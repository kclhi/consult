import sys
import re
import subprocess
import networkx as nx
import pygraphviz as pgv
import os

def parse_extension(text):
    # all IN arguments in the graph 
    # m = re.findall(r"(in\()([\(A-Za-z0-9_\),]+)", text)
    m = text.split()
    intext = set()
    for el in m:
        if el.startswith("in("):
            intext.add(el)
    ins = set()
    for group in intext:
        pred = group[3:-1]
        if pred[-1] == ',':
            ins.add(pred[:-2])
        else:
            ins.add(pred[:-1])

    print "IN Arguments are:\n"+str(ins)+"\n"

    # all arguments in the argument graph
    # a = re.findall(r"(arg\()([\(A-Za-z0-9_\),]+)", text)
    totalargs = text.split()
    alltext = set()
    for el in totalargs:
        #if "arg(" in el:
        if el.startswith("arg("):
            alltext.add(el)
    
    args = set()
    inargs = set()
    for group in alltext:
        pred = group[4:-1]
        if pred[-1] == ',':
            if pred[:-2] in ins:
                inargs.add(pred[:-2])
            else:
                args.add(pred[:-2])
        else:
            if pred[:-1] in ins:
                inargs.add(pred[:-1])
            else:
                args.add(pred[:-1])

    # all attacks in the graph
    # r = re.findall(r"(att\()([\(A-Za-z0-9_\),]+)", text)
    r = text.split()
    att_text = set()
    for el in r:
        #if "att(" in el:
        if el.startswith("att("):
            att_text.add(el)
    
    att = set()
    for group in att_text:
        pred = group[4:-1]
        if pred[-1] == ',':
            pred = pred[:-2]
        else:
            pred = pred[:-1]
        #S = pred[:-1].split('),')
        #att.add((S[0]+')',S[1]))
          
        lpc = 0 # left paranthesis count
        rpc = 0 # left paranthesis count
        brindex = 0
  
        for ch in pred:
            if ch == "(":
                lpc = lpc +1
            if ch == ")":
                rpc = rpc +1              
        
            brindex = brindex + 1
            if lpc == rpc and lpc>0:
                break
        att.add((pred[:brindex], pred[brindex+1:]))
               
    return [args,inargs,att]  

def export_graph(args,inargs,att,export_json=0):
    
    data = dict()
    G=nx.DiGraph()
    G.add_nodes_from(args)
    G.add_nodes_from(inargs,color='green')
    G.add_edges_from(att)
    
    if export_json:
        from networkx.readwrite import json_graph
        data = json_graph.node_link_data(G)
        #import json
        #json_data = json.dumps(data)
        #print json_data
    
    return [G,data]
    
def export_graph_to_file(params,args,inargs,att,id=0,path="./",export_json=0):
	G=export_graph(args,inargs,att,export_json)[0]

	# get AGraph from G graph
	A=nx.nx_agraph.to_agraph(G)
	A.node_attr['shape']='box'

	#A.write("file.dot") 
	A.layout(prog='dot')
	# Write the PNG file to the directory where the example is
	A.draw(path+params[-1].split('.')[0]+'_'+str(id)+'.png')

def export_graph_to_url(params,hostip,args,inargs,att,id=0,export_json=0):
    result = dict()
    host = 'http://'
    G,G_json = export_graph(args,inargs,att,export_json)
    
    # get AGraph from G graph
    A=nx.nx_agraph.to_agraph(G)
    A.node_attr['shape']='box'

    #A.write("file.dot") 
    A.layout(prog='dot')
    # Write the PNG file to the directory to the static/images folder
    A.draw('./static/images/'+params[-1].split('.')[0].split('/')[1]+'_'+str(id)+'.png')
    
    # prepare the result object
    # image generation will be removed later
    result["AF_url"] = host+hostip+'/static/images/'+params[-1].split('.')[0].split('/')[1]+'_'+str(id)+'.png'
    result["AF_json"] = G_json
    
    return result


def run_aspartix_web(hostip,flags):
    params = list()
    
    for i,flag in enumerate(flags):
        params.append(flag)

    params.insert(0,'./dlv')
    output = subprocess.check_output(params,cwd=os.getcwd()+'/argengine')

    exts = filter(lambda a: a != '', output.split('\n')) 
    exts = exts[1:len(exts)]

    ext_set = dict()
    print "Number of extensions: "+str(len(exts))
    for i,ext in enumerate(exts):
        a = ext.replace('\n', '').replace('\r', '')
        a = a.split('{')[1].split('}')[0]
        text = '{'+a+'}'
        res = parse_extension(text)
        ext_set['ext'+str(i)] = export_graph_to_url(params,hostip,res[0],res[1],res[2],i+1,export_json=1)
        
    return ext_set


def run_aspartix_console():
    params = list()
    
    for i,para in enumerate(sys.argv):
        if i!=0:
            params.append(para)

    params.insert(0,'./dlv')
    output = subprocess.check_output(params)

    exts = filter(lambda a: a != '', output.split('\n')) 
    exts = exts[1:len(exts)]

    print "Number of extensions: "+str(len(exts))
    for i,ext in enumerate(exts):
        a = ext.replace('\n', '').replace('\r', '')
        a = a.split('{')[1].split('}')[0]
        text = '{'+a+'}'
        res = parse_extension(text)
        export_graph_to_file(params,res[0],res[1],res[2],id=i+1)

# pip install networkx
# sudo apt-get install python-dev graphviz libgraphviz-dev pkg-config
# pip install pygraphviz

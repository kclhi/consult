import sys
import re
import subprocess
import networkx as nx
import pygraphviz as pgv

########### Example Queries
# python parse-aspartix.py ground.dl metalevel.dl DEMO/firewall-paf.dl
# python parse-aspartix.py ground.dl metalevel.dl DEMO/eric-eaf.dl
# python parse-aspartix.py ground.dl metalevel.dl DEMO/gp-eaf.dl
# python parse-aspartix.py ground.dl metalevel.dl DEMO/bittorrent-vaf.dl
# python parse-aspartix.py ground.dl metalevel.dl DEMO/metalevel-paf.dl
# python parse-aspartix.py ground.dl metalevel.dl DEMO/metalevel-weather-eaf.dl
# python parse-aspartix.py ground.dl metalevel.dl cases/case-complex.dl
# python parse-aspartix.py ground.dl metalevel.dl cases/case-metalevel.dl

# python parse-aspartix.py ground.dl metalevel.dl wp4-eaf/abstract.dl

# multiple extensions
# python parse-aspartix.py prefex.dl metalevel.dl DEMO/metalevel-avaf.dl
###########

def parse_extension(text):
	# all IN arguments in the graph 
	# m = re.findall(r"(in\()([\(A-Za-z0-9_\),]+)", text)
        m = text.split()
        intext = set()
        for el in m:
            if "in(" in el:
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
            if "arg(" in el:
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
            if "att(" in el:
	        att_text.add(el)
	att = set()
	for group in att_text:
	  pred = group[4:-1]
          if pred[-1] == ',':
	    #S = pred[:-2].split('),')
	    #att.add((S[0]+')',S[1]))
            pred = pred[:-2]
	  else:
            pred = pred[:-1]
	    #S = pred[:-1].split('),')
	    #att.add((S[0]+')',S[1]))
          
          lpc = 0 # left paranthesis count
          rpc = 0 # left paranthesis count
          brindex = 0

          #print pred
	  # TODO
          #if "cq" in pred:
          #    brindex=3
          #elif "pref" in pred:
          #    brindex=5
          #else: 	
	  for ch in pred:
	      #if ch == "q" and lpc == 0: # argument such as a question e.g. q1 TODO 
		  #brindex= 2
		  #break
              if ch == "(":
		  lpc = lpc +1
              if ch == ")":
		  rpc = rpc +1              
	      brindex = brindex + 1
	      if lpc == rpc and lpc>0:
		  break
          att.add((pred[:brindex], pred[brindex+1:]))
               
	return [args,inargs,att]   

def export_graph(args,inargs,att,id=0):
	G=nx.DiGraph()

	G.add_nodes_from(args)
	G.add_nodes_from(inargs,color='green')
	G.add_edges_from(att)

	# get AGraph from G graph
	A=nx.nx_agraph.to_agraph(G)
	A.node_attr['shape']='box'

	#A.write("file.dot") 
	A.layout(prog='dot')
	# Write the PNG file to the directory where the example is
	A.draw(params[-1].split('.')[0]+'_'+str(id)+'.png')

# main starts here
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
	export_graph(res[0],res[1],res[2],i+1)


# pip install networkx
# sudo apt-get install python-dev graphviz libgraphviz-dev pkg-config
# pip install pygraphviz

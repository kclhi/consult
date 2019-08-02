import os, sys, json, requests
from flask_restful import Resource
from flask import request

sys.path.insert(0, './argengine')
from data_science import DataScience
from explanation_manager import ExplanationManager
import parse_aspartix

class ChatBot(Resource):

    """
    @api {post} /argengine/chatbot Main reasoning endpoint
    @apiName Reasoner
    @apiGroup Chatbot

    @apiParam {Number} pid Patient ID.
    @apiParam {Number} sid Session ID.
    @apiParam {String} keyname [symptom|notrecommend|preference|selfcheck].
    @apiParam {Number} value Value for keyname.
    @apiParam {String} pdata Patient data in JSON format (e.g. { 'pdata':[{'res.c271649006':'no alert','res.c271650006':'no alert','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':82,'c271650006':53,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}] })
    @apiParam {Number} expl If this is one 1, the explanation manager will be invoked to generate explanations.
    @apiParam {String} [filter] A comma-separated list of scheme names. The argumentation results will be filtered according to this list.
    
    @apiExample {curl} : 's1'
        # Ask for a painkiller for backpain by providing explanations.
        curl --request GET http://localhost:5000/argengine/chatbot/s1
    
    @apiExample {curl} : 'High blood pressure observed. Ask for a painkiller for backpain.'
        curl --request POST http://localhost:5000/argengine/chatbot --data {'pid': 1234, 'sid':2, 'keyname': 'symptom', 'value':'backpain', 'pdata': {'patient.id':1234,'raised_bp':1,'last.sys':142,'last.dia':86,'pid':1234,'age':60,'ethnicity':'black_african','testresult1':125,'testresult1.type':'sys'}}'

    @apiExample {curl} : 'High blood pressure observed. Ask for a painkiller for backpain. Express drug preference.'
        curl --request POST http://localhost:5000/argengine/chatbot --data '{'pid': 1234, 'sid':2, 'keyname': 'preference', 'value':'paracetamol,codeine', 'pdata': {'patient.id':1234,'raised_bp':1,'last.sys':142,'last.dia':86,'pid':1234,'age':60,'ethnicity':'black_african','testresult1':125,'testresult1.type':'sys'}}'

    @apiSuccess {String} response Argumentation results together with textual explanations.
    """
    def post(self):

        pdict = request.get_json();
        print "Received raw data: " + str(pdict);
        return ChatBot.getArgumenationResponse(pdict);

    @staticmethod
    def getArgumenationResponse(pdict):

        pid = "p"+pdict['pid'].replace("-","_")
        sid = str(pdict['sid'])
        keyname = pdict['keyname']
        value = pdict['value']
        pdata = pdict['pdata']
        expl = pdict['expl'] if "expl" in pdict.keys() else 0  # if 1 will call the Explanation Manager
        if "filter" in pdict.keys(): filter_words = pdict['filter'] # filter results according to the specified scheme names

        params = list()

        # get the static reasoning files
        params.append('ground.dl')
        params.append('metalevel.dl') # by default metalevel semantics are used.
        params.append('rules.dl') # rules that will be used for reasoning.

        # get the query
        query=''
        if str(keyname) == 'symptom':
            if str(value) == 'backpain':
                query = 'suffers_from('+pid+',backpain).\n'
            if str(value) == 'headache':
                query = 'suffers_from('+pid+',headache).\n'
            if str(value) == 'swollen_ankle':
                query = 'suffers_from('+pid+',swollen_ankle).\n'
        elif str(keyname) == 'notrecommend': #not recommend the specified treatments by the patient
            vset = str(value).split(',')
            for v in vset:
                query += 'not_recommend('+pid+','+v+').\n'
        elif str(keyname) == 'preference':
            v1,v2 = str(value).split(',')
            query = 'arg(preferred('+v1+','+v2+')).\n'
        elif str(keyname) == 'selfcheck':
            # we do nothing extra, used for engine initiated dialogues
            query=''
        else:
            return 'Unknown keyname: '+ str(keyname)

        if not os.path.exists('data/'+pid): # new patient
            os.makedirs('data/'+pid)

        if not os.path.exists('data/'+pid+'/'+sid): # new session
            os.makedirs('data/'+pid+'/'+sid)

            # create a new query file
            f= open('data/'+pid+'/'+sid+'/'+'queries.dl','w+')
            if query != '':
                # write the new query to it
                f.write(query)
            # close the file
            f.close()

        else:
            if query != '':
                # append to existing query file
                f= open('data/'+pid+'/'+sid+'/'+'queries.dl','a')
                # write the new query to it
                f.write(query)
                # close the file
                f.close()

        # add the query file to the engine parameters
        params.append('../data/'+pid+'/'+sid+'/'+'queries.dl')

        # get the facts about the patient
        # get the patient facts
        pfacts = DataScience.getPatientFacts(pdata);

        # create a new query file
        f= open('data/'+pid+'/'+sid+'/'+pid+'.dl','w+')
        # write the patient facts to it
        f.write(pfacts)
        # close the file
        f.close()

        # add the patient facts to the params
        params.append('../data/'+pid+'/'+sid+'/'+pid+'.dl')

        # run the reasoning engine
        hostip = request.host
        result_json=parse_aspartix.run_aspartix_web(hostip,params)

        # invoke the Explanation Manager
        if expl: result_json = ExplanationManager.getExplanation(result_json, filter_words) if 'filter_words' in locals() else ExplanationManager.getExplanation(result_json)

        print "Returning result: " + str(result_json)
        return result_json

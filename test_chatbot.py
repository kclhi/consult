from flask_restful import Resource
from chatbot import ChatBot

# chatbot testing class
class TestChatbot(Resource):

    def get(self, name):

        pdata_82_noalert = { 'pdata':[{'res.c271649006':'no alert','res.c271650006':'no alert','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':82,'c271650006':53,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}] }

        pdata_142_amber = { 'pdata':[{'res.c271649006':'Amber Flag','res.c271650006':'Amber Flag','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':142,'c271650006':86,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}] }

        pdata_150_red = { 'pdata':[{'res.c271649006':'Red Flag','res.c271650006':'Red Flag','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':150,'c271650006':95,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}] }

        pdata_180_doublered = { 'pdata':[{'res.c271649006':'Double Red Flag','res.c271650006':'Double Red Flag','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':180,'c271650006':110,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}] }

        if name == 's1':
            params = { 'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'symptom','value':'backpain', 'expl':1 }
            query = { key: value for (key, value) in (params.items() + pdata_82_noalert.items()) }

        if name == 's3-1':
            params = { 'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'symptom','value':'backpain', 'expl':1 }
            query = { key: value for (key, value) in (params.items() + pdata_150_red.items()) }

        if name == 's3-2':
            params = { 'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'symptom','value':'backpain', 'expl':1 }
            query = { key: value for (key, value) in (params.items() + pdata_180_doublered.items()) }

        if name == 's4': # selfcheck example
            params = { 'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'selfcheck','value':'', 'expl':1 }
            query = { key: value for (key, value) in (params.items() + pdata_180_doublered.items()) }

        if name == 's5': # unknown keyname example
            params = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'dummy','value':'', 'expl':1}
            query = { key: value for (key, value) in (params.items() + pdata_180_doublered.items()) }

        if name == 's6': # single amber alert
            params = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'selfcheck','value':'', 'expl':1, 'filter':'amber'}
            query = { key: value for (key, value) in (params.items() + pdata_142_amber.items()) }
        
        if name == 's7': # symptom headache
            params = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'3','keyname':'symptom','value':'headache', 'expl':1, 'filter':'aspt'}
            query = { key: value for (key, value) in (params.items() + pdata_142_amber.items()) }     

        if name == 's8': # as a follow up to s1, remove ibuprofen from the results
            params = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'notrecommend','value':'ibuprofen', 'expl':1, 'filter':'aspt'}
            query = { key: value for (key, value) in (params.items() + pdata_142_amber.items()) }          

        if name == 's9': # as a follow up to s1, remove ibuprofen and naproxen from the results
            params = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'notrecommend','value':'ibuprofen,naproxen', 'expl':1, 'filter':'aspt'}
            query = { key: value for (key, value) in (params.items() + pdata_142_amber.items()) }          

        return ChatBot.getArgumenationResponse(query);

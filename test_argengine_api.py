# Chatbot scenarios testing -- test_argengine_api.py
import requests
import json
import pytest

def make_call(query):
    response = requests.post(
        'http://0.0.0.0:5000/argengine/chatbot',
        data={'data': json.dumps(query)}
    )
    data = json.loads(response.text)
    winning = data["ext0"]["winning"]

    return winning

def assert_results(winning,results):
    r = 0
    for k in winning.keys():
        curr_val = winning[k]
        r+=1
        assert curr_val in results

    # number of returned arguments should be equal to the size of the results
    assert r == len(results)


def clean_dir():
    # remove dummy patient folder
    import shutil
    shutil.rmtree("data/p07209f10_58a4_11e9_994c_cd7260ae2b18")

@pytest.mark.order1
def test_chatbot_s1_backpain_noalert():
    clean_dir()
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'symptom','value':'backpain','pdata':{'res.sbp':'no alert','res.dbp':'no alert','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':82,'c271650006':53,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}, 'expl':1, 'filter':''}

    winning = make_call(query)

    results = []
    res_arg1={"bindings": {"A": "ibuprofen", "G": "rp"},
            "expl": "Treatment 'ibuprofen' should be considered as it promotes goal 'rp', given patient facts.",
            "name": "aspt([goal(rp),action(ibuprofen),promotes(ibuprofen,rp)],action(ibuprofen))"
            }

    results.append(res_arg1)

    assert_results(winning,results)

def test_chatbot_s1_backpain_noalert_filter():
    clean_dir()
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'symptom','value':'backpain','pdata':{'res.sbp':'no alert','res.dbp':'no alert','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':82,'c271650006':53,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}, 'expl':1, 'filter':'aspt'}

    winning = make_call(query)

    results = []
    res_arg1={"bindings": {"A": "ibuprofen", "G": "rp"},
            "expl": "Treatment 'ibuprofen' should be considered as it promotes goal 'rp', given patient facts.",
            "name": "aspt([goal(rp),action(ibuprofen),promotes(ibuprofen,rp)],action(ibuprofen))"
            }

    results.append(res_arg1)

    assert_results(winning,results)

@pytest.mark.order2
def test_chatbot_s2_1_backpain_amberalert():
    clean_dir()
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'2','keyname':'symptom','value':'backpain','pdata':{'res.sbp':'Amber Flag','res.dbp':'Amber Flag','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':142,'c271650006':86,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}, 'expl':1, 'filter':''}

    winning = make_call(query)

    results = []
    res_arg1 = {"bindings": {"P": "p07209f10_58a4_11e9_994c_cd7260ae2b18", "S": "142"},
            "expl": "The systolic measurement of the patient p07209f10_58a4_11e9_994c_cd7260ae2b18 is 142. This value is less than 150 and more than 134; therefore, an amber flag is raised.",
            "name": "amber([systolic(p07209f10_58a4_11e9_994c_cd7260ae2b18,142),\"<150\",\">134\"],flag(amber))"
            }

    res_arg2 = {"bindings": {"P": "p07209f10_58a4_11e9_994c_cd7260ae2b18", "D": "86"},
            "expl": "The diastolic measurement of the patient p07209f10_58a4_11e9_994c_cd7260ae2b18 is 86. This value is less than 95 and more than 84; therefore, an amber flag is raised.",
            "name": "amber([diastolic(p07209f10_58a4_11e9_994c_cd7260ae2b18,86),\"<95\",\">84\"],flag(amber))"
            }

    results.append(res_arg1)
    results.append(res_arg2)

    assert_results(winning,results)

@pytest.mark.order3
def test_chatbot_s2_2_preference_amberalert():
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'2','keyname': 'preference', 'value':'paracetamol,codeine','pdata':{'res.sbp':'Amber Flag','res.dbp':'Amber Flag','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':142,'c271650006':86,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}, 'expl':1, 'filter':''}

    winning = make_call(query)

    results = []
    res_arg1 = {"bindings": {"P": "p07209f10_58a4_11e9_994c_cd7260ae2b18", "S": "142"},
            "expl": "The systolic measurement of the patient p07209f10_58a4_11e9_994c_cd7260ae2b18 is 142. This value is less than 150 and more than 134; therefore, an amber flag is raised.",
            "name": "amber([systolic(p07209f10_58a4_11e9_994c_cd7260ae2b18,142),\"<150\",\">134\"],flag(amber))"
            }

    res_arg2 = {"bindings": {"P": "p07209f10_58a4_11e9_994c_cd7260ae2b18", "D": "86"},
            "expl": "The diastolic measurement of the patient p07209f10_58a4_11e9_994c_cd7260ae2b18 is 86. This value is less than 95 and more than 84; therefore, an amber flag is raised.",
            "name": "amber([diastolic(p07209f10_58a4_11e9_994c_cd7260ae2b18,86),\"<95\",\">84\"],flag(amber))"
            }

    res_arg3 = {"bindings": {"A": "paracetamol", "G": "rp"},
            "expl": "Treatment 'paracetamol' should be considered as it promotes goal 'rp', given patient facts.",
            "name": "aspt([goal(rp),action(paracetamol),promotes(paracetamol,rp)],action(paracetamol))"
            }

    results.append(res_arg1)
    results.append(res_arg2)
    results.append(res_arg3)

    assert_results(winning,results)

@pytest.mark.order4
def test_chatbot_s2_1_backpain_alert_filter():
    clean_dir()
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'2','keyname':'symptom','value':'backpain','pdata':{'res.sbp':'Amber Flag','res.dbp':'Amber Flag','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':142,'c271650006':86,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}, 'expl':1, 'filter':'aspt'}

    winning = make_call(query)

    results = []

    assert_results(winning,results)

@pytest.mark.order5
def test_chatbot_s2_2_preference_alert_filter():
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'2','keyname': 'preference', 'value':'paracetamol,codeine','pdata':{'res.sbp':'Amber Flag','res.dbp':'Amber Flag','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':142,'c271650006':86,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}, 'expl':1, 'filter':'aspt'}

    winning = make_call(query)

    results = []

    res_arg3 = {"bindings": {"A": "paracetamol", "G": "rp"},
            "expl": "Treatment 'paracetamol' should be considered as it promotes goal 'rp', given patient facts.",
            "name": "aspt([goal(rp),action(paracetamol),promotes(paracetamol,rp)],action(paracetamol))"
            }

    results.append(res_arg3)

    assert_results(winning,results)

def test_chatbot_s3_1_selfcheck_redalert():
    clean_dir()
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'selfcheck','value':'','pdata':{'res.sbp':'Red Flag','res.dbp':'Red Flag','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':150,'c271650006':95,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}, 'expl':1, 'filter':'red'}

    winning = make_call(query)

    results = []
    res_arg1 = {"bindings": {"P": "p07209f10_58a4_11e9_994c_cd7260ae2b18", "S": "150"},
            "expl": "The systolic measurement of the patient p07209f10_58a4_11e9_994c_cd7260ae2b18 is 150. This value is less than 180 and more than 149; therefore, a red flag is raised.",
            "name": "red([systolic(p07209f10_58a4_11e9_994c_cd7260ae2b18,150),\"<180\",\">149\"],flag(red))"
            }

    res_arg2 = {"bindings": {"P": "p07209f10_58a4_11e9_994c_cd7260ae2b18", "D": "95"},
            "expl": "The diastolic measurement of the patient p07209f10_58a4_11e9_994c_cd7260ae2b18 is 95. This value is less than 110 and more than 94; therefore, a red flag is raised.",
            "name": "red([diastolic(p07209f10_58a4_11e9_994c_cd7260ae2b18,95),\"<110\",\">94\"],flag(red))"
            }

    results.append(res_arg1)
    results.append(res_arg2)

    assert_results(winning,results)

def test_chatbot_s3_2_selfcheck_dredalert():
    clean_dir()
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'selfcheck','value':'','pdata':{'res.sbp':'Double Red Flag','res.dbp':'Double Red Flag','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':180,'c271650006':110,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}, 'expl':1, 'filter':'dred'}

    winning = make_call(query)

    results = []
    res_arg1 = {"bindings": {"P": "p07209f10_58a4_11e9_994c_cd7260ae2b18", "S": "180"},
            "expl": "The systolic measurement of the patient p07209f10_58a4_11e9_994c_cd7260ae2b18 is 180. This value is more than 179; therefore, a double red flag is raised.",
            "name": "dred([systolic(p07209f10_58a4_11e9_994c_cd7260ae2b18,180),\">179\"],flag(doublered))"
            }

    res_arg2 = {"bindings": {"P": "p07209f10_58a4_11e9_994c_cd7260ae2b18", "D": "110"},
            "expl": "The diastolic measurement of the patient p07209f10_58a4_11e9_994c_cd7260ae2b18 is 110. This value is more than 109; therefore, a double red flag is raised.",
            "name": "dred([diastolic(p07209f10_58a4_11e9_994c_cd7260ae2b18,110),\">109\"],flag(doublered))"
            }

    results.append(res_arg1)
    results.append(res_arg2)

    assert_results(winning,results)

def test_chatbot_s4_selfcheck_service_alive():
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'selfcheck','value':'','pdata':{'res.sbp':'Double Red Flag','res.dbp':'Double Red Flag','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':180,'c271650006':110,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}, 'expl':1, 'filter':'amber,red,dred'}

    response = requests.post(
        'http://0.0.0.0:5000/argengine/chatbot',
        data={'data': json.dumps(query)}
    )

    assert response.status_code == 200

def test_chatbot_s5_unknown_query():
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'dummy','value':'','pdata':{'res.sbp':'Double Red Flag','res.dbp':'Double Red Flag','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':180,'c271650006':110,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}, 'expl':1, 'filter':''}

    response = requests.post(
        'http://0.0.0.0:5000/argengine/chatbot',
        data={'data': json.dumps(query)}
    )

    assert "Unknown keyname" in response.text

def test_chatbot_s6_selfcheck_single_amberalert():
    clean_dir()
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'selfcheck','value':'','pdata':{'res.sbp':'Amber Flag','res.dbp':'no alert','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':142,'c271650006':80,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}, 'expl':1, 'filter':'amber'}

    winning = make_call(query)

    results = []
    res_arg1 = {"bindings": {"P": "p07209f10_58a4_11e9_994c_cd7260ae2b18", "S": "142"},
            "expl": "The systolic measurement of the patient p07209f10_58a4_11e9_994c_cd7260ae2b18 is 142. This value is less than 150 and more than 134; therefore, an amber flag is raised.",
            "name": "amber([systolic(p07209f10_58a4_11e9_994c_cd7260ae2b18,142),\"<150\",\">134\"],flag(amber))"
            }

    results.append(res_arg1)

    assert_results(winning,results)

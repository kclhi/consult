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

def test_chatbot_s1_backpain_noalert_filter():
    clean_dir()
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'symptom','value':'backpain','pdata':{'res.sbp':'no alert','res.dbp':'no alert','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':82,'c271650006':53,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}, 'expl':1, 'filter':'aspt'}

    winning = make_call(query)

    results = []
    res_arg1={"bindings": {"A": "ibuprofen", "G": "rp"},
            "expl": "Treatment 'ibuprofen' should be considered as it promotes goal 'rp', given patient facts.",
            "name": "aspt([goal(rp),action(ibuprofen),promotes(ibuprofen,rp)],action(ibuprofen))"
            }
    res_arg2={"bindings": {"A": "naproxen", "G": "rp"},
            "expl": "Treatment 'naproxen' should be considered as it promotes goal 'rp', given patient facts.",
            "name": "aspt([goal(rp),action(naproxen),promotes(naproxen,rp)],action(naproxen))"
            }
    res_arg3={"bindings": {"A": "diclofenac", "G": "rp"},
            "expl": "Treatment 'diclofenac' should be considered as it promotes goal 'rp', given patient facts.",
            "name": "aspt([goal(rp),action(diclofenac),promotes(diclofenac,rp)],action(diclofenac))"
            }
    res_arg4={"bindings": {"A": "celecoxib", "G": "rp"},
            "expl": "Treatment 'celecoxib' should be considered as it promotes goal 'rp', given patient facts.",
            "name": "aspt([goal(rp),action(celecoxib),promotes(celecoxib,rp)],action(celecoxib))"
            }
    res_arg5={"bindings": {"A": "mefenamic_acid", "G": "rp"},
            "expl": "Treatment 'mefenamic_acid' should be considered as it promotes goal 'rp', given patient facts.",
            "name": "aspt([goal(rp),action(mefenamic_acid),promotes(mefenamic_acid,rp)],action(mefenamic_acid))"
            }
    res_arg6={"bindings": {"A": "etoricoxib", "G": "rp"},
            "expl": "Treatment 'etoricoxib' should be considered as it promotes goal 'rp', given patient facts.",
            "name": "aspt([goal(rp),action(etoricoxib),promotes(etoricoxib,rp)],action(etoricoxib))"
            }
    res_arg7={"bindings": {"A": "indomethacin", "G": "rp"},
            "expl": "Treatment 'indomethacin' should be considered as it promotes goal 'rp', given patient facts.",
            "name": "aspt([goal(rp),action(indomethacin),promotes(indomethacin,rp)],action(indomethacin))"
            }
    res_arg8={"bindings": {"A": "highdose_aspirin", "G": "rp"},
            "expl": "Treatment 'highdose_aspirin' should be considered as it promotes goal 'rp', given patient facts.",
            "name": "aspt([goal(rp),action(highdose_aspirin),promotes(highdose_aspirin,rp)],action(highdose_aspirin))"
            }
    results.append(res_arg1)
    results.append(res_arg2)
    results.append(res_arg3)
    results.append(res_arg4)
    results.append(res_arg5)
    results.append(res_arg6)
    results.append(res_arg7)
    results.append(res_arg8)

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

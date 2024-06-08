# Chatbot scenarios testing -- test_argengine_api.py
import requests
import json
import pytest

def make_call(query):
    response = requests.post(
        'http://0.0.0.0:5000/argengine/chatbot',
        json=query
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
    shutil.rmtree("./data/p07209f10_58a4_11e9_994c_cd7260ae2b18")

def test_chatbot_s1_backpain_noalert_filter():
    clean_dir()
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'symptom','value':'backpain','pdata':[{'res.c271649006':'no alert','res.c271650006':'no alert','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':82,'c271650006':53,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}], 'expl':1, 'filter':'aspt'}

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
    #res_arg3={"bindings": {"A": "diclofenac", "G": "rp"},
    #        "expl": "Treatment 'diclofenac' should be considered as it promotes goal 'rp', given patient facts.",
    #        "name": "aspt([goal(rp),action(diclofenac),promotes(diclofenac,rp)],action(diclofenac))"
    #        }
    #res_arg4={"bindings": {"A": "celecoxib", "G": "rp"},
    #        "expl": "Treatment 'celecoxib' should be considered as it promotes goal 'rp', given patient facts.",
    #        "name": "aspt([goal(rp),action(celecoxib),promotes(celecoxib,rp)],action(celecoxib))"
    #        }
    #res_arg5={"bindings": {"A": "mefenamic_acid", "G": "rp"},
    #        "expl": "Treatment 'mefenamic_acid' should be considered as it promotes goal 'rp', given patient facts.",
    #        "name": "aspt([goal(rp),action(mefenamic_acid),promotes(mefenamic_acid,rp)],action(mefenamic_acid))"
    #        }
    #res_arg6={"bindings": {"A": "etoricoxib", "G": "rp"},
    #        "expl": "Treatment 'etoricoxib' should be considered as it promotes goal 'rp', given patient facts.",
    #        "name": "aspt([goal(rp),action(etoricoxib),promotes(etoricoxib,rp)],action(etoricoxib))"
    #        }
    #res_arg7={"bindings": {"A": "indomethacin", "G": "rp"},
    #        "expl": "Treatment 'indomethacin' should be considered as it promotes goal 'rp', given patient facts.",
    #        "name": "aspt([goal(rp),action(indomethacin),promotes(indomethacin,rp)],action(indomethacin))"
    #        }
    #res_arg8={"bindings": {"A": "highdose_aspirin", "G": "rp"},
    #        "expl": "Treatment 'highdose_aspirin' should be considered as it promotes goal 'rp', given patient facts.",
    #        "name": "aspt([goal(rp),action(highdose_aspirin),promotes(highdose_aspirin,rp)],action(highdose_aspirin))"
    #        }
    results.append(res_arg1)
    results.append(res_arg2)
    #results.append(res_arg3)
    #results.append(res_arg4)
    #results.append(res_arg5)
    #results.append(res_arg6)
    #results.append(res_arg7)
    #results.append(res_arg8)

    assert_results(winning,results)

def test_chatbot_s3_1_selfcheck_redalert():
    clean_dir()
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'selfcheck','value':'','pdata':[{'res.c271649006':'Red Flag','res.c271650006':'Red Flag','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':150,'c271650006':95,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}], 'expl':1, 'filter':'red'}

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
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'selfcheck','value':'','pdata':[{'res.c271649006':'Double Red Flag','res.c271650006':'Double Red Flag','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':180,'c271650006':110,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}], 'expl':1, 'filter':'dred'}

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
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'selfcheck','value':'','pdata':[{'res.c271649006':'Double Red Flag','res.c271650006':'Double Red Flag','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':180,'c271650006':110,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}], 'expl':1, 'filter':'amber,red,dred'}

    response = requests.post(
        'http://0.0.0.0:5000/argengine/chatbot',
        json=query
    )

    assert response.status_code == 200

def test_chatbot_s5_unknown_query():
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'dummy','value':'','pdata':[{'res.c271649006':'Double Red Flag','res.c271650006':'Double Red Flag','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':180,'c271650006':110,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}], 'expl':1, 'filter':''}

    response = requests.post(
        'http://0.0.0.0:5000/argengine/chatbot',
        json=query
    )

    assert "Unknown keyname" in response.text

def test_chatbot_s6_selfcheck_single_amberalert():
    clean_dir()
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'selfcheck','value':'','pdata':[{'res.c271649006':'Amber Flag','res.c271650006':'no alert','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':142,'c271650006':80,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}], 'expl':1, 'filter':'amber'}

    winning = make_call(query)

    results = []
    res_arg1 = {"bindings": {"P": "p07209f10_58a4_11e9_994c_cd7260ae2b18", "S": "142"},
            "expl": "The systolic measurement of the patient p07209f10_58a4_11e9_994c_cd7260ae2b18 is 142. This value is less than 150 and more than 134; therefore, an amber flag is raised.",
            "name": "amber([systolic(p07209f10_58a4_11e9_994c_cd7260ae2b18,142),\"<150\",\">134\"],flag(amber))"
            }

    results.append(res_arg1)

    assert_results(winning,results)
    
def test_chatbot_s7_headache():
    clean_dir()
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'symptom','value':'headache','pdata':[{'res.c271649006':'Amber Flag','res.c271650006':'no alert','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':142,'c271650006':80,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}], 'expl':1, 'filter':'aspt'}

    winning = make_call(query)

    results = []
    res_arg1={"bindings": {"A": "ibuprofen", "G": "rhp"},
            "expl": "Treatment 'ibuprofen' should be considered as it promotes goal 'rhp', given patient facts.",
            "name": "aspt([goal(rhp),action(ibuprofen),promotes(ibuprofen,rhp)],action(ibuprofen))"
            }
    res_arg2={"bindings": {"A": "paracetamol", "G": "rhp"},
            "expl": "Treatment 'paracetamol' should be considered as it promotes goal 'rhp', given patient facts.",
            "name": "aspt([goal(rhp),action(paracetamol),promotes(paracetamol,rhp)],action(paracetamol))"
            }
    
    results.append(res_arg1)
    results.append(res_arg2)
    
    assert_results(winning,results)
    
def test_chatbot_s8_twostep_removetr():
    clean_dir()
    
    # make first query to recommend anything for backpain
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'symptom','value':'backpain','pdata':[{'res.c271649006':'no alert','res.c271650006':'no alert','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':82,'c271650006':53,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}], 'expl':1, 'filter':'aspt'}

    make_call(query)
    
    # make a follow-up query to remove some of the treatments
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'notrecommend','value':'ibuprofen','pdata':[{'res.c271649006':'no alert','res.c271650006':'no alert','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':82,'c271650006':53,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}], 'expl':1, 'filter':'aspt'}

    winning=make_call(query)
    

    results = []
    res_arg1={"bindings": {"A": "naproxen", "G": "rp"},
            "expl": "Treatment 'naproxen' should be considered as it promotes goal 'rp', given patient facts.",
            "name": "aspt([goal(rp),action(naproxen),promotes(naproxen,rp)],action(naproxen))"
            }
    
    results.append(res_arg1)

    assert_results(winning,results)
    
def test_chatbot_s9_twostep_removetwotr():
    clean_dir()
    
    # make first query to recommend anything for backpain
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'symptom','value':'backpain','pdata':[{'res.c271649006':'no alert','res.c271650006':'no alert','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':82,'c271650006':53,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}], 'expl':1, 'filter':'aspt'}

    make_call(query)
    
    # make a follow-up query to remove some of the treatments
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'notrecommend','value':'ibuprofen,naproxen','pdata':[{'res.c271649006':'no alert','res.c271650006':'no alert','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':82,'c271650006':53,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}], 'expl':1, 'filter':'aspt'}

    winning=make_call(query)    

    assert winning == "No winning arguments."
    
def test_chatbot_s9_twostep_removetr():
    clean_dir()
    
    # make first query to recommend anything for backpain
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'symptom','value':'headache','pdata':[{'res.c271649006':'no alert','res.c271650006':'no alert','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':82,'c271650006':53,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}], 'expl':1, 'filter':'aspt'}

    make_call(query)
    
    # make a follow-up query to remove some of the treatments
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'notrecommend','value':'paracetamol','pdata':[{'res.c271649006':'no alert','res.c271650006':'no alert','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':82,'c271650006':53,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}], 'expl':1, 'filter':'aspt'}

    winning=make_call(query)
    

    results = []
    res_arg1={"bindings": {"A": "ibuprofen", "G": "rhp"},
            "expl": "Treatment 'ibuprofen' should be considered as it promotes goal 'rhp', given patient facts.",
            "name": "aspt([goal(rhp),action(ibuprofen),promotes(ibuprofen,rhp)],action(ibuprofen))"
            }
    
    results.append(res_arg1)

    assert_results(winning,results)
    
def test_chatbot_s11_swollenankle():
    clean_dir()
    query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'symptom','value':'swollen_ankle','pdata':[{'res.c271649006':'Amber Flag','res.c271650006':'no alert','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':142,'c271650006':80,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}], 'expl':1, 'filter':'aspt'}

    winning = make_call(query)

    results = []
    res_arg1={"bindings": {"A": "amlodipine", "G": "rs"},
            "expl": "Treatment 'amlodipine' should be considered as it promotes goal 'rs', given patient facts.",
            "name": "aspt([goal(rs),action(amlodipine),promotes(amlodipine,rs)],action(amlodipine))"
            }
    res_arg2={"bindings": {"A": "clevidipine", "G": "rs"},
            "expl": "Treatment 'clevidipine' should be considered as it promotes goal 'rs', given patient facts.",
            "name": "aspt([goal(rs),action(clevidipine),promotes(clevidipine,rs)],action(clevidipine))"
            }
    res_arg3={"bindings": {"A": "diltiazem_hydrochloride", "G": "rs"},
            "expl": "Treatment 'diltiazem_hydrochloride' should be considered as it promotes goal 'rs', given patient facts.",
            "name": "aspt([goal(rs),action(diltiazem_hydrochloride),promotes(diltiazem_hydrochloride,rs)],action(diltiazem_hydrochloride))"
            }
    res_arg4={"bindings": {"A": "felodipine", "G": "rs"},
            "expl": "Treatment 'felodipine' should be considered as it promotes goal 'rs', given patient facts.",
            "name": "aspt([goal(rs),action(felodipine),promotes(felodipine,rs)],action(felodipine))"
            }
    res_arg5={"bindings": {"A": "lacidipine", "G": "rs"},
            "expl": "Treatment 'lacidipine' should be considered as it promotes goal 'rs', given patient facts.",
            "name": "aspt([goal(rs),action(lacidipine),promotes(lacidipine,rs)],action(lacidipine))"
            }
    res_arg6={"bindings": {"A": "lercanidipine_hydrochloride", "G": "rs"},
            "expl": "Treatment 'lercanidipine_hydrochloride' should be considered as it promotes goal 'rs', given patient facts.",
            "name": "aspt([goal(rs),action(lercanidipine_hydrochloride),promotes(lercanidipine_hydrochloride,rs)],action(lercanidipine_hydrochloride))"
            }
    res_arg7={"bindings": {"A": "nicardipine_hydrochloride", "G": "rs"},
            "expl": "Treatment 'nicardipine_hydrochloride' should be considered as it promotes goal 'rs', given patient facts.",
            "name": "aspt([goal(rs),action(nicardipine_hydrochloride),promotes(nicardipine_hydrochloride,rs)],action(nicardipine_hydrochloride))"
            }
    res_arg8={"bindings": {"A": "nifedipine", "G": "rs"},
            "expl": "Treatment 'nifedipine' should be considered as it promotes goal 'rs', given patient facts.",
            "name": "aspt([goal(rs),action(nifedipine),promotes(nifedipine,rs)],action(nifedipine))"
            }
    res_arg9={"bindings": {"A": "nimodipine", "G": "rs"},
            "expl": "Treatment 'nimodipine' should be considered as it promotes goal 'rs', given patient facts.",
            "name": "aspt([goal(rs),action(nimodipine),promotes(nimodipine,rs)],action(nimodipine))"
            }
    res_arg10={"bindings": {"A": "ramipril_with_felodipine", "G": "rs"},
            "expl": "Treatment 'ramipril_with_felodipine' should be considered as it promotes goal 'rs', given patient facts.",
            "name": "aspt([goal(rs),action(ramipril_with_felodipine),promotes(ramipril_with_felodipine,rs)],action(ramipril_with_felodipine))"
            }
    res_arg11={"bindings": {"A": "verapamil_hydrochloride", "G": "rs"},
            "expl": "Treatment 'verapamil_hydrochloride' should be considered as it promotes goal 'rs', given patient facts.",
            "name": "aspt([goal(rs),action(verapamil_hydrochloride),promotes(verapamil_hydrochloride,rs)],action(verapamil_hydrochloride))"
            }
    
    results.append(res_arg1)
    results.append(res_arg2)
    results.append(res_arg3)
    results.append(res_arg4)
    results.append(res_arg5)
    results.append(res_arg6)
    results.append(res_arg7)
    results.append(res_arg8)
    results.append(res_arg9)
    results.append(res_arg10)
    results.append(res_arg11)
    
    assert_results(winning,results)

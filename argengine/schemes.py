def string_parser(pred_dict,s):
    import re

    def parse_for_key(key, reg, st):
	    return re.findall(key+reg, st)

    def reg_builder(key):
        r1 = "\(([A-z0-9_]+)\)"
        r2 = "\(([,A-z0-9_]+)\)"

        if len(pred_dict[key]) == 1:
            return r1
        else:
            return r2

    # a dictionary to keep the result
    res = {}
    bindings = {}
    for p in pred_dict.keys():
        res[p] = parse_for_key(p, reg_builder(p), s)[0].split(',')

        i = 0
        while i < len(res[p]):
            var = pred_dict[p][i]
            if var not in bindings.keys():
                bindings[var] = res[p][i]
            i+=1

    return bindings

"""
    s: an argument string to parse.
    example input: s = "aspt([goal(rp),action(paracetamol),promotes(paracetamol,rp)],action(paracetamol))"
"""
def aspt(s):
    pred_dict= {"goal":["G"], "action":["A"], "promotes":["A","G"]}

    bindings = string_parser(pred_dict,s)

    explanation = "Treatment '{}' should be considered as it promotes goal '{}', given patient facts.".format(bindings["A"],bindings["G"])

    return bindings,explanation

"""
    s: an argument string to parse.
    example input: amber([systolic(P,S),"<150", ">134"],flag(amber))
    TODO: out where the information is coming from.
"""
def amber(s):
    explanation = ""
    bindings = {}
    if "systolic" in s:
        pred_dict= {"systolic":["P","S"]}
        bindings = string_parser(pred_dict,s)

        explanation+= "The systolic measurement of the patient {} is {}. This value is less than 150 and more than 134; therefore, an amber flag is raised.".format(bindings["P"],bindings["S"])

    if "diastolic" in s:
        pred_dict= {"diastolic":["P","D"]}
        bindings = string_parser(pred_dict,s)

        explanation+= "The diastolic measurement of the patient {} is {}. This value is less than 95 and more than 84; therefore, an amber flag is raised.".format(bindings["P"],bindings["D"])

    return bindings,explanation


def red(s):
    explanation = ""
    bindings = {}
    if "systolic" in s:
        pred_dict= {"systolic":["P","S"]}
        bindings = string_parser(pred_dict,s)

        explanation+= "The systolic measurement of the patient {} is {}. This value is less than 180 and more than 149; therefore, a red flag is raised.".format(bindings["P"],bindings["S"])

    if "diastolic" in s:
        pred_dict= {"diastolic":["P","D"]}
        bindings = string_parser(pred_dict,s)

        explanation+= "The diastolic measurement of the patient {} is {}. This value is less than 110 and more than 94; therefore, a red flag is raised.".format(bindings["P"],bindings["D"])

    return bindings,explanation


def dred(s):
    explanation = ""
    bindings = {}
    if "systolic" in s:
        pred_dict= {"systolic":["P","S"]}
        bindings = string_parser(pred_dict,s)

        explanation+= "The systolic measurement of the patient {} is {}. This value is more than 179; therefore, a double red flag is raised.".format(bindings["P"],bindings["S"])

    if "diastolic" in s:
        pred_dict= {"diastolic":["P","D"]}
        bindings = string_parser(pred_dict,s)

        explanation+= "The diastolic measurement of the patient {} is {}. This value is more than 109; therefore, a double red flag is raised.".format(bindings["P"],bindings["D"])

    return bindings,explanation

def provenance(s):

    return "",""

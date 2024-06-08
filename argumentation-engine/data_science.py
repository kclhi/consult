import json

class DataScience():

    @staticmethod
    def getPatientFacts(pdict):

        pdict = pdict[0];
        id = "p"+pdict['pid'].replace("-","_")
        age = pdict['age']
        eth = pdict['ethnicity'].lower()
        last_sys = pdict['c271649006']
        last_dia = pdict['c271650006']
        res_sbp = pdict['res.c271649006']
        res_dbp = pdict['res.c271650006']
        flags = ['Amber Flag','Red Flag','Double Red Flag']
        facts=''.join(['patient(', id ,').\n', 'age(', id, ',', str(age),').\n', 'ethnic_origin(', id, ',', eth,').\n', 'systolic(', id, ',', str(last_sys),').\n', 'diastolic(', id, ',', str(last_dia),').\n'])

        if (res_sbp in flags) or (res_dbp in flags): facts = facts + 'side_effect(hbp).\n'

        print "Patient facts: " + str(facts);

        return facts

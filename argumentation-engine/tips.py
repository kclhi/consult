from flask_restful import Resource
import sqlite3, json
from flask import g
from random import shuffle

class Tips(Resource):

    DATABASE = 'tips.sqlite'

    @staticmethod
    def get_db():
        db = getattr(g, '_database', None)
        if db is None:
            db = g._database = sqlite3.connect(Tips.DATABASE)
            db.row_factory = sqlite3.Row
        return db

    @staticmethod
    def query_db(query, args=(), one=False):
        cur = Tips.get_db().cursor()
        cur.execute(query, args)
        r = [dict((cur.description[i][0], value) for i, value in enumerate(row)) for row in cur.fetchall()]
        cur.connection.close()
        return (r[0] if r else None) if one else r

    def get(self, collation):

        tips = Tips.query_db('select title, content, source, image from tips')

        if ( collation == "random" ):
            shuffle(tips)
            return json.dumps(tips[0])
        else:
            return tips

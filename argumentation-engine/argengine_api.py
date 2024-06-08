from flask import Flask, request, g
from flask_restful import Api, reqparse

from chatbot import ChatBot
from test_chatbot import TestChatbot
from tips import Tips

app = Flask(__name__)
api = Api(app)

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

# routing
api.add_resource(ChatBot, '/argengine/chatbot')
api.add_resource(TestChatbot, '/argengine/chatbot/<string:name>') # chatbot testing
api.add_resource(Tips, '/argengine/tips/<string:collation>')

if __name__ == '__main__':
    app.run(debug=True)

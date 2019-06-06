from flask import Flask, request
from flask_restful import Api, reqparse

from chatbot import ChatBot
from test_chatbot import TestChatbot

app = Flask(__name__)
api = Api(app)

# routing
api.add_resource(ChatBot, '/argengine/chatbot')
api.add_resource(TestChatbot, '/argengine/chatbot/<string:name>') # chatbot testing

if __name__ == '__main__':
    app.run(debug=True)

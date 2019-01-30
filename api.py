from flask import Flask, request
from flask_restful import Resource, Api

app = Flask(__name__)
api = Api(app)

todos = {}


class HelloWorld(Resource):
    def get(self):
        return {'hello': 'world'}

class TodoSimple(Resource):
    def get(self, todo_id):
        return {todo_id: todos[todo_id]}

    def put(self, todo_id):
        todos[todo_id] = request.form['data']
        return {todo_id: todos[todo_id]}

# TodoList
# shows a list of all todos, and lets you POST to add new tasks
class TodoList(Resource):
    def get(self):
        return todos

# routing
api.add_resource(HelloWorld, '/')
api.add_resource(TodoSimple, '/<string:todo_id>')
api.add_resource(TodoList, '/todos')

if __name__ == '__main__':
    app.run(debug=True)

var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());

var todos = [
  { id: 1, title: "Learn GitHub", done: false },
  { id: 2, title: "Build a project", done: false }
];

app.get('/todos', function (req, res) {
  res.json(todos);
});

app.post('/todos', function (req, res) {
  var newTodo = {
    id: todos.length + 1,
    title: req.body.title,
    done: false
  };
  todos.push(newTodo);
  res.status(201).json(newTodo);
});

app.listen(3000, function () {
  console.log('Todo API running on http://localhost:3000');
});

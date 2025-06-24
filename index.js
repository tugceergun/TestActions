var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());

var todos = [
  { id: 1, title: "Learn GitHub", done: false },
  { id: 2, title: "Build a project", done: false }
];

// Input validation middleware
function validateTodo(req, res, next) {
  if (!req.body.title || req.body.title.trim().length === 0) {
    return res.status(400).json({ error: 'Title is required and cannot be empty' });
  }
  if (req.body.title.length > 100) {
    return res.status(400).json({ error: 'Title cannot exceed 100 characters' });
  }
  next();
}

app.get('/todos', function (req, res) {
  try {
    res.json({
      success: true,
      data: todos,
      count: todos.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/todos/:id', function (req, res) {
  try {
    const id = parseInt(req.params.id);
    const todo = todos.find(t => t.id === id);
    
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json({ success: true, data: todo });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/todos', validateTodo, function (req, res) {
  try {
    var newTodo = {
      id: todos.length + 1,
      title: req.body.title.trim(),
      done: req.body.done || false,
      createdAt: new Date().toISOString()
    };
    todos.push(newTodo);
    res.status(201).json({ success: true, data: newTodo });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

app.put('/todos/:id', validateTodo, function (req, res) {
  try {
    const id = parseInt(req.params.id);
    const todoIndex = todos.findIndex(t => t.id === id);
    
    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    todos[todoIndex] = {
      ...todos[todoIndex],
      title: req.body.title.trim(),
      done: req.body.done !== undefined ? req.body.done : todos[todoIndex].done,
      updatedAt: new Date().toISOString()
    };
    
    res.json({ success: true, data: todos[todoIndex] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

app.delete('/todos/:id', function (req, res) {
  try {
    const id = parseInt(req.params.id);
    const todoIndex = todos.findIndex(t => t.id === id);
    
    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    const deletedTodo = todos.splice(todoIndex, 1)[0];
    res.json({ success: true, message: 'Todo deleted', data: deletedTodo });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

app.listen(3000, function () {
  console.log('Todo API running on http://localhost:3000');
  console.log('Available endpoints:');
  console.log('- GET /todos - List all todos');
  console.log('- GET /todos/:id - Get specific todo');
  console.log('- POST /todos - Create new todo');
  console.log('- PUT /todos/:id - Update todo');
  console.log('- DELETE /todos/:id - Delete todo');
});

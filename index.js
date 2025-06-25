var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());

var todos = [
  { id: 1, title: "Learn GitHub", done: false, createdAt: new Date().toISOString() },
  { id: 2, title: "Build a project", done: false, createdAt: new Date().toISOString() }
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

// New endpoint: Get todo statistics
app.get('/stats', function (req, res) {
  try {
    const total = todos.length;
    const completed = todos.filter(todo => todo.done).length;
    const pending = total - completed;
    
    res.json({
      success: true,
      data: {
        total: total,
        completed: completed,
        pending: pending,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// New endpoint: Health check
app.get('/health', function (req, res) {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    todos_count: todos.length
  });
});

// New endpoint: Mark multiple todos as complete
app.patch('/todos/complete-all', function (req, res) {
  try {
    let completedCount = 0;
    todos.forEach(todo => {
      if (!todo.done) {
        todo.done = true;
        todo.updatedAt = new Date().toISOString();
        completedCount++;
      }
    });
    
    res.json({
      success: true,
      message: `${completedCount} todos marked as complete`,
      data: { completedCount }
    });
  } catch (error) {
    console.error('Error completing todos:', error);
    res.status(500).json({ error: 'Failed to complete todos' });
  }
});

app.listen(3000, function () {
  console.log('🚀 Enhanced Todo API running on http://localhost:3000');
  console.log('📋 Available endpoints:');
  console.log('- GET /todos - List all todos');
  console.log('- GET /todos/:id - Get specific todo');
  console.log('- POST /todos - Create new todo');
  console.log('- PUT /todos/:id - Update todo');
  console.log('- DELETE /todos/:id - Delete todo');
  console.log('- GET /stats - Get todo statistics');
  console.log('- GET /health - Health check');
  console.log('- PATCH /todos/complete-all - Mark all todos as complete');
  console.log('✨ Enhanced with new features for better functionality!');
});

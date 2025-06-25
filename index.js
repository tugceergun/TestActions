var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());

var todos = [
  { id: 1, title: "Learn GitHub", done: false, createdAt: new Date().toISOString() },
  { id: 2, title: "Build a project", done: false, createdAt: new Date().toISOString() }
];

// Enhanced input validation middleware
function validateTodo(req, res, next) {
  const errors = [];
  
  // Title validation
  if (!req.body.title || req.body.title.trim().length === 0) {
    errors.push('Title is required and cannot be empty');
  } else if (req.body.title.length > 100) {
    errors.push('Title cannot exceed 100 characters');
  } else if (req.body.title.length < 3) {
    errors.push('Title must be at least 3 characters long');
  }
  
  // Priority validation
  if (req.body.priority && !['low', 'normal', 'high', 'urgent'].includes(req.body.priority)) {
    errors.push('Priority must be one of: low, normal, high, urgent');
  }
  
  // Done validation
  if (req.body.done !== undefined && typeof req.body.done !== 'boolean') {
    errors.push('Done must be a boolean value');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ 
      success: false,
      error: 'Validation failed', 
      details: errors 
    });
  }
  
  next();
}

app.get('/todos', function (req, res) {
  try {
    const { status, limit, search } = req.query;
    let filteredTodos = todos;
    
    // Filter by completion status
    if (status !== undefined) {
      const isDone = status === 'completed';
      filteredTodos = filteredTodos.filter(todo => todo.done === isDone);
    }
    
    // Search in title
    if (search) {
      filteredTodos = filteredTodos.filter(todo => 
        todo.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Limit results
    if (limit && !isNaN(limit)) {
      filteredTodos = filteredTodos.slice(0, parseInt(limit));
    }
    
    res.json({
      success: true,
      data: filteredTodos,
      count: filteredTodos.length,
      total: todos.length,
      filters: { status, search, limit }
    });
  } catch (error) {
    console.error('Error fetching todos:', error);
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
      id: Math.max(...todos.map(t => t.id), 0) + 1, // Better ID generation
      title: req.body.title.trim(),
      done: req.body.done || false,
      priority: req.body.priority || 'normal', // New priority field
      createdAt: new Date().toISOString()
    };
    todos.push(newTodo);
    console.log(`New todo created: "${newTodo.title}" with priority: ${newTodo.priority}`);
    res.status(201).json({ success: true, data: newTodo });
  } catch (error) {
    console.error('Error creating todo:', error);
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

// New endpoint: Clear all completed todos
app.delete('/todos/completed', function (req, res) {
  try {
    const initialCount = todos.length;
    todos = todos.filter(todo => !todo.done);
    const deletedCount = initialCount - todos.length;
    
    res.json({
      success: true,
      message: `${deletedCount} completed todos cleared`,
      data: { deletedCount, remaining: todos.length }
    });
  } catch (error) {
    console.error('Error clearing completed todos:', error);
    res.status(500).json({ error: 'Failed to clear completed todos' });
  }
});

// Enhanced stats endpoint with priority breakdown
app.get('/stats/detailed', function (req, res) {
  try {
    const total = todos.length;
    const completed = todos.filter(todo => todo.done).length;
    const pending = total - completed;
    
    // Priority breakdown
    const priorityStats = todos.reduce((acc, todo) => {
      const priority = todo.priority || 'normal';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});
    
    // Recent activity (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentTodos = todos.filter(todo => 
      new Date(todo.createdAt) > yesterday || 
      (todo.updatedAt && new Date(todo.updatedAt) > yesterday)
    );
    
    res.json({
      success: true,
      data: {
        overview: {
          total,
          completed,
          pending,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
        },
        priorityBreakdown: priorityStats,
        recentActivity: {
          count: recentTodos.length,
          todos: recentTodos.map(t => ({ id: t.id, title: t.title, priority: t.priority }))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching detailed stats:', error);
    res.status(500).json({ error: 'Failed to fetch detailed statistics' });
  }
});

// Add error handling middleware
app.use(function(req, res) {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: [
      'GET /todos', 'GET /todos/:id', 'POST /todos', 'PUT /todos/:id', 
      'DELETE /todos/:id', 'GET /stats', 'GET /stats/detailed', 
      'GET /health', 'PATCH /todos/complete-all', 'DELETE /todos/completed'
    ]
  });
});

app.listen(3000, function () {
  console.log('🚀 Enhanced Todo API v2.0 running on http://localhost:3000');
  console.log('📋 Available endpoints:');
  console.log('   GET    /todos                 - List todos (supports ?status, ?search, ?limit)');
  console.log('   GET    /todos/:id             - Get specific todo');
  console.log('   POST   /todos                 - Create new todo (supports priority field)');
  console.log('   PUT    /todos/:id             - Update todo');
  console.log('   DELETE /todos/:id             - Delete todo');
  console.log('   GET    /stats                 - Get basic statistics');
  console.log('   GET    /stats/detailed        - Get detailed statistics with priorities');
  console.log('   GET    /health                - Health check');
  console.log('   PATCH  /todos/complete-all    - Mark all todos as complete');
  console.log('   DELETE /todos/completed       - Clear all completed todos');
  console.log('');
  console.log('🔧 New Features:');
  console.log('   ✅ Enhanced validation with detailed error messages');
  console.log('   🔍 Search and filtering capabilities');
  console.log('   📊 Detailed statistics and analytics');
  console.log('   🧹 Bulk operations for better productivity');
  console.log('   🏷️  Priority system (low, normal, high, urgent)');
  console.log('   ⚡ Better error handling and logging');
  console.log('');
  console.log('✨ Ready for production use!');
});

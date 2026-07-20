const express = require('express');
const cors    = require('cors');
const app = express();
const PORT = 3000;

// Allow requests from any origin (including file://) during local development.
// The cors package automatically sets the Access-Control-Allow-Origin header
// so the browser stops blocking cross-origin fetch calls.
app.use(cors());

app.use(express.json());

// In-memory array acting as our "database" for now
let tasks = [
    { id: 1, title: "Learn Git basics", done: false },
    { id: 2, title: "Set up Express server", done: true }
];

app.get('/tasks', (req, res) => {
    res.json(tasks);
});

app.post('/tasks', (req, res) => {
    const newTask = {
        id: tasks.length + 1,
        title: req.body.title,
        done: false
    };
    tasks.push(newTask);
    res.status(201).json(newTask);
});

app.put('/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
        return res.status(404).json({ error: "Task not found" });
    }

    task.title = req.body.title ?? task.title;
    task.done = req.body.done ?? task.done;

    res.json(task);
});

app.delete('/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const index = tasks.findIndex(t => t.id === taskId);

    if (index === -1) {
        return res.status(404).json({ error: "Task not found" });
    }

    tasks.splice(index, 1);
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
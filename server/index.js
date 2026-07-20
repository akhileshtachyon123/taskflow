const express      = require('express');
const cors         = require('cors');
const Database     = require('better-sqlite3');
const path         = require('path');

const app  = express();
const PORT = 3000;

// ── Middleware ────────────────────────────────────────────────────────────────

// Allow requests from any origin (including file://) during local development.
app.use(cors());

// Parse incoming JSON request bodies.
app.use(express.json());

// ── Database setup ────────────────────────────────────────────────────────────

// Open (or create) tasks.db in the same directory as this file.
// better-sqlite3 is synchronous, so no callbacks or promises are needed.
const db = new Database(path.join(__dirname, 'tasks.db'));

// Create the tasks table if it doesn't already exist.
// `done` is stored as INTEGER (0 = false, 1 = true) — SQLite has no BOOLEAN type.
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT    NOT NULL,
    done  INTEGER NOT NULL DEFAULT 0
  )
`);

// Helper: convert a raw DB row so `done` is a JS boolean for the frontend.
function toTask(row) {
  return { id: row.id, title: row.title, done: row.done === 1 };
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /tasks — return every task in the table, oldest first.
app.get('/tasks', (req, res) => {
  // SELECT all rows ordered by insertion order (id ASC).
  const rows = db.prepare('SELECT * FROM tasks ORDER BY id ASC').all();
  res.json(rows.map(toTask));
});

// POST /tasks — insert a new task and return it with its generated id.
app.post('/tasks', (req, res) => {
  const { title } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }

  // INSERT the new task; done defaults to 0 (false) via the column default.
  const stmt   = db.prepare('INSERT INTO tasks (title) VALUES (?)');
  const result = stmt.run(title.trim());

  // Fetch the freshly-inserted row so we return exactly what's in the DB.
  const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(toTask(newTask));
});

// PUT /tasks/:id — update title and/or done for one task; return the updated row.
app.put('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);

  // Fetch the existing row so we can apply partial updates (keep current values
  // for fields the caller didn't include in the request body).
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // Use nullish coalescing to fall back to the current DB value when a field
  // is absent from the request body. Convert JS boolean → 0/1 for SQLite.
  const newTitle = req.body.title ?? existing.title;
  const newDone  = req.body.done  !== undefined
    ? (req.body.done ? 1 : 0)   // coerce boolean → integer
    : existing.done;

  // UPDATE the row with the merged values.
  db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?')
    .run(newTitle, newDone, taskId);

  // Return the updated row.
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  res.json(toTask(updated));
});

// DELETE /tasks/:id — remove one task; respond with 204 No Content.
app.delete('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);

  // Check the task exists before attempting deletion.
  const existing = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId);

  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // DELETE the row; no response body needed for a 204.
  db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
  res.status(204).send();
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Database file: ${path.join(__dirname, 'tasks.db')}`);
});
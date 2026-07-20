// Base URL for all API calls
const API = 'http://localhost:3000/tasks';

// ── DOM References ────────────────────────────────────────────────────────────
const form      = document.getElementById('task-form');
const input     = document.getElementById('task-input');
const taskList  = document.getElementById('task-list');
const emptyMsg  = document.getElementById('empty-msg');

// ── Fetch all tasks and render them ──────────────────────────────────────────
// Called on page load and after every mutating action so the UI stays in sync.
async function loadTasks() {
  try {
    const res   = await fetch(API);
    const tasks = await res.json();
    renderTasks(tasks);
  } catch (err) {
    console.error('Failed to load tasks:', err);
  }
}

// ── Render the task list into the DOM ────────────────────────────────────────
// Clears the list and rebuilds it from the provided array of task objects.
function renderTasks(tasks) {
  taskList.innerHTML = '';

  // Show or hide the "no tasks" message
  emptyMsg.classList.toggle('hidden', tasks.length > 0);

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item${task.done ? ' done' : ''}`;
    li.dataset.id = task.id;

    // Task title span
    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;

    // Toggle-done button — shows ✓ when pending, ↩ when done
    const checkBtn = document.createElement('button');
    checkBtn.className = 'btn-check';
    checkBtn.title = task.done ? 'Mark as undone' : 'Mark as done';
    checkBtn.textContent = task.done ? '↩' : '✓';
    checkBtn.addEventListener('click', () => toggleTask(task.id, task.done));

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className = 'btn-delete';
    delBtn.title = 'Delete task';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', () => deleteTask(task.id));

    li.append(title, checkBtn, delBtn);
    taskList.appendChild(li);
  });
}

// ── Add a new task (POST) ─────────────────────────────────────────────────────
// Reads the input value, POSTs it to the server, then reloads the list.
async function addTask(title) {
  try {
    await fetch(API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title }),
    });
    await loadTasks(); // re-render after adding
  } catch (err) {
    console.error('Failed to add task:', err);
  }
}

// ── Toggle a task's done status (PUT) ────────────────────────────────────────
// Sends the flipped `done` value to the server, then reloads the list.
async function toggleTask(id, currentDone) {
  try {
    await fetch(`${API}/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ done: !currentDone }),
    });
    await loadTasks(); // re-render after toggling
  } catch (err) {
    console.error('Failed to update task:', err);
  }
}

// ── Delete a task (DELETE) ────────────────────────────────────────────────────
// Sends a DELETE request for the given task ID, then reloads the list.
async function deleteTask(id) {
  try {
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    await loadTasks(); // re-render after deleting
  } catch (err) {
    console.error('Failed to delete task:', err);
  }
}

// ── Form submit handler ───────────────────────────────────────────────────────
// Prevents page reload, validates input, and delegates to addTask().
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = input.value.trim();
  if (!title) return;
  input.value = '';       // clear the field immediately for fast re-use
  await addTask(title);
});

// ── Initialise ────────────────────────────────────────────────────────────────
// Kick off the first load when the page is ready.
loadTasks();

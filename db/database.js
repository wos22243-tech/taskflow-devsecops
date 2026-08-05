const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'taskflow.db'));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    owner_id INTEGER,
    status TEXT DEFAULT 'todo'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER,
    author TEXT,
    content TEXT
  )`);

  // VULN (intentionnelle): mots de passe stockes en clair, pas de hash
  db.run(`INSERT OR IGNORE INTO users (id, username, password, role) VALUES
    (1, 'admin', 'admin123', 'admin'),
    (2, 'alice', 'password1', 'user'),
    (3, 'bob', 'bobpass', 'user')`);

  db.run(`INSERT OR IGNORE INTO tasks (id, title, description, owner_id, status) VALUES
    (1, 'Preparer le rapport', 'Rapport trimestriel a finir', 2, 'todo'),
    (2, 'Corriger le bug prod', 'Le serveur plante sous charge', 3, 'in_progress')`);
});

module.exports = db;

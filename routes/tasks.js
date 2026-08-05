const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

module.exports = function (JWT_SECRET) {
  const router = express.Router();

  function verifyToken(req, res, next) {
    const token = req.cookies.token || (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Non authentifie' });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Token invalide' });
    }
  }

  router.get('/', verifyToken, (req, res) => {
    db.all('SELECT * FROM tasks', (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  router.post('/', verifyToken, (req, res) => {
    const { title, description } = req.body;
    db.run('INSERT INTO tasks (title, description, owner_id, status) VALUES (?, ?, ?, ?)',
      [title, description, req.user.id, 'todo'],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
      });
  });

  // VULN (intentionnelle): XSS stocke - le contenu du commentaire n'est jamais
  // echappe cote serveur ni cote client avant affichage (voir public/task.html)
  router.post('/:id/comments', verifyToken, (req, res) => {
    const { content } = req.body;
    const taskId = req.params.id;
    db.run('INSERT INTO comments (task_id, author, content) VALUES (?, ?, ?)',
      [taskId, req.user.username, content],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
      });
  });

  router.get('/:id/comments', verifyToken, (req, res) => {
    db.all('SELECT * FROM comments WHERE task_id = ?', [req.params.id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  return router;
};

const express = require('express');
const db = require('../db/database');

const router = express.Router();

// VULN (intentionnelle): injection SQL via parametre GET, sans authentification
// Payload de test: /api/search?q=x' UNION SELECT id,username,password,role FROM users --
router.get('/', (req, res) => {
  const q = req.query.q || '';
  const query = `SELECT id, title, description, status FROM tasks WHERE title LIKE '%${q}%'`;

  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message, query });
    res.json(rows);
  });
});

module.exports = router;

const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

module.exports = function (JWT_SECRET) {
  const router = express.Router();

  // VULN (intentionnelle): injection SQL - concatenation directe de l'input utilisateur
  // Payload de test: username = admin' -- 
  router.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

    db.get(query, (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur serveur', details: err.message });
      }
      if (!user) {
        return res.status(401).json({ error: 'Identifiants invalides' });
      }

      // pas d'expiration definie sur le token, role inclus tel quel
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
      res.cookie('token', token, { httpOnly: false }); // VULN: httpOnly false
      res.json({ message: 'Connecte', token });
    });
  });

  router.post('/register', (req, res) => {
    const { username, password } = req.body;
    // VULN: aucun hash de mot de passe, aucune validation de complexite
    db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, 'user')`,
      [username, password],
      function (err) {
        if (err) return res.status(400).json({ error: 'Utilisateur deja existant' });
        res.json({ message: 'Utilisateur cree', id: this.lastID });
      });
  });

  return router;
};

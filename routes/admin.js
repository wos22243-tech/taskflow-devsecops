const express = require('express');
const { exec } = require('child_process');
const fileUpload = require('express-fileupload');
const path = require('path');

module.exports = function (ADMIN_API_KEY) {
  const router = express.Router();
  router.use(fileUpload());

  function checkApiKey(req, res, next) {
    // VULN (intentionnelle): comparaison non constante (timing attack) +
    // cle transmise en clair dans un header custom
    if (req.headers['x-api-key'] !== ADMIN_API_KEY) {
      return res.status(403).json({ error: 'Cle API invalide' });
    }
    next();
  }

  // VULN (intentionnelle): injection de commande OS - l'input utilisateur est
  // passe directement a exec() sans validation ni echappement
  // Payload de test: host = "127.0.0.1; cat /etc/passwd"
  router.get('/ping', checkApiKey, (req, res) => {
    const host = req.query.host || 'localhost';
    exec(`ping -c 1 ${host}`, (err, stdout, stderr) => {
      if (err) return res.status(500).json({ error: stderr });
      res.json({ result: stdout });
    });
  });

  // VULN (intentionnelle): upload de fichier sans validation de type/extension,
  // ecriture directe dans le dossier public (execution possible si .js/.php servi)
  router.post('/upload', checkApiKey, (req, res) => {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }
    const file = req.files.file;
    const uploadPath = path.join(__dirname, '..', 'public', 'uploads', file.name);
    file.mv(uploadPath, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Fichier televerse', path: `/uploads/${file.name}` });
    });
  });

  return router;
};

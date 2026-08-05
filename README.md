# TaskFlow — Application cible pour le projet DevSecOps

Petit gestionnaire de tâches (Node.js/Express + SQLite) conçu comme **application
cible** pour le projet "Développement d'un pipeline DevSecOps et validation avec
des attaques". Elle contient des vulnérabilités **intentionnelles**, à détecter
puis corriger via le pipeline CI/CD.

## Installation locale

```bash
npm install
node server.js
# ou
docker compose up --build
```

L'application écoute sur `http://localhost:3000`.

Comptes de test (voir `db/database.js`) :
- `admin` / `admin123` (rôle admin)
- `alice` / `password1`
- `bob` / `bobpass`

## Cartographie des vulnérabilités intentionnelles

| # | Type (OWASP) | Emplacement | Description |
|---|---|---|---|
| 1 | A03 Injection (SQLi) | `routes/auth.js` — `/api/auth/login` | Concaténation directe de l'input dans la requête SQL |
| 2 | A03 Injection (SQLi) | `routes/search.js` — `/api/search` | Idem, sans authentification requise |
| 3 | A03 Injection (commande OS) | `routes/admin.js` — `/api/admin/ping` | `exec()` avec input utilisateur non validé |
| 4 | A03 Injection (XSS stocké) | `public/task.html` + `routes/tasks.js` | Commentaires insérés via `innerHTML` sans échappement |
| 5 | A02 Défaillances cryptographiques | `db/database.js` | Mots de passe stockés en clair, pas de hash (bcrypt attendu) |
| 6 | A05 Mauvaise configuration | `server.js` | CORS ouvert à `*`, cookie JWT `httpOnly: false` |
| 7 | A07 Identification/authentification | `routes/auth.js` | JWT sans expiration, pas de limitation de tentatives (brute force possible) |
| 8 | A08 Intégrité logicielle | `Dockerfile` | Image de base `node:16-slim` obsolète, conteneur exécuté en root |
| 9 | A06 Composants vulnérables | `package.json` | `lodash@4.17.15` (prototype pollution) et `express-fileupload@1.1.6` (CVE connues), versions figées volontairement anciennes |
| 10 | A01 Contrôle d'accès défaillant | `routes/admin.js` — `/api/admin/upload` | Upload de fichier sans validation de type/extension, écrit dans le dossier public |
| 11 | Secrets exposés | `server.js` | Clé JWT et clé API codées en dur dans le code source |

## Utilisation dans le pipeline

- **SAST** (Semgrep/SonarQube) doit détecter : injections SQL/commande, usage
  d'`exec`, `innerHTML` non échappé.
- **Secrets scanning** (Gitleaks) doit détecter : `JWT_SECRET` et `ADMIN_API_KEY`
  dans `server.js`.
- **SCA** (Trivy/Dependency-Check) doit détecter : `lodash@4.17.15`,
  `express-fileupload@1.1.6`.
- **Container scanning** (Trivy) doit détecter : CVE de `node:16-slim`.
- **DAST** (OWASP ZAP) doit détecter à l'exécution : XSS sur `/task.html`,
  injections sur `/api/search` et `/api/auth/login`, en-têtes de sécurité
  manquants (CSP, X-Frame-Options, etc.).

## Avertissement

Cette application est volontairement vulnérable. Ne jamais la déployer sur un
réseau public ou accessible depuis Internet. Utilisation strictement réservée
à un environnement de test isolé (local ou VM dédiée) dans le cadre du projet.

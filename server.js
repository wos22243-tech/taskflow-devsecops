const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// VULN (intentionnelle): secret JWT et cle API codes en dur dans le source
// -> doit etre detecte par un scanner de secrets (Gitleaks / TruffleHog)
const JWT_SECRET = 'sup3r_s3cret_taskflow_key_2024';
const ADMIN_API_KEY = 'sk_live_4f8a9c2b1e7d6f3a9b0c1d2e3f4a5b6c';

const authRoutes = require('./routes/auth')(JWT_SECRET);
const taskRoutes = require('./routes/tasks')(JWT_SECRET);
const searchRoutes = require('./routes/search');
const adminRoutes = require('./routes/admin')(ADMIN_API_KEY);

const app = express();

// VULN (intentionnelle): CORS ouvert a tous les domaines
app.use(cors({ origin: '*', credentials: true }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TaskFlow demarre sur le port ${PORT}`);
});

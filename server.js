const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

/* ===============================
   HEALTH CHECKS
================================ */
app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/healthz', (req, res) => res.status(200).send('OK'));


/* ===============================
   HELPER: Extract subdomain
================================ */
function getSubdomain(hostname) {
    const parts = hostname.split('.');

    // localhost support
    if (hostname.includes('localhost')) return null;

    // xsen.fun → no subdomain
    if (parts.length <= 2) return null;

    return parts[0];
}


/* ===============================
   ROOT ROUTING
================================ */
app.get('/', (req, res) => {
    const subdomain = getSubdomain(req.hostname);

    console.log('Host:', req.hostname, 'Subdomain:', subdomain);

    if (subdomain) {
        const channelFile = path.join(__dirname, `${subdomain}.html`);

        return res.sendFile(channelFile, (err) => {
            if (err) {
                console.log('Channel file not found, serving index.html');
                return res.sendFile(path.join(__dirname, 'index.html'));
            }
        });
    }

    return res.sendFile(path.join(__dirname, 'index.html'));
});


/* ===============================
   CHANNEL APP ROUTE
   sooners.xsen.fun/app
================================ */
app.get('/app', (req, res) => {
    const subdomain = getSubdomain(req.hostname);

    if (!subdomain) {
        return res.status(404).send('Not found');
    }

    const appFile = path.join(__dirname, `${subdomain}-app.html`);

    return res.sendFile(appFile, (err) => {
        if (err) {
            return res.status(404).send('Channel app not found');
        }
    });
});


/* ===============================
   STATIC FILES (AFTER routing)
================================ */
app.use(express.static(__dirname));


/* ===============================
   START SERVER
================================ */
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`XSEN Server running on port ${PORT}`);
});


process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down...');
    server.close(() => {
        process.exit(0);
    });
});

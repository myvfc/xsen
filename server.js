const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// ─── HEALTH CHECK FIRST ───────────────────────────────
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// ─── MAIN PAGE ROUTING ────────────────────────────────
app.get('/', (req, res) => {
    const hostname = req.hostname;
    console.log('Request:', hostname, req.path);

    if (hostname === 'sooners.xsen.fun') {
        return res.sendFile(path.join(__dirname, 'sooners.html'));
    }
    else if (hostname === 'cowboys.xsen.fun') {
        return res.sendFile(path.join(__dirname, 'okstate.html'));
    }
    else if (hostname === 'xsen.fun' || hostname.includes('railway.app')) {
        return res.sendFile(path.join(__dirname, 'index.html'));
    }
    else {
        res.status(404).send('Not found');
    }
});

// ─── STATIC PAGE ROUTES ───────────────────────────────
app.get('/landing.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing.html'));
});

app.get('/channels.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'channels.html'));
});

// ─── CHAT APP ROUTING ─────────────────────────────────
app.get('/app', (req, res) => {
    const hostname = req.hostname;

    if (hostname === 'sooners.xsen.fun') {
        return res.sendFile(path.join(__dirname, 'sooners/app.html'));
    }
    else if (hostname === 'cowboys.xsen.fun') {
        return res.sendFile(path.join(__dirname, 'okstate/app.html'));
    }
    else {
        res.status(404).send('Not found');
    }
});

// ─── LOGIN ROUTING ────────────────────────────────────
app.get('/login', (req, res) => {
    const hostname = req.hostname;

    if (hostname === 'sooners.xsen.fun') {
        return res.sendFile(path.join(__dirname, 'sooners/login.html'));
    }
    else if (hostname === 'cowboys.xsen.fun') {
        return res.sendFile(path.join(__dirname, 'okstate/login.html'));
    }
    else {
        res.status(404).send('Not found');
    }
});

// ─── STATIC FILES LAST ────────────────────────────────
// Only handles CSS, JS, images etc - NOT index.html for /
app.use(express.static(__dirname));

// ─── HANDLE SIGTERM GRACEFULLY ────────────────────────
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

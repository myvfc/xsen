const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));

// Health check
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// ─── MAIN PAGE ROUTING ────────────────────────────────
app.get('/', (req, res) => {
    const hostname = req.hostname;

    console.log('Request:', hostname, req.path);

    // sooners.xsen.fun → sales page
    if (hostname === 'sooners.xsen.fun') {
        return res.sendFile(path.join(__dirname, 'sooners.html'));
    }
    // cowboys.xsen.fun → sales page
    else if (hostname === 'cowboys.xsen.fun') {
        return res.sendFile(path.join(__dirname, 'cowboys.html'));
    }
    // xsen.fun paths
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

    // sooners.xsen.fun/app → sooners chat
    if (hostname === 'sooners.xsen.fun') {
        return res.sendFile(path.join(__dirname, 'sooners/app.html'));
    }
    // cowboys.xsen.fun/app → cowboys chat
    else if (hostname === 'cowboys.xsen.fun') {
        return res.sendFile(path.join(__dirname, 'cowboys/app.html'));
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
        return res.sendFile(path.join(__dirname, 'cowboys/login.html'));
    }
    else {
        res.status(404).send('Not found');
    }
});

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

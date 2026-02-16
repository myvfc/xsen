const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// CRITICAL: Health check MUST be first and fast
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.get('/healthz', (req, res) => {
    res.status(200).send('OK');
});

// Serve static files AFTER health check
app.use(express.static(__dirname));

// Main routing
app.get('/', (req, res) => {
    const hostname = req.hostname;
    
    console.log('Serving:', hostname, req.path);
    
    // sooners.xsen.fun → sooners.html
    if (hostname === 'sooners.xsen.fun') {
        console.log('Serving sooners.html');
        return res.sendFile(path.join(__dirname, 'sooners.html'));
    }
    
    // xsen.fun (main site)
    console.log('Serving index.html');
    return res.sendFile(path.join(__dirname, 'index.html'));
});

// /landing.html route
app.get('/landing.html', (req, res) => {
    return res.sendFile(path.join(__dirname, 'landing.html'));
});

// /channels.html route
app.get('/channels.html', (req, res) => {
    return res.sendFile(path.join(__dirname, 'channels.html'));
});

// sooners.xsen.fun/app → chat
app.get('/app', (req, res) => {
    if (req.hostname === 'sooners.xsen.fun') {
        return res.sendFile(path.join(__dirname, 'sooners-app.html'));
    }
    return res.status(404).send('Not found');
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

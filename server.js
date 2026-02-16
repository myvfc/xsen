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

// Subdomain routing
app.get('/', (req, res) => {
    const hostname = req.hostname;
    
    console.log('Hostname:', hostname); // DEBUG
    
    // sooners.xsen.fun
    if (hostname === 'sooners.xsen.fun') {
        console.log('Serving sooners.html'); // DEBUG
        res.sendFile(path.join(__dirname, 'sooners.html'));
    }
    // xsen.fun/landing.html
    else if (req.path === '/landing.html') {
        res.sendFile(path.join(__dirname, 'landing.html'));
    }
    // xsen.fun/channels.html
    else if (req.path === '/channels.html') {
        res.sendFile(path.join(__dirname, 'channels.html'));
    }
    // xsen.fun (main site)
    else if (hostname === 'xsen.fun' || hostname.includes('railway.app')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
    else {
        res.status(404).send('Not found');
    }
});

// sooners.xsen.fun/app route
app.get('/app', (req, res) => {
    if (req.hostname === 'sooners.xsen.fun') {
        res.sendFile(path.join(__dirname, 'sooners-app.html'));
    } else {
        res.status(404).send('Not found');
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`); // FIXED
});

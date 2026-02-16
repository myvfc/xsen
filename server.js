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

// Main routing
app.get('/', (req, res) => {
    const hostname = req.hostname;
    
    console.log('Request:', hostname, req.path);
    
    // sooners.xsen.fun → sooners.html
    if (hostname === 'sooners.xsen.fun') {
        return res.sendFile(path.join(__dirname, 'sooners.html'));
    }
    
    // xsen.fun paths
    if (hostname === 'xsen.fun' || hostname.includes('railway.app')) {
        if (req.path === '/landing.html') {
            return res.sendFile(path.join(__dirname, 'landing.html'));
        }
        if (req.path === '/channels.html') {
            return res.sendFile(path.join(__dirname, 'channels.html'));
        }
        // Default to index.html
        return res.sendFile(path.join(__dirname, 'index.html'));
    }
    
    res.status(404).send('Not found');
});

// sooners.xsen.fun/app → chat
app.get('/app', (req, res) => {
    if (req.hostname === 'sooners.xsen.fun') {
        return res.sendFile(path.join(__dirname, 'sooners-app.html'));
    }
    res.status(404).send('Not found');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

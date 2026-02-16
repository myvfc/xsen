const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));

// Subdomain routing
app.get('/', (req, res) => {
    const hostname = req.hostname;
    
    // sooners.xsen.fun
    if (hostname === 'sooners.xsen.fun') {
        res.sendFile(path.join(__dirname, 'sooners.html'));
    }
    // xsen.fun/landing.html
    else if (req.path === '/landing.html') {
        res.sendFile(path.join(__dirname, 'landing.html'));
    }
    // xsen.fun/channels.html ← ADD THIS
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

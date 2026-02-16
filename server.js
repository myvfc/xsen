const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));

// Health check for Railway (ADD THIS)
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Subdomain routing (rest stays the same)
app.get('/', (req, res) => {
    const hostname = req.hostname;
    
    if (hostname === 'sooners.xsen.fun') {
        res.sendFile(path.join(__dirname, 'sooners.html'));
    }
    // ... rest of your routes
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

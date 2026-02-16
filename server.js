const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Health check - MUST respond quickly
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.get('*', (req, res) => {
    console.log('========== REQUEST RECEIVED ==========');
    console.log('URL:', req.url);
    console.log('Hostname:', req.hostname);
    console.log('======================================');
    
    res.send(`
        <h1>XSEN SERVER IS WORKING!</h1>
        <p>URL: ${req.url}</p>
        <p>Hostname: ${req.hostname}</p>
    `);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('===========================================');
    console.log(`SERVER LISTENING ON PORT ${PORT}`);
    console.log('Server ready');
    console.log('===========================================');
});

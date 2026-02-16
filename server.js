const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('*', (req, res) => {
    console.log('========== REQUEST RECEIVED ==========');
    console.log('URL:', req.url);
    console.log('Hostname:', req.hostname);
    console.log('Method:', req.method);
    console.log('======================================');
    
    res.send(`
        <h1>XSEN SERVER IS WORKING!</h1>
        <p>URL: ${req.url}</p>
        <p>Hostname: ${req.hostname}</p>
        <p>Time: ${new Date().toISOString()}</p>
    `);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('===========================================');
    console.log(`SERVER LISTENING ON PORT ${PORT}`);
    console.log('Server is ready to receive requests');
    console.log('Binding to: 0.0.0.0');
    console.log('===========================================');
});

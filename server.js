// ─── MAIN PAGE ROUTING ────────────────────────────────
app.get('/', (req, res) => {
  const hostname = req.hostname;
  console.log('Request:', hostname, req.path);

  if (hostname === 'sooners.xsen.fun') {
    return res.sendFile(path.join(__dirname, 'sooners.html'));
  }
  else if (hostname === 'okstate.xsen.fun') {
    return res.sendFile(path.join(__dirname, 'okstate.html'));
  }
  else if (hostname === 'longhorns.xsen.fun') {  // ← ADD THIS
    return res.sendFile(path.join(__dirname, 'longhorns.html'));
  }
  else if (hostname === 'xsen.fun' || hostname.includes('railway.app')) {
    return res.sendFile(path.join(__dirname, 'index.html'));
  }
  else {
    res.status(404).send('Not found');
  }
});

// ─── CHAT APP ROUTING ─────────────────────────────────
app.get('/app', (req, res) => {
  const hostname = req.hostname;

  if (hostname === 'sooners.xsen.fun') {
    return res.sendFile(path.join(__dirname, 'sooners/app.html'));
  }
  else if (hostname === 'okstate.xsen.fun') {
    return res.sendFile(path.join(__dirname, 'okstate/app.html'));
  }
  else if (hostname === 'longhorns.xsen.fun') {  // ← ADD THIS
    return res.sendFile(path.join(__dirname, 'longhorns/app.html'));
  }
  else {
    res.status(404).send('Not found');
  }
});

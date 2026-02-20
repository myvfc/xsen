/**
 * XSEN NIL Notification System — v2
 * In-channel prompt (sound + vibration + bold UI) + browser push
 * Requires: window.supabase already initialized before this script
 */

// ── CONFIG ───────────────────────────────────────────────────────────────────

const XSEN_NIL_CONFIG = {
  school: 'sooners',
  nil_url: 'https://your-nil-group.com/donate',
  poll_interval_ms: 30000,
  prompt_display_ms: 90000,
};

const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_HERE';


// ── SOUND ────────────────────────────────────────────────────────────────────

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const tones = [
      { freq: 880,  start: 0,    duration: 0.15 },
      { freq: 1100, start: 0.18, duration: 0.25 },
    ];
    tones.forEach(function(t) {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(t.freq, ctx.currentTime + t.start);
      gain.gain.setValueAtTime(0, ctx.currentTime + t.start);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + t.start + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + t.start + t.duration);
      osc.start(ctx.currentTime + t.start);
      osc.stop(ctx.currentTime + t.start + t.duration);
    });
  } catch(e) {
    console.log('Audio unavailable:', e);
  }
}


// ── VIBRATION ────────────────────────────────────────────────────────────────

function vibrateDevice() {
  if ('vibrate' in navigator) {
    navigator.vibrate([150, 80, 150]);
  }
}


// ── IN-CHANNEL PROMPT ────────────────────────────────────────────────────────

var lastSeenPromptId = sessionStorage.getItem('xsen_last_nil_id') || null;
var nilShowCount = parseInt(sessionStorage.getItem('xsen_nil_count') || '0');

async function pollNilQueue() {
  try {
    var result = await window.supabase
      .from('nil_prompt_queue')
      .select('*')
      .eq('school', XSEN_NIL_CONFIG.school)
      .is('displayed_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    var data  = result.data;
    var error = result.error;

    if (error || !data || data.length === 0) return;

    var prompt = data[0];
    if (prompt.id === lastSeenPromptId) return;
    if (nilShowCount >= 3) return;
  lastSeenPromptId = prompt.id;
  nilShowCount++;
  sessionStorage.setItem('xsen_last_nil_id', prompt.id);
  sessionStorage.setItem('xsen_nil_count', nilShowCount);

    await window.supabase
      .from('nil_prompt_queue')
      .update({ displayed_at: new Date().toISOString() })
      .eq('id', prompt.id);

    showInChannelPrompt(prompt);

  } catch(err) {
    console.error('NIL poll error:', err);
  }
}

function showInChannelPrompt(prompt) {
  var container = document.getElementById('nil-prompt-container');
  if (!container) return;

  playAlertSound();
  vibrateDevice();

  container.innerHTML =
    '<div class="nil-prompt" id="nil-prompt-card">' +
      '<div class="nil-prompt-accent"></div>' +
      '<div class="nil-prompt-inner">' +
        '<div class="nil-prompt-left">' +
          '<div class="nil-prompt-tag"><span class="nil-dot"></span>⚡ NIL MOMENT</div>' +
          '<div class="nil-prompt-message">' + prompt.message + '</div>' +
          '<div class="nil-prompt-sub">Support goes directly to your NIL collective — not XSEN.</div>' +
        '</div>' +
        '<div class="nil-prompt-right">' +
          '<a href="' + prompt.nil_url + '" target="_blank" class="nil-prompt-btn" onclick="trackNilClick(\'' + prompt.id + '\')">Support Now →</a>' +
          '<button class="nil-prompt-dismiss" onclick="dismissNilPrompt()">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="nil-prompt-progress"><div class="nil-prompt-progress-fill" id="nil-progress-fill"></div></div>' +
    '</div>';

  container.style.display = 'block';

  requestAnimationFrame(function() {
    var fill = document.getElementById('nil-progress-fill');
    if (fill) {
      fill.style.transition = 'width ' + XSEN_NIL_CONFIG.prompt_display_ms + 'ms linear';
      setTimeout(function() { fill.style.width = '0%'; }, 50);
    }
  });

  setTimeout(function() { dismissNilPrompt(); }, XSEN_NIL_CONFIG.prompt_display_ms);
}

function dismissNilPrompt() {
  var card      = document.getElementById('nil-prompt-card');
  var container = document.getElementById('nil-prompt-container');
  if (!card) return;
  card.classList.add('nil-prompt-exit');
  setTimeout(function() {
    if (container) { container.style.display = 'none'; container.innerHTML = ''; }
  }, 400);
}

async function trackNilClick(promptId) {
  try {
    await window.supabase
      .from('nil_prompt_queue')
      .update({ clicked: true })
      .eq('id', promptId);
  } catch(e) {}
}


// ── BROWSER PUSH ─────────────────────────────────────────────────────────────

async function initPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    var registration = await navigator.serviceWorker.register('/sw-xsen.js');
    var permission   = Notification.permission;

    if (permission === 'granted') {
      await subscribeToPush(registration);
    } else if (permission === 'default') {
      showPushOptIn(registration);
    }
  } catch(e) {
    console.log('Push init error:', e);
  }
}

function showPushOptIn(registration) {
  if (sessionStorage.getItem('xsen_push_asked')) return;
  sessionStorage.setItem('xsen_push_asked', '1');

  var banner = document.getElementById('push-optin-banner');
  if (!banner) return;
  banner.style.display = 'flex';

  document.getElementById('push-optin-yes').addEventListener('click', async function() {
    banner.style.display = 'none';
    var result = await Notification.requestPermission();
    if (result === 'granted') await subscribeToPush(registration);
  });

  document.getElementById('push-optin-no').addEventListener('click', function() {
    banner.style.display = 'none';
  });
}

async function subscribeToPush(registration) {
  try {
    var subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    await window.supabase.from('push_subscriptions').upsert({
      school: XSEN_NIL_CONFIG.school,
      subscription: JSON.stringify(subscription),
      created_at: new Date().toISOString()
    });
  } catch(err) {
    console.error('Push subscription failed:', err);
  }
}

function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  var rawData = atob(base64);
  return Uint8Array.from(Array.from(rawData).map(function(c) { return c.charCodeAt(0); }));
}


// ── START ─────────────────────────────────────────────────────────────────────

setInterval(pollNilQueue, XSEN_NIL_CONFIG.poll_interval_ms);
pollNilQueue();
initPushNotifications();


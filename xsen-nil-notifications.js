/**
 * XSEN NIL Notification System — v2
 * Bigger, louder, unmissable.
 * Handles: in-channel prompt (sound + vibration + bold UI) + browser push
 * Requires: Supabase client initialized as `supabase` before this script
 */

// ── CONFIG ───────────────────────────────────────────────────────────────────

const XSEN_NIL_CONFIG = {
  school: 'sooners',
  nil_url: 'https://your-nil-group.com/donate',
  poll_interval_ms: 30000,
  prompt_display_ms: 90000,  // 90 seconds — longer window to act
};

const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_HERE';


// ── SOUND ────────────────────────────────────────────────────────────────────
// Uses Web Audio API — no audio file needed, generated in browser

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Two-tone chime — attention-getting but not jarring
    const tones = [
      { freq: 880, start: 0,    duration: 0.15 },
      { freq: 1100, start: 0.18, duration: 0.25 },
    ];

    tones.forEach(({ freq, start, duration }) => {
      const osc    = ctx.createOscillator();
      const gain   = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type      = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + start + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    });
  } catch (e) {
    // Audio not available — silent fail, everything else still works
    console.log('Audio not available:', e);
  }
}


// ── VIBRATION ────────────────────────────────────────────────────────────────

function vibrateDevice() {
  if ('vibrate' in navigator) {
    // Two short bursts — feels like a game alert
    navigator.vibrate([150, 80, 150]);
  }
}


// ── IN-CHANNEL PROMPT ────────────────────────────────────────────────────────

let lastSeenPromptId = null;

async function pollNilQueue() {
  try {
    const { data, error } = await supabase
      .from('nil_prompt_queue')
      .select('*')
      .eq('school', XSEN_NIL_CONFIG.school)
      .is('displayed_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return;

    const prompt = data[0];
    if (prompt.id === lastSeenPromptId) return;
    lastSeenPromptId = prompt.id;

    await supabase
      .from('nil_prompt_queue')
      .update({ displayed_at: new Date().toISOString() })
      .eq('id', prompt.id);

    showInChannelPrompt(prompt);

  } catch (err) {
    console.error('NIL poll error:', err);
  }
}

function showInChannelPrompt(prompt) {
  const container = document.getElementById('nil-prompt-container');
  if (!container) return;

  // Fire sound + vibration immediately
  playAlertSound();
  vibrateDevice();

  // Inject the card
  container.innerHTML = `
    <div class="nil-prompt" id="nil-prompt-card">

      <!-- Pulsing top accent bar -->
      <div class="nil-prompt-accent"></div>

      <div class="nil-prompt-inner">

        <div class="nil-prompt-left">
          <div class="nil-prompt-tag">
            <span class="nil-dot"></span>
            ⚡ NIL MOMENT
          </div>
          <div class="nil-prompt-message">${prompt.message}</div>
          <div class="nil-prompt-sub">
            Support goes directly to your NIL collective — not XSEN.
          </div>
        </div>

        <div class="nil-prompt-right">
          <a href="${prompt.nil_url}"
             target="_blank"
             class="nil-prompt-btn"
             onclick="trackNilClick('${prompt.id}')">
            Support Now →
          </a>
          <button class="nil-prompt-dismiss" onclick="dismissNilPrompt()" aria-label="Dismiss">✕</button>
        </div>

      </div>

      <!-- Countdown bar -->
      <div class="nil-prompt-progress">
        <div class="nil-prompt-progress-fill" id="nil-progress-fill"></div>
      </div>

    </div>
  `;

  container.style.display = 'block';

  // Start countdown bar
  requestAnimationFrame(() => {
    const fill = document.getElementById('nil-progress-fill');
    if (fill) {
      fill.style.transition = `width ${XSEN_NIL_CONFIG.prompt_display_ms}ms linear`;
      setTimeout(() => fill.style.width = '0%', 50);
    }
  });

  // Auto-dismiss
  setTimeout(() => dismissNilPrompt(), XSEN_NIL_CONFIG.prompt_display_ms);
}

function dismissNilPrompt() {
  const card = document.getElementById('nil-prompt-card');
  const container = document.getElementById('nil-prompt-container');
  if (!card) return;
  card.classList.add('nil-prompt-exit');
  setTimeout(() => {
    if (container) { container.style.display = 'none'; container.innerHTML = ''; }
  }, 400);
}

async function trackNilClick(promptId) {
  try {
    await supabase
      .from('nil_prompt_queue')
      .update({ clicked: true })
      .eq('id', promptId);
  } catch (e) {}
}


// ── BROWSER PUSH ─────────────────────────────────────────────────────────────

async function initPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    const registration = await navigator.serviceWorker.register('/sw-xsen.js');
    const permission   = Notification.permission;

    if (permission === 'granted') {
      await subscribeToPush(registration);
    } else if (permission === 'default') {
      showPushOptIn(registration);
    }
  } catch (e) {
    console.log('Push init error:', e);
  }
}

function showPushOptIn(registration) {
  if (sessionStorage.getItem('xsen_push_asked')) return;
  sessionStorage.setItem('xsen_push_asked', '1');

  const banner = document.getElementById('push-optin-banner');
  if (!banner) return;
  banner.style.display = 'flex';

  document.getElementById('push-optin-yes').addEventListener('click', async () => {
    banner.style.display = 'none';
    const result = await Notification.requestPermission();
    if (result === 'granted') await subscribeToPush(registration);
  });

  document.getElementById('push-optin-no').addEventListener('click', () => {
    banner.style.display = 'none';
  });
}

async function subscribeToPush(registration) {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    await supabase.from('push_subscriptions').upsert({
      school: XSEN_NIL_CONFIG.school,
      subscription: JSON.stringify(subscription),
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Push subscription failed:', err);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}


// ── START ─────────────────────────────────────────────────────────────────────

setInterval(pollNilQueue, XSEN_NIL_CONFIG.poll_interval_ms);
pollNilQueue();
initPushNotifications();


// ── CSS ───────────────────────────────────────────────────────────────────────
/*
Replace your previous NIL CSS in sooners.html <style> block with this:

#nil-prompt-container {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  padding: 0 16px 16px;
  pointer-events: none;
}

.nil-prompt {
  pointer-events: all;
  background: #111111;
  border: 1px solid rgba(201,168,76,0.6);
  border-radius: 10px;
  overflow: hidden;
  max-width: 720px;
  margin: 0 auto;
  box-shadow:
    0 0 0 1px rgba(201,168,76,0.15),
    0 30px 80px rgba(0,0,0,0.8),
    0 0 60px rgba(132,22,23,0.3);
  animation: nilSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.nil-prompt-exit {
  animation: nilSlideDown 0.4s ease forwards !important;
}

@keyframes nilSlideUp {
  from { opacity: 0; transform: translateY(100%); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes nilSlideDown {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(100%); }
}

.nil-prompt-accent {
  height: 4px;
  background: linear-gradient(90deg, #841617, #c9a84c, #841617);
  background-size: 200% 100%;
  animation: accentShimmer 2s linear infinite;
}

@keyframes accentShimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.nil-prompt-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px;
  flex-wrap: wrap;
}

.nil-prompt-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: #c9a84c;
  margin-bottom: 8px;
}

.nil-dot {
  width: 8px;
  height: 8px;
  background: #ff4444;
  border-radius: 50%;
  animation: nilPulse 1s infinite;
  flex-shrink: 0;
}

@keyframes nilPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(1.4); }
}

.nil-prompt-message {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 22px;
  letter-spacing: 1px;
  color: #f5f5f0;
  margin-bottom: 6px;
  line-height: 1.1;
}

.nil-prompt-sub {
  font-size: 11px;
  color: rgba(245,245,240,0.35);
  letter-spacing: 0.3px;
}

.nil-prompt-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.nil-prompt-btn {
  background: #841617;
  color: #f5f5f0;
  padding: 14px 28px;
  border-radius: 5px;
  text-decoration: none;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 20px;
  letter-spacing: 1.5px;
  white-space: nowrap;
  transition: all 0.2s;
  box-shadow: 0 4px 20px rgba(132,22,23,0.5);
}

.nil-prompt-btn:hover {
  background: #9a1c1d;
  transform: translateY(-1px);
  box-shadow: 0 8px 30px rgba(132,22,23,0.7);
}

.nil-prompt-dismiss {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  color: rgba(245,245,240,0.4);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nil-prompt-dismiss:hover {
  background: rgba(255,255,255,0.1);
  color: #f5f5f0;
}

.nil-prompt-progress {
  height: 4px;
  background: rgba(255,255,255,0.04);
}

.nil-prompt-progress-fill {
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, #841617, #c9a84c);
  border-radius: 0 2px 2px 0;
}

/* Push opt-in banner */
#push-optin-banner {
  display: none;
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 998;
  background: #1a1a1a;
  border: 1px solid rgba(201,168,76,0.3);
  border-radius: 8px;
  padding: 14px 20px;
  gap: 14px;
  align-items: center;
  max-width: 480px;
  width: calc(100% - 40px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
  font-family: 'DM Sans', sans-serif;
}

.push-optin-text {
  font-size: 13px;
  color: rgba(245,245,240,0.65);
  flex: 1;
  line-height: 1.5;
}

.push-optin-text strong { color: #f5f5f0; }

#push-optin-yes {
  background: #c9a84c;
  color: #0a0a0a;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  font-family: 'DM Sans', sans-serif;
}

#push-optin-no {
  background: none;
  border: none;
  color: rgba(245,245,240,0.3);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  font-family: 'DM Sans', sans-serif;
}

@media (max-width: 600px) {
  .nil-prompt-inner { padding: 18px 16px; gap: 14px; }
  .nil-prompt-message { font-size: 18px; }
  .nil-prompt-btn { padding: 12px 20px; font-size: 17px; }
  .nil-prompt-right { width: 100%; justify-content: space-between; }
}
*/

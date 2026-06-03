const WS_URL = 'ws://192.168.29.133:81';

let socket = null;
let reconnectTimer = null;
let activeLED = null;

function connectWebSocket() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  try { socket = new WebSocket(WS_URL); }
  catch (err) { setConnectionStatus(false); scheduleReconnect(); return; }
  socket.addEventListener('open', () => { console.log('[WS] Connected'); setConnectionStatus(true); });
  socket.addEventListener('close', () => { setConnectionStatus(false); scheduleReconnect(); });
  socket.addEventListener('error', () => { setConnectionStatus(false); });
  socket.addEventListener('message', (e) => { console.log('[WS] Received:', e.data); });
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => { reconnectTimer = null; connectWebSocket(); }, 3000);
}

function setConnectionStatus(connected) {
  const dot = document.getElementById('ws-status-dot');
  const text = document.getElementById('ws-status-text');
  dot.classList.toggle('connected', connected);
  dot.classList.toggle('disconnected', !connected);
  text.classList.toggle('connected', connected);
  text.classList.toggle('disconnected', !connected);
  text.textContent = connected ? 'Connected' : 'Disconnected';
}

function wsSend(message) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(message);
    console.log('[WS] Sent:', message);
  }
}

function turnOffAll(ledCards) {
  ledCards.forEach((card) => {
    wsSend('OFF:' + card.getAttribute('data-color'));
    card.querySelector('.led-status').textContent = 'OFF';
  });
  activeLED = null;
}

document.addEventListener('DOMContentLoaded', () => {
  const ledCards = document.querySelectorAll('.led-card');

  // ─── Use mouseenter/mouseleave on each card ───
  // pointer-events:none on children in CSS ensures
  // these fire only at the true card boundary
  ledCards.forEach((card) => {
    const colorName = card.getAttribute('data-color');
    const statusBadge = card.querySelector('.led-status');

    card.addEventListener('mouseenter', () => {
      // Turn OFF previous if different
      if (activeLED && activeLED !== colorName) {
        ledCards.forEach((c) => {
          if (c.getAttribute('data-color') === activeLED) {
            wsSend('OFF:' + activeLED);
            c.querySelector('.led-status').textContent = 'OFF';
          }
        });
      }
      activeLED = colorName;
      wsSend('ON:' + colorName);
      statusBadge.textContent = 'ON';
    });

    card.addEventListener('mouseleave', () => {
      if (activeLED === colorName) {
        wsSend('OFF:' + colorName);
        statusBadge.textContent = 'OFF';
        activeLED = null;
      }
    });
  });

  document.addEventListener('mouseleave', () => turnOffAll(ledCards));
  window.addEventListener('blur', () => turnOffAll(ledCards));

  connectWebSocket();
});
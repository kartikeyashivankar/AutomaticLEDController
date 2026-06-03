const LOCAL_WS_URL = 'ws://192.168.29.133:81';
const SECURE_WS_URL = 'wss://your-secure-websocket-domain/ws'; // change when you have secure backend

const WS_URL = window.location.protocol === 'https:'
  ? SECURE_WS_URL
  : LOCAL_WS_URL;

let socket = null;
let reconnectTimer = null;
let activeLED = null;
let isPageActive = true;

function connectWebSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  try {
    socket = new WebSocket(WS_URL);
  } catch (err) {
    console.error('[WS] WebSocket creation failed:', err);
    setConnectionStatus(false);
    scheduleReconnect();
    return;
  }

  socket.addEventListener('open', () => {
    console.log('[WS] Connected');
    setConnectionStatus(true);
  });

  socket.addEventListener('close', () => {
    console.log('[WS] Disconnected');
    setConnectionStatus(false);
    scheduleReconnect();
  });

  socket.addEventListener('error', (err) => {
    console.error('[WS] Error:', err);
    setConnectionStatus(false);
  });

  socket.addEventListener('message', (e) => {
    console.log('[WS] Received:', e.data);
  });
}

function scheduleReconnect() {
  if (reconnectTimer || !isPageActive) return;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectWebSocket();
  }, 3000);
}

function setConnectionStatus(connected) {
  const dot = document.getElementById('ws-status-dot');
  const text = document.getElementById('ws-status-text');

  if (!dot || !text) return;

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
    return true;
  } else {
    console.warn('[WS] Not connected. Message not sent:', message);
    setConnectionStatus(false);
    return false;
  }
}

function updateCardState(card, state) {
  const badge = card.querySelector('.led-status');
  if (badge) badge.textContent = state ? 'ON' : 'OFF';
  card.classList.toggle('active', state);
}

function turnOffAll(ledCards) {
  ledCards.forEach((card) => {
    const color = card.getAttribute('data-color');
    wsSend('OFF:' + color);
    updateCardState(card, false);
  });
  activeLED = null;
}

document.addEventListener('DOMContentLoaded', () => {
  const ledCards = document.querySelectorAll('.led-card');

  ledCards.forEach((card) => {
    const colorName = card.getAttribute('data-color');

    card.addEventListener('mouseenter', () => {
      if (!isPageActive) return;

      if (activeLED && activeLED !== colorName) {
        const prevCard = document.querySelector(`.led-card[data-color="${activeLED}"]`);
        if (prevCard) {
          wsSend('OFF:' + activeLED);
          updateCardState(prevCard, false);
        }
      }

      activeLED = colorName;
      wsSend('ON:' + colorName);
      updateCardState(card, true);
    });

    card.addEventListener('mouseleave', () => {
      if (activeLED === colorName) {
        wsSend('OFF:' + colorName);
        updateCardState(card, false);
        activeLED = null;
      }
    });
  });

  document.addEventListener('mouseleave', () => turnOffAll(ledCards));

  window.addEventListener('blur', () => turnOffAll(ledCards));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isPageActive = false;
      turnOffAll(ledCards);
    } else {
      isPageActive = true;
      connectWebSocket();
    }
  });

  connectWebSocket();
});
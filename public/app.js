/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Smart Shopping Assistant — Client App
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const API_BASE = '';

// ── State ──────────────────────────────────────────────────────
let sessionId = localStorage.getItem('shopSmart_sessionId') || null;
let isLoading = false;
let messageCount = 0;

// ── DOM Elements ───────────────────────────────────────────────
const welcomeScreen = document.getElementById('welcome-screen');
const messagesWrapper = document.getElementById('messages-wrapper');
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const btnSend = document.getElementById('btn-send');
const btnClear = document.getElementById('btn-clear-chat');
const statusBadge = document.getElementById('status-badge');
const chatContainer = document.getElementById('chat-container');

// ── Initialize ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkServerHealth();
  setupEventListeners();
  autoResizeTextarea();
});

// ── Event Listeners ────────────────────────────────────────────
function setupEventListeners() {
  // Send button
  btnSend.addEventListener('click', sendMessage);

  // Keyboard input
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Input change → enable/disable send button
  messageInput.addEventListener('input', () => {
    btnSend.disabled = messageInput.value.trim().length === 0;
    autoResizeTextarea();
  });

  // Clear chat
  btnClear.addEventListener('click', clearChat);

  // Category chips
  document.querySelectorAll('.chip[data-category]').forEach(chip => {
    chip.addEventListener('click', () => {
      const category = chip.dataset.category;
      messageInput.value = `Show me the best ${category.toLowerCase()} you have`;
      btnSend.disabled = false;
      messageInput.focus();
      sendMessage();
    });
  });

  // Quick prompt cards
  document.querySelectorAll('.prompt-card[data-prompt]').forEach(card => {
    card.addEventListener('click', () => {
      messageInput.value = card.dataset.prompt;
      btnSend.disabled = false;
      messageInput.focus();
      sendMessage();
    });
  });
}

// ── Auto Resize Textarea ───────────────────────────────────────
function autoResizeTextarea() {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

// ── Server Health Check ────────────────────────────────────────
async function checkServerHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    const data = await res.json();

    if (data.status === 'ok') {
      statusBadge.classList.add('online');
      statusBadge.classList.remove('offline');
      const statusText = statusBadge.querySelector('.status-text');
      statusText.textContent = data.engine === 'gemini' ? 'Gemini AI' : 'Local Engine';
    }
  } catch {
    statusBadge.classList.add('offline');
    statusBadge.classList.remove('online');
    const statusText = statusBadge.querySelector('.status-text');
    statusText.textContent = 'Offline';
  }
}

// ── Send Message ───────────────────────────────────────────────
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || isLoading) return;

  // Switch from welcome screen to chat
  if (welcomeScreen && !welcomeScreen.classList.contains('hidden')) {
    welcomeScreen.classList.add('hidden');
    messagesWrapper.classList.add('active');
  }

  // Add user message
  appendMessage('user', text);

  // Clear input
  messageInput.value = '';
  btnSend.disabled = true;
  autoResizeTextarea();

  // Show typing indicator
  isLoading = true;
  const typingEl = showTypingIndicator();

  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        sessionId: sessionId,
      }),
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const data = await res.json();

    // Save session
    if (data.sessionId) {
      sessionId = data.sessionId;
      localStorage.setItem('shopSmart_sessionId', sessionId);
    }

    // Remove typing indicator and add response
    removeTypingIndicator(typingEl);
    appendMessage('assistant', data.reply, data.engine);

  } catch (err) {
    console.error('Send error:', err);
    removeTypingIndicator(typingEl);
    appendMessage('assistant', 'Sorry, I\'m having trouble connecting right now. Please try again in a moment! 😅', 'error');
  } finally {
    isLoading = false;
  }
}

// ── Append Message ─────────────────────────────────────────────
function appendMessage(role, content, engine = null) {
  messageCount++;

  const messageEl = document.createElement('div');
  messageEl.className = `message ${role}`;
  messageEl.id = `message-${messageCount}`;

  const avatarEl = document.createElement('div');
  avatarEl.className = 'message-avatar';
  avatarEl.textContent = role === 'user' ? '👤' : '🤖';

  const contentEl = document.createElement('div');
  contentEl.className = 'message-content';
  contentEl.innerHTML = role === 'user' ? escapeHtml(content) : renderMarkdown(content);

  // Add engine badge for assistant messages
  if (role === 'assistant' && engine && engine !== 'error') {
    const badgeEl = document.createElement('div');
    badgeEl.className = `engine-badge ${engine}`;
    badgeEl.innerHTML = engine === 'gemini'
      ? '✨ Gemini AI'
      : '⚙️ Local Engine';
    contentEl.appendChild(badgeEl);
  }

  messageEl.appendChild(avatarEl);
  messageEl.appendChild(contentEl);
  messagesContainer.appendChild(messageEl);

  // Scroll to bottom
  scrollToBottom();
}

// ── Typing Indicator ───────────────────────────────────────────
function showTypingIndicator() {
  const el = document.createElement('div');
  el.className = 'typing-indicator';
  el.id = 'typing-indicator';

  el.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="typing-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;

  messagesContainer.appendChild(el);
  scrollToBottom();
  return el;
}

function removeTypingIndicator(el) {
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}

// ── Scroll to Bottom ───────────────────────────────────────────
function scrollToBottom() {
  requestAnimationFrame(() => {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  });
}

// ── Clear Chat ─────────────────────────────────────────────────
function clearChat() {
  // Reset UI
  messagesContainer.innerHTML = '';
  messagesWrapper.classList.remove('active');
  welcomeScreen.classList.remove('hidden');

  // Reset state
  sessionId = null;
  localStorage.removeItem('shopSmart_sessionId');
  messageCount = 0;

  // Focus input
  messageInput.focus();
}

// ── Markdown-Lite Renderer ─────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return '';

  let html = escapeHtml(text);

  // Bold **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic *text*
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // Inline code `text`
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');

  // Bullet lists: lines starting with - or •
  html = html.replace(/^[\-•]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Numbered lists: lines starting with 1. 2. etc.
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
  // Wrap consecutive <li> in <ol> (only numbered)
  // We'll handle this by wrapping any li not inside ul
  html = html.replace(/((?:^<li>.*<\/li>\n?)+)/gm, (match) => {
    if (!match.includes('<ul>')) {
      // Check if this is already wrapped
      return match;
    }
    return match;
  });

  // Line breaks (double newline → paragraph, single → br)
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');

  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<')) {
    html = '<p>' + html + '</p>';
  }

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

// ── Escape HTML ────────────────────────────────────────────────
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

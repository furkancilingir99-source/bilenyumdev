/* ---------------------------------------------------------------------------
 * Bilenyum robot-fab.js — Yumi sabit asistan butonu + chatbot davranışı
 *
 * Gereksinimler:
 *   - dom.js (önce yüklenmeli — $, $$, on global)
 *
 * HTML beklentileri:
 *   - FAB:        #robotFab
 *   - Panel:      #chatbot
 *   - Kapama:     #chatbotClose
 *   - Form:       #chatbotForm (içinde <input>)
 *   - Mesaj body: #chatbotBody
 *   - Hızlı yanıt butonları (opsiyonel): .chat-action
 *
 * Sayfa-özel bot cevapları için:
 *   window.BilenyumChatbot.replies = function (text) {
 *     text = text.toLowerCase();
 *     if (text.includes('matematik')) return 'Yumi: ...';
 *     return 'Sorunu aldım, detaylı yanıt vereceğim.'; // default fallback
 *   };
 *
 * Sayfa register etmezse generic fallback kullanılır.
 *
 * Boyut: yaklaşık 50 satır (önceki ortalama 75 satırın ~%70'i, üstüne sayfa-
 * başına 8-15 satırlık personality snippet'ı).
 * ------------------------------------------------------------------------- */
(function () {
  'use strict';

  var fab     = $('#robotFab');
  var chatbot = $('#chatbot');
  var closeBtn= $('#chatbotClose');
  var form    = $('#chatbotForm');
  var body    = $('#chatbotBody');
  if (!fab || !chatbot || !form || !body) return;

  var input  = $('input', form);
  var actions = $('.chat-actions', chatbot);

  function openChat()  { chatbot.classList.add('open');    chatbot.setAttribute('aria-hidden', 'false'); setTimeout(function () { input && input.focus(); }, 250); }
  function closeChat() { chatbot.classList.remove('open'); chatbot.setAttribute('aria-hidden', 'true'); }

  function appendMessage(text, who) {
    var msg = document.createElement('div');
    msg.className = 'chat-msg ' + (who === 'user' ? 'user' : 'bot');
    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = text;
    msg.appendChild(bubble);
    body.appendChild(msg);
    body.scrollTop = body.scrollHeight;
  }

  function handleUserText(text) {
    appendMessage(text, 'user');
    if (actions) actions.style.display = 'none';
    var resolver = (window.BilenyumChatbot && window.BilenyumChatbot.replies) || null;
    var reply = (resolver && resolver(text)) || 'Sorunu aldım. Kısa süre içinde sana detaylı bir yanıt vereceğim.';
    setTimeout(function () { appendMessage(reply, 'bot'); }, 600);
  }

  on(fab, 'click', function () { chatbot.classList.contains('open') ? closeChat() : openChat(); });
  if (closeBtn) on(closeBtn, 'click', closeChat);
  on(document, 'keydown', function (e) {
    if (e.key === 'Escape' && chatbot.classList.contains('open')) closeChat();
  });

  on($$('.chat-action', chatbot), 'click', function () { handleUserText(this.textContent.trim()); });

  on(form, 'submit', function (e) {
    e.preventDefault();
    var text = (input.value || '').trim();
    if (!text) return;
    input.value = '';
    handleUserText(text);
  });

  // Expose API (so pages can register reply resolver or push messages)
  window.BilenyumChatbot = window.BilenyumChatbot || {};
  window.BilenyumChatbot.open    = openChat;
  window.BilenyumChatbot.close   = closeChat;
  window.BilenyumChatbot.send    = function (text) { appendMessage(text, 'bot'); };
})();

/* Public website support UI. Session-only state; no founder or private account access. */
function startSupportChat() {
  if (document.getElementById('jc-support-chat')) return;
  const style = document.createElement('link');
  style.rel = 'stylesheet'; style.href = '/assets/support-chat.css';
  document.head.append(style);
  const root = document.createElement('aside');
  root.id = 'jc-support-chat';
  root.className = 'jc-chat';
  root.setAttribute('aria-label', 'Juss and Co support');
  root.innerHTML =
    '<section class="jc-chat__panel" id="jc-chat-panel" aria-label="Support conversation" hidden>' +
      '<div class="jc-chat__top"><div><div class="jc-chat__eyebrow">Juss &amp; Co · here to help</div>' +
      '<h2 class="jc-chat__title">What can we help with?</h2></div>' +
      '<button class="jc-chat__close" type="button" aria-label="Close support chat">✕</button></div>' +
      '<p class="jc-chat__notice">AI-assisted replies. Please don’t share passwords, payment details, private information or children’s information. Messages are processed to answer you; this page does not save your chat.</p>' +
      '<div class="jc-chat__history" role="log" aria-label="Chat messages" aria-live="polite" aria-relevant="additions"></div>' +
      '<div class="jc-chat__quick" aria-label="Suggested questions">' +
      '<button type="button" data-question="Tell me about Juss & Co products">Products</button>' +
      '<button type="button" data-question="What services do you offer?">Services</button>' +
      '<button type="button" data-question="How can I contact a person?">Talk to a person</button></div>' +
      '<form class="jc-chat__form"><textarea class="jc-chat__input" maxlength="900" rows="1" required aria-label="Your support question" placeholder="Ask about products, projects or support…"></textarea>' +
      '<button class="jc-chat__send" type="submit">Send</button></form>' +
      '<div class="jc-chat__footer">Want a person? <a href="/contact.html">Contact our team</a>.</div>' +
    '</section>' +
    '<button class="jc-chat__launch" id="jc-chat-launcher" type="button" aria-controls="jc-chat-panel" aria-expanded="false"><span class="jc-chat__spark" aria-hidden="true">✦</span> Ask Juss &amp; Co</button>';
  document.body.append(root);
  const panel = root.querySelector('#jc-chat-panel');
  const launch = root.querySelector('#jc-chat-launcher');
  const close = root.querySelector('.jc-chat__close');
  const log = root.querySelector('.jc-chat__history');
  const input = root.querySelector('.jc-chat__input');
  const form = root.querySelector('.jc-chat__form');
  const send = root.querySelector('.jc-chat__send');
  const quick = root.querySelector('.jc-chat__quick');
  const history = [];
  let busy = false;
  function toggle(open) {
    panel.hidden = !open; launch.setAttribute('aria-expanded', String(open));
    if (open) input.focus(); else launch.focus();
  }
  function append(role, text, links) {
    const bubble = document.createElement('div');
    bubble.className = 'jc-chat__bubble jc-chat__bubble--' + role;
    bubble.textContent = text;
    if (role === 'assistant' && Array.isArray(links) && links.length) {
      const sources = document.createElement('div');
      sources.className = 'jc-chat__links';
      for (const l of links.slice(0, 4)) {
        if (!l || typeof l.url !== 'string' || typeof l.label !== 'string') continue;
        let url;
        try { url = new URL(l.url, location.origin); } catch { continue; }
        const allowed = url.protocol === 'https:' && (
          url.hostname === 'www.jussco.company' || url.hostname === 'games.jussco.company'
        );
        if (!allowed) continue;
        const link = document.createElement('a');
        link.href = url.href; link.textContent = l.label.slice(0, 48);
        link.target = '_blank'; link.rel = 'noopener noreferrer';
        sources.append(link);
      }
      bubble.append(sources);
    }
    log.append(bubble); log.scrollTop = log.scrollHeight;
    return bubble;
  }
  append('assistant', 'Welcome to Juss & Co! I can help you explore our products, find a solution, or point you to the right person. What brings you here?');
  async function ask(question) {
    question = question.trim();
    if (busy || question.length < 2) return;
    append('user', question); input.value = '';
    quick.hidden = true; busy = true; send.disabled = true;
    const thinking = append('assistant', 'Finding the best next step…');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);
    try {
      const response = await fetch('/api/support-chat', {
        method:'POST', headers:{'content-type':'application/json'}, credentials:'omit',
        signal:controller.signal,
        body:JSON.stringify({message:question, history:history.slice(-4), page:location.pathname})
      });
      if (!response.ok) throw new Error('unavailable');
      const data = await response.json();
      if (!data || typeof data.answer !== 'string') throw new Error('invalid_answer');
      thinking.remove();
      append('assistant', data.answer, data.links);
      history.push({role:'user',content:question},{role:'assistant',content:data.answer.slice(0,600)});
      if (history.length > 4) history.splice(0,history.length-4);
    } catch {
      thinking.remove();
      append('assistant', 'The AI chat is unavailable right now. You can still reach Juss & Co through our Contact page.', [{label:'Contact Juss & Co',url:'https://www.jussco.company/contact.html'}]);
    } finally {
      clearTimeout(timeout); busy = false; send.disabled = false; input.focus();
    }
  }
  launch.addEventListener('click', () => toggle(panel.hidden));
  close.addEventListener('click', () => toggle(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) toggle(false); });
  form.addEventListener('submit', e => { e.preventDefault(); ask(input.value); });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input.value); }
  });
  quick.addEventListener('click', e => { const q = e.target.closest('[data-question]'); if (q) ask(q.dataset.question); });
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startSupportChat, {once:true});
  else startSupportChat();
}

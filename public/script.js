// ---------- Modelos de logo (dados de exemplo) ----------
const MODELS = [
  {
    name: 'Minimalista',
    tag: 'Linhas limpas, ideal para marcas modernas e versáteis',
    price: 'R$ 149',
    color: '#e8734a',
    svg: '<circle cx="12" cy="12" r="7"/>',
  },
  {
    name: 'Moderno',
    tag: 'Formas geométricas, ótimo para startups e tecnologia',
    price: 'R$ 179',
    color: '#5aa9e6',
    svg: '<rect x="5" y="5" width="14" height="14" rx="3"/>',
  },
  {
    name: 'Tech',
    tag: 'Visual digital, perfeito para apps e produtos SaaS',
    price: 'R$ 199',
    color: '#8e6bd8',
    svg: '<path d="M12 3l7 4v10l-7 4-7-4V7z"/>',
  },
  {
    name: 'Vintage',
    tag: 'Estilo retrô com emblema, para marcas artesanais',
    price: 'R$ 169',
    color: '#c99a4b',
    svg: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>',
  },
  {
    name: 'Luxo',
    tag: 'Elegante e sofisticado, para marcas premium',
    price: 'R$ 249',
    color: '#d4af37',
    svg: '<path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/>',
  },
  {
    name: 'Divertido',
    tag: 'Cores vivas e formas orgânicas, para marcas jovens',
    price: 'R$ 159',
    color: '#e05a8a',
    svg: '<path d="M12 21s-8-4.5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-8 11-8 11z"/>',
  },
];

function renderModels() {
  const grid = document.getElementById('modelsGrid');
  grid.innerHTML = MODELS.map(
    (m) => `
    <div class="model-card">
      <div class="model-thumb">
        <svg viewBox="0 0 24 24" width="56" height="56" fill="${m.color}" fill-opacity="0.9">${m.svg}</svg>
      </div>
      <p class="model-name">${m.name}</p>
      <p class="model-tag">${m.tag}</p>
      <div class="model-footer">
        <span class="model-price">${m.price}</span>
        <button class="buy-btn" data-style="${m.name}">Comprar</button>
      </div>
    </div>
  `
  ).join('');

  grid.querySelectorAll('.buy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      alert(
        `Você escolheu o modelo "${btn.dataset.style}".\n\n` +
        `Este é um protótipo — aqui entraria a integração com um checkout de pagamento (ex: Stripe/Mercado Pago).`
      );
    });
  });
}

// ---------- Chat ----------
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
const sendBtn = document.getElementById('sendBtn');
const styleSelect = document.getElementById('styleSelect');
const demoBanner = document.getElementById('demoBanner');

let history = [];

function addMessage(role, text) {
  const wrap = document.createElement('div');
  wrap.className = `msg ${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = text;
  wrap.appendChild(bubble);
  chatMessages.appendChild(wrap);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

function addLoadingBubble() {
  const wrap = document.createElement('div');
  wrap.className = 'msg assistant';
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble loading';
  bubble.textContent = 'Digitando...';
  wrap.appendChild(bubble);
  chatMessages.appendChild(wrap);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return wrap;
}

async function sendMessage(text) {
  addMessage('user', text);
  history.push({ role: 'user', content: text });

  sendBtn.disabled = true;
  const loadingWrap = addLoadingBubble();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history }),
    });
    const data = await res.json();
    loadingWrap.remove();

    if (!res.ok) {
      addMessage('assistant', data.error || 'Ocorreu um erro. Tente novamente.');
      return;
    }

    addMessage('assistant', data.reply);
    history.push({ role: 'assistant', content: data.reply });
  } catch (err) {
    loadingWrap.remove();
    addMessage('assistant', 'Não foi possível conectar ao servidor. Verifique se ele está rodando.');
  } finally {
    sendBtn.disabled = false;
  }
}

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  const style = styleSelect.value;
  const fullText = style && style !== 'Automático' ? `${text} (estilo preferido: ${style})` : text;

  chatInput.value = '';
  chatInput.style.height = 'auto';
  sendMessage(fullText);
});

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
});

chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 160) + 'px';
});

// ---------- Geração de imagem ----------
const generateImgBtn = document.getElementById('generateImgBtn');

function addImageMessage(imageUrl) {
  const wrap = document.createElement('div');
  wrap.className = 'msg assistant';
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  const img = document.createElement('img');
  img.src = imageUrl;
  img.alt = 'Logo gerado por IA';
  bubble.appendChild(img);

  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = 'logo-gerado.png';
  link.className = 'img-download';
  link.textContent = 'Baixar imagem';
  bubble.appendChild(document.createElement('br'));
  bubble.appendChild(link);

  wrap.appendChild(bubble);
  chatMessages.appendChild(wrap);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function generateImage() {
  const description = chatInput.value.trim() || history.filter((m) => m.role === 'user').slice(-1)[0]?.content;

  if (!description) {
    addMessage('assistant', 'Descreva o logo que você quer no campo de texto antes de gerar a imagem.');
    return;
  }

  const style = styleSelect.value;
  addMessage('user', `[Gerar imagem] ${description}${style !== 'Automático' ? ' — estilo: ' + style : ''}`);
  chatInput.value = '';
  chatInput.style.height = 'auto';

  generateImgBtn.disabled = true;
  sendBtn.disabled = true;
  const loadingWrap = addLoadingBubble();
  loadingWrap.querySelector('.msg-bubble').textContent = 'Gerando imagem, isso pode levar alguns segundos...';

  try {
    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, style }),
    });
    const data = await res.json();
    loadingWrap.remove();

    if (!res.ok) {
      addMessage('assistant', data.error || 'Não foi possível gerar a imagem.');
      return;
    }

    addImageMessage(data.imageUrl);
  } catch (err) {
    loadingWrap.remove();
    addMessage('assistant', 'Não foi possível conectar ao servidor para gerar a imagem.');
  } finally {
    generateImgBtn.disabled = false;
    sendBtn.disabled = false;
  }
}

generateImgBtn.addEventListener('click', generateImage);

// ---------- Status (modo demo) ----------
async function checkStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    if (data.demoMode) demoBanner.classList.remove('hidden');
  } catch (err) {
    // silencioso
  }
}

renderModels();
checkStatus();

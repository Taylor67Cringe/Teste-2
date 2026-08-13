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

// ---------- Anexos (imagem, PDF, texto, qualquer arquivo) ----------
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax

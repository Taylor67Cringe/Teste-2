/**
 * Servidor da LogoAI — 100% Node.js puro, sem dependências externas.
 * Requer Node.js 18+ (usa fetch nativo).
 *
 * Como usar:
 *   1. Copie .env.example para .env e cole sua OPENAI_API_KEY
 *   2. node server.js
 *   3. Abra http://localhost:3000
 *
 * Sem chave configurada, o servidor roda em MODO DEMO (respostas simuladas),
 * então você pode testar a interface sem gastar créditos de API.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

// ---- Carrega variáveis do .env (sem depender de pacote "dotenv") ----
function loadEnv(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx === -1) return;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      value = value.replace(/^['"]|['"]$/g, '');
      if (!(key in process.env)) process.env[key] = value;
    });
  } catch (err) {
    // .env não existe ainda — tudo bem, segue em modo demo
  }
}
loadEnv(path.join(__dirname, '.env'));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENAI_API_KEY || '';
const DEMO_MODE = !API_KEY;
const PUBLIC_DIR = path.join(__dirname, 'public');

const SYSTEM_PROMPT = `Você é o assistente virtual da "LogoAI", uma loja online de logos.
Seu papel é conversar com o visitante para entender o negócio dele (nome, ramo, estilo
preferido, cores, público-alvo) e recomendar um dos modelos de logo disponíveis no site
(Minimalista, Moderno, Tech, Vintage, Luxo, Divertido), explicando rapidamente por que
combina. Seja breve (2-4 frases), simpático, direto, e faça no máximo uma pergunta por vez.
Responda sempre em português do Brasil.`;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function sendJSON(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) req.destroy(); // limite de 1MB
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function handleChat(req, res) {
  try {
    const raw = await readBody(req);
    const body = raw ? JSON.parse(raw) : {};
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (DEMO_MODE) {
      const lastUser = [...messages].reverse().find((m) => m.role === 'user');
      const userText = lastUser ? lastUser.content : '';
      const reply =
        `(Modo demo — configure OPENAI_API_KEY no .env para respostas reais da OpenAI)\n\n` +
        `Entendi: "${userText}". Com base nisso, um estilo Moderno ou Minimalista combinaria bem. ` +
        `Me conta: qual é o nome do seu negócio e em que ramo ele atua?`;
      return sendJSON(res, 200, { reply });
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('Erro da OpenAI:', openaiRes.status, errText);
      return sendJSON(res, 502, { error: 'Erro ao falar com a OpenAI. Verifique sua OPENAI_API_KEY.' });
    }

    const data = await openaiRes.json();
    const reply = data.choices?.[0]?.message?.content || '';
    sendJSON(res, 200, { reply });
  } catch (err) {
    console.error('Erro no /api/chat:', err);
    sendJSON(res, 500, { error: 'Erro interno no servidor.' });
  }
}

async function handleGenerateImage(req, res) {
  try {
    const raw = await readBody(req);
    const body = raw ? JSON.parse(raw) : {};
    const description = (body.description || '').toString().trim();
    const style = (body.style || 'Automático').toString().trim();

    if (!description) {
      return sendJSON(res, 400, { error: 'Descreva o logo que você quer antes de gerar a imagem.' });
    }

    const prompt =
      `Logo profissional para um negócio, estilo ${style}. ` +
      `Fundo branco ou transparente, ícone limpo e centralizado, sem texto extra a menos que pedido. ` +
      `Descrição do negócio/logo: ${description}`;

    if (DEMO_MODE) {
      // Modo demo: devolve um SVG de placeholder em vez de chamar a API de imagens
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
        <rect width="512" height="512" fill="#1c1c1c"/>
        <circle cx="256" cy="256" r="120" fill="#e8734a"/>
        <text x="256" y="460" font-size="20" fill="#9a9a9a" text-anchor="middle" font-family="sans-serif">Modo demo — configure OPENAI_API_KEY</text>
      </svg>`;
      const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
      return sendJSON(res, 200, { imageUrl: dataUrl, demo: true });
    }

    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1024',
        quality: 'medium',
        n: 1,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('Erro da OpenAI (imagens):', openaiRes.status, errText);
      return sendJSON(res, 502, {
        error: 'Erro ao gerar a imagem. Verifique sua OPENAI_API_KEY e se há créditos disponíveis na conta.',
      });
    }

    const data = await openaiRes.json();
    const item = data.data?.[0];
    let imageUrl = '';
    if (item?.b64_json) {
      imageUrl = `data:image/png;base64,${item.b64_json}`;
    } else if (item?.url) {
      imageUrl = item.url;
    }

    if (!imageUrl) {
      return sendJSON(res, 502, { error: 'A OpenAI não retornou nenhuma imagem.' });
    }

    sendJSON(res, 200, { imageUrl });
  } catch (err) {
    console.error('Erro no /api/generate-image:', err);
    sendJSON(res, 500, { error: 'Erro interno no servidor ao gerar a imagem.' });
  }
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(PUBLIC_DIR, urlPath);

  // Evita path traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 - Não encontrado');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/status') {
    return sendJSON(res, 200, { demoMode: DEMO_MODE });
  }
  if (req.method === 'POST' && req.url === '/api/chat') {
    return handleChat(req, res);
  }
  if (req.method === 'POST' && req.url === '/api/generate-image') {
    return handleGenerateImage(req, res);
  }
  if (req.method === 'GET') {
    return serveStatic(req, res);
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  if (DEMO_MODE) {
    console.log('⚠️  OPENAI_API_KEY não encontrada — rodando em MODO DEMO (respostas simuladas).');
    console.log('   Copie .env.example para .env e adicione sua chave para respostas reais.');
  } else {
    console.log('🔑 OPENAI_API_KEY carregada — respostas reais da OpenAI ativadas.');
  }
});

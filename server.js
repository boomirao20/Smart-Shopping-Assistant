require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const products = require('./data/products.json');
const { getRecommendations, extractIntent } = require('./engines/localEngine');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Gemini Setup ──────────────────────────────────────────────
let genAI = null;
let model = null;

if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  console.log('✅ Gemini API initialized');
} else {
  console.log('⚠️  No Gemini API key found — using local fallback engine');
}

// ── Session Store ─────────────────────────────────────────────
const sessions = new Map();
const SESSION_TTL = 30 * 60 * 1000; // 30 minutes

function getSession(sessionId) {
  if (!sessionId || !sessions.has(sessionId)) {
    const id = sessionId || uuidv4();
    sessions.set(id, {
      id,
      history: [],
      preferences: {},
      createdAt: Date.now(),
      lastActivity: Date.now(),
    });
    return sessions.get(id);
  }
  const session = sessions.get(sessionId);
  session.lastActivity = Date.now();
  return session;
}

// Cleanup stale sessions every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.lastActivity > SESSION_TTL) {
      sessions.delete(id);
    }
  }
}, 10 * 60 * 1000);

// ── System Prompt ─────────────────────────────────────────────
function buildSystemPrompt(relevantProducts, userPreferences) {
  return `You are a Smart Shopping Assistant — a helpful, friendly, and knowledgeable shopping expert.

━━ CORE RULES ━━
- ONLY recommend products from the PRODUCT LIST below. NEVER invent products.
- If no product matches, say so honestly and suggest the closest alternatives from the list.
- Keep responses short, clean, and easy to scan.
- Use a warm, conversational tone with emojis sparingly.
- Format product recommendations with name, price (₹), and a brief reason.
- Use markdown formatting: **bold** for product names, bullet points for features.
- Maximum 5 product recommendations per response.

━━ INTELLIGENCE ━━
- Prioritize: budget fit → relevance to purpose → value for money → rating.
- If the query is vague, ask 1-2 focused follow-up questions.
- Use conversation context to refine suggestions.

━━ AVAILABLE PRODUCTS ━━
${JSON.stringify(relevantProducts, null, 2)}

${userPreferences && Object.keys(userPreferences).length > 0 ? `━━ USER PREFERENCES ━━\n${JSON.stringify(userPreferences)}` : ''}

━━ FORMAT ━━
For recommendations:
**1. Product Name** — ₹Price
Reason: Brief explanation of why this fits

For follow-ups / clarifications, keep it natural and helpful.`;
}

// ── Find Relevant Products ────────────────────────────────────
function findRelevantProducts(query) {
  const intent = extractIntent(query);
  const q = query.toLowerCase();

  let relevant = products;

  // Filter by category if detected
  if (intent.category) {
    const categoryProducts = products.filter(p => p.category === intent.category);
    if (categoryProducts.length > 0) {
      relevant = categoryProducts;
    }
  }

  // Filter by brand if detected
  if (intent.brand) {
    const brandProducts = relevant.filter(p => p.brand.toLowerCase() === intent.brand);
    if (brandProducts.length > 0) {
      relevant = brandProducts;
    }
  }

  // Filter by budget if detected
  if (intent.budget) {
    const budgetProducts = relevant.filter(p => p.price <= intent.budget * 1.1); // 10% margin
    if (budgetProducts.length > 0) {
      relevant = budgetProducts;
    }
  }

  // If still too many, try tag matching
  if (relevant.length > 15) {
    const tagMatched = relevant.filter(p =>
      p.tags.some(tag => q.includes(tag)) ||
      p.features.some(f => q.includes(f.toLowerCase()))
    );
    if (tagMatched.length >= 3) {
      relevant = tagMatched;
    }
  }

  // Cap at 20 products for context window
  return relevant.slice(0, 20);
}

// ── Chat with Gemini ──────────────────────────────────────────
async function chatWithGemini(userMessage, session) {
  const relevantProducts = findRelevantProducts(userMessage);
  const systemPrompt = buildSystemPrompt(relevantProducts, session.preferences);

  // Build conversation history for context
  const historyMessages = session.history.slice(-10).map(h => {
    return `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`;
  }).join('\n\n');

  const fullPrompt = `${systemPrompt}\n\n${historyMessages ? `━━ CONVERSATION HISTORY ━━\n${historyMessages}\n\n` : ''}User: ${userMessage}\n\nAssistant:`;

  const result = await model.generateContent(fullPrompt);
  const response = result.response.text();

  return response;
}

// ── API Routes ────────────────────────────────────────────────

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const session = getSession(sessionId);

    // Add user message to history
    session.history.push({ role: 'user', content: message.trim(), timestamp: Date.now() });

    let reply;
    let engine = 'gemini';

    if (model) {
      try {
        reply = await chatWithGemini(message.trim(), session);
      } catch (err) {
        console.error('Gemini API error, falling back to local engine:', err.message);
        const result = getRecommendations(message.trim(), session.history);
        reply = result.message;
        engine = 'local';
      }
    } else {
      const result = getRecommendations(message.trim(), session.history);
      reply = result.message;
      engine = 'local';
    }

    // Add assistant reply to history
    session.history.push({ role: 'assistant', content: reply, timestamp: Date.now() });

    // Keep history manageable
    if (session.history.length > 30) {
      session.history = session.history.slice(-20);
    }

    res.json({
      reply,
      sessionId: session.id,
      engine,
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Get all products
app.get('/api/products', (req, res) => {
  const { category, minPrice, maxPrice, brand } = req.query;

  let filtered = [...products];

  if (category) {
    filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }
  if (brand) {
    filtered = filtered.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
  }
  if (minPrice) {
    filtered = filtered.filter(p => p.price >= parseInt(minPrice));
  }
  if (maxPrice) {
    filtered = filtered.filter(p => p.price <= parseInt(maxPrice));
  }

  res.json(filtered);
});

// Get categories
app.get('/api/categories', (req, res) => {
  const categories = [...new Set(products.map(p => p.category))];
  const categoryCounts = categories.map(cat => ({
    name: cat,
    count: products.filter(p => p.category === cat).length,
  }));
  res.json(categoryCounts);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    engine: model ? 'gemini' : 'local',
    products: products.length,
    sessions: sessions.size,
  });
});

// ── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🛍️  Smart Shopping Assistant is running!`);
  console.log(`   Local:  http://localhost:${PORT}`);
  console.log(`   Engine: ${model ? '🤖 Gemini AI' : '⚙️  Local Fallback'}`);
  console.log(`   Products: ${products.length} items loaded\n`);
});

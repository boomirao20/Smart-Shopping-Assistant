const products = require('../data/products.json');

/**
 * Local fallback recommendation engine.
 * Uses keyword matching, conversational understanding, and fuzzy text search
 * when the Gemini API is unavailable.
 */

// ── Keyword Maps ──────────────────────────────────────────────
const CATEGORY_KEYWORDS = {
  Smartphones: ['phone', 'smartphone', 'mobile', 'cell', 'handset', 'android', 'iphone'],
  Laptops: ['laptop', 'notebook', 'macbook', 'chromebook', 'computer', 'pc'],
  "Men's Shoes": ["men's shoes", "mens shoes", "men shoe", "men sneaker", "men boot", "men sandal", "men's footwear", "mens footwear"],
  "Women's Shoes": ["women's shoes", "womens shoes", "women shoe", "women sneaker", "women heel", "women sandal", "women's footwear", "womens footwear", "ladies shoes", "ladies footwear"],
  "Kids' Shoes": ["kids shoes", "kids' shoes", "children shoes", "child shoe", "kids footwear", "kids sneaker", "school shoes"],
  "Men's Clothing": ["men's clothing", "mens clothing", "men shirt", "men jeans", "men jacket", "men hoodie", "men blazer", "men trousers", "men chinos", "men's fashion", "mens wear"],
  "Women's Clothing": ["women's clothing", "womens clothing", "women dress", "women kurti", "women saree", "women jeans", "women top", "women blazer", "ladies clothing", "ladies wear", "women's fashion", "lehenga", "salwar"],
  "Kids' Clothing": ["kids clothing", "kids' clothing", "children clothing", "kids dress", "kids shirt", "kids uniform", "baby clothes", "boys clothing", "girls clothing", "kids wear"],
  'Home Appliances': ['tv', 'television', 'ac', 'air conditioner', 'washing machine', 'microwave', 'oven', 'fan', 'vacuum', 'heater', 'air fryer', 'appliance', 'fridge', 'refrigerator', 'geyser', 'water purifier', 'mixer', 'grinder'],
  Accessories: ['headphone', 'headphones', 'earbuds', 'earphone', 'watch', 'smartwatch', 'speaker', 'mouse', 'keyboard', 'powerbank', 'power bank', 'kindle', 'ereader', 'sunglasses', 'fitness band'],
  'Bags & Luggage': ['bag', 'backpack', 'luggage', 'trolley', 'suitcase', 'handbag', 'messenger bag', 'travel bag'],
  'Beauty & Personal Care': ['skincare', 'face wash', 'cream', 'trimmer', 'hair dryer', 'grooming', 'makeup', 'foundation', 'beauty', 'moisturizer', 'shampoo'],
  'Sports & Fitness': ['sports', 'cricket', 'badminton', 'football', 'basketball', 'yoga', 'gym', 'treadmill', 'dumbbells', 'fitness equipment', 'racket', 'bat'],
  'Toys & Games': ['toy', 'toys', 'lego', 'game', 'board game', 'doll', 'barbie', 'nerf', 'play-doh', 'puzzle', 'action figure'],
};

const PURPOSE_KEYWORDS = {
  gaming: ['gaming', 'game', 'gamer', 'fps', 'esports'],
  running: ['running', 'run', 'marathon', 'jogging', 'jog'],
  casual: ['casual', 'daily', 'everyday', 'daily-use', 'regular'],
  premium: ['premium', 'luxury', 'best', 'top', 'flagship', 'high-end'],
  budget: ['budget', 'cheap', 'affordable', 'low-cost', 'under', 'value', 'economical'],
  work: ['work', 'office', 'business', 'professional', 'productivity'],
  fitness: ['fitness', 'gym', 'workout', 'exercise', 'health', 'sports'],
  travel: ['travel', 'portable', 'commute', 'outdoor'],
  camera: ['camera', 'photo', 'photography', 'selfie', 'video'],
  music: ['music', 'audio', 'sound', 'bass', 'hi-fi'],
  students: ['student', 'students', 'college', 'study', 'school', 'education'],
};

// ── Conversational Patterns ───────────────────────────────────
// Handles greetings, thanks, help, about, comparisons, etc.
const CONVERSATIONAL_PATTERNS = [
  {
    patterns: [/^(hi|hello|hey|howdy|hola|namaste|good\s*(morning|afternoon|evening|night))[\s!?.]*$/i, /^(sup|yo|what'?s\s*up)[\s!?.]*$/i],
    response: () => `Hello! 👋 Welcome to ShopSmart AI!\n\nI'm your personal shopping assistant. Here's what I can help you with:\n\n• 📱 **Smartphones** — Find the perfect phone for any budget\n• 💻 **Laptops** — From student notebooks to gaming beasts\n• 👟 **Shoes** — Men's, Women's, and Kids' footwear\n• 👕 **Clothing** — Explore fashion across all categories\n• 🏠 **Home Appliances** — TVs, ACs, kitchen gadgets & more\n• 🎧 **Accessories** — Headphones, watches, speakers & more\n• 🎒 **Bags & Luggage** — Backpacks, trolleys, handbags\n• 💄 **Beauty & Personal Care** — Skincare, grooming, makeup\n• ⚽ **Sports & Fitness** — Equipment for every sport\n• 🧸 **Toys & Games** — Fun for every age\n\nJust tell me what you're looking for! For example:\n*"I need a gaming laptop under ₹1,00,000"* or *"Suggest running shoes under ₹10,000"*`,
  },
  {
    patterns: [/^(thanks|thank\s*you|thx|ty|thanks?\s*a\s*lot|appreciate)[\s!?.]*$/i],
    response: () => `You're welcome! 😊 Happy to help! Let me know if you need anything else — I'm always here to find you the best deals! 🛍️`,
  },
  {
    patterns: [/^(bye|goodbye|see\s*you|later|cya|take\s*care)[\s!?.]*$/i],
    response: () => `Goodbye! 👋 Happy shopping! Come back anytime you need product recommendations. Have a great day! 🌟`,
  },
  {
    patterns: [/what\s*(can\s*you|do\s*you)\s*do/i, /how\s*(can|do)\s*you\s*help/i, /what\s*are\s*you/i, /who\s*are\s*you/i, /your\s*features/i, /help\s*me/i, /^help[\s!?.]*$/i],
    response: () => `I'm **ShopSmart AI**, your intelligent shopping assistant! 🤖✨\n\nHere's what I can do:\n\n🔍 **Find Products** — Tell me what you need, and I'll recommend the best options\n💰 **Budget Matching** — Specify your budget (e.g., "under ₹20,000") and I'll filter accordingly\n🏷️ **Brand Search** — Ask for specific brands like Samsung, Nike, Apple, etc.\n🎯 **Purpose-Based** — Tell me your use case (gaming, running, office, etc.)\n📊 **Comparisons** — I can compare products in the same category\n\n**Available Categories:**\nSmartphones, Laptops, Shoes (Men/Women/Kids), Clothing (Men/Women/Kids), Home Appliances, Accessories, Bags & Luggage, Beauty & Personal Care, Sports & Fitness, Toys & Games\n\n**Tips for better results:**\n• Be specific: *"gaming laptop under ₹80,000"*\n• Mention purpose: *"running shoes for marathon"*\n• Specify gender: *"women's casual shoes"*\n• Set a budget: *"phone under ₹30K"*`,
  },
  {
    patterns: [/how\s*are\s*you/i, /how('?s| is)\s*(it\s*going|everything|life)/i],
    response: () => `I'm doing great, thanks for asking! 😊 I'm always ready to help you shop smarter. What are you looking for today? 🛍️`,
  },
  {
    patterns: [/^(ok|okay|sure|alright|got\s*it|nice|cool|great|awesome|perfect)[\s!?.]*$/i],
    response: () => `Great! 😊 Is there anything else you'd like me to help you find? Just describe what you need and I'll find the best options for you! 🛍️`,
  },
  {
    patterns: [/cheapest|lowest\s*price|most\s*affordable/i],
    response: (query) => {
      const sorted = [...products].sort((a, b) => a.price - b.price);
      const top5 = sorted.slice(0, 5);
      let msg = `Here are the **most affordable products** in our catalog:\n\n`;
      top5.forEach((p, i) => {
        msg += `**${i + 1}. ${p.name}** — ₹${p.price.toLocaleString('en-IN')}\n`;
        msg += `⭐ ${p.rating} | ${p.brand} | ${p.category}\n`;
        msg += `${p.description}\n\n`;
      });
      msg += `Want me to find affordable options in a specific category? Just ask! 😊`;
      return msg;
    },
  },
  {
    patterns: [/most\s*expensive|highest\s*price|costliest|priciest/i],
    response: (query) => {
      const sorted = [...products].sort((a, b) => b.price - a.price);
      const top5 = sorted.slice(0, 5);
      let msg = `Here are the **premium, top-priced products** in our catalog:\n\n`;
      top5.forEach((p, i) => {
        msg += `**${i + 1}. ${p.name}** — ₹${p.price.toLocaleString('en-IN')}\n`;
        msg += `⭐ ${p.rating} | ${p.brand} | ${p.category}\n`;
        msg += `${p.description}\n\n`;
      });
      msg += `Want details on any of these premium picks? 🌟`;
      return msg;
    },
  },
  {
    patterns: [/best\s*rated|top\s*rated|highest\s*rated|best\s*rating/i],
    response: (query) => {
      const sorted = [...products].sort((a, b) => b.rating - a.rating);
      const top5 = sorted.slice(0, 5);
      let msg = `Here are the **top-rated products** across all categories:\n\n`;
      top5.forEach((p, i) => {
        msg += `**${i + 1}. ${p.name}** — ₹${p.price.toLocaleString('en-IN')}\n`;
        msg += `⭐ ${p.rating} | ${p.brand} | ${p.category}\n`;
        msg += `${p.description}\n\n`;
      });
      msg += `Would you like top-rated products in a specific category? Let me know! 😊`;
      return msg;
    },
  },
  {
    patterns: [/how\s*many\s*products/i, /total\s*products/i, /what\s*(all\s*)?products/i, /list\s*(all\s*)?(your\s*)?categories/i, /what\s*categories/i, /available\s*categories/i],
    response: () => {
      const categoryMap = {};
      products.forEach(p => {
        categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
      });
      let msg = `We have **${products.length} products** across **${Object.keys(categoryMap).length} categories**! 📦\n\n`;
      for (const [cat, count] of Object.entries(categoryMap)) {
        msg += `• **${cat}** — ${count} products\n`;
      }
      msg += `\nJust tell me what you're looking for and I'll find the best match! 🎯`;
      return msg;
    },
  },
  {
    patterns: [/compare|vs\.?|versus|difference\s*between|which\s*(one\s*)?(is\s*)?(better|best)/i],
    response: (query) => {
      // Try to find mentioned product names
      const q = query.toLowerCase();
      const mentioned = products.filter(p =>
        q.includes(p.name.toLowerCase()) || q.includes(p.brand.toLowerCase())
      );
      if (mentioned.length >= 2) {
        const picks = mentioned.slice(0, 3);
        let msg = `Here's a quick comparison:\n\n`;
        picks.forEach((p, i) => {
          msg += `**${i + 1}. ${p.name}** — ₹${p.price.toLocaleString('en-IN')}\n`;
          msg += `⭐ Rating: ${p.rating} | Brand: ${p.brand} | Category: ${p.category}\n`;
          msg += `Features: ${p.features.join(', ')}\n`;
          msg += `${p.description}\n\n`;
        });
        msg += `Need more details on any of these? 🔍`;
        return msg;
      }
      return null; // Fall through to other handlers
    },
  },
];

// ── Conversational Handler ────────────────────────────────────
function handleConversation(query) {
  for (const entry of CONVERSATIONAL_PATTERNS) {
    for (const pattern of entry.patterns) {
      if (pattern.test(query)) {
        const result = entry.response(query);
        if (result !== null) {
          return { type: 'conversational', message: result };
        }
      }
    }
  }
  return null;
}

// ── Fuzzy Text Search ─────────────────────────────────────────
// Searches product name, description, features, tags, brand for any matching words
function fuzzySearchProducts(query) {
  const q = query.toLowerCase();
  // Extract meaningful search words (ignore very short words and common stop words)
  const STOP_WORDS = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
    'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
    'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just', 'because', 'but', 'and',
    'or', 'if', 'while', 'about', 'up', 'it', 'its', 'i', 'me', 'my',
    'we', 'you', 'your', 'he', 'she', 'they', 'them', 'what', 'which',
    'who', 'this', 'that', 'these', 'those', 'am', 'tell', 'show',
    'suggest', 'recommend', 'find', 'get', 'give', 'need', 'want',
    'looking', 'search', 'any', 'good', 'nice', 'please', 'something',
  ]);

  const words = q.split(/\s+/).filter(w => w.length >= 2 && !STOP_WORDS.has(w));
  if (words.length === 0) return [];

  const scored = products.map(p => {
    let score = 0;
    const searchableText = [
      p.name.toLowerCase(),
      p.description.toLowerCase(),
      p.brand.toLowerCase(),
      p.category.toLowerCase(),
      ...p.features.map(f => f.toLowerCase()),
      ...p.tags,
    ].join(' ');

    for (const word of words) {
      // Exact word match in name (highest priority)
      if (p.name.toLowerCase().includes(word)) score += 15;
      // Brand match
      if (p.brand.toLowerCase().includes(word)) score += 12;
      // Category match
      if (p.category.toLowerCase().includes(word)) score += 10;
      // Tag match
      if (p.tags.some(t => t.includes(word))) score += 8;
      // Feature match
      if (p.features.some(f => f.toLowerCase().includes(word))) score += 6;
      // Description match
      if (p.description.toLowerCase().includes(word)) score += 4;
    }

    // Rating bonus
    score += Math.round(p.rating * 2);

    return { ...p, score };
  });

  return scored.filter(p => p.score > 5).sort((a, b) => b.score - a.score).slice(0, 5);
}

// ── About-Product Handler ─────────────────────────────────────
// Handles "tell me about X", "what is X", "details about X" type queries
function handleProductQuery(query) {
  const q = query.toLowerCase();

  // Check if user is asking about a specific product by name
  const productMatch = products.find(p => q.includes(p.name.toLowerCase()));
  if (productMatch) {
    const p = productMatch;
    let msg = `Here are the details for **${p.name}**:\n\n`;
    msg += `**Price:** ₹${p.price.toLocaleString('en-IN')}\n`;
    msg += `**Brand:** ${p.brand}\n`;
    msg += `**Category:** ${p.category}\n`;
    msg += `**Rating:** ⭐ ${p.rating}/5\n\n`;
    msg += `**Description:** ${p.description}\n\n`;
    msg += `**Key Features:**\n`;
    p.features.forEach(f => { msg += `• ${f}\n`; });
    msg += `\nWould you like to see similar products or compare this with alternatives? 🔍`;
    return { type: 'product_detail', message: msg, products: [p] };
  }

  return null;
}

// ── Intent Extraction ─────────────────────────────────────────
function extractIntent(query) {
  const q = query.toLowerCase();

  // Extract category
  let detectedCategory = null;
  let detectedCategories = null; // for multi-match (e.g., generic "shoes")
  let categoryScore = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (q.includes(kw) && kw.length > categoryScore) {
        detectedCategory = cat;
        categoryScore = kw.length;
      }
    }
  }

  // Generic term fallback: "shoes", "clothing", "footwear" without gender prefix
  // should match ALL gendered subcategories
  const GENERIC_MULTI_MAP = {
    shoes: ["Men's Shoes", "Women's Shoes", "Kids' Shoes"],
    shoe: ["Men's Shoes", "Women's Shoes", "Kids' Shoes"],
    sneakers: ["Men's Shoes", "Women's Shoes", "Kids' Shoes"],
    sneaker: ["Men's Shoes", "Women's Shoes", "Kids' Shoes"],
    footwear: ["Men's Shoes", "Women's Shoes", "Kids' Shoes"],
    sandals: ["Men's Shoes", "Women's Shoes", "Kids' Shoes"],
    boots: ["Men's Shoes", "Women's Shoes", "Kids' Shoes"],
    clothing: ["Men's Clothing", "Women's Clothing", "Kids' Clothing"],
    clothes: ["Men's Clothing", "Women's Clothing", "Kids' Clothing"],
    fashion: ["Men's Clothing", "Women's Clothing", "Kids' Clothing"],
    wear: ["Men's Clothing", "Women's Clothing", "Kids' Clothing"],
  };

  if (!detectedCategory) {
    for (const [term, cats] of Object.entries(GENERIC_MULTI_MAP)) {
      if (q.includes(term)) {
        detectedCategories = cats;
        break;
      }
    }
  }

  // Extract budget
  let budget = null;
  const budgetPatterns = [
    /(?:under|below|less than|within|max|upto|up to|budget)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/i,
    /(?:₹|rs\.?|inr)\s*([\d,]+)\s*(?:budget|max|or less)?/i,
    /([\d,]+)\s*(?:₹|rs|rupees)\s*(?:budget|max|range)?/i,
    /(\d+)k\b/i,
  ];

  for (const pattern of budgetPatterns) {
    const match = q.match(pattern);
    if (match) {
      let val = match[1].replace(/,/g, '');
      if (pattern === budgetPatterns[3]) {
        budget = parseInt(val) * 1000;
      } else {
        budget = parseInt(val);
      }
      break;
    }
  }

  // Extract purposes
  const purposes = [];
  for (const [purpose, keywords] of Object.entries(PURPOSE_KEYWORDS)) {
    for (const kw of keywords) {
      if (q.includes(kw)) {
        purposes.push(purpose);
        break;
      }
    }
  }

  // Extract brand
  const allBrands = [...new Set(products.map(p => p.brand.toLowerCase()))];
  const detectedBrand = allBrands.find(b => q.includes(b.toLowerCase()));

  return { category: detectedCategory, categories: detectedCategories, budget, purposes, brand: detectedBrand };
}

// ── Product Scoring ───────────────────────────────────────────
function scoreProduct(product, intent) {
  let score = 0;

  // Category match — strict filtering
  if (intent.category) {
    if (product.category === intent.category) {
      score += 30;
    } else {
      return -1; // Exclude entirely
    }
  } else if (intent.categories) {
    // Multi-category match (generic "shoes" or "clothing")
    if (intent.categories.includes(product.category)) {
      score += 30;
    } else {
      return -1;
    }
  }

  // Brand match (+20)
  if (intent.brand && product.brand.toLowerCase() === intent.brand) {
    score += 20;
  }

  // Budget fit (+25 if within, -10 if over)
  if (intent.budget) {
    if (product.price <= intent.budget) {
      // Prefer products closer to budget (better value)
      const ratio = product.price / intent.budget;
      score += Math.round(25 * ratio);
    } else {
      score -= 10;
    }
  }

  // Purpose match (+5 per matched tag)
  if (intent.purposes.length > 0) {
    for (const purpose of intent.purposes) {
      if (product.tags.includes(purpose)) {
        score += 5;
      }
    }
  }

  // Rating bonus
  score += Math.round(product.rating * 2);

  return score;
}

// ── Recommendation Generator ──────────────────────────────────
function getRecommendations(query, chatHistory = []) {
  // ① Conversational handler — greetings, thanks, help, etc.
  const conversational = handleConversation(query);
  if (conversational) return conversational;

  // ② Specific product detail query — "tell me about iPhone 15"
  const productDetail = handleProductQuery(query);
  if (productDetail) return productDetail;

  // ③ Standard keyword intent extraction
  const intent = extractIntent(query);

  // If we have a clear intent, score and rank products normally
  if (intent.category || intent.categories || intent.brand || intent.purposes.length > 0 || intent.budget) {
    // Score and rank products
    let scoredProducts = products.map(p => ({
      ...p,
      score: scoreProduct(p, intent),
    }));

    // Filter out irrelevant products (score > 0)
    scoredProducts = scoredProducts.filter(p => p.score > 0);

    // Sort by score descending
    scoredProducts.sort((a, b) => b.score - a.score);

    // Take top 5
    const top = scoredProducts.slice(0, 5);

    if (top.length > 0) {
      return {
        type: 'recommendations',
        message: formatRecommendations(top, intent),
        products: top,
      };
    }

    // Try without category for broader results
    const broader = products
      .map(p => ({ ...p, score: scoreProduct(p, { ...intent, category: null, categories: null }) }))
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (broader.length > 0) {
      return {
        type: 'alternatives',
        message: formatAlternatives(broader, intent),
        products: broader,
      };
    }
  }

  // ④ Fuzzy text search fallback — search across all product fields
  const fuzzyResults = fuzzySearchProducts(query);
  if (fuzzyResults.length > 0) {
    let msg = `Here's what I found related to your query:\n\n`;
    fuzzyResults.forEach((p, i) => {
      msg += `**${i + 1}. ${p.name}** — ₹${p.price.toLocaleString('en-IN')}\n`;
      msg += `⭐ ${p.rating} | ${p.brand} | ${p.category}\n`;
      msg += `${p.description}\n`;
      msg += `Key features: ${p.features.slice(0, 3).join(', ')}\n\n`;
    });
    msg += `Would you like more details about any of these, or should I search differently? 😊`;

    return {
      type: 'fuzzy_results',
      message: msg,
      products: fuzzyResults,
    };
  }

  // ⑤ Final fallback — clarification with helpful guidance
  return {
    type: 'clarification',
    message: generateClarificationMessage(query),
  };
}

// ── Formatters ────────────────────────────────────────────────
function formatPrice(price) {
  return '₹' + price.toLocaleString('en-IN');
}

function formatRecommendations(products, intent) {
  let msg = `Here are my top picks`;
  if (intent.category) msg += ` in **${intent.category}**`;
  if (intent.budget) msg += ` within **${formatPrice(intent.budget)}**`;
  if (intent.purposes.length) msg += ` for **${intent.purposes.join(', ')}**`;
  msg += `:\n\n`;

  products.forEach((p, i) => {
    msg += `**${i + 1}. ${p.name}** — ${formatPrice(p.price)}\n`;
    msg += `⭐ ${p.rating} | ${p.brand}\n`;
    msg += `${p.description}\n`;
    msg += `Key features: ${p.features.slice(0, 3).join(', ')}\n\n`;
  });

  msg += `Would you like more details about any of these, or should I refine the search? 😊`;
  return msg;
}

function formatAlternatives(products, intent) {
  let msg = `I couldn't find exact matches, but here are some close alternatives:\n\n`;

  products.forEach((p, i) => {
    msg += `**${i + 1}. ${p.name}** — ${formatPrice(p.price)}\n`;
    msg += `⭐ ${p.rating} | ${p.brand} | ${p.category}\n`;
    msg += `${p.description}\n\n`;
  });

  msg += `Want me to search with different criteria? 🔍`;
  return msg;
}

function generateClarificationMessage(query) {
  return `I wasn't able to find specific products for "${query}", but I'd love to help! 😊\n\n` +
    `Here's what I can help you with:\n\n` +
    `• 📱 **Smartphones** — "Best phone under ₹30,000"\n` +
    `• 💻 **Laptops** — "Gaming laptop under ₹1,00,000"\n` +
    `• 👟 **Shoes** — "Running shoes under ₹10,000"\n` +
    `• 👕 **Clothing** — "Men's casual shirts"\n` +
    `• 🏠 **Home Appliances** — "Best air fryer"\n` +
    `• 🎧 **Accessories** — "ANC headphones"\n` +
    `• 🎒 **Bags** — "Travel backpack"\n` +
    `• 💄 **Beauty** — "Face wash for oily skin"\n` +
    `• ⚽ **Sports** — "Badminton racket"\n` +
    `• 🧸 **Toys** — "LEGO sets for kids"\n\n` +
    `Try asking something like: *"I need a gaming laptop under ₹80,000"* or *"Suggest running shoes for men"*`;
}

module.exports = { getRecommendations, extractIntent };

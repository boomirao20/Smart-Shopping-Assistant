const products = require('../data/products.json');

/**
 * Local fallback recommendation engine.
 * Uses keyword matching and scoring when the Gemini API is unavailable.
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
  const intent = extractIntent(query);

  // If we can't figure out what they want at all
  if (!intent.category && !intent.brand && intent.purposes.length === 0 && !intent.budget) {
    return {
      type: 'clarification',
      message: generateClarificationMessage(query),
    };
  }

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

  if (top.length === 0) {
    // Try without category for broader results
    const broader = products
      .map(p => ({ ...p, score: scoreProduct(p, { ...intent, category: null }) }))
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

    return {
      type: 'no_results',
      message: `I couldn't find any products matching your criteria. Could you try:\n• A different category or product type\n• Adjusting your budget range\n• Being more specific about what you need`,
    };
  }

  return {
    type: 'recommendations',
    message: formatRecommendations(top, intent),
    products: top,
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
  return `I'd love to help you find the perfect product! 😊 Could you tell me a bit more?\n\n` +
    `• **What are you looking for?** (e.g., phone, laptop, shoes, headphones)\n` +
    `• **What's your budget?** (e.g., under ₹20,000)\n` +
    `• **What's the purpose?** (e.g., gaming, daily use, running)\n\n` +
    `For example, you could say: *"I need a gaming laptop under ₹80,000"* or *"Suggest running shoes under ₹10,000"*`;
}

module.exports = { getRecommendations, extractIntent };

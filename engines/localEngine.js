const products = require('../data/products.json');

/**
 * Enhanced Local Recommendation Engine
 * ─────────────────────────────────────
 * Smart enough to handle unseen / open-ended questions using:
 *  1. Auto-generated knowledge base from the product catalog
 *  2. Synonym-aware semantic matching
 *  3. Question-type classification + data-driven answer generation
 *  4. Context-aware follow-up handling
 *  5. Fuzzy text search as final fallback
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  AUTO-GENERATED KNOWLEDGE BASE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function buildKnowledgeBase(allProducts) {
  const kb = {
    categories: {},
    brands: {},
    priceRanges: {},
    topRated: [],
    bestValue: [],
    tagIndex: {},
    featureIndex: {},
  };

  // ── Category stats ────────────────────────────────────────
  const catMap = {};
  allProducts.forEach(p => {
    if (!catMap[p.category]) {
      catMap[p.category] = { products: [], totalPrice: 0, totalRating: 0, brands: new Set(), tags: new Set() };
    }
    const c = catMap[p.category];
    c.products.push(p);
    c.totalPrice += p.price;
    c.totalRating += p.rating;
    c.brands.add(p.brand);
    p.tags.forEach(t => c.tags.add(t));
  });

  for (const [cat, data] of Object.entries(catMap)) {
    const prices = data.products.map(p => p.price).sort((a, b) => a - b);
    const ratings = data.products.map(p => p.rating).sort((a, b) => b - a);
    kb.categories[cat] = {
      count: data.products.length,
      minPrice: prices[0],
      maxPrice: prices[prices.length - 1],
      avgPrice: Math.round(data.totalPrice / data.products.length),
      avgRating: +(data.totalRating / data.products.length).toFixed(1),
      topRating: ratings[0],
      brands: [...data.brands],
      tags: [...data.tags],
      bestRated: [...data.products].sort((a, b) => b.rating - a.rating).slice(0, 3),
      bestValue: [...data.products].sort((a, b) => (b.rating / b.price) - (a.rating / a.price)).slice(0, 3),
      cheapest: [...data.products].sort((a, b) => a.price - b.price).slice(0, 3),
      priciest: [...data.products].sort((a, b) => b.price - a.price).slice(0, 3),
    };
  }

  // ── Brand stats ───────────────────────────────────────────
  const brandMap = {};
  allProducts.forEach(p => {
    const b = p.brand;
    if (!brandMap[b]) {
      brandMap[b] = { products: [], categories: new Set(), totalRating: 0 };
    }
    brandMap[b].products.push(p);
    brandMap[b].categories.add(p.category);
    brandMap[b].totalRating += p.rating;
  });

  for (const [brand, data] of Object.entries(brandMap)) {
    const prices = data.products.map(p => p.price).sort((a, b) => a - b);
    kb.brands[brand] = {
      count: data.products.length,
      categories: [...data.categories],
      avgRating: +(data.totalRating / data.products.length).toFixed(1),
      minPrice: prices[0],
      maxPrice: prices[prices.length - 1],
      products: data.products,
    };
  }

  // ── Global top rated & best value ─────────────────────────
  kb.topRated = [...allProducts].sort((a, b) => b.rating - a.rating).slice(0, 10);
  kb.bestValue = [...allProducts].sort((a, b) => (b.rating / b.price) - (a.rating / a.price)).slice(0, 10);

  // ── Tag index: tag → products ─────────────────────────────
  allProducts.forEach(p => {
    p.tags.forEach(tag => {
      if (!kb.tagIndex[tag]) kb.tagIndex[tag] = [];
      kb.tagIndex[tag].push(p);
    });
  });

  // ── Feature index: keyword → products ─────────────────────
  allProducts.forEach(p => {
    p.features.forEach(f => {
      const words = f.toLowerCase().split(/[\s,\-\/]+/).filter(w => w.length > 2);
      words.forEach(w => {
        if (!kb.featureIndex[w]) kb.featureIndex[w] = [];
        kb.featureIndex[w].push(p);
      });
    });
  });

  return kb;
}

const KB = buildKnowledgeBase(products);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SYNONYM DICTIONARY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SYNONYM_GROUPS = [
  ['cheap', 'affordable', 'budget', 'economical', 'inexpensive', 'low-cost', 'value', 'pocket-friendly'],
  ['expensive', 'premium', 'luxury', 'high-end', 'costly', 'pricey', 'flagship', 'top-end'],
  ['good', 'best', 'great', 'top', 'excellent', 'quality', 'nice', 'recommended', 'ideal'],
  ['fast', 'quick', 'speedy', 'powerful', 'high-performance', 'snappy'],
  ['camera', 'photography', 'photo', 'selfie', 'picture', 'snap'],
  ['battery', 'battery-life', 'long-lasting', 'endurance', 'backup'],
  ['display', 'screen', 'panel', 'amoled', 'oled', 'lcd'],
  ['light', 'lightweight', 'portable', 'slim', 'thin', 'compact'],
  ['durable', 'sturdy', 'tough', 'rugged', 'strong', 'long-lasting'],
  ['stylish', 'trendy', 'fashionable', 'modern', 'sleek', 'elegant'],
  ['comfortable', 'comfy', 'cushioned', 'soft', 'cozy'],
  ['kids', 'children', 'child', 'kid', 'toddler', 'baby', 'infant'],
  ['women', 'woman', 'ladies', 'female', 'her', 'she', 'girl', 'wife', 'mom', 'mother', 'sister', 'daughter', 'girlfriend'],
  ['men', 'man', 'male', 'him', 'he', 'guy', 'boy', 'husband', 'dad', 'father', 'brother', 'son', 'boyfriend'],
  ['running', 'jogging', 'marathon', 'run', 'jog'],
  ['gaming', 'game', 'gamer', 'play', 'fps', 'esports'],
  ['office', 'work', 'business', 'professional', 'productivity', 'corporate'],
  ['gift', 'present', 'surprise', 'gifting'],
  ['popular', 'trending', 'famous', 'hot', 'in-demand', 'bestseller', 'best-selling'],
  ['waterproof', 'water-resistant', 'splash-proof', 'rain-proof'],
];

// Build a fast lookup: word → canonical synonym group words
const SYNONYM_MAP = {};
SYNONYM_GROUPS.forEach(group => {
  group.forEach(word => {
    SYNONYM_MAP[word] = group;
  });
});

function expandWithSynonyms(words) {
  const expanded = new Set(words);
  words.forEach(w => {
    if (SYNONYM_MAP[w]) {
      SYNONYM_MAP[w].forEach(syn => expanded.add(syn));
    }
  });
  return [...expanded];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  KEYWORD MAPS (kept from original for backward compat)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  QUESTION TYPE CLASSIFIER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function classifyQuestion(query) {
  const q = query.toLowerCase().trim();

  // ── Comparison questions ──────────────────────────────────
  if (/\bvs\.?\b|\bversus\b|\bcompare\b|\bcomparison\b|\bdifference\s+between\b|\bwhich\s+(one\s+)?(is\s+)?(better|best|superior)\b|\bor\b.*\bbetter\b/i.test(q)) {
    return 'comparison';
  }

  // ── Gift suggestions ──────────────────────────────────────
  if (/\bgift\b|\bpresent\b|\bsurprise\b|\bgifting\b|\bbirthday\b|\banniversary\b|\bfor\s+(my\s+)?(mom|dad|mother|father|wife|husband|sister|brother|friend|son|daughter|kid|girlfriend|boyfriend|colleague)\b/i.test(q)) {
    return 'gift';
  }

  // ── Budget advice ─────────────────────────────────────────
  if (/\bhow\s+much\s+(should|do|does|would|will)\b.*\b(spend|cost|budget|pay)\b|\bgood\s+budget\b|\bwhat.*(budget|spend)\b|\bworth\s+(the\s+)?(money|price|cost|it)\b|\bvalue\s+for\s+money\b/i.test(q)) {
    return 'budget_advice';
  }

  // ── Trending / Popular ───────────────────────────────────
  if (/\btrending\b|\bpopular\b|\bhot\b|\bin[\s-]?demand\b|\bbestseller\b|\bbest[\s-]?selling\b|\bmost\s+bought\b|\bwhat'?s?\s+new\b|\blatest\b|\brecent\b/i.test(q)) {
    return 'trending';
  }

  // ── Feature-based queries ─────────────────────────────────
  if (/\bwith\s+(good|best|great|excellent)\s+\w+\b|\bhas\s+(good|best|great)\b|\b(best|good|great)\s+(camera|battery|display|screen|performance|sound|bass|speaker)\b|\bwaterproof\b|\bwater[\s-]?resistant\b|\bnoise[\s-]?cancell?ing\b/i.test(q)) {
    return 'feature_query';
  }

  // ── Buying guide / advice ─────────────────────────────────
  if (/\bshould\s+i\s+(buy|get|purchase|choose|pick)\b|\bis\s+it\s+(good|worth|okay|fine)\b|\bwhat\s+(should|do)\s+i\s+(look|check|consider|know)\b|\bbefore\s+buying\b|\bbuying\s+(guide|tips|advice)\b|\bthings\s+to\s+(consider|know|check)\b|\bpros?\s+and\s+cons?\b/i.test(q)) {
    return 'buying_guide';
  }

  // ── Brand recommendation ──────────────────────────────────
  if (/\b(good|best|top|reliable|trusted)\s+brand\b|\bwhich\s+brand\b|\bbrand\s+(for|recommendation)\b|\brecommend\s+(a\s+)?brand\b/i.test(q)) {
    return 'brand_recommendation';
  }

  // ── Opinion / Review ──────────────────────────────────────
  if (/\bis\s+\w+\s+(good|worth|reliable|durable)\b|\bhow\s+(good|reliable|durable)\s+is\b|\bwhat\s+do\s+you\s+think\b|\byour\s+opinion\b|\breview\b|\bany\s+good\b/i.test(q)) {
    return 'opinion';
  }

  // ── Age/audience specific ─────────────────────────────────
  if (/\bfor\s+(a\s+)?\d+\s*year[\s-]?old\b|\bfor\s+(teen|teenager|elderly|senior|toddler|baby|infant)\b|\bfor\s+(school|college|university)\b/i.test(q)) {
    return 'audience_specific';
  }

  // ── Season / occasion ─────────────────────────────────────
  if (/\b(winter|summer|monsoon|rainy|festive|wedding|party|casual|formal|office|outdoor|travel|trekking|hiking)\b/i.test(q)) {
    return 'occasion';
  }

  return null; // Not a special question — fall through to standard recommendation
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ANSWER GENERATORS (data-driven, one per question type)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function formatPrice(price) {
  return '₹' + price.toLocaleString('en-IN');
}

function formatProductCard(p, index) {
  let card = `**${index}. ${p.name}** — ${formatPrice(p.price)}\n`;
  card += `⭐ ${p.rating} | ${p.brand} | ${p.category}\n`;
  card += `${p.description}\n`;
  card += `Key features: ${p.features.slice(0, 3).join(', ')}\n`;
  return card;
}

// ── Comparison ──────────────────────────────────────────────
function answerComparison(query) {
  const q = query.toLowerCase();

  // Try to find two brands being compared
  const allBrands = Object.keys(KB.brands);
  const mentionedBrands = allBrands.filter(b => q.includes(b.toLowerCase()));

  // Try to find a category context
  const categoryContext = detectCategoryFromQuery(q);

  if (mentionedBrands.length >= 2) {
    const [b1, b2] = mentionedBrands.slice(0, 2);
    const d1 = KB.brands[b1];
    const d2 = KB.brands[b2];

    // Filter to relevant category if detected
    let p1 = d1.products;
    let p2 = d2.products;
    if (categoryContext) {
      const cats = Array.isArray(categoryContext) ? categoryContext : [categoryContext];
      p1 = p1.filter(p => cats.includes(p.category));
      p2 = p2.filter(p => cats.includes(p.category));
    }

    if (p1.length === 0 && p2.length === 0) {
      return null; // No products to compare in this context
    }

    let msg = `Here's a comparison of **${b1}** vs **${b2}**`;
    if (categoryContext) msg += ` in ${Array.isArray(categoryContext) ? categoryContext.join(', ') : categoryContext}`;
    msg += `:\n\n`;

    // Brand 1 stats
    const avg1 = p1.length > 0 ? +(p1.reduce((s, p) => s + p.rating, 0) / p1.length).toFixed(1) : 0;
    const prices1 = p1.map(p => p.price).sort((a, b) => a - b);
    msg += `**${b1}** (${p1.length} products)\n`;
    msg += `• Avg Rating: ⭐ ${avg1}\n`;
    msg += `• Price Range: ${formatPrice(prices1[0] || 0)} – ${formatPrice(prices1[prices1.length - 1] || 0)}\n`;
    if (p1.length > 0) {
      const bestP1 = [...p1].sort((a, b) => b.rating - a.rating)[0];
      msg += `• Top Pick: **${bestP1.name}** (⭐ ${bestP1.rating}, ${formatPrice(bestP1.price)})\n`;
    }
    msg += `\n`;

    // Brand 2 stats
    const avg2 = p2.length > 0 ? +(p2.reduce((s, p) => s + p.rating, 0) / p2.length).toFixed(1) : 0;
    const prices2 = p2.map(p => p.price).sort((a, b) => a - b);
    msg += `**${b2}** (${p2.length} products)\n`;
    msg += `• Avg Rating: ⭐ ${avg2}\n`;
    msg += `• Price Range: ${formatPrice(prices2[0] || 0)} – ${formatPrice(prices2[prices2.length - 1] || 0)}\n`;
    if (p2.length > 0) {
      const bestP2 = [...p2].sort((a, b) => b.rating - a.rating)[0];
      msg += `• Top Pick: **${bestP2.name}** (⭐ ${bestP2.rating}, ${formatPrice(bestP2.price)})\n`;
    }
    msg += `\n`;

    // Verdict
    if (avg1 > avg2) {
      msg += `**Verdict:** ${b1} has a slight edge in ratings (${avg1} vs ${avg2}), `;
    } else if (avg2 > avg1) {
      msg += `**Verdict:** ${b2} has a slight edge in ratings (${avg2} vs ${avg1}), `;
    } else {
      msg += `**Verdict:** Both brands have similar ratings (${avg1}), `;
    }
    if (prices1[0] < prices2[0]) {
      msg += `while ${b1} offers more affordable options starting at ${formatPrice(prices1[0])}.`;
    } else if (prices2[0] < prices1[0]) {
      msg += `while ${b2} offers more affordable options starting at ${formatPrice(prices2[0])}.`;
    } else {
      msg += `and both start at similar price points.`;
    }
    msg += `\n\nWould you like me to recommend specific products from either brand? 🔍`;

    return { type: 'comparison', message: msg };
  }

  // Try comparing two specific products mentioned by name
  const mentionedProducts = products.filter(p => q.includes(p.name.toLowerCase()));
  if (mentionedProducts.length >= 2) {
    const picks = mentionedProducts.slice(0, 3);
    let msg = `Here's a detailed comparison:\n\n`;
    picks.forEach((p, i) => {
      msg += `**${i + 1}. ${p.name}** — ${formatPrice(p.price)}\n`;
      msg += `⭐ Rating: ${p.rating} | Brand: ${p.brand} | Category: ${p.category}\n`;
      msg += `Features: ${p.features.join(', ')}\n`;
      msg += `${p.description}\n\n`;
    });

    // Simple comparison verdict
    const best = [...picks].sort((a, b) => b.rating - a.rating)[0];
    const cheapest = [...picks].sort((a, b) => a.price - b.price)[0];
    msg += `**Quick Verdict:**\n`;
    msg += `• Best rated: **${best.name}** (⭐ ${best.rating})\n`;
    msg += `• Most affordable: **${cheapest.name}** (${formatPrice(cheapest.price)})\n`;
    msg += `\nNeed more details on any of these? 🔍`;

    return { type: 'comparison', message: msg };
  }

  return null;
}

// ── Gift suggestions ────────────────────────────────────────
function answerGift(query) {
  const q = query.toLowerCase();

  // Detect recipient type
  let recipientCategories = [];
  let recipientLabel = 'your loved one';
  let budget = extractBudget(q);

  if (/\b(mom|mother|wife|sister|daughter|girlfriend|her|she|woman|lady|ladies|female)\b/i.test(q)) {
    recipientCategories = ["Women's Clothing", "Women's Shoes", "Beauty & Personal Care", "Accessories", "Bags & Luggage"];
    recipientLabel = 'her';
  } else if (/\b(dad|father|husband|brother|son|boyfriend|him|he|man|male)\b/i.test(q)) {
    recipientCategories = ["Men's Clothing", "Men's Shoes", "Accessories", "Sports & Fitness"];
    recipientLabel = 'him';
  } else if (/\b(kid|child|children|toddler|baby|infant|boy|girl)\b/i.test(q)) {
    recipientCategories = ["Toys & Games", "Kids' Clothing", "Kids' Shoes"];
    recipientLabel = 'kids';
  } else if (/\b(teen|teenager)\b/i.test(q)) {
    recipientCategories = ["Accessories", "Smartphones", "Men's Clothing", "Women's Clothing"];
    recipientLabel = 'a teenager';
  } else if (/\b(colleague|boss|coworker|friend)\b/i.test(q)) {
    recipientCategories = ["Accessories", "Beauty & Personal Care", "Bags & Luggage"];
    recipientLabel = 'a friend/colleague';
  } else {
    // Generic gift — pick from popular gift categories
    recipientCategories = ["Accessories", "Beauty & Personal Care", "Bags & Luggage", "Toys & Games"];
    recipientLabel = 'someone special';
  }

  // Find suitable products
  let giftOptions = products.filter(p => recipientCategories.includes(p.category));

  if (budget) {
    giftOptions = giftOptions.filter(p => p.price <= budget * 1.1);
  }

  // Sort by rating
  giftOptions.sort((a, b) => b.rating - a.rating);

  if (giftOptions.length === 0) {
    // Fallback to best rated across all categories within budget
    giftOptions = [...products];
    if (budget) giftOptions = giftOptions.filter(p => p.price <= budget * 1.1);
    giftOptions.sort((a, b) => b.rating - a.rating);
  }

  const top = giftOptions.slice(0, 5);

  if (top.length === 0) {
    return {
      type: 'gift',
      message: `I'd love to help with gift suggestions! 🎁 Could you tell me:\n\n• **Who** is the gift for? (mom, dad, kid, friend, etc.)\n• **Budget range?** (e.g., under ₹5,000)\n• **Any preferences?** (fashion, tech, beauty, sports)\n\nThis will help me find the perfect gift! 😊`,
    };
  }

  let msg = `Here are some great gift ideas for **${recipientLabel}**`;
  if (budget) msg += ` under **${formatPrice(budget)}**`;
  msg += `: 🎁\n\n`;

  top.forEach((p, i) => {
    msg += formatProductCard(p, i + 1) + '\n';
  });

  msg += `💡 **Gift Tip:** `;
  if (recipientLabel === 'her') {
    msg += `Beauty products and fashion accessories always make thoughtful gifts!`;
  } else if (recipientLabel === 'him') {
    msg += `Tech accessories and sportswear are usually safe bets!`;
  } else if (recipientLabel === 'kids') {
    msg += `Educational toys combine fun with learning — a win-win!`;
  } else {
    msg += `When in doubt, go with a highly-rated product from a trusted brand!`;
  }
  msg += `\n\nWould you like me to refine these suggestions? 😊`;

  return { type: 'gift', message: msg };
}

// ── Budget advice ───────────────────────────────────────────
function answerBudgetAdvice(query) {
  const q = query.toLowerCase();
  const categoryContext = detectCategoryFromQuery(q);

  if (categoryContext) {
    const cat = Array.isArray(categoryContext) ? categoryContext[0] : categoryContext;
    const stats = KB.categories[cat];

    if (stats) {
      let msg = `Here's a budget guide for **${cat}**: 💰\n\n`;
      msg += `**Price Range:** ${formatPrice(stats.minPrice)} – ${formatPrice(stats.maxPrice)}\n`;
      msg += `**Average Price:** ${formatPrice(stats.avgPrice)}\n`;
      msg += `**Products Available:** ${stats.count}\n\n`;

      // Budget tiers
      const third = Math.round((stats.maxPrice - stats.minPrice) / 3);
      const budgetMax = stats.minPrice + third;
      const midMax = stats.minPrice + third * 2;

      msg += `**Budget Tiers:**\n`;
      msg += `• 💚 **Budget** (${formatPrice(stats.minPrice)} – ${formatPrice(budgetMax)}): `;
      const budgetPicks = stats.cheapest.slice(0, 2);
      msg += budgetPicks.map(p => `${p.name} (${formatPrice(p.price)})`).join(', ') + '\n';

      msg += `• 💛 **Mid-Range** (${formatPrice(budgetMax)} – ${formatPrice(midMax)}): `;
      const midProducts = products.filter(p => p.category === cat && p.price >= budgetMax && p.price <= midMax)
        .sort((a, b) => b.rating - a.rating).slice(0, 2);
      if (midProducts.length > 0) {
        msg += midProducts.map(p => `${p.name} (${formatPrice(p.price)})`).join(', ') + '\n';
      } else {
        msg += 'Limited options in this range\n';
      }

      msg += `• 🔶 **Premium** (${formatPrice(midMax)}+): `;
      msg += stats.priciest.slice(0, 2).map(p => `${p.name} (${formatPrice(p.price)})`).join(', ') + '\n';

      msg += `\n**Best Value Pick:** ${stats.bestValue[0].name} — ${formatPrice(stats.bestValue[0].price)} (⭐ ${stats.bestValue[0].rating})\n`;
      msg += `\nWant me to recommend products at a specific budget? Just tell me your range! 😊`;

      return { type: 'budget_advice', message: msg };
    }
  }

  // Generic budget advice
  let msg = `I'd love to help with budget advice! 💰\n\nHere's a quick overview of our price ranges:\n\n`;
  const cats = Object.entries(KB.categories)
    .sort((a, b) => a[1].avgPrice - b[1].avgPrice);

  cats.forEach(([cat, stats]) => {
    msg += `• **${cat}** — ${formatPrice(stats.minPrice)} to ${formatPrice(stats.maxPrice)} (avg: ${formatPrice(stats.avgPrice)})\n`;
  });

  msg += `\nTell me which category you're interested in, and I'll give you a detailed budget breakdown! 🎯`;

  return { type: 'budget_advice', message: msg };
}

// ── Trending / Popular ──────────────────────────────────────
function answerTrending(query) {
  const q = query.toLowerCase();
  const categoryContext = detectCategoryFromQuery(q);

  let pool = KB.topRated;
  let label = 'across all categories';

  if (categoryContext) {
    const cats = Array.isArray(categoryContext) ? categoryContext : [categoryContext];
    pool = products.filter(p => cats.includes(p.category)).sort((a, b) => b.rating - a.rating);
    label = `in ${cats.join(', ')}`;
  }

  const top = pool.slice(0, 5);

  let msg = `Here are the **most popular products** ${label}: 🔥\n\n`;
  top.forEach((p, i) => {
    msg += formatProductCard(p, i + 1) + '\n';
  });

  msg += `These are our highest-rated picks! Would you like to explore a specific category or price range? 😊`;

  return { type: 'trending', message: msg };
}

// ── Feature-based queries ───────────────────────────────────
function answerFeatureQuery(query) {
  const q = query.toLowerCase();
  const categoryContext = detectCategoryFromQuery(q);

  // Extract the feature being asked about
  const featureKeywords = ['camera', 'battery', 'display', 'screen', 'performance', 'sound', 'bass',
    'speaker', 'waterproof', 'water-resistant', 'noise-cancelling', 'noise cancelling',
    'anc', 'fast charging', 'fast-charging', '5g', 'amoled', 'oled', 'ram', 'storage',
    'processor', 'lightweight', 'portable', 'durable', 'stylish'];

  const matchedFeatures = featureKeywords.filter(f => q.includes(f));

  if (matchedFeatures.length === 0) return null;

  const featureLabel = matchedFeatures.join(' & ');

  // Search for products with these features
  let pool = products;
  if (categoryContext) {
    const cats = Array.isArray(categoryContext) ? categoryContext : [categoryContext];
    pool = pool.filter(p => cats.includes(p.category));
  }

  // Score products by feature match
  const scored = pool.map(p => {
    let score = 0;
    const searchable = [
      p.name.toLowerCase(),
      p.description.toLowerCase(),
      ...p.features.map(f => f.toLowerCase()),
      ...p.tags,
    ].join(' ');

    matchedFeatures.forEach(feat => {
      if (searchable.includes(feat)) score += 10;
    });
    score += p.rating * 2;
    return { ...p, score };
  }).filter(p => p.score > 5).sort((a, b) => b.score - a.score);

  const budget = extractBudget(q);
  let results = scored;
  if (budget) {
    results = results.filter(p => p.price <= budget * 1.1);
  }

  const top = results.slice(0, 5);

  if (top.length === 0) return null;

  let msg = `Here are the best products with **${featureLabel}**`;
  if (budget) msg += ` under **${formatPrice(budget)}**`;
  msg += `:\n\n`;

  top.forEach((p, i) => {
    msg += formatProductCard(p, i + 1) + '\n';
  });

  msg += `Want more details on any of these, or should I narrow down further? 🔍`;

  return { type: 'feature_query', message: msg };
}

// ── Buying Guide ────────────────────────────────────────────
function answerBuyingGuide(query) {
  const q = query.toLowerCase();
  const categoryContext = detectCategoryFromQuery(q);

  // Check if asking about a specific brand
  const mentionedBrands = Object.keys(KB.brands).filter(b => q.includes(b.toLowerCase()));

  if (mentionedBrands.length > 0) {
    const brand = mentionedBrands[0];
    const info = KB.brands[brand];
    const topProduct = [...info.products].sort((a, b) => b.rating - a.rating)[0];

    let msg = `Here's what you should know about **${brand}**: 📋\n\n`;
    msg += `**Available in:** ${info.categories.join(', ')}\n`;
    msg += `**Products:** ${info.count} items in our catalog\n`;
    msg += `**Avg Rating:** ⭐ ${info.avgRating}\n`;
    msg += `**Price Range:** ${formatPrice(info.minPrice)} – ${formatPrice(info.maxPrice)}\n\n`;

    msg += `**Top Product:** ${topProduct.name} — ${formatPrice(topProduct.price)} (⭐ ${topProduct.rating})\n`;
    msg += `${topProduct.description}\n\n`;

    msg += `**Verdict:** `;
    if (info.avgRating >= 4.5) {
      msg += `${brand} is a **highly rated** brand with excellent customer satisfaction. Definitely worth considering! ✅`;
    } else if (info.avgRating >= 4.2) {
      msg += `${brand} offers **solid quality** products with good ratings. A reliable choice! 👍`;
    } else {
      msg += `${brand} provides **decent** products. Check individual product reviews for the best picks. 📝`;
    }

    msg += `\n\nWould you like to see all ${brand} products, or compare with another brand? 😊`;

    return { type: 'buying_guide', message: msg };
  }

  if (categoryContext) {
    const cat = Array.isArray(categoryContext) ? categoryContext[0] : categoryContext;
    const stats = KB.categories[cat];

    if (stats) {
      let msg = `Here's a quick **buying guide for ${cat}**: 📋\n\n`;

      msg += `**Things to consider:**\n`;
      // Generate tips based on category
      const tips = getCategoryTips(cat);
      tips.forEach(tip => { msg += `• ${tip}\n`; });

      msg += `\n**Brands available:** ${stats.brands.join(', ')}\n`;
      msg += `**Budget range:** ${formatPrice(stats.minPrice)} – ${formatPrice(stats.maxPrice)}\n\n`;

      msg += `**My Top 3 Picks:**\n\n`;
      stats.bestRated.forEach((p, i) => {
        msg += formatProductCard(p, i + 1) + '\n';
      });

      msg += `Want me to help you narrow down based on your specific needs? 🎯`;

      return { type: 'buying_guide', message: msg };
    }
  }

  return null;
}

function getCategoryTips(category) {
  const tips = {
    Smartphones: [
      '📸 **Camera** — Megapixels matter, but sensor quality matters more',
      '🔋 **Battery** — Look for 4500mAh+ for all-day use',
      '⚡ **Processor** — Snapdragon 7-series or above for smooth performance',
      '💾 **Storage** — 128GB minimum, 256GB if you take lots of photos',
      '📱 **Display** — AMOLED gives better colors; 120Hz for smoother scrolling',
    ],
    Laptops: [
      '⚡ **Processor** — Intel i5/Ryzen 5 for everyday; i7/Ryzen 7+ for heavy work',
      '💾 **RAM** — 8GB minimum; 16GB for multitasking and future-proofing',
      '💿 **Storage** — Always go for SSD over HDD for speed',
      '📱 **Display** — Full HD minimum; consider IPS for better viewing angles',
      '🔋 **Battery** — 8+ hours for portable use; less critical for desktop replacement',
    ],
    "Men's Shoes": ['👟 **Fit** — Try a half size up for running shoes', '🏃 **Sole** — Look for cushioned soles for daily wear', '💧 **Material** — Mesh for breathability; leather for formal'],
    "Women's Shoes": ['👠 **Comfort** — Prioritize cushioning for heels', '🏃 **Sole** — Rubber soles for better grip', '🎨 **Versatility** — Neutral colors work with more outfits'],
    "Kids' Shoes": ['📏 **Size** — Leave a thumb\'s width at the toe for growth', '🏃 **Durability** — Look for reinforced toes', '🧼 **Washability** — Easy-clean materials save time'],
    'Home Appliances': ['⚡ **Energy Rating** — Higher star rating = lower electricity bills', '📏 **Size** — Measure your space before buying', '🛠️ **Warranty** — Look for at least 2-year warranty'],
    Accessories: ['🔋 **Battery life** — Critical for wireless devices', '📶 **Connectivity** — Bluetooth 5.0+ for better range', '🎨 **Build quality** — Metal > plastic for durability'],
  };

  return tips[category] || [
    '⭐ **Ratings** — Check product ratings and reviews',
    '💰 **Budget** — Set a budget and compare options within it',
    '🏷️ **Brand** — Stick to trusted brands for reliability',
    '📋 **Features** — List your must-haves before browsing',
  ];
}

// ── Brand Recommendation ────────────────────────────────────
function answerBrandRecommendation(query) {
  const q = query.toLowerCase();
  const categoryContext = detectCategoryFromQuery(q);

  if (categoryContext) {
    const cat = Array.isArray(categoryContext) ? categoryContext[0] : categoryContext;
    const stats = KB.categories[cat];

    if (stats) {
      // Rank brands by average rating within this category
      const brandStats = {};
      products.filter(p => p.category === cat).forEach(p => {
        if (!brandStats[p.brand]) brandStats[p.brand] = { total: 0, count: 0, prices: [] };
        brandStats[p.brand].total += p.rating;
        brandStats[p.brand].count += 1;
        brandStats[p.brand].prices.push(p.price);
      });

      const ranked = Object.entries(brandStats)
        .map(([brand, data]) => ({
          brand,
          avgRating: +(data.total / data.count).toFixed(1),
          count: data.count,
          minPrice: Math.min(...data.prices),
          maxPrice: Math.max(...data.prices),
        }))
        .sort((a, b) => b.avgRating - a.avgRating);

      let msg = `Here are the **best brands for ${cat}**: 🏷️\n\n`;
      ranked.forEach((b, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
        msg += `${medal} **${b.brand}** — ⭐ ${b.avgRating} avg rating | ${b.count} product(s) | ${formatPrice(b.minPrice)} – ${formatPrice(b.maxPrice)}\n`;
      });

      msg += `\nWant me to show you the top products from any of these brands? 😊`;

      return { type: 'brand_recommendation', message: msg };
    }
  }

  // Generic brand overview
  const topBrands = Object.entries(KB.brands)
    .sort((a, b) => b[1].avgRating - a[1].avgRating)
    .slice(0, 10);

  let msg = `Here are some of our **top-rated brands** across all categories: 🏷️\n\n`;
  topBrands.forEach(([brand, data]) => {
    msg += `• **${brand}** — ⭐ ${data.avgRating} | ${data.categories.join(', ')} | ${formatPrice(data.minPrice)}+\n`;
  });

  msg += `\nTell me which category you're looking at, and I'll give you brand-specific recommendations! 😊`;

  return { type: 'brand_recommendation', message: msg };
}

// ── Opinion / Review ────────────────────────────────────────
function answerOpinion(query) {
  const q = query.toLowerCase();

  // Check if asking about a specific brand
  const mentionedBrands = Object.keys(KB.brands).filter(b => q.includes(b.toLowerCase()));
  if (mentionedBrands.length > 0) {
    return answerBuyingGuide(query); // Reuse buying guide for brand opinions
  }

  // Check if asking about a specific product
  const matchedProduct = products.find(p => q.includes(p.name.toLowerCase()));
  if (matchedProduct) {
    const p = matchedProduct;
    let msg = `Here's my take on **${p.name}**: 📝\n\n`;
    msg += `**Price:** ${formatPrice(p.price)}\n`;
    msg += `**Rating:** ⭐ ${p.rating}/5\n`;
    msg += `**Brand:** ${p.brand}\n\n`;
    msg += `**${p.description}**\n\n`;

    msg += `**Pros:**\n`;
    p.features.forEach(f => { msg += `✅ ${f}\n`; });

    // Compare with alternatives in same category
    const alternatives = products
      .filter(alt => alt.category === p.category && alt.id !== p.id)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 2);

    if (alternatives.length > 0) {
      msg += `\n**Alternatives to consider:**\n`;
      alternatives.forEach(alt => {
        msg += `• **${alt.name}** — ${formatPrice(alt.price)} (⭐ ${alt.rating})\n`;
      });
    }

    msg += `\n**Verdict:** `;
    if (p.rating >= 4.5) {
      msg += `Excellent choice! Highly rated and well-reviewed. ✅`;
    } else if (p.rating >= 4.2) {
      msg += `A solid pick with good value. Worth considering! 👍`;
    } else {
      msg += `Decent product, but check the alternatives above for potentially better options. 🤔`;
    }

    msg += `\n\nWant me to compare this with any specific alternative? 😊`;
    return { type: 'opinion', message: msg };
  }

  return null;
}

// ── Audience-specific ───────────────────────────────────────
function answerAudienceSpecific(query) {
  const q = query.toLowerCase();

  // Detect age
  const ageMatch = q.match(/(\d+)\s*year[\s-]?old/i);
  let categories = [];
  let label = '';

  if (ageMatch) {
    const age = parseInt(ageMatch[1]);
    if (age <= 5) {
      categories = ["Toys & Games", "Kids' Clothing", "Kids' Shoes"];
      label = `a ${age}-year-old child`;
    } else if (age <= 12) {
      categories = ["Toys & Games", "Kids' Clothing", "Kids' Shoes", "Sports & Fitness"];
      label = `a ${age}-year-old kid`;
    } else if (age <= 19) {
      categories = ["Smartphones", "Accessories", "Men's Clothing", "Women's Clothing", "Sports & Fitness"];
      label = `a ${age}-year-old teenager`;
    } else {
      categories = Object.keys(KB.categories); // All categories
      label = `a ${age}-year-old`;
    }
  } else if (/\b(teen|teenager)\b/i.test(q)) {
    categories = ["Smartphones", "Accessories", "Men's Clothing", "Women's Clothing"];
    label = 'teenagers';
  } else if (/\b(elderly|senior)\b/i.test(q)) {
    categories = ["Home Appliances", "Beauty & Personal Care", "Accessories"];
    label = 'seniors';
  } else if (/\b(school|college|university|student)\b/i.test(q)) {
    categories = ["Laptops", "Smartphones", "Accessories", "Bags & Luggage"];
    label = 'students';
  }

  if (categories.length === 0) return null;

  const budget = extractBudget(q);
  let pool = products.filter(p => categories.includes(p.category));
  if (budget) pool = pool.filter(p => p.price <= budget * 1.1);
  pool.sort((a, b) => b.rating - a.rating);

  const top = pool.slice(0, 5);
  if (top.length === 0) return null;

  let msg = `Here are great picks for **${label}**`;
  if (budget) msg += ` under **${formatPrice(budget)}**`;
  msg += `: 🎯\n\n`;

  top.forEach((p, i) => {
    msg += formatProductCard(p, i + 1) + '\n';
  });

  msg += `Want me to narrow down to a specific category or budget? 😊`;
  return { type: 'audience_specific', message: msg };
}

// ── Occasion-based ──────────────────────────────────────────
function answerOccasion(query) {
  const q = query.toLowerCase();

  const occasionTags = {
    winter: ['winter', 'warm', 'jacket', 'sweater', 'hoodie', 'heater', 'room-heater'],
    summer: ['summer', 'light', 'lightweight', 'cotton', 'cool', 'fan', 'ac'],
    monsoon: ['monsoon', 'waterproof', 'water-resistant', 'rain'],
    festive: ['festive', 'party', 'ethnic', 'traditional', 'indian', 'lehenga', 'saree', 'kurta'],
    wedding: ['festive', 'party', 'ethnic', 'traditional', 'formal', 'premium', 'silk'],
    party: ['party', 'stylish', 'trendy', 'fashion', 'heels', 'dress'],
    formal: ['formal', 'office', 'business', 'professional', 'blazer', 'workwear'],
    casual: ['casual', 'daily-use', 'everyday', 'comfortable', 'casual'],
    travel: ['travel', 'portable', 'lightweight', 'luggage', 'backpack', 'outdoor'],
    trekking: ['trekking', 'outdoor', 'waterproof', 'durable', 'sports', 'adventure'],
    outdoor: ['outdoor', 'travel', 'trekking', 'adventure', 'waterproof', 'durable'],
    office: ['office', 'formal', 'business', 'professional', 'work', 'productivity'],
  };

  // Find which occasion matches
  let matchedOccasion = null;
  let matchedTags = [];
  for (const [occasion, tags] of Object.entries(occasionTags)) {
    if (q.includes(occasion)) {
      matchedOccasion = occasion;
      matchedTags = tags;
      break;
    }
  }

  if (!matchedOccasion) return null;

  // Score products by tag overlap
  const budget = extractBudget(q);
  const categoryContext = detectCategoryFromQuery(q);

  let pool = products;
  if (categoryContext) {
    const cats = Array.isArray(categoryContext) ? categoryContext : [categoryContext];
    pool = pool.filter(p => cats.includes(p.category));
  }
  if (budget) {
    pool = pool.filter(p => p.price <= budget * 1.1);
  }

  const scored = pool.map(p => {
    let score = 0;
    const allTags = [...p.tags, ...p.features.map(f => f.toLowerCase())];
    matchedTags.forEach(t => {
      if (allTags.some(pt => pt.includes(t))) score += 5;
    });
    score += p.rating * 2;
    return { ...p, score };
  }).filter(p => p.score > 5).sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 5);
  if (top.length === 0) return null;

  let msg = `Here are great picks for **${matchedOccasion}**`;
  if (budget) msg += ` under **${formatPrice(budget)}**`;
  msg += `: 🌟\n\n`;

  top.forEach((p, i) => {
    msg += formatProductCard(p, i + 1) + '\n';
  });

  msg += `Would you like me to filter by category or budget? 😊`;
  return { type: 'occasion', message: msg };
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CONTEXT-AWARE FOLLOW-UP HANDLING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleFollowUp(query, chatHistory) {
  if (!chatHistory || chatHistory.length < 2) return null;

  const q = query.toLowerCase().trim();

  // Common follow-up patterns
  const isFollowUp =
    /^(any|show|give|get|find|suggest)\s+(me\s+)?(more|other|another|different|alternative|similar)/i.test(q) ||
    /^(what\s+about|how\s+about)\s/i.test(q) ||
    /^(cheaper|more\s+affordable|budget|expensive|premium|better)\s*(one|option|alternative)?s?\s*[\?\.]?\s*$/i.test(q) ||
    /^(any\s+)?(cheaper|more\s+affordable|pricier|better|other)\s+(options?|alternatives?|choices?|ones?)/i.test(q) ||
    /^(yes|yeah|yep|sure|ok|please|go ahead)/i.test(q) ||
    /^more\s*(details?|info|options?|like\s+this|products?)/i.test(q) ||
    /^(tell\s+me\s+more|elaborate|explain|details)/i.test(q);

  if (!isFollowUp) return null;

  // Extract context from recent assistant messages
  const lastAssistant = [...chatHistory].reverse().find(h => h.role === 'assistant');
  const lastUser = [...chatHistory].reverse().find(h => h.role === 'user' && h.content !== query);

  if (!lastAssistant) return null;

  const lastContent = lastAssistant.content.toLowerCase();

  // Try to identify the last recommended category
  let lastCategory = null;
  for (const cat of Object.keys(KB.categories)) {
    if (lastContent.includes(cat.toLowerCase())) {
      lastCategory = cat;
      break;
    }
  }

  // Check for "cheaper" / "more affordable" follow-up
  if (/cheaper|more\s+affordable|budget|less\s+expensive|low[\s-]?cost/i.test(q)) {
    let pool = products;
    if (lastCategory) pool = pool.filter(p => p.category === lastCategory);
    pool.sort((a, b) => a.price - b.price);
    const top = pool.slice(0, 5);

    if (top.length > 0) {
      let msg = `Here are more **affordable options**`;
      if (lastCategory) msg += ` in **${lastCategory}**`;
      msg += `:\n\n`;
      top.forEach((p, i) => { msg += formatProductCard(p, i + 1) + '\n'; });
      msg += `Would you like to set a specific budget? 😊`;
      return { type: 'follow_up', message: msg };
    }
  }

  // Check for "expensive" / "premium" follow-up
  if (/expensive|premium|high[\s-]?end|luxury|pricier|upgrade/i.test(q)) {
    let pool = products;
    if (lastCategory) pool = pool.filter(p => p.category === lastCategory);
    pool.sort((a, b) => b.price - a.price);
    const top = pool.slice(0, 5);

    if (top.length > 0) {
      let msg = `Here are the **premium options**`;
      if (lastCategory) msg += ` in **${lastCategory}**`;
      msg += `:\n\n`;
      top.forEach((p, i) => { msg += formatProductCard(p, i + 1) + '\n'; });
      msg += `These are our top-tier picks! Want more details on any? 🌟`;
      return { type: 'follow_up', message: msg };
    }
  }

  // Check for "more" / "other options"
  if (/more|other|different|alternative|similar|another/i.test(q)) {
    let pool = products;
    if (lastCategory) pool = pool.filter(p => p.category === lastCategory);
    pool.sort((a, b) => b.rating - a.rating);

    // Try to exclude already shown products (rough heuristic)
    const shown = [];
    products.forEach(p => {
      if (lastContent.includes(p.name.toLowerCase())) shown.push(p.id);
    });
    pool = pool.filter(p => !shown.includes(p.id));

    const top = pool.slice(0, 5);

    if (top.length > 0) {
      let msg = `Here are **more options**`;
      if (lastCategory) msg += ` in **${lastCategory}**`;
      msg += `:\n\n`;
      top.forEach((p, i) => { msg += formatProductCard(p, i + 1) + '\n'; });
      msg += `Want me to filter by brand, price, or features? 😊`;
      return { type: 'follow_up', message: msg };
    }
  }

  // Check for brand-specific follow-up: "what about Samsung?"
  const brandFollowUp = Object.keys(KB.brands).find(b => q.includes(b.toLowerCase()));
  if (brandFollowUp) {
    let pool = KB.brands[brandFollowUp].products;
    if (lastCategory) pool = pool.filter(p => p.category === lastCategory);
    pool.sort((a, b) => b.rating - a.rating);
    const top = pool.slice(0, 5);

    if (top.length > 0) {
      let msg = `Here are the **${brandFollowUp}** options`;
      if (lastCategory) msg += ` in **${lastCategory}**`;
      msg += `:\n\n`;
      top.forEach((p, i) => { msg += formatProductCard(p, i + 1) + '\n'; });
      msg += `Want to compare these with another brand? 🔍`;
      return { type: 'follow_up', message: msg };
    }
  }

  // Generic follow-up with last query context
  if (lastUser && /^(yes|yeah|yep|sure|ok|please|go ahead)/i.test(q)) {
    // Re-run the last user query with broader results
    return null; // Let it fall through to normal processing
  }

  return null;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HELPER: DETECT CATEGORY FROM FREE-TEXT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function detectCategoryFromQuery(q) {
  q = q.toLowerCase();

  // Direct category keyword match (most specific first)
  let best = null;
  let bestLen = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (q.includes(kw) && kw.length > bestLen) {
        best = cat;
        bestLen = kw.length;
      }
    }
  }
  if (best) return best;

  // Generic multi-category match
  for (const [term, cats] of Object.entries(GENERIC_MULTI_MAP)) {
    if (q.includes(term)) return cats;
  }

  // Direct category name match
  for (const cat of Object.keys(KB.categories)) {
    if (q.includes(cat.toLowerCase())) return cat;
  }

  return null;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HELPER: EXTRACT BUDGET FROM QUERY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function extractBudget(q) {
  q = q.toLowerCase();
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
        return parseInt(val) * 1000;
      }
      return parseInt(val);
    }
  }
  return null;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CONVERSATIONAL PATTERNS (greetings, thanks, help, etc.)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CONVERSATIONAL_PATTERNS = [
  {
    patterns: [/^(hi|hello|hey|howdy|hola|namaste|good\s*(morning|afternoon|evening|night))[\s!?.]*$/i, /^(sup|yo|what'?s\s*up)[\s!?.]*$/i],
    response: () => `Hello! 👋 Welcome to ShopSmart AI!\n\nI'm your personal shopping assistant. Here's what I can help you with:\n\n• 📱 **Smartphones** — Find the perfect phone for any budget\n• 💻 **Laptops** — From student notebooks to gaming beasts\n• 👟 **Shoes** — Men's, Women's, and Kids' footwear\n• 👕 **Clothing** — Explore fashion across all categories\n• 🏠 **Home Appliances** — TVs, ACs, kitchen gadgets & more\n• 🎧 **Accessories** — Headphones, watches, speakers & more\n• 🎒 **Bags & Luggage** — Backpacks, trolleys, handbags\n• 💄 **Beauty & Personal Care** — Skincare, grooming, makeup\n• ⚽ **Sports & Fitness** — Equipment for every sport\n• 🧸 **Toys & Games** — Fun for every age\n\nI can also help with:\n🔄 **Comparisons** — *"Samsung vs Apple phones"*\n🎁 **Gift Ideas** — *"Gift for my mom under ₹5,000"*\n💰 **Budget Advice** — *"How much should I spend on a laptop?"*\n📋 **Buying Guides** — *"Should I buy a gaming laptop?"*\n\nJust ask me anything! 😊`,
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
    response: () => `I'm **ShopSmart AI**, your intelligent shopping assistant! 🤖✨\n\nHere's what I can do:\n\n🔍 **Find Products** — Tell me what you need, and I'll recommend the best options\n💰 **Budget Matching** — Specify your budget (e.g., "under ₹20,000") and I'll filter accordingly\n🏷️ **Brand Search** — Ask for specific brands like Samsung, Nike, Apple, etc.\n🎯 **Purpose-Based** — Tell me your use case (gaming, running, office, etc.)\n📊 **Comparisons** — "Samsung vs Apple?" or "Compare Nike and Adidas shoes"\n🎁 **Gift Suggestions** — "Gift for my mom under ₹5,000"\n💡 **Budget Advice** — "How much should I spend on a phone?"\n📋 **Buying Guides** — "Should I buy a gaming laptop?" or "Is Samsung worth it?"\n🔥 **Trending** — "What's popular right now?"\n\n**Available Categories:**\nSmartphones, Laptops, Shoes (Men/Women/Kids), Clothing (Men/Women/Kids), Home Appliances, Accessories, Bags & Luggage, Beauty & Personal Care, Sports & Fitness, Toys & Games\n\n**Tips for better results:**\n• Be specific: *"gaming laptop under ₹80,000"*\n• Ask opinions: *"Is OnePlus worth buying?"*\n• Compare: *"Nike vs Adidas for running"*\n• Gift ideas: *"Birthday gift for a 10-year-old"*`,
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
      const categoryContext = detectCategoryFromQuery(query.toLowerCase());
      let pool = products;
      if (categoryContext) {
        const cats = Array.isArray(categoryContext) ? categoryContext : [categoryContext];
        pool = pool.filter(p => cats.includes(p.category));
      }
      const sorted = [...pool].sort((a, b) => a.price - b.price);
      const top5 = sorted.slice(0, 5);
      let msg = `Here are the **most affordable products**`;
      if (categoryContext) msg += ` in **${Array.isArray(categoryContext) ? categoryContext.join(', ') : categoryContext}**`;
      msg += `:\n\n`;
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
      const categoryContext = detectCategoryFromQuery(query.toLowerCase());
      let pool = products;
      if (categoryContext) {
        const cats = Array.isArray(categoryContext) ? categoryContext : [categoryContext];
        pool = pool.filter(p => cats.includes(p.category));
      }
      const sorted = [...pool].sort((a, b) => b.price - a.price);
      const top5 = sorted.slice(0, 5);
      let msg = `Here are the **premium, top-priced products**`;
      if (categoryContext) msg += ` in **${Array.isArray(categoryContext) ? categoryContext.join(', ') : categoryContext}**`;
      msg += `:\n\n`;
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
      const categoryContext = detectCategoryFromQuery(query.toLowerCase());
      let pool = products;
      if (categoryContext) {
        const cats = Array.isArray(categoryContext) ? categoryContext : [categoryContext];
        pool = pool.filter(p => cats.includes(p.category));
      }
      const sorted = [...pool].sort((a, b) => b.rating - a.rating);
      const top5 = sorted.slice(0, 5);
      let msg = `Here are the **top-rated products**`;
      if (categoryContext) msg += ` in **${Array.isArray(categoryContext) ? categoryContext.join(', ') : categoryContext}**`;
      msg += `:\n\n`;
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
        const stats = KB.categories[cat];
        msg += `• **${cat}** — ${count} products (${formatPrice(stats.minPrice)} – ${formatPrice(stats.maxPrice)})\n`;
      }
      msg += `\nJust tell me what you're looking for and I'll find the best match! 🎯`;
      return msg;
    },
  },
];


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  IMPROVED FUZZY TEXT SEARCH (synonym-aware)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

function fuzzySearchProducts(query) {
  const q = query.toLowerCase();
  const rawWords = q.split(/\s+/).filter(w => w.length >= 2 && !STOP_WORDS.has(w));
  if (rawWords.length === 0) return [];

  // Expand with synonyms
  const words = expandWithSynonyms(rawWords);

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
      if (p.name.toLowerCase().includes(word)) score += 15;
      if (p.brand.toLowerCase().includes(word)) score += 12;
      if (p.category.toLowerCase().includes(word)) score += 10;
      if (p.tags.some(t => t.includes(word))) score += 8;
      if (p.features.some(f => f.toLowerCase().includes(word))) score += 6;
      if (p.description.toLowerCase().includes(word)) score += 4;
    }

    score += Math.round(p.rating * 2);
    return { ...p, score };
  });

  return scored.filter(p => p.score > 5).sort((a, b) => b.score - a.score).slice(0, 5);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  INTENT EXTRACTION (kept for backward compat with server.js)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function extractIntent(query) {
  const q = query.toLowerCase();

  let detectedCategory = null;
  let detectedCategories = null;
  let categoryScore = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (q.includes(kw) && kw.length > categoryScore) {
        detectedCategory = cat;
        categoryScore = kw.length;
      }
    }
  }

  if (!detectedCategory) {
    for (const [term, cats] of Object.entries(GENERIC_MULTI_MAP)) {
      if (q.includes(term)) {
        detectedCategories = cats;
        break;
      }
    }
  }

  const budget = extractBudget(q);

  const purposes = [];
  for (const [purpose, keywords] of Object.entries(PURPOSE_KEYWORDS)) {
    for (const kw of keywords) {
      if (q.includes(kw)) {
        purposes.push(purpose);
        break;
      }
    }
  }

  const allBrands = [...new Set(products.map(p => p.brand.toLowerCase()))];
  const detectedBrand = allBrands.find(b => q.includes(b.toLowerCase()));

  return { category: detectedCategory, categories: detectedCategories, budget, purposes, brand: detectedBrand };
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PRODUCT SCORING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function scoreProduct(product, intent) {
  let score = 0;

  if (intent.category) {
    if (product.category === intent.category) {
      score += 30;
    } else {
      return -1;
    }
  } else if (intent.categories) {
    if (intent.categories.includes(product.category)) {
      score += 30;
    } else {
      return -1;
    }
  }

  if (intent.brand && product.brand.toLowerCase() === intent.brand) {
    score += 20;
  }

  if (intent.budget) {
    if (product.price <= intent.budget) {
      const ratio = product.price / intent.budget;
      score += Math.round(25 * ratio);
    } else {
      score -= 10;
    }
  }

  if (intent.purposes.length > 0) {
    for (const purpose of intent.purposes) {
      if (product.tags.includes(purpose)) {
        score += 5;
      }
    }
  }

  score += Math.round(product.rating * 2);
  return score;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ABOUT-PRODUCT HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleProductQuery(query) {
  const q = query.toLowerCase();

  const productMatch = products.find(p => q.includes(p.name.toLowerCase()));
  if (productMatch) {
    const p = productMatch;
    let msg = `Here are the details for **${p.name}**:\n\n`;
    msg += `**Price:** ${formatPrice(p.price)}\n`;
    msg += `**Brand:** ${p.brand}\n`;
    msg += `**Category:** ${p.category}\n`;
    msg += `**Rating:** ⭐ ${p.rating}/5\n\n`;
    msg += `**Description:** ${p.description}\n\n`;
    msg += `**Key Features:**\n`;
    p.features.forEach(f => { msg += `• ${f}\n`; });

    // Show alternatives
    const alternatives = products
      .filter(alt => alt.category === p.category && alt.id !== p.id)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 2);

    if (alternatives.length > 0) {
      msg += `\n**Similar Products:**\n`;
      alternatives.forEach(alt => {
        msg += `• **${alt.name}** — ${formatPrice(alt.price)} (⭐ ${alt.rating})\n`;
      });
    }

    msg += `\nWould you like to see similar products or compare this with alternatives? 🔍`;
    return { type: 'product_detail', message: msg, products: [p] };
  }

  return null;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CONVERSATIONAL HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SMART CLARIFICATION (instead of generic fallback)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generateSmartClarification(query) {
  const q = query.toLowerCase();

  // Try to detect ANY useful context from the query
  const detectedBrand = Object.keys(KB.brands).find(b => q.includes(b.toLowerCase()));
  const detectedCategory = detectCategoryFromQuery(q);
  const budget = extractBudget(q);

  // If we detect something, offer targeted help
  if (detectedBrand || detectedCategory || budget) {
    let msg = `I'd love to help! Let me understand your request better: 🤔\n\n`;

    if (detectedBrand) {
      const info = KB.brands[detectedBrand];
      msg += `I see you're interested in **${detectedBrand}**. We have ${info.count} ${detectedBrand} product(s) in: ${info.categories.join(', ')}.\n\n`;
      msg += `Would you like to:\n`;
      msg += `• See all ${detectedBrand} products?\n`;
      msg += `• Compare ${detectedBrand} with another brand?\n`;
      msg += `• Get our top ${detectedBrand} recommendations?\n`;
    } else if (detectedCategory) {
      const cat = Array.isArray(detectedCategory) ? detectedCategory[0] : detectedCategory;
      const stats = KB.categories[cat];
      if (stats) {
        msg += `I see you're looking at **${cat}**. We have ${stats.count} options from ${formatPrice(stats.minPrice)} to ${formatPrice(stats.maxPrice)}.\n\n`;
        msg += `Could you tell me:\n`;
        msg += `• What's your **budget**?\n`;
        msg += `• Any **brand preference**? (${stats.brands.slice(0, 4).join(', ')})\n`;
        msg += `• What **purpose** — daily use, gaming, work, sports?\n`;
      }
    }

    if (budget) {
      msg += `\nI'll keep your budget of **${formatPrice(budget)}** in mind! `;
    }

    msg += `\nJust give me a bit more detail and I'll find the perfect match! 😊`;
    return msg;
  }

  // Fully generic fallback — but still helpful
  return `I'd be happy to help with that! 😊 To give you the best recommendations, could you tell me:\n\n` +
    `• **What product** are you looking for? (phone, laptop, shoes, headphones, etc.)\n` +
    `• **Budget range?** (e.g., under ₹20,000)\n` +
    `• **Purpose?** (gaming, work, daily use, travel, gift, etc.)\n\n` +
    `Or try asking me:\n` +
    `• *"Best phone under ₹30,000"*\n` +
    `• *"Compare Samsung vs Apple"*\n` +
    `• *"Gift for my mom under ₹5,000"*\n` +
    `• *"What's trending right now?"*\n` +
    `• *"Should I buy a gaming laptop?"*\n` +
    `• *"Best brands for headphones"*\n\n` +
    `I can answer all kinds of shopping questions! 🛍️`;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN ENTRY: getRecommendations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getRecommendations(query, chatHistory = []) {
  // ① Conversational handler — greetings, thanks, help, cheapest, etc.
  const conversational = handleConversation(query);
  if (conversational) return conversational;

  // ② Context-aware follow-up handling
  const followUp = handleFollowUp(query, chatHistory);
  if (followUp) return followUp;

  // ③ Specific product detail query — "tell me about iPhone 15"
  const productDetail = handleProductQuery(query);
  if (productDetail) return productDetail;

  // ④ Smart question answering — classify question type and generate data-driven answer
  const questionType = classifyQuestion(query);
  if (questionType) {
    let answer = null;
    switch (questionType) {
      case 'comparison':
        answer = answerComparison(query);
        break;
      case 'gift':
        answer = answerGift(query);
        break;
      case 'budget_advice':
        answer = answerBudgetAdvice(query);
        break;
      case 'trending':
        answer = answerTrending(query);
        break;
      case 'feature_query':
        answer = answerFeatureQuery(query);
        break;
      case 'buying_guide':
        answer = answerBuyingGuide(query);
        break;
      case 'brand_recommendation':
        answer = answerBrandRecommendation(query);
        break;
      case 'opinion':
        answer = answerOpinion(query);
        break;
      case 'audience_specific':
        answer = answerAudienceSpecific(query);
        break;
      case 'occasion':
        answer = answerOccasion(query);
        break;
    }
    if (answer) return answer;
  }

  // ⑤ Standard keyword intent extraction (original logic)
  const intent = extractIntent(query);

  if (intent.category || intent.categories || intent.brand || intent.purposes.length > 0 || intent.budget) {
    let scoredProducts = products.map(p => ({
      ...p,
      score: scoreProduct(p, intent),
    }));

    scoredProducts = scoredProducts.filter(p => p.score > 0);
    scoredProducts.sort((a, b) => b.score - a.score);

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

  // ⑥ Fuzzy text search fallback — synonym-aware search across all product fields
  const fuzzyResults = fuzzySearchProducts(query);
  if (fuzzyResults.length > 0) {
    let msg = `Here's what I found related to your query:\n\n`;
    fuzzyResults.forEach((p, i) => {
      msg += formatProductCard(p, i + 1) + '\n';
    });
    msg += `Would you like more details about any of these, or should I search differently? 😊`;

    return {
      type: 'fuzzy_results',
      message: msg,
      products: fuzzyResults,
    };
  }

  // ⑦ Smart clarification (instead of generic fallback)
  return {
    type: 'clarification',
    message: generateSmartClarification(query),
  };
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  FORMATTERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function formatRecommendations(products, intent) {
  let msg = `Here are my top picks`;
  if (intent.category) msg += ` in **${intent.category}**`;
  if (intent.budget) msg += ` within **${formatPrice(intent.budget)}**`;
  if (intent.purposes.length) msg += ` for **${intent.purposes.join(', ')}**`;
  msg += `:\n\n`;

  products.forEach((p, i) => {
    msg += formatProductCard(p, i + 1) + '\n';
  });

  msg += `Would you like more details about any of these, or should I refine the search? 😊`;
  return msg;
}

function formatAlternatives(products, intent) {
  let msg = `I couldn't find exact matches, but here are some close alternatives:\n\n`;

  products.forEach((p, i) => {
    msg += formatProductCard(p, i + 1) + '\n';
  });

  msg += `Want me to search with different criteria? 🔍`;
  return msg;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = { getRecommendations, extractIntent };

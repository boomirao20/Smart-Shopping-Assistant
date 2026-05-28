# 🛍️ ShopSmart AI — Smart Shopping Assistant

An AI-powered shopping assistant chatbot that helps users discover, compare, and choose the best products through natural, friendly conversation. Ask it **anything** — product recommendations, brand comparisons, gift ideas, budget advice, buying guides, or what's trending — and get intelligent, data-driven answers.

![ShopSmart AI](https://img.shields.io/badge/ShopSmart-AI-7c3aed?style=for-the-badge&logo=robot&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Chat** | Google Gemini-powered conversational product recommendations |
| 🧠 **Smart Question Answering** | Handles **unseen questions** — comparisons, gift ideas, budget advice, buying guides, opinions, trending, and more |
| ⚙️ **Intelligent Fallback Engine** | Local engine with knowledge base, synonym matching, question classification, and data-driven answer generation |
| 💬 **Conversation Memory** | Per-session chat history with context-aware follow-ups ("any cheaper?" remembers the last category) |
| 🔄 **Brand Comparisons** | "Samsung vs Apple?" — auto-generates comparison with ratings, prices, and verdicts |
| 🎁 **Gift Suggestions** | "Gift for my mom" — infers recipient-appropriate categories and recommends |
| 💰 **Budget Intelligence** | Extracts budgets from natural language AND gives budget tier breakdowns per category |
| 📋 **Buying Guides** | "Should I buy a gaming laptop?" — category-specific tips and top picks |
| 🏷️ **Brand Analysis** | "Is OnePlus worth it?" — data-driven brand opinions with ratings and verdicts |
| 🔥 **Trending & Popular** | "What's trending?" — shows highest-rated products |
| 🔍 **Synonym-Aware Search** | Understands "affordable" = "cheap" = "budget" = "economical" via 20 synonym groups |
| 📱 **Responsive Design** | Works seamlessly on mobile and desktop |
| 🎨 **Premium UI** | Dark glassmorphism theme with smooth animations and custom scrollbar |

---


## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) (comes with Node.js)
- (Optional) [Google Gemini API Key](https://aistudio.google.com/apikey)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/smart-shopping-assistant.git
   cd smart-shopping-assistant
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Gemini API key:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```

   > **Note:** The app works without a Gemini API key — it will use the local fallback engine for recommendations.

4. **Start the server**

   ```bash
   npm start
   ```

5. **Open in browser**

   Visit [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express.js |
| **AI Engine** | Google Gemini 2.0 Flash |
| **Fallback Engine** | Custom knowledge-base + question classifier + synonym matching + fuzzy search |
| **Frontend** | Vanilla HTML, CSS, JavaScript |
| **Styling** | CSS with glassmorphism, gradients, animations, custom scrollbar |
| **Typography** | Google Fonts (Inter) |

---

## 📁 Project Structure

```
smart-shopping-assistant/
├── server.js                 # Express server & API routes
├── package.json              # Dependencies & scripts
├── .env                      # Environment variables (not tracked)
├── .env.example              # Environment template
│
├── data/
│   └── products.json         # Product catalog (137 items)
│
├── engines/
│   └── localEngine.js        # Smart fallback recommendation engine
│
└── public/
    ├── index.html            # Chat UI
    ├── styles.css            # Premium dark theme with custom scrollbar
    └── app.js                # Client-side chat logic
```

---

## 📡 API Endpoints

### `POST /api/chat`

Send a message to the shopping assistant.

**Request:**
```json
{
  "message": "Suggest a phone under ₹30,000",
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "reply": "Here are my top picks in Smartphones within ₹30,000...",
  "sessionId": "uuid-session-id",
  "engine": "gemini"
}
```

---

### `GET /api/products`

Retrieve products with optional filters.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `category` | string | Filter by category (e.g., `Smartphones`) |
| `brand` | string | Filter by brand (e.g., `Samsung`) |
| `minPrice` | number | Minimum price |
| `maxPrice` | number | Maximum price |

**Example:** `/api/products?category=Smartphones&maxPrice=30000`

---

### `GET /api/categories`

Returns all product categories with item counts.

**Response:**
```json
[
  { "name": "Smartphones", "count": 8 },
  { "name": "Laptops", "count": 7 },
  { "name": "Men's Shoes", "count": 10 }
]
```

---

### `GET /api/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "engine": "gemini",
  "products": 137,
  "sessions": 3
}
```

---

## 📦 Product Categories

The assistant covers **137 products** across **14 categories**:

| Category | Products | Price Range |
|----------|----------|-------------|
| 📱 Smartphones | 8 | ₹11,999 – ₹1,59,900 |
| 💻 Laptops | 7 | ₹38,990 – ₹1,99,900 |
| 👟 Men's Shoes | 10 | ₹699 – ₹16,999 |
| 👠 Women's Shoes | 9 | ₹1,299 – ₹16,999 |
| 👦 Kids' Shoes | 6 | ₹799 – ₹3,495 |
| 👔 Men's Clothing | 14 | ₹999 – ₹4,999 |
| 👗 Women's Clothing | 14 | ₹699 – ₹5,999 |
| 🧒 Kids' Clothing | 12 | ₹499 – ₹2,499 |
| 🏠 Home Appliances | 13 | ₹2,190 – ₹64,990 |
| 🎧 Accessories | 15 | ₹1,299 – ₹29,990 |
| 🎒 Bags & Luggage | 7 | ₹1,299 – ₹8,999 |
| 💄 Beauty & Personal Care | 7 | ₹349 – ₹34,900 |
| ⚽ Sports & Fitness | 8 | ₹499 – ₹29,999 |
| 🧸 Toys & Games | 8 | ₹799 – ₹5,999 |

---

## 🧠 How It Works

### With Gemini API (AI Mode)

1. User sends a message
2. Server extracts intent (category, budget, brand, purpose)
3. Relevant products are filtered from the catalog (keyword scoring + tag matching)
4. A structured prompt with product context + chat history is sent to Gemini
5. Gemini generates a natural, conversational recommendation
6. Response is returned with session context preserved

The Gemini system prompt is enhanced to handle open-ended questions — comparisons, gift suggestions, budget advice, buying guides, brand opinions, feature queries, and trending — not just product recommendations.

### Without Gemini API (Local Fallback Mode)

The local engine uses a **7-step query resolution pipeline** to ensure every question — even unseen ones — gets a meaningful, data-driven answer:

```
① Conversational Handler → ② Follow-Up Handler → ③ Product Detail Query → ④ Smart Question Answering → ⑤ Keyword Intent Match → ⑥ Fuzzy Text Search → ⑦ Smart Clarification
```

#### ① Conversational Handler
Detects and responds to non-product queries:
- **Greetings:** "hi", "hello", "namaste", "good morning"
- **Thanks/Bye:** "thank you", "bye", "see you"
- **Help requests:** "what can you do", "help me", "who are you"
- **Meta queries:** "cheapest product", "best rated", "most expensive", "how many products"
- **Acknowledgments:** "ok", "cool", "great", "awesome"

#### ② Context-Aware Follow-Up Handler
Understands follow-up messages using conversation history:
- **"Any cheaper options?"** → Remembers the last category and shows affordable picks
- **"What about Samsung?"** → Shows Samsung products in the last discussed category
- **"More options"** → Excludes already-shown products and shows new ones
- **"Something more premium"** → Shows higher-priced alternatives

#### ③ Product Detail Query
If the user mentions a specific product name (e.g., "tell me about iPhone 15 Pro Max"), returns detailed product info including price, brand, rating, description, features, and similar alternatives.

#### ④ Smart Question Answering (NEW)
The **core intelligence layer** that handles unseen/open-ended questions. It classifies the question into one of **10 types** and generates data-driven answers using the auto-built knowledge base:

| Question Type | Example | How It Answers |
|---------------|---------|----------------|
| 🔄 **Comparison** | "Samsung vs Apple phones?" | Compares brand stats (avg rating, price range, top picks) with a verdict |
| 🎁 **Gift Suggestion** | "Gift for my mom under ₹5K" | Infers recipient → suitable categories → top-rated picks + gift tips |
| 💰 **Budget Advice** | "How much to spend on a laptop?" | Shows price range, budget tiers (budget/mid/premium), and best value pick |
| 🔥 **Trending** | "What's popular right now?" | Returns highest-rated products globally or per category |
| 📸 **Feature Query** | "Best camera phone under ₹50K" | Scores products by feature-keyword matches in descriptions/tags |
| 📋 **Buying Guide** | "Should I buy a gaming laptop?" | Category-specific tips + brand analysis + top 3 picks |
| 🏷️ **Brand Rec** | "Best brand for headphones?" | Ranks brands by avg rating within category with medal icons |
| 📝 **Opinion** | "Is OnePlus worth buying?" | Brand data analysis, pros listing, alternatives, and a verdict |
| 🎯 **Audience** | "Products for a 10-year-old" | Age/audience-aware category selection |
| 🌟 **Occasion** | "Suggest winter clothing" | Tag-based matching for seasons, events, and use cases |

**Under the hood:** At startup, the engine auto-generates a **Knowledge Base** from the product catalog containing:
- Category stats (price ranges, avg price, avg rating, top brands, best value)
- Brand stats (categories, ratings, price ranges, product counts)
- Tag index and feature index for fast lookups
- Top-rated and best-value product rankings

**Synonym Dictionary:** 20 synonym groups ensure semantic matching:
- "affordable" = "cheap" = "budget" = "economical" = "pocket-friendly"
- "premium" = "luxury" = "expensive" = "high-end" = "flagship"
- "kids" = "children" = "child" = "toddler" = "baby"
- And 17 more groups...

#### ⑤ Keyword Intent Matching
The standard recommendation engine. Extracts intent from the query:
- **Category detection** — maps keywords to 14 categories (including generic terms like "shoes" → all shoe categories)
- **Budget extraction** — parses "under ₹30K", "below Rs 20000", "budget 50k" etc.
- **Brand matching** — detects 76+ brands from the product catalog
- **Purpose tagging** — identifies use cases like gaming, running, office, travel

Products are scored based on:
| Factor | Points | Logic |
|--------|--------|-------|
| Category match | +30 | Strict filtering |
| Budget fit | up to +25 | Proportional to price/budget ratio |
| Brand match | +20 | Exact brand match |
| Purpose/tag match | +5 each | Per matching tag |
| Rating bonus | +rating × 2 | Higher-rated products preferred |

#### ⑥ Fuzzy Text Search (Synonym-Aware)
If keyword matching doesn't find results, the engine performs a **synonym-expanded** full-text search across **all product fields** — name, description, brand, category, features, and tags:

| Match Location | Priority Score |
|---------------|---------------|
| Product name | +15 |
| Brand | +12 |
| Category | +10 |
| Tags | +8 |
| Features | +6 |
| Description | +4 |

This allows queries like "waterproof", "OLED", "cotton", "wireless charging", or even synonyms like "pocket-friendly" to find relevant products.

#### ⑦ Smart Clarification (Last Resort)
Instead of a generic fallback, the engine detects **partial context** (brand, category, or budget mentioned) and asks **targeted** follow-up questions. Only if nothing is detected does it show the full category listing with examples.

---

## 🎨 UI Features

- **Dark glassmorphism theme** — premium feel with frosted glass effects
- **Animated background** — subtle mesh gradient animation
- **Custom scrollbar** — gradient purple-cyan scrollbar with hover glow effects
- **Typing indicator** — animated bouncing dots while waiting for response
- **Message animations** — smooth slide-in for new messages
- **Engine badge** — shows whether Gemini AI or Local Engine answered
- **Responsive layout** — adapts to mobile, tablet, and desktop
- **Auto-resize input** — textarea grows as you type
- **Quick prompts** — one-click starter questions (comparisons, gifts, trending)
- **Category chips** — quick browse by category

---

## 🔧 Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `GEMINI_API_KEY` | — | Google Gemini API key (optional) |
| `PORT` | `3000` | Server port |

---

## 📝 Scripts

```bash
npm start       # Start the server
npm run dev     # Start with --watch (auto-restart on changes)
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Boomi Rao**

---

<p align="center">
  Made with ❤️ and AI
</p>

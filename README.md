# 🛍️ ShopSmart AI — Smart Shopping Assistant

An AI-powered shopping assistant chatbot that helps users discover, compare, and choose the best products through natural, friendly conversation.

![ShopSmart AI](https://img.shields.io/badge/ShopSmart-AI-7c3aed?style=for-the-badge&logo=robot&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Chat** | Google Gemini-powered conversational product recommendations |
| ⚙️ **Smart Fallback Engine** | Local engine with keyword matching, conversational understanding, and fuzzy text search |
| 💬 **Conversation Memory** | Per-session chat history for context-aware suggestions |
| 🏷️ **Category Browsing** | Quick-filter across 13 product categories |
| 💰 **Budget-Aware** | Extracts price constraints from natural language (e.g., "under ₹30K") |
| 🔍 **Smart Intent Detection** | Understands product type, brand, purpose, and preferences |
| 🗣️ **Conversational Responses** | Handles greetings, thanks, help requests, comparisons, and general questions |
| 🔎 **Fuzzy Search** | Finds products even with non-standard queries by searching across all product fields |
| 📱 **Responsive Design** | Works seamlessly on mobile and desktop |
| 🎨 **Premium UI** | Dark glassmorphism theme with smooth animations and custom scrollbar |

---

## 🖼️ Screenshots

### Welcome Page
<p align="center">
  <img src="docs/welcome.png" alt="Welcome Page" width="800">
</p>

### Product Recommendations
<p align="center">
  <img src="docs/recommendations.png" alt="Recommendations" width="800">
</p>

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
| **Fallback Engine** | Custom keyword-matching + fuzzy search + conversational AI |
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

The assistant covers **137 products** across **13 categories**:

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
3. Relevant products are filtered from the catalog
4. A structured prompt with product context + chat history is sent to Gemini
5. Gemini generates a natural, conversational recommendation
6. Response is returned with session context preserved

### Without Gemini API (Local Fallback Mode)

The local engine uses a **5-step query resolution pipeline** to ensure every question gets a meaningful answer:

```
① Conversational Handler → ② Product Detail Query → ③ Keyword Intent Match → ④ Fuzzy Text Search → ⑤ Clarification
```

#### ① Conversational Handler
Detects and responds to non-product queries:
- **Greetings:** "hi", "hello", "namaste", "good morning"
- **Thanks/Bye:** "thank you", "bye", "see you"
- **Help requests:** "what can you do", "help me", "who are you"
- **Meta queries:** "cheapest product", "best rated", "most expensive", "how many products"
- **Acknowledgments:** "ok", "cool", "great", "awesome"
- **Comparisons:** "compare Samsung vs Apple" (finds matching products)

#### ② Product Detail Query
If the user mentions a specific product name (e.g., "tell me about iPhone 15 Pro Max"), returns detailed product info including price, brand, rating, description, and all features.

#### ③ Keyword Intent Matching
The core recommendation engine. Extracts intent from the query:
- **Category detection** — maps keywords to 13 categories
- **Budget extraction** — parses "under ₹30K", "below Rs 20000", "budget 50k" etc.
- **Brand matching** — detects 40+ brands from the product catalog
- **Purpose tagging** — identifies use cases like gaming, running, office, travel

Products are scored based on:
| Factor | Points | Logic |
|--------|--------|-------|
| Category match | +30 | Strict filtering |
| Budget fit | up to +25 | Proportional to price/budget ratio |
| Brand match | +20 | Exact brand match |
| Purpose/tag match | +5 each | Per matching tag |
| Rating bonus | +rating × 2 | Higher-rated products preferred |

#### ④ Fuzzy Text Search
If keyword matching doesn't find results, the engine performs a full-text search across **all product fields** — name, description, brand, category, features, and tags. Stop words are filtered out, and results are scored by match quality:

| Match Location | Priority Score |
|---------------|---------------|
| Product name | +15 |
| Brand | +12 |
| Category | +10 |
| Tags | +8 |
| Features | +6 |
| Description | +4 |

This allows queries like "waterproof", "OLED", "cotton", "wireless charging" to find relevant products even without matching a predefined category.

#### ⑤ Clarification (Last Resort)
Only if all previous steps fail, the engine shows a helpful message listing all available categories with example queries.

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
- **Quick prompts** — one-click starter questions
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

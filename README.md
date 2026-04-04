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
| ⚙️ **Fallback Engine** | Local keyword-matching engine when Gemini API is unavailable |
| 💬 **Conversation Memory** | Per-session chat history for context-aware suggestions |
| 🏷️ **Category Browsing** | Quick-filter across 6 product categories |
| 💰 **Budget-Aware** | Extracts price constraints from natural language (e.g., "under ₹30K") |
| 🔍 **Smart Intent Detection** | Understands product type, brand, purpose, and preferences |
| 📱 **Responsive Design** | Works seamlessly on mobile and desktop |
| 🎨 **Premium UI** | Dark glassmorphism theme with smooth animations |

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
| **Fallback Engine** | Custom keyword-matching + scoring algorithm |
| **Frontend** | Vanilla HTML, CSS, JavaScript |
| **Styling** | CSS with glassmorphism, gradients, animations |
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
│   └── products.json         # Product catalog (50 items)
│
├── engines/
│   └── localEngine.js        # Fallback recommendation engine
│
└── public/
    ├── index.html            # Chat UI
    ├── styles.css            # Premium dark theme
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

**Example:** `/api/products?category=Shoes&maxPrice=10000`

---

### `GET /api/categories`

Returns all product categories with item counts.

**Response:**
```json
[
  { "name": "Smartphones", "count": 8 },
  { "name": "Laptops", "count": 7 },
  { "name": "Shoes", "count": 8 }
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
  "products": 50,
  "sessions": 3
}
```

---

## 📦 Product Categories

The assistant covers **50 products** across 6 categories:

| Category | Products | Price Range |
|----------|----------|-------------|
| 📱 Smartphones | 8 | ₹11,999 – ₹1,59,900 |
| 💻 Laptops | 7 | ₹38,990 – ₹1,99,900 |
| 👟 Shoes | 8 | ₹699 – ₹16,999 |
| 👕 Clothing | 7 | ₹1,299 – ₹3,490 |
| 🏠 Home Appliances | 9 | ₹2,190 – ₹64,990 |
| 🎧 Accessories | 11 | ₹1,299 – ₹29,990 |

---

## 🧠 How It Works

### With Gemini API (AI Mode)

1. User sends a message
2. Server extracts intent (category, budget, brand, purpose)
3. Relevant products are filtered from the catalog
4. A structured prompt with product context + chat history is sent to Gemini
5. Gemini generates a natural, conversational recommendation
6. Response is returned with session context preserved

### Without Gemini API (Fallback Mode)

1. User sends a message
2. Local engine extracts intent via keyword matching
3. Products are scored based on:
   - **Category match** (+30 points, strict filtering)
   - **Budget fit** (up to +25 points, proportional to price/budget ratio)
   - **Brand match** (+20 points)
   - **Purpose/tag match** (+5 per matching tag)
   - **Rating bonus** (+rating × 2)
4. Top 5 products are formatted and returned

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

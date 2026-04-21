# MERN Calculator

A modern, full-stack scientific calculator built with React, Express, MongoDB, and Node.js. Features a beautiful glassmorphic UI with dark/light themes, advanced scientific functions, and user-specific calculation history.

![Calculator Preview](https://img.shields.io/badge/Stack-MERN-green) ![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

### Basic Operations
- ➕ Addition, subtraction, multiplication, and division
- 🔢 Decimal point support
- ⌨️ Full keyboard support
- 🎯 Real-time expression preview
- ↩️ Backspace and clear functions (AC/CE)

### Scientific Functions
- **Trigonometry:** sin, cos, tan (in degrees)
- **Powers & Roots:** x², x³, √, ∛
- **Logarithms:** ln, log, e^x, 10^x
- **Constants:** π (Pi), e (Euler's number)
- **Advanced:** 1/x (reciprocal), n! (factorial), % (percentage)

### UI/UX
- 🎨 Beautiful glassmorphic design with animated gradients
- 🌓 Dark and light mode toggle
- 💫 Smooth animations and ripple effects
- 📱 Fully responsive (mobile, tablet, desktop)
- ✨ Glowing buttons with hover effects
- 🎭 Animated background with moving grid

### Data Management
- 💾 User-specific calculation history (no login required)
- ☁️ MongoDB cloud persistence
- 📂 Local storage fallback when offline
- 🔄 Auto-save all calculations
- 🗑️ Clear history option
- 🔍 Click history items to reuse results

## 🏗️ Project Structure

```
mern-stack-calculator-app/
├── client/src/          # React calculator UI
│   ├── App.jsx         # Main calculator component
│   └── index.css       # Styles with CSS variables
├── server/             # Express API
│   ├── config/         # Database configuration
│   ├── controllers/    # Request handlers
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API routes
│   ├── utils/          # Helper functions
│   └── index.js        # Server entry point
├── src/                # Vite entry point
├── .env                # Environment variables
└── package.json        # Dependencies
```

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (optional, for cloud storage)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd mern-stack-calculator-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure MongoDB (Optional):**
   
   Create a `.env` file in the project root:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/mern-calculator
   PORT=5000
   ```
   
   If you skip this step, the app will use local JSON file storage.

4. **Start the development server:**
   
   **Terminal 1 - Frontend:**
   ```bash
   npm run dev
   ```
   Opens at `http://localhost:5173`
   
   **Terminal 2 - Backend:**
   ```bash
   node server/index.js
   ```
   Runs at `http://localhost:5000`

5. **Open your browser:**
   Navigate to `http://localhost:5173`

## 🌐 Deployment

### Backend (Render)

1. Push code to GitHub
2. Create a new Web Service on [Render](https://render.com)
3. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `node server/index.js`
   - **Environment Variables:**
     ```
     MONGODB_URI=<your-mongodb-atlas-uri>
     PORT=5000
     ```

### Frontend (Vercel/Netlify)

1. Create a new project on [Vercel](https://vercel.com) or [Netlify](https://netlify.com)
2. Configure:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Environment Variable:**
     ```
     VITE_API_URL=<your-render-backend-url>
     ```

## 📡 API Endpoints

| Method | Endpoint | Description | Query/Body |
|--------|----------|-------------|------------|
| GET | `/` | API status | - |
| GET | `/health` | Health check | - |
| GET | `/history` | Fetch user's calculations | `?userId=<id>` |
| POST | `/history` | Save a calculation | `{ userId, expression, result }` |
| DELETE | `/history` | Clear user's history | `?userId=<id>` |

## 🎮 Usage

### Keyboard Shortcuts
- **Numbers:** `0-9`
- **Operators:** `+`, `-`, `*`, `/`
- **Decimal:** `.`
- **Calculate:** `Enter` or `=`
- **Clear All:** `Escape` or `C`
- **Backspace:** `Backspace`
- **Percentage:** `%`

### Scientific Mode
Click "Show Functions" to reveal 16 advanced scientific functions including trigonometry, logarithms, and more.

### History Panel
- View all your past calculations
- Click any history item to load the result
- Clear all history with the trash icon
- History is unique per browser (no login needed)

## 🛠️ Technologies Used

### Frontend
- **React 19** - UI library
- **Vite** - Build tool
- **Tailwind CSS 4** - Styling
- **CSS Variables** - Theming

### Backend
- **Node.js** - Runtime
- **Express 5** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM

### DevOps
- **Render** - Backend hosting
- **Vercel/Netlify** - Frontend hosting
- **MongoDB Atlas** - Cloud database

## 🎨 Color Scheme

### Light Mode
- Primary: Purple gradients (#8b5cf6)
- Operators: Orange gradients (#f59e0b)
- Actions: Red gradients (#ef4444)
- Equals: Green gradients (#10b981)

### Dark Mode
- Background: Deep navy (#0f172a)
- Accent: Light purple (#a78bfa)
- Glass effect with blur

## 📝 Notes

- **User Identification:** Each browser gets a unique ID stored in localStorage
- **Offline Support:** Calculations are cached locally and synced when online
- **No Authentication:** Simple session-based user tracking
- **History Limit:** Stores last 50 calculations per user
- **Fallback Storage:** Uses local JSON file if MongoDB is unavailable

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for learning or production.

## 🙏 Acknowledgments

- Built with the MERN stack
- Inspired by modern calculator designs
- Icons from Lucide/Feather

---

**Made with ❤️ using React, Express, MongoDB & Node.js**
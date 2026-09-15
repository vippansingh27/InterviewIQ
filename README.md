# InterviewIQ 🚀

**InterviewIQ** is an AI-powered mock interview platform designed to help candidates prepare for technical and behavioral interviews with real-time AI questioning, dynamic feedback, speech-to-text response capture, and detailed analytical performance reports.

---

## 🌟 Key Features

- **🤖 AI-Driven Dynamic Interviews**: Customized interview questions based on job role, experience level, and uploaded resumes.
- **📄 Resume Analysis**: Automatic resume parsing and analysis using PDF processing to generate tailored interview questions.
- **🎙️ Real-Time Interaction**: Interactive speech and timed response interface featuring virtual AI interviewer avatars.
- **📊 Comprehensive Feedback & Reports**:
  - Detailed scoring on technical accuracy, communication, and confidence.
  - Interactive visual analytics powered by **Recharts**.
  - Downloadable PDF performance reports generated with **jsPDF**.
- **💳 Credit & Subscription System**: Integrated payments via **Razorpay** with tier-based interview credits.
- **🔐 Secure Authentication**: Fast and secure user authentication via Firebase Auth and JWT session tokens.
- **📜 Interview History**: Track past interview sessions, review past scores, and monitor performance improvement over time.

---

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) + React-Redux
- **Animations & Charts**: [Motion](https://motion.dev/) + [Recharts](https://recharts.org/) + [React Circular Progressbar](https://github.com/kevinsqi/react-circular-progressbar)
- **PDF Export**: [jsPDF](https://github.com/parallax/jsPDF) & [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable)
- **Authentication**: [Firebase](https://firebase.google.com/)

### Backend (Server)
- **Runtime**: [Node.js](https://nodejs.org/) & [Express.js 5](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **AI Service**: [OpenRouter API](https://openrouter.ai/) for LLM integration
- **File Uploads & PDF Parsing**: [Multer](https://github.com/expressjs/multer) & [pdfjs-dist](https://mozilla.github.io/pdf.js/)
- **Payments**: [Razorpay](https://razorpay.com/)
- **Authentication & Security**: JSON Web Tokens (`jsonwebtoken`) & `cookie-parser`

---

## 📁 Project Structure

```bash
interviewSystem/
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── assets/             # Images, icons, and AI avatar video assets
│   │   ├── components/         # Reusable UI components (Navbar, Steps, Timer, etc.)
│   │   ├── pages/              # App views (Home, Auth, Interview, Report, History, Pricing)
│   │   ├── redux/              # Store configuration and user state slices
│   │   └── utils/              # Firebase configuration and helpers
│   ├── package.json
│   └── vite.config.ts
│
├── server/                     # Backend API Server
│   ├── config/                 # DB connection and token utilities
│   ├── controllers/            # Request handlers (auth, interview, payment, user)
│   ├── middlewares/            # Auth and multer upload middlewares
│   ├── models/                 # Mongoose schemas (User, Interview, Payment)
│   ├── routes/                 # Express API routes
│   ├── services/               # Razorpay and OpenRouter AI integrations
│   ├── package.json
│   └── index.js                # Server entry point
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB instance (local or MongoDB Atlas)
- OpenRouter API Key
- Razorpay Account (Key ID & Secret)

---

### 1. Clone the Repository

```bash
git clone https://github.com/vippansingh27/InterviewIQ.git
cd InterviewIQ
```

---

### 2. Setup Backend (Server)

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in `server/`:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   OPENROUTER_API_KEY=your_openrouter_api_key
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```

---

### 3. Setup Frontend (Client)

1. Navigate to the `client` directory:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in `client/` if configuring Firebase / custom endpoints:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

# Eflow - Smart E-Scooter Rental System

A modern, AI-powered e-scooter rental platform built for seamless urban mobility. This full-stack application enables users to book, track, and pay for e-scooter rides with integrated wallet management and real-time insights.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure login/signup with manual registration and Google OAuth integration
- **Scooter Management**: Real-time scooter availability, battery health monitoring, and status tracking
- **Ride Booking**: Intuitive booking system with scooter selection and reservation
- **Live Tracking**: GPS-based scooter tracking during rides
- **Ride Timer**: Real-time ride duration and cost calculation
- **Payment Processing**: Multiple payment modes with secure transaction handling
- **Digital Wallet**: Integrated wallet system for seamless payments and balance management
- **Ride History**: Comprehensive ride logs and transaction history

### AI-Powered Features
- **Smart Insights**: Gemini AI integration for energy consumption analysis and optimization recommendations
- **Intelligent Routing**: AI-assisted route optimization for efficient scooter placement
- **Usage Analytics**: Data-driven insights for operational efficiency

### Technical Features
- **Real-time Updates**: Live scooter status and location updates
- **Responsive Design**: Mobile-first design optimized for urban mobility
- **Secure Payments**: Encrypted payment processing with transaction verification
- **Scalable Architecture**: Microservices-ready backend with PostgreSQL database

## 🏗️ Architecture

### Backend (Python/FastAPI)
- **Framework**: FastAPI for high-performance async API
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with OAuth 2.0 (Google integration)
- **AI Integration**: Google Gemini API for intelligent insights
- **Security**: bcrypt password hashing, CORS middleware

### Frontend (React/Vite)
- **Framework**: React 19 with modern hooks
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: React Router for SPA navigation
- **Styling**: CSS modules with responsive design
- **State Management**: React hooks and localStorage

## 📁 Project Structure

```
eflow/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── __pycache__/         # Python cache
├── frontend/
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── features/        # Feature-specific pages
│   │   ├── hooks/           # Custom React hooks
│   │   └── styles/          # Global styles
│   ├── package.json         # Node dependencies
│   ├── vite.config.js       # Vite configuration
│   └── vercel.json          # Vercel deployment config
├── schema.sql               # Database schema
└── README.md               # Project documentation
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL
- Google Cloud account (for Gemini AI)
- Google OAuth credentials

### Backend Setup

1. **Clone and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   Create a `.env` file with:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/eflow
   FRONTEND_URL=http://localhost:5173
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   SESSION_SECRET=your_session_secret
   GEMINI_API_KEY=your_gemini_api_key
   ```

5. **Initialize database:**
   ```bash
   python -c "from main import init_db; init_db()"
   ```

6. **Run the backend server:**
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 🚀 Deployment

### Backend Deployment
- Deploy to services like Railway, Render, or Heroku
- Ensure environment variables are configured
- Set up PostgreSQL database instance

### Frontend Deployment
- Deploy to Vercel, Netlify, or similar platforms
- Configure build settings for Vite
- Set up environment variables for production

## 🔧 API Endpoints

### Authentication
- `POST /signup` - User registration
- `POST /login` - User login
- `GET /auth/google` - Google OAuth initiation
- `GET /auth/google/callback` - OAuth callback

### Scooters
- `GET /scooters` - Get available scooters
- `GET /scooters/{id}` - Get scooter details

### Bookings
- `POST /book` - Create booking
- `POST /end-ride` - End active ride
- `GET /active-booking/{user_id}` - Get active booking

### Payments
- `POST /payment` - Process payment
- `GET /payments/{user_id}` - Get payment history

### Wallet
- `GET /wallet/{user_id}` - Get wallet balance
- `POST /wallet/add` - Add funds to wallet
- `GET /wallet/transactions/{user_id}` - Get transaction history

## 🤖 AI Integration

The system integrates Google Gemini AI for:
- **Energy Insights**: Analyze scooter battery usage patterns
- **Route Optimization**: Suggest optimal scooter placement
- **Usage Analytics**: Generate reports on system efficiency

## 📊 Database Schema

### Core Tables
- **users**: User accounts and authentication
- **scooters**: Scooter inventory and status
- **bookings**: Ride bookings and sessions
- **payments**: Payment transactions
- **wallets**: User wallet balances
- **wallet_transactions**: Wallet transaction logs

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest  # Assuming pytest is configured
```

### Frontend Testing
```bash
cd frontend
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for hackathon innovation
- Powered by FastAPI, React, and PostgreSQL
- AI capabilities provided by Google Gemini
- Icons and assets from various open-source projects

## 📞 Support

For support, email support@eflow.com or join our Discord community.

---

**Eflow** - Revolutionizing urban mobility with smart technology 🚀

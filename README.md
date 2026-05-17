# ✈️ SkyWay - The Sky Is Your Runway

![SkyWay Banner](./assets/banner.png)

### Find the best fares across 500+ airlines and book your next adventure in seconds.

SkyWay is a high-performance, full-stack flight booking application designed to provide users with a seamless and premium travel booking experience. Built with a modern tech stack, it features real-time search, secure authentication, automated ID verification, and a stunning glassmorphic UI.

## 🌟 Features

- **🚀 Real-time Flight Search**: Advanced filtering and search capabilities for domestic and international flights.
- **🔐 Secure Authentication**: JWT-based user authentication with encrypted passwords using Bcrypt.
- **📄 Automated ID Verification**: Instant PDF-based document verification (Aadhaar/Voter ID) powered by `pdf-parse`.
- **📧 Smart Notifications**: Automated welcome and booking confirmation emails via Nodemailer.
- **💳 Integrated Payments**: Secure checkout flow for flight reservations.
- **📱 Fully Responsive**: Optimized for both desktop and mobile devices with a mobile-first design approach.
- **🎨 Premium UI/UX**: Stunning dark-mode aesthetics with glassmorphism and smooth animations.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS 4.0
- **Routing**: React Router 7
- **Feedback**: React Hot Toast
- **Icons**: Lucide React / FontAwesome

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **File Handling**: Multer
- **Parsing**: PDF-Parse
- **Email**: Nodemailer (SMTP)

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account or local MongoDB instance
- SMTP Server (e.g., Gmail App Password)

### 1. Clone the Repository
```bash
git clone https://github.com/enanka2124/SkyWay.git
cd SkyWay
```

### 2. Backend Configuration
Create a `.env` file in the `server/` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

Install dependencies and start the server:
```bash
cd server
npm install
npm start
```

### 3. Frontend Configuration
Install dependencies and start the development server:
```bash
cd ../client
npm install
npm run dev
```

## 📂 Project Structure

```text
SkyWay/
├── client/                # React Frontend (Vite)
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (Home, Info, Search)
│   │   └── utils/         # Frontend helper functions
│   └── public/            # Static assets
├── server/                # Node.js Express Backend
│   ├── models/            # Mongoose Schemas
│   ├── routes/            # API Endpoints
│   ├── utils/             # Mailer, PDF Parser, etc.
│   └── uploads/           # Temporary storage for ID uploads
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

----
Developed by [Enanka Nandi](https://github.com/enanka2124)

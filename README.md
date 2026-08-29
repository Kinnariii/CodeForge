<div align="center">

<img src="https://img.shields.io/badge/CodeForge-Production%20Ready-orange?style=for-the-badge&logo=leetcode&logoColor=white" alt="CodeForge" />

# ⚡ CodeForge

### A Full-Stack Competitive Programming Platform

**Practice. Battle. Compete. Conquer.**

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-code--forge--iota--ten.vercel.app-blue?style=for-the-badge)](https://code-forge-iota-ten.vercel.app)
[![Backend API](https://img.shields.io/badge/🚀%20Backend%20API-Render-green?style=for-the-badge)](https://codeforge-backend-v0h3.onrender.com/health)

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socket.io&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=json-web-tokens&logoColor=white)

</div>

---

## 📌 What is CodeForge?

CodeForge is a **production-ready, full-stack competitive programming platform** inspired by LeetCode and Codeforces. It lets users solve algorithmic problems, compete in real-time **1v1 Battle Arenas**, join **timed Contests**, and track their performance through a live **rating system**.

Built from scratch with a modern, scalable backend architecture — featuring sandboxed code execution, real-time WebSocket communication, async job queues, Redis caching, and a complete ELO-based rating system.

---

## 🌐 Live Links

| Service | URL |
|---|---|
| 🌐 **Frontend** | [code-forge-iota-ten.vercel.app](https://code-forge-iota-ten.vercel.app) |
| 🚀 **Backend API** | [codeforge-backend-v0h3.onrender.com](https://codeforge-backend-v0h3.onrender.com) |
| ❤️ **Health Check** | [/health](https://codeforge-backend-v0h3.onrender.com/health) |

> ⚠️ **Note:** Backend is on Render free tier — first request may take ~30s to wake up.

---

## ✨ Core Features

### 🧩 Problem Solving
- Browse problems by difficulty (Easy / Medium / Hard)
- Full in-browser **C++ code editor**
- Real-time **code execution** with test case feedback
- Hidden & visible test cases
- Detailed submission history with runtime & memory stats

### ⚔️ 1v1 Battle Arena
- Real-time **matchmaking system** via WebSockets
- Both players get the **same problem simultaneously**
- First to pass all test cases wins
- Live opponent progress tracking
- **ELO-based battle rating** updates after every match

### 🏆 Contests
- Create and join **timed programming contests**
- Multiple problems per contest
- **Live leaderboard** with penalty-based ranking (ICPC style)
- **Automatic contest rating calculation** via scheduled cron jobs
- Final leaderboard stored after contest ends

### 👤 User System
- JWT-based authentication with **token blacklisting** (logout support)
- Role-based access: `user` and `admin`
- User profile with **contest & battle rating history**
- Complete submission history

### 🛡️ Admin Panel
- Create / Edit / Delete problems with judge configuration
- Create and manage contests
- Manage test cases (hidden/visible)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Client (React + Vite)                │
│         Vercel CDN — code-forge-iota-ten.vercel.app     │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP REST + WebSocket
┌────────────────────────▼────────────────────────────────┐
│              Backend (Node.js + Express)                  │
│          Render — codeforge-backend-v0h3.onrender.com   │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  REST APIs   │  │  Socket.io   │  │  BullMQ      │  │
│  │  (8 modules) │  │  (Realtime)  │  │  (Job Queue) │  │
│  └──────────────┘  └──────────────┘  └──────┬───────┘  │
│                                              │           │
│  ┌────────────────────────────────────────── ▼ ───────┐ │
│  │              Code Execution Engine                   │ │
│  │   Docker Sandbox → g++ compile → run per test case  │ │
│  └──────────────────────────────────────────────────┘  │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
┌──────────▼──────────┐  ┌───────────▼───────────────┐
│   MongoDB Atlas     │  │      Upstash Redis         │
│  (Persistent Data)  │  │  (Cache + BullMQ + Tokens) │
└─────────────────────┘  └───────────────────────────┘
```

---

## 🔧 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **MongoDB + Mongoose** | Primary database |
| **Redis (Upstash)** | Caching, BullMQ job queue, token blacklist |
| **BullMQ** | Async code submission queue |
| **Socket.io** | Real-time battle & matchmaking |
| **JWT** | Authentication with blacklist support |
| **Docker** | Sandboxed C++ code execution |
| **node-cron** | Automated contest rating scheduler |
| **bcrypt** | Password hashing |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite** | Build tool |
| **React Router v7** | Client-side routing |
| **Axios** | HTTP client with interceptors |
| **Socket.io-client** | Real-time WebSocket connection |
| **Vanilla CSS** | Custom styling |

### DevOps & Cloud
| Service | Purpose |
|---|---|
| **Vercel** | Frontend deployment (CDN) |
| **Render** | Backend deployment |
| **MongoDB Atlas** | Cloud database |
| **Upstash** | Serverless Redis |
| **Docker** | Code execution sandbox |
| **UptimeRobot** | Service monitoring |

---

## 📁 Project Structure

```
CodeForge/
├── backend/
│   ├── server.js                    # Entry point
│   ├── src/
│   │   ├── app.js                   # Express app setup
│   │   ├── config/
│   │   │   ├── database.js          # MongoDB connection
│   │   │   ├── redis.js             # Redis client
│   │   │   └── queue.config.js      # BullMQ connection
│   │   ├── models/
│   │   │   ├── User.js              # User + Rating History
│   │   │   ├── Problem.js           # Problem + Judge Config
│   │   │   ├── Submission.js        # Code Submissions
│   │   │   ├── TestCase.js          # Test Cases
│   │   │   ├── Contest.js           # Contests + Leaderboard
│   │   │   └── Battle.js            # 1v1 Battle Sessions
│   │   ├── routes/                  # API route definitions
│   │   ├── controllers/             # Request handlers
│   │   ├── services/
│   │   │   ├── judge.service.js     # Core judging logic
│   │   │   ├── battleResult.service.js  # Battle resolution
│   │   │   ├── rating.service.js    # ELO rating calculation
│   │   │   ├── matchmaking.service.js   # Battle matchmaking
│   │   │   ├── contestRatingScheduler.service.js  # Cron job
│   │   │   └── executor/
│   │   │       ├── cpp.executor.js  # C++ execution (Docker + fallback)
│   │   │       └── code-generator.js # Test harness generator
│   │   ├── workers/
│   │   │   └── submission.worker.js # BullMQ job processor
│   │   ├── queues/
│   │   │   └── submission.queue.js  # BullMQ queue
│   │   ├── sockets/
│   │   │   ├── socket.js            # Socket.io setup
│   │   │   └── battle.socket.js     # Battle room handlers
│   │   ├── middlewares/
│   │   │   └── auth.middleware.js   # JWT + Admin guard
│   │   ├── repositories/            # DB query abstraction
│   │   └── utils/
│   │       └── cache.js             # Redis cache helpers
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── ProblemList.jsx      # Problems browser
    │   │   ├── ProblemDetail.jsx    # Code editor + submission
    │   │   ├── Contests.jsx         # Contest listing
    │   │   ├── ContestDetail.jsx    # Contest + live leaderboard
    │   │   ├── BattleLobby.jsx      # Matchmaking lobby
    │   │   ├── BattleArena.jsx      # 1v1 battle room
    │   │   ├── Profile.jsx          # User profile + ratings
    │   │   ├── Submissions.jsx      # Submission history
    │   │   ├── CreateProblem.jsx    # Admin: create problem
    │   │   ├── CreateContest.jsx    # Admin: create contest
    │   │   └── EditProblem.jsx      # Admin: edit problem
    │   ├── services/
    │   │   ├── api.js               # Axios instance + interceptors
    │   │   └── socket.js            # Socket.io client
    │   └── .env.example
    └── vite.config.js
```

---

## 🔑 API Endpoints

### Authentication — `/api/v1/auth`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register new user |
| POST | `/login` | Login, get JWT |
| POST | `/logout` | Blacklist token |

### Problems — `/api/v1/problems`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/` | List all problems | ✅ |
| GET | `/:id` | Get problem details | ✅ |
| POST | `/` | Create problem | Admin |
| PUT | `/:id` | Update problem | Admin |
| DELETE | `/:id` | Delete problem | Admin |
| POST | `/:id/run` | Run code on samples | ✅ |

### Submissions — `/api/v1/submissions`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/` | Submit code | ✅ |
| GET | `/` | My submissions | ✅ |
| GET | `/:id` | Submission details | ✅ |

### Contests — `/api/v1/contests`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/` | List contests | ✅ |
| POST | `/` | Create contest | Admin |
| GET | `/:id` | Contest details | ✅ |
| POST | `/:id/register` | Join contest | ✅ |
| GET | `/:id/leaderboard` | Live leaderboard | ✅ |

### Battles — `/api/v1/battles`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/matchmake` | Find opponent | ✅ |
| GET | `/:id` | Battle details | ✅ |

### Users — `/api/v1/users`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/profile` | My profile + ratings | ✅ |
| GET | `/leaderboard` | Global leaderboard | ✅ |

---

## ⚙️ Code Execution Flow

```
User submits C++ code
        │
        ▼
Submission saved to MongoDB (status: "pending")
        │
        ▼
Job pushed to BullMQ queue (Redis)
        │
        ▼
Submission Worker picks up job
        │
        ├── Docker available? ──YES──► Run in Docker sandbox
        │                              (isolated, memory/CPU limited)
        │
        └──────────────NO──────────► Run directly with g++
                                      (cloud/demo fallback)
        │
        ▼
Each test case judged individually
        │
        ▼
Result: accepted / wrong_answer / compile_error /
        runtime_error / time_limit_exceeded
        │
        ▼
MongoDB updated, Socket.io emits result to user
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or Upstash)
- Docker (for sandboxed execution)

### 1. Clone the repo
```bash
git clone https://github.com/Lovejindal1/CodeForge.git
cd CodeForge
```

### 2. Setup Backend
```bash
cd backend
cp .env.example .env
# Fill in .env with your values
npm install
npm start
```

### 3. Setup Frontend
```bash
cd frontend
# No .env needed for local — uses localhost:3000 by default
npm install
npm run dev
```

### 4. Build Docker image for C++ execution
```bash
cd backend/src/services/executor/docker
docker build -t codeforge-cpp-runner:1.1 .
```

### Backend `.env` variables
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/codeforge
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

---

## ☁️ Deployment

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel (free) | [code-forge-iota-ten.vercel.app](https://code-forge-iota-ten.vercel.app) |
| Backend | Render (free) | [codeforge-backend-v0h3.onrender.com](https://codeforge-backend-v0h3.onrender.com) |
| Database | MongoDB Atlas (free 512MB) | — |
| Redis | Upstash (free tier) | — |

---

## 🔐 Security Features

- ✅ JWT authentication with **token blacklisting on logout**
- ✅ Role-based access control (`user` / `admin`)
- ✅ **Sandboxed code execution** (Docker: no network, CPU & memory limits)
- ✅ Request rate limiting
- ✅ Password hashing with bcrypt
- ✅ Input validation with `validator.js`
- ✅ CORS configured for production frontend URL

---

## 🧠 Rating System

CodeForge uses an **ELO-inspired rating system** for both Battles and Contests:

- Every user starts at **1200 rating**
- Battle wins/losses change rating based on opponent strength
- Contest ratings update after contest ends (automated via cron)
- Full **rating history** stored per user

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

1. Fork the repo
2. Create your feature branch: `git checkout -b feat/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feat/amazing-feature`
5. Open a Pull Request

---

## 👨‍💻 Author

**Love Jindal**

[![GitHub](https://img.shields.io/badge/GitHub-Lovejindal1-181717?style=flat-square&logo=github)](https://github.com/Lovejindal1)

---

<div align="center">

**⭐ If you found this project useful, please give it a star!**

Made with ❤️ by Love Jindal

</div>

<div align="center">

# ⚡ CodeForge

### Full-Stack Competitive Programming & Real-Time Algorithmic Battle Platform

**Practice Algorithms • Compete in 1v1 PvP Battles • Dominate Timed Contests • Climb ELO Leaderboards**

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Platform-code--forge--iota--ten.vercel.app-6366f1?style=for-the-badge&logo=vercel&logoColor=white)](https://code-forge-iota-ten.vercel.app)
[![Backend API](https://img.shields.io/badge/🚀%20Live%20Backend-Render%20Cloud-00c58e?style=for-the-badge&logo=render&logoColor=white)](https://codeforge-backend-10w2.onrender.com/health)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

<br/>

![React](https://img.shields.io/badge/React%2019-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite%206-646CFF?style=flat-square&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js%2020-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express%204-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB Atlas](https://img.shields.io/badge/MongoDB%20Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Upstash%20Redis-FF4438?style=flat-square&logo=redis&logoColor=white)
![BullMQ](https://img.shields.io/badge/BullMQ%20Queue-9B59B6?style=flat-square&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io%20Realtime-010101?style=flat-square&logo=socket.io&logoColor=white)
![Docker](https://img.shields.io/badge/Docker%20Container-2496ED?style=flat-square&logo=docker&logoColor=white)
![JWT](https://img.shields.io/badge/JWT%20Auth-000000?style=flat-square&logo=json-web-tokens&logoColor=white)
![UptimeRobot](https://img.shields.io/badge/UptimeRobot-Monitored-1abc9c?style=flat-square&logo=uptimerobot&logoColor=white)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Live Deployments](#-live-deployments)
- [Core Features](#-core-features)
  - [1. Problem Solving & Code Execution](#1-problem-solving--code-execution)
  - [2. 1v1 Real-Time Battle Arena (PvP)](#2-1v1-real-time-battle-arena-pvp)
  - [3. Timed Contests & ICPC-Style Scoring](#3-timed-contests--icpc-style-scoring)
  - [4. Dual ELO Rating System](#4-dual-elo-rating-system)
  - [5. Authentication & Security](#5-authentication--security)
  - [6. Admin Management Suite](#6-admin-management-suite)
- [System Architecture](#-system-architecture)
- [Deep Dive: Code Execution Engine](#-deep-dive-code-execution-engine)
- [Data Models & Schema](#-data-models--schema)
- [API Reference](#-api-reference)
- [WebSocket Event Specification](#-websocket-event-specification)
- [Tech Stack Details](#-tech-stack-details)
- [Project Directory Structure](#-project-directory-structure)
- [Local Development Setup](#-local-development-setup)
- [Environment Variables](#-environment-variables)
- [Production Deployment](#-production-deployment)
- [Author & Acknowledgments](#-author--acknowledgments)

---

## 📌 Overview

**CodeForge** is a full-featured, production-ready competitive programming and battle platform engineered from the ground up to deliver a low-latency, scalable online judging experience inspired by platforms like LeetCode and Codeforces.

It solves real-world distributed systems challenges:
- **Asynchronous Code Execution:** Offloads heavy C++ compilation and multi-test execution to a background queue (BullMQ + Redis) to protect web process responsiveness.
- **Dual Execution Engine:** Operates in a hardened Docker container sandbox locally and dynamically falls back to an optimized native direct execution engine in constrained containerized cloud platforms.
- **Bi-Directional Real-Time Communication:** Facilitates 1v1 algorithmic duels using Socket.io rooms, tracking opponent submission states and test completion in real-time.
- **Autonomous Rating Lifecycle:** Background cron schedulers dynamically calculate post-contest rating adjustments using official ELO formulas once contests conclude.

---

## 🌐 Live Deployments

| Component | Platform | URL |
|---|---|---|
| **Frontend Application** | Vercel (Global Edge CDN) | [https://code-forge-iota-ten.vercel.app](https://code-forge-iota-ten.vercel.app) |
| **Backend API Server** | Render (Dockerized Service) | [https://codeforge-backend-10w2.onrender.com](https://codeforge-backend-10w2.onrender.com) |
| **Health Check Monitor** | Render `/health` | [https://codeforge-backend-10w2.onrender.com/health](https://codeforge-backend-10w2.onrender.com/health) |
| **Database Cluster** | MongoDB Atlas (Cloud M0) | Fully Managed Cloud Cluster |
| **Distributed Cache & Queue** | Upstash Redis (TLS / rediss://) | Cloud Serverless Redis |
| **Liveness Keep-Alive** | UptimeRobot | Ping every 5 minutes to prevent cold sleep |

> ℹ️ *Tip: Because the backend is hosted on a free cloud tier, initial cold-starts can take ~20–40s if the service is reviving.*

---

## ✨ Core Features

### 1. Problem Solving & Code Execution
- **Curated Problem Repository:** Filter by difficulty (**Easy**, **Medium**, **Hard**) and tags with search.
- **Interactive Code Editor:** Embedded in-browser code editor with line gutters, tab indentation handling, and syntax styling.
- **Sample Execution (`Run Code`):** Instant synchronous execution against visible sample test cases without persisting data to database.
- **Full Judge Evaluation (`Submit`):** Enqueues code to a distributed BullMQ worker. Evaluates visible & hidden test cases sequentially, calculating peak memory consumption and CPU execution runtime.
- **Granular Verdicts:**
  - `Accepted (AC)`
  - `Wrong Answer (WA)` (with expected vs. received diff)
  - `Compile Error (CE)` (full compiler output)
  - `Runtime Error (RE)`
  - `Time Limit Exceeded (TLE)`

### 2. 1v1 Real-Time Battle Arena (PvP)
- **Matchmaking Lobby:** Players join the matchmaking pool; the server pairs candidates based on rating proximity.
- **Synchronized Room Creation:** Generates a dynamic Socket.io battle room (`battle:<id>`), allocating the same problem simultaneously to both contestants.
- **Live Progress Telemetry:** Real-time opponent status notifications (e.g., test cases passed, submission verdicts, active typing indicators).
- **Instant Win Resolution:** The first participant to achieve `Accepted` automatically triggers the win lifecycle, concludes the match, calculates rating deltas, and stores the completed battle audit log.

### 3. Timed Contests & ICPC-Style Scoring
- **Scheduled Contests:** Contests with strict start and end timestamps.
- **Participant Registration:** Controlled entry before and during active contest windows.
- **Live Leaderboard:** Real-time standings using ICPC scoring rules:
  $$\text{Score} = \text{Problems Solved}$$
  $$\text{Penalty} = \text{Time taken} + (20\text{ min} \times \text{Wrong Submissions})$$
- **Automated Rating Engine:** A node-cron daemon periodically polls for ended contests, processes the final leaderboard, computes performance multipliers, and distributes rating updates to all participants.

### 4. Dual ELO Rating System
- Distinct track records for **Contest Rating** and **Battle Rating**.
- Default starting rating: **1200**.
- Complete historical audit trail (`ratingHistory`) stored on the user document for visual progress charting.

### 5. Authentication & Security
- Secure stateless JWT authentication stored in client local storage with Axios interceptor injection.
- **Redis Token Blacklisting:** Instant token revocation upon `/logout` to invalidate compromised tokens before expiration.
- **Password Protection:** Cryptographically hashed with `bcryptjs` (salt rounds: 10).
- **Execution Sandboxing:** Strict timeout enforcement, memory capping, and non-privileged execution contexts to prevent system compromise.
- **API Rate Limiting:** Global and endpoint-specific rate limiters (e.g., submission throttling) preventing DoS abuse.

### 6. Admin Management Suite
- Dedicated administrative interface protected by role-based middleware (`role: "admin"`).
- Create, edit, and delete problems with full judge config (return types, argument types, starter code, driver generator templates).
- Test case manager to inject hidden test datasets and visible problem demonstrations.
- Contest creator with multi-problem assignment and schedule parameters.

---

## 🏗️ System Architecture

```
                                  ┌─────────────────────────────┐
                                  │      Client (Browser)       │
                                  │   React 19 + Vite Frontend  │
                                  └──────────────┬──────────────┘
                                                 │
                                ┌────────────────┴────────────────┐
                                │ HTTP REST APIs & WebSockets     │
                                └────────────────┬────────────────┘
                                                 │
                 ┌───────────────────────────────▼───────────────────────────────┐
                 │                   Express Backend Server                      │
                 │                 (Docker on Render Platform)                   │
                 │                                                               │
                 │  ┌───────────────────────┐         ┌───────────────────────┐  │
                 │  │  Express REST API     │         │  Socket.io Server     │  │
                 │  │  Controllers & Routes │         │  Lobby / 1v1 Battle   │  │
                 │  └───────────┬───────────┘         └───────────┬───────────┘  │
                 │              │                                 │              │
                 │  ┌───────────▼───────────┐                     │              │
                 │  │     BullMQ Producer   │                     │              │
                 │  │  (Dispatches to Queue)│                     │              │
                 │  └───────────┬───────────┘                     │              │
                 │              │                                 │              │
                 │  ┌───────────▼───────────┐                     │              │
                 │  │     BullMQ Consumer   │                     │              │
                 │  │   (Submission Worker) ├─────────────────────┘              │
                 │  └───────────┬───────────┘                                    │
                 │              │                                                │
                 │  ┌───────────▼──────────────────────────────────────────────┐ │
                 │  │               Judge Service & Executor                   │ │
                 │  │   • Code Generator (Generates test harness wrapper)      │ │
                 │  │   • C++ Direct / Docker Execution Engine                 │ │
                 │  │   • Sequential Test-Case Verifier                        │ │
                 │  └──────────────────────────────────────────────────────────┘ │
                 └───────────────────────┬──────────────────────┬────────────────┘
                                         │                      │
                   ┌─────────────────────▼──────┐        ┌──────▼─────────────────────┐
                   │    MongoDB Atlas Cluster   │        │     Upstash Redis Cloud    │
                   │   • Users & Profiles       │        │   • BullMQ Queue & Jobs    │
                   │   • Problems & TestCases   │        │   • Token Blacklist        │
                   │   • Submissions & Contests │        │   • Leaderboard Cache      │
                   │   • Battles & Ratings      │        │   • Rate Limiting Counters │
                   └────────────────────────────┘        └────────────────────────────┘
```

---

## ⚙️ Deep Dive: Code Execution Engine

Online judges cannot execute raw user code directly because competitive programming problems require reading inputs from `stdin` and writing expected formats to `stdout`.

CodeForge implements a **modular 4-stage pipeline**:

```
[User Solution Class] 
         │
         ▼
[1. Code Generation] ──► Merges Solution with Driver Code, Custom Type Parsers & main()
         │
         ▼
[2. Compilation]    ──► g++ -O1 -Werror=return-type main.cpp -o main
         │
         ▼
[3. Test Execution] ──► Runs binary per test case: ./main < input-X.txt
         │               Enforces execution timeout (5000ms) & captures runtime
         │
         ▼
[4. Output Diff]    ──► Normalizes whitespaces, checks output vs expected
```

### Type Serialization Support
The custom code generator automatically constructs deserializers based on the problem's `judgeConfig`:
- Primitives: `int`, `long long`, `double`, `bool`, `string`
- Containers: `vector<int>`, `vector<string>`
- Custom input parsers for array bracket stripping: `[1, 2, 3]` $\rightarrow$ `vector<int>{1, 2, 3}`

### Dual Mode Execution
1. **Docker Mode (Production / Self-Hosted):**
   - Launches an isolated container from `codeforge-cpp-runner:1.1`
   - Parameters: `--network none --memory 128m --cpus 0.5 --pids-limit 64 --read-only --tmpfs /tmp`
2. **Direct Mode (Containerized PaaS / Render):**
   - Compiles using system `g++ -O1` inside a unique ephemeral directory (`/tmp/codeforge-XXXXXX`).
   - Cleaned up via `finally` blocks guaranteeing zero disk leakages.

---

## 🗄️ Data Models & Schema

```
┌────────────────────────────────┐       ┌────────────────────────────────┐
│             User               │       │            Problem             │
├────────────────────────────────┤       ├────────────────────────────────┤
│ _id: ObjectId                  │       │ _id: ObjectId                  │
│ name: String                   │       │ problemNumber: Number (Unique) │
│ email: String (Unique)         │◄──┐   │ title: String                  │
│ password: Hash                 │   │   │ description: String            │
│ role: 'user' | 'admin'         │   │   │ difficulty: 'Easy'|'Med'|'Hard'│
│ contestRating: Number (1200)   │   │   │ functionName: String           │
│ battleRating: Number (1200)    │   │   │ starterCode: String            │
│ ratingHistory: [RatingEvent]   │   │   │ judgeConfig: {                 │
└────────────────────────────────┘   │   │   returnType: String           │
                                     │   │   parameters: [{name, type}]   │
┌────────────────────────────────┐   │   │ }                              │
│           Submission           │   │   └────────────────┬───────────────┘
├────────────────────────────────┤   │                    │
│ _id: ObjectId                  │   │                    │
│ user: Ref<User> ───────────────┼───┤                    │
│ problem: Ref<Problem> ─────────┼───┼────────────────────┤
│ code: String                   │   │                    │
│ language: 'cpp'                │   │   ┌────────────────▼───────────────┐
│ status: 'pending'|'accepted'|..│   │   │            TestCase            │
│ passedTests: Number            │   │   ├────────────────────────────────┤
│ totalTests: Number             │   │   │ _id: ObjectId                  │
│ runtime: Number (ms)           │   │   │ problem: Ref<Problem>          │
│ memory: Number (KB)            │   │   │ input: String                  │
│ error: String                  │   │   │ expectedOutput: String         │
│ battle: Ref<Battle>            │   │   │ isHidden: Boolean              │
└────────────────────────────────┘   │   └────────────────────────────────┘
                                     │
┌────────────────────────────────┐   │   ┌────────────────────────────────┐
│            Contest             │   │   │             Battle             │
├────────────────────────────────┤   │   ├────────────────────────────────┤
│ _id: ObjectId                  │   │   │ _id: ObjectId                  │
│ title: String                  │   │   │ player1: { user, rating, .. }  │
│ description: String            │   └───┼── player2: { user, rating, .. }│
│ startTime: Date                │       │ problem: Ref<Problem>          │
│ endTime: Date                  │       │ winner: Ref<User>              │
│ problems: [Ref<Problem>]       │       │ status: 'waiting'|'in_progress'│
│ participants: [Ref<User>]      │       │ duration: Number (15 mins)     │
│ finalLeaderboard: [Entry]      │       │ endReason: 'accepted'|'timeout'│
└────────────────────────────────┘       └────────────────────────────────┘
```

---

## 📡 API Reference

### 🔐 Authentication (`/api/v1/auth`)
| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/register` | `POST` | Public | Register new account with email & password |
| `/login` | `POST` | Public | Authenticate user & receive JWT token |
| `/logout` | `POST` | Authenticated | Revoke and blacklist JWT in Redis cache |

### 🧩 Problems (`/api/v1/problems`)
| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/` | `GET` | Public | List all problems (supports pagination, search, tags) |
| `/:id` | `GET` | Public | Retrieve single problem metadata & starter code |
| `/` | `POST` | **Admin** | Create a new problem with judge schema |
| `/:id` | `PUT` | **Admin** | Update problem definition, constraints, or starter code |
| `/:id` | `DELETE` | **Admin** | Remove problem and associated test cases |

### ⚡ Submissions (`/api/v1/submissions`)
| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/run` | `POST` | Authenticated | Test code against visible sample test cases synchronously |
| `/` | `POST` | Authenticated | Create official submission & dispatch judging job to queue |
| `/:id` | `GET` | Authenticated | Poll/query status, runtime, and results of a submission |
| `/my` | `GET` | Authenticated | Retrieve authenticated user's submission history |
| `/problem/:id`| `GET` | Authenticated | Retrieve user submissions for a specific problem |
| `/my/stats` | `GET` | Authenticated | Retrieve user acceptance rate & difficulty breakdown |

### ⚔️ 1v1 Battle (`/api/v1/battles`)
| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/matchmake` | `POST` | Authenticated | Enter matchmaking queue |
| `/:id` | `GET` | Authenticated | Fetch active battle session state & participants |

### 🏆 Contests (`/api/v1/contests`)
| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/` | `GET` | Public | Retrieve active, upcoming, and past contests |
| `/:id` | `GET` | Public | Contest details and problem associations |
| `/` | `POST` | **Admin** | Create a new timed contest |
| `/:id/register`| `POST` | Authenticated | Register authenticated user for a contest |
| `/:id/leaderboard`| `GET` | Public | Fetch real-time contest standings and penalties |

### 👥 Users & Leaderboard (`/api/v1/users`)
| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/profile` | `GET` | Authenticated | Current user profile, ratings, and rating history |
| `/leaderboard` | `GET` | Public | Global user rankings sorted by contest/battle ratings |

---

## 🔌 WebSocket Event Specification

CodeForge uses Socket.io with JWT authentication in query parameters (`?token=<JWT>`).

### Client $\rightarrow$ Server Events
| Event | Payload | Description |
|---|---|---|
| `join_lobby` | `{}` | Requests to enter the matchmaking pool |
| `leave_lobby` | `{}` | Cancels matchmaking search |
| `join_battle` | `{ battleId }` | Joins the designated battle room |
| `battle_code_update`| `{ battleId, code }` | Syncs current code length / state |
| `surrender_battle` | `{ battleId }` | Player forfeits the match |

### Server $\rightarrow$ Client Events
| Event | Payload | Description |
|---|---|---|
| `match_found` | `{ battleId, problemId, opponent }` | Notifies that opponent was found; triggers match start |
| `opponent_status` | `{ testsPassed, totalTests, status }` | Live updates on opponent's submission attempts |
| `battle_submission_result` | `{ submissionId, status, passedTests }` | Result of a code submission inside battle |
| `battle_ended` | `{ winner, reason, ratingChanges }` | Battle concluded; reveals final rating deltas |

---

## 💻 Tech Stack Details

```
Frontend:
├── Framework: React 19 (Hooks, Context API, Suspense)
├── Tooling: Vite 6 (HMR, Rollup Bundler)
├── Router: React Router DOM v7 (SPA client-side navigation)
├── HTTP Client: Axios (Interceptors for Bearer token & unified error handling)
├── WebSockets: Socket.io-client
└── Styling: Modular Pure CSS (Glassmorphic dark design, responsive grids)

Backend:
├── Runtime: Node.js (v20+ LTS Bullseye)
├── Server: Express.js 4 (REST architecture)
├── Database ODM: Mongoose 8 (Schema validation, indexes, population)
├── Caching & Queues: IORedis + BullMQ (Exponential backoff retries, Redis TLS)
├── Real-Time: Socket.io 4 (CORS configured, room namespaces)
├── Scheduler: node-cron (Automated background contest finalization)
├── Authentication: jsonwebtoken + bcryptjs
└── Compiler: GCC / g++ (C++17 standard)
```

---

## 📂 Project Directory Structure

```
CodeForge/
├── backend/
│   ├── Dockerfile                       # Production container with g++ & Node.js 20
│   ├── server.js                        # Main HTTP + Socket server bootstrap
│   ├── package.json
│   ├── .env.example                     # Environment template
│   └── src/
│       ├── app.js                       # Express configuration & CORS
│       ├── config/
│       │   ├── database.js              # MongoDB Atlas connection
│       │   ├── redis.js                 # Redis client instance
│       │   └── queue.config.js          # BullMQ TLS Redis connection
│       ├── controllers/                 # REST Route controllers
│       ├── middlewares/
│       │   ├── auth.middleware.js       # JWT validation & Token blacklist check
│       │   └── rateLimiter.middleware.js# Express rate limiters
│       ├── models/                      # Mongoose Schema definitions
│       ├── queues/
│       │   └── submission.queue.js      # BullMQ Queue declaration
│       ├── repositories/                # Database query abstractions
│       ├── routes/                      # API endpoint definitions
│       ├── services/
│       │   ├── auth.service.js
│       │   ├── battleResult.service.js  # Battle resolution & ratings
│       │   ├── contestRatingScheduler.service.js # Auto-rating cron daemon
│       │   ├── judge.service.js         # Core submission orchestrator
│       │   ├── matchmaking.service.js   # 1v1 matchmaking pool
│       │   ├── rating.service.js        # ELO formula implementation
│       │   └── executor/
│       │       ├── code-generator.js    # C++ harness wrapper generator
│       │       ├── cpp.executor.js      # Direct & Docker compilation engine
│       │       └── executor.factory.js  # Executor dispatcher
│       ├── sockets/
│       │   ├── socket.js                # Socket connection handling
│       │   ├── socketManager.js         # Global IO instance accessor
│       │   └── battle.socket.js         # 1v1 Battle event handlers
│       ├── utils/
│       │   └── cache.js                 # Redis cache helper functions
│       └── workers/
│           └── submission.worker.js     # BullMQ async submission processor
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── vercel.json                      # Single Page App routing rewrite rules
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── main.jsx                     # Application entry
│       ├── App.jsx                      # Route definitions
│       ├── components/                  # Reusable Navbar, Modals, Cards
│       ├── context/                     # AuthContext for global session state
│       ├── pages/
│       │   ├── ProblemList.jsx          # Problems browser & search
│       │   ├── ProblemDetail.jsx        # Code Editor, Runner, Submissions
│       │   ├── BattleLobby.jsx          # 1v1 Matchmaking interface
│       │   ├── BattleArena.jsx          # Live duel arena with opponent telemetry
│       │   ├── Contests.jsx             # Active and past contests list
│       │   ├── ContestDetail.jsx        # Contest problems & Live Leaderboard
│       │   ├── Profile.jsx              # User analytics & rating evolution
│       │   ├── Submissions.jsx          # Global submission history
│       │   ├── CreateProblem.jsx        # Admin problem generator
│       │   └── CreateContest.jsx        # Admin contest creator
│       └── services/
│           ├── api.js                   # Configured Axios instance
│           └── socket.js                # Shared Socket.io client instance
└── README.md
```

---

## 🛠️ Local Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local daemon running on `27017` or MongoDB Atlas URI
- **Redis**: Local server running on `6379` or Upstash Redis URL
- **C++ Compiler**: `g++` (GCC) installed and accessible in system `PATH`
- **Docker** *(Optional, for sandboxed execution testing)*

### 1. Clone Repository
```bash
git clone https://github.com/Lovejindal1/CodeForge.git
cd CodeForge
```

### 2. Configure Backend
```bash
cd backend
npm install

# Create environment file
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/codeforge
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

Start the backend server:
```bash
npm start
# Output confirms: MongoDB Connected, Redis Connected, Submission worker started
```

### 3. Configure Frontend
Open a second terminal window:
```bash
cd frontend
npm install

# Local development defaults to http://localhost:3000 automatically
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Description | Example |
|---|---|---|---|
| `PORT` | No | Server listen port (Default: 3000) | `3000` |
| `NODE_ENV` | Yes | App environment (`development` / `production`) | `production` |
| `MONGO_URI` | Yes | MongoDB connection string (Atlas or Local) | `mongodb+srv://...` |
| `REDIS_URL` | Yes | Redis connection URI (supports `rediss://` TLS) | `rediss://default:...@upstash.io:6379` |
| `JWT_SECRET` | Yes | Cryptographic secret for signing tokens | `superSecretKey_123` |
| `JWT_EXPIRES_IN`| Yes | Token expiry duration | `7d` |
| `FRONTEND_URL` | Yes | Allowed CORS origin for production | `https://code-forge-iota-ten.vercel.app` |

### Frontend (`frontend/.env`)
| Variable | Required | Description | Example |
|---|---|---|---|
| `VITE_API_URL` | Yes | Base URL for REST API endpoints | `https://codeforge-backend-10w2.onrender.com/api/v1` |
| `VITE_SOCKET_URL`| Yes | Base URL for WebSocket connection | `https://codeforge-backend-10w2.onrender.com` |

---

## 🚀 Production Deployment

### Backend (Render Cloud with Docker)
1. In Render, create a new **Web Service** pointing to your repository.
2. Select **Docker** as the Environment.
3. Configure:
   - **Root Directory:** `backend`
   - **Dockerfile Path:** `./Dockerfile`
4. Add all Backend Environment Variables in the Render dashboard.

### Frontend (Vercel)
1. In Vercel, import the `CodeForge` repository.
2. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
3. Add Environment Variables:
   - `VITE_API_URL`: `https://<your-render-url>/api/v1`
   - `VITE_SOCKET_URL`: `https://<your-render-url>`
4. Deploy! SPA routing is handled automatically via `frontend/vercel.json`.

---

## 👨‍💻 Author & Acknowledgments

**Love Jindal**
- GitHub: [@Lovejindal1](https://github.com/Lovejindal1)
- Project Repository: [https://github.com/Lovejindal1/CodeForge](https://github.com/Lovejindal1/CodeForge)

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by [Love Jindal](https://github.com/Lovejindal1)

</div>

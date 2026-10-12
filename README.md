<div align="center">

# ⚡ CodeForge

### A Full-Stack Competitive Programming Platform

**Solve Problems · Fight in 1v1 Battles · Join Contests · Climb the Leaderboard**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_Site-2563eb?style=flat&logo=vercel&logoColor=white)](https://code-forge-iota-ten.vercel.app)
&nbsp;
[![Backend API](https://img.shields.io/badge/Backend-Render-059669?style=flat&logo=render&logoColor=white)](https://codeforge-backend-10w2.onrender.com/health)
&nbsp;
[![License](https://img.shields.io/badge/License-MIT-gray?style=flat)](LICENSE)

<br/>

![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-black?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)
![BullMQ](https://img.shields.io/badge/BullMQ-7c3aed?style=flat)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=flat&logo=socketdotio&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-0284c7?style=flat&logo=docker&logoColor=white)

</div>

---

## 📌 What is CodeForge?

**CodeForge** is a competitive programming platform built from scratch — similar to LeetCode and Codeforces. Users can solve algorithmic problems, fight real-time 1v1 coding battles, participate in timed contests, and track their ELO rating progress over time.

The project is **fully deployed and live:**
- **Frontend:** Vercel → [code-forge-iota-ten.vercel.app](https://code-forge-iota-ten.vercel.app)
- **Backend:** Render (Dockerized) → [codeforge-backend-10w2.onrender.com](https://codeforge-backend-10w2.onrender.com)

> ⚠️ Backend is on Render's free tier — it may take ~20–30s to wake up on first request.

---

## ✨ Features

### 🧩 Problem Solving
- Browse problems filtered by difficulty: **Easy**, **Medium**, **Hard**
- Built-in **C++ code editor** with line numbers and tab support
- **Run Code** — test against visible sample cases instantly (no DB save)
- **Submit** — runs code against all hidden test cases via a background queue
- Verdicts: `Accepted`, `Wrong Answer`, `Compile Error`, `Runtime Error`, `Time Limit Exceeded`
- Full submission history with runtime and memory stats per submission

### ⚔️ 1v1 Battle Arena
- Enter a **matchmaking lobby** — get auto-paired with another online user
- Both players receive the **same problem** at the same time
- First to get `Accepted` on all test cases wins the battle
- Live opponent progress updates via **WebSockets** (tests passed, verdict, etc.)
- Battle **ELO rating** updates automatically after every match

```
Player 1 ──[ Matchmaking ]──► CodeForge Server ◄──[ Matchmaking ]── Player 2
                                    │
                         Creates 1v1 Battle Room
                                    │
               Both solve simultaneously ──► First to AC wins!
```

### 🏆 Contests
- Join scheduled **timed programming contests**
- Multiple problems per contest
- **Live leaderboard** — ICPC-style scoring (problems solved + time penalty)
- Rating gets automatically calculated by a **background cron job** once the contest ends

### 📊 Rating System
- Two separate ratings: **Contest Rating** and **Battle Rating**
- Both start at **1200** and change based on performance
- Full rating history stored for each user — tracked over time

### 🔐 Authentication & Security
- JWT-based login/logout with **Redis token blacklisting** (tokens are immediately invalidated on logout)
- Passwords hashed using **bcryptjs**
- API rate limiting to prevent abuse
- Code execution with **timeout limits and memory caps**

### 🛡️ Admin Panel
- Create, edit, and delete problems
- Add/remove test cases (visible or hidden)
- Create and schedule contests

---

## 🏗️ How It Works — Architecture

```
┌──────────────────────────────────┐
│     Browser (React + Vite)       │
│   Hosted on Vercel (Global CDN)  │
└──────────────┬───────────────────┘
               │  HTTP REST + WebSocket
┌──────────────▼───────────────────────────────────────────┐
│             Express.js Backend (Node.js 20)              │
│           Running in Docker on Render Cloud              │
│                                                          │
│  ┌─────────────┐   ┌──────────────┐   ┌───────────────┐  │
│  │  REST APIs  │   │  Socket.io   │   │    BullMQ     │  │
│  │ (Auth, Sub, │   │  (Battles,   │   │  (Job Queue   │  │
│  │  Contest..) │   │  Matchmaking)│   │  for judging) │  │
│  └──────┬──────┘   └──────────────┘   └───────┬───────┘  │
│         │                                     │          │
│  ┌──────▼─────────────────────────────────────▼───────┐  │
│  │               Judge Service                        │  │
│  │  1. Wrap user code in a complete C++ program        │  │
│  │  2. Compile with g++                               │  │
│  │  3. Run against each test case, capture output     │  │
│  │  4. Compare output vs expected → give verdict      │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────┬────────────────────┬──────────────┘
                       │                    │
         ┌─────────────▼──────┐   ┌─────────▼──────────────┐
         │  MongoDB Atlas     │   │  Upstash Redis         │
         │  - Users           │   │  - BullMQ job queue    │
         │  - Problems        │   │  - Blacklisted tokens  │
         │  - Submissions     │   │  - Rate limit counters │
         │  - Contests        │   └────────────────────────┘
         │  - Battles         │
         └────────────────────┘
```

---

## ⚙️ Code Execution Engine

This is the core of the platform. When a user submits C++ code, it can't just be run directly — it needs a proper `main()` with input reading and output printing. Here's how it works:

```
Step 1 — Code Wrapping
  User writes a Solution class → system wraps it in a complete C++ program
  with input parsing (int, vector<int>, string, etc.) and a main() function

Step 2 — Compilation
  g++ -O1 main.cpp -o main
  If compilation fails → returns Compile Error with the g++ output

Step 3 — Test Case Execution
  For each test case: ./main < input.txt
  5 second timeout per test case
  Captures stdout, stderr, and execution time

Step 4 — Verdict
  Compare actual output vs expected output (after trimming whitespace)
  → Accepted / Wrong Answer / TLE / Runtime Error
```

**Two execution modes:**
- **Docker mode** (local/self-hosted): Runs in isolated containers with `--network none`, memory limit 128MB, CPU limit 0.5 cores
- **Direct mode** (Render cloud): Runs `g++` natively inside a temp directory, cleaned up automatically

---

## 🗄️ Database Schema

### Entity Relationships

```mermaid
erDiagram
    User ||--o{ Submission : submits
    User ||--o{ Battle : competes_in
    User ||--o{ Contest : registers_for
    Problem ||--o{ TestCase : contains
    Problem ||--o{ Submission : evaluated_on
    Contest ||--o{ Problem : includes
    Battle ||--|| Problem : plays_on
    Battle ||--o| User : winner
```

### Collections Overview

#### 👤 `users`
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique User ID |
| `name` | String | Display name |
| `email` | String | Unique email address |
| `password` | String | Hashed password (`bcryptjs`) |
| `role` | String | `'user'` or `'admin'` |
| `contestRating` | Number | Contest rating (starts at `1200`) |
| `battleRating` | Number | 1v1 Battle rating (starts at `1200`) |
| `ratingHistory` | Array | Audit log of rating changes with timestamps |

#### 🧩 `problems`
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique Problem ID |
| `problemNumber`| Number | Unique incremental problem number |
| `title` | String | Problem title |
| `description` | String | Problem statement, input/output formats & constraints |
| `difficulty` | String | `'Easy'` \| `'Medium'` \| `'Hard'` |
| `functionName` | String | Target function name inside `Solution` class |
| `starterCode` | String | Boilerplate code template shown in editor |
| `judgeConfig` | Object | `{ returnType: String, parameters: [{ name, type }] }` |

#### 🧪 `testcases`
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique Test Case ID |
| `problem` | ObjectId | Ref $\rightarrow$ `problems` |
| `input` | String | Raw input fed via `stdin` |
| `expectedOutput`| String | Expected output checked against `stdout` |
| `isHidden` | Boolean | `false` = visible sample test case, `true` = hidden judge case |

#### ⚡ `submissions`
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique Submission ID |
| `user` | ObjectId | Ref $\rightarrow$ `users` |
| `problem` | ObjectId | Ref $\rightarrow$ `problems` |
| `code` | String | Submitted C++ source code |
| `language` | String | `'cpp'` |
| `status` | String | `'pending'` \| `'accepted'` \| `'wrong_answer'` \| `'compile_error'` \| `'runtime_error'` \| `'time_limit_exceeded'` |
| `passedTests` | Number | Number of test cases passed |
| `totalTests` | Number | Total test cases evaluated |
| `runtime` | Number | Execution time in milliseconds |
| `memory` | Number | Peak memory usage in KB |
| `error` | String | Compiler or runtime error message (if any) |
| `battle` | ObjectId | Ref $\rightarrow$ `battles` (null if practice submission) |

#### 🏆 `contests`
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique Contest ID |
| `title` | String | Contest title & theme |
| `description` | String | Rules and guidelines |
| `startTime` | Date | Contest start timestamp |
| `endTime` | Date | Contest end timestamp |
| `problems` | [ObjectId] | Array of Problem references |
| `participants` | [ObjectId] | Array of registered User references |
| `finalLeaderboard`| Array | Final ranks, scores, and penalty times |

#### ⚔️ `battles`
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique Battle ID |
| `player1` | Object | `{ user: Ref, rating: Number, currentCode: String }` |
| `player2` | Object | `{ user: Ref, rating: Number, currentCode: String }` |
| `problem` | ObjectId | Ref $\rightarrow$ `problems` assigned to both players |
| `winner` | ObjectId | Ref $\rightarrow$ `users` (null if tied or in progress) |
| `status` | String | `'waiting'` \| `'in_progress'` \| `'finished'` |
| `duration` | Number | Match duration limit (default: `15` minutes) |
| `endReason` | String | `'accepted'` \| `'timeout'` \| `'surrender'` |

---

## 📡 API Reference

All endpoints are prefixed with `/api/v1`.

### Auth (`/auth`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Create a new account |
| `POST` | `/login` | Public | Login and get JWT token |
| `POST` | `/logout` | User | Invalidate current token |

### Problems (`/problems`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Public | Get all problems (filter, paginate, search) |
| `GET` | `/:id` | Public | Get a single problem |
| `POST` | `/` | Admin | Create a problem |
| `PUT` | `/:id` | Admin | Update a problem |
| `DELETE` | `/:id` | Admin | Delete a problem |

### Submissions (`/submissions`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/run` | User | Run code on sample test cases (no DB save) |
| `POST` | `/` | User | Submit code for full judging (queued async) |
| `GET` | `/:id` | User | Check submission result |
| `GET` | `/my` | User | My submission history |
| `GET` | `/problem/:id` | User | My submissions for a specific problem |
| `GET` | `/my/stats` | User | My acceptance rate and stats |

### Battles (`/battles`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/matchmake` | User | Join matchmaking pool |
| `GET` | `/:id` | User | Get current battle info |

### Contests (`/contests`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Public | Get all contests |
| `GET` | `/:id` | Public | Get contest details |
| `POST` | `/` | Admin | Create a contest |
| `POST` | `/:id/register` | User | Register for a contest |
| `GET` | `/:id/leaderboard` | Public | Live leaderboard |

### Users (`/users`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/profile` | User | My profile and rating history |
| `GET` | `/leaderboard` | Public | Global rankings |

---

## 🔌 WebSocket Events (Socket.io)

Socket connects with JWT: `io(SERVER_URL, { query: { token } })`

**Events you send (Client → Server):**
| Event | Payload | What it does |
|---|---|---|
| `join_lobby` | — | Enter matchmaking |
| `leave_lobby` | — | Cancel matchmaking |
| `join_battle` | `{ battleId }` | Join battle room |
| `battle_code_update` | `{ battleId, code }` | Sync code state |
| `surrender_battle` | `{ battleId }` | Forfeit the match |

**Events you receive (Server → Client):**
| Event | Payload | What it means |
|---|---|---|
| `match_found` | `{ battleId, problem, opponent }` | Opponent found, battle starting |
| `opponent_status` | `{ testsPassed, totalTests, status }` | Opponent progress update |
| `battle_submission_result` | `{ status, passedTests }` | Your submission judged |
| `battle_ended` | `{ winner, reason, ratingChanges }` | Match is over |

---

## 📂 Project Structure

```
CodeForge/
├── backend/
│   ├── Dockerfile                    # Node.js 20 + g++ for Render deployment
│   ├── server.js                     # App entry — HTTP server + Socket.io setup
│   └── src/
│       ├── app.js                    # Express app, middleware, routes
│       ├── config/
│       │   ├── database.js           # MongoDB connection
│       │   ├── redis.js              # Redis client
│       │   └── queue.config.js       # BullMQ Redis connection (with TLS)
│       ├── controllers/              # Request handlers
│       ├── middlewares/
│       │   ├── auth.middleware.js    # JWT verification + blacklist check
│       │   └── rateLimiter.middleware.js
│       ├── models/                   # Mongoose schemas
│       ├── queues/
│       │   └── submission.queue.js   # BullMQ queue setup
│       ├── repositories/             # DB query functions
│       ├── routes/                   # API route definitions
│       ├── services/
│       │   ├── judge.service.js      # Core judging logic
│       │   ├── matchmaking.service.js
│       │   ├── battleResult.service.js
│       │   ├── rating.service.js     # ELO calculations
│       │   ├── contestRatingScheduler.service.js  # Cron job for auto-rating
│       │   └── executor/
│       │       ├── code-generator.js # Wraps user code into a full C++ program
│       │       ├── cpp.executor.js   # Compiles and runs code (Docker or direct)
│       │       └── executor.factory.js
│       ├── sockets/
│       │   ├── socket.js             # Socket.io connection setup
│       │   ├── socketManager.js      # Global io() instance
│       │   └── battle.socket.js      # Battle room event handlers
│       ├── utils/
│       │   └── cache.js              # Redis helper functions
│       └── workers/
│           └── submission.worker.js  # BullMQ worker — processes judge jobs
│
├── frontend/
│   ├── vercel.json                   # SPA routing fix for Vercel
│   └── src/
│       ├── App.jsx                   # Routes
│       ├── components/               # Navbar, Cards, Modals
│       ├── context/                  # Auth context (global user state)
│       ├── pages/
│       │   ├── ProblemList.jsx       # Problem browser
│       │   ├── ProblemDetail.jsx     # Editor + Run/Submit + Submission history
│       │   ├── BattleLobby.jsx       # Matchmaking UI
│       │   ├── BattleArena.jsx       # Live 1v1 battle screen
│       │   ├── Contests.jsx          # Contest list
│       │   ├── ContestDetail.jsx     # Contest problems + leaderboard
│       │   ├── Profile.jsx           # User stats + rating chart
│       │   ├── Submissions.jsx       # All submissions view
│       │   ├── CreateProblem.jsx     # Admin: add problem
│       │   └── CreateContest.jsx     # Admin: add contest
│       └── services/
│           ├── api.js                # Axios instance with auth interceptor
│           └── socket.js             # Shared socket.io client
└── README.md
```

---

## 🛠️ Running Locally

### Requirements
- Node.js v18+
- MongoDB (local or Atlas URI)
- Redis (local or Upstash URL)
- `g++` compiler installed (`sudo apt install g++` on Linux / MinGW on Windows)

### 1. Clone the Repo
```bash
git clone https://github.com/Lovejindal1/CodeForge.git
cd CodeForge
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env   # Fill in your values
npm start
```

Backend runs at `http://localhost:3000`

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## 🔐 Environment Variables

### `backend/.env`
| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Port to run on (default: 3000) |
| `NODE_ENV` | Yes | `development` or `production` |
| `MONGO_URI` | Yes | MongoDB connection string |
| `REDIS_URL` | Yes | Redis URL (use `rediss://` for TLS) |
| `JWT_SECRET` | Yes | Secret key for signing tokens |
| `JWT_EXPIRES_IN` | Yes | Token expiry e.g. `7d` |
| `FRONTEND_URL` | Yes | Allowed CORS origin |

### `frontend/.env`
| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Backend REST API base URL |
| `VITE_SOCKET_URL` | Yes | Backend WebSocket URL |

---

## 🚀 Cloud Deployment Guide

CodeForge is built on a modern, decoupled cloud architecture using 5 free-tier services:

```
[Vercel]                 ──► Frontend (React + Vite SPA)
[Render]                 ──► Backend API & Judge (Docker with g++)
[MongoDB Atlas]          ──► Primary Database (M0 Cloud Cluster)
[Upstash Redis]          ──► Task Queue & Cache (Serverless Redis TLS)
[UptimeRobot]            ──► 24/7 Keep-Alive Heartbeat (/health pinger)
```

---

### Step 1: Database Setup (MongoDB Atlas)
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free **M0 Cluster**.
2. **Network Access**: Add IP `0.0.0.0/0` (Allow access from anywhere, required for cloud hosting).
3. **Database Access**: Create a database user with Read/Write privileges.
4. **Connection String**: Click *Connect* $\rightarrow$ *Drivers* $\rightarrow$ Copy the URI:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/codeforge?retryWrites=true&w=majority
   ```

---

### Step 2: Queue & Cache Setup (Upstash Redis)
1. Sign up at [Upstash Redis](https://upstash.com) and create a free database.
2. Select the cloud region closest to your Render server region.
3. In the database dashboard, copy the **`rediss://`** connection string (TLS enabled).
4. *Usage in CodeForge:*
   - **BullMQ**: Powers the asynchronous submission judging worker queue.
   - **Token Blacklist**: Instantly invalidates JWTs on logout.
   - **Rate Limiting**: Throttles brute-force API requests.

---

### Step 3: Backend Deployment (Render with Docker)
1. Sign up at [Render](https://render.com) and click **New +** $\rightarrow$ **Web Service**.
2. Connect your GitHub repository: `https://github.com/Lovejindal1/CodeForge`.
3. Configure the service:
   - **Name**: `codeforge-backend`
   - **Runtime / Environment**: `Docker`
   - **Root Directory**: `backend`
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**: `Free`
4. Add **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=3000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/codeforge
   REDIS_URL=rediss://default:xxxxxx@xxxxxx.upstash.io:6379
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://code-forge-iota-ten.vercel.app
   ```
5. Click **Create Web Service**. Render builds the Docker image (`node:20-bullseye-slim` with `g++`) and starts the server.

---

### Step 4: Frontend Deployment (Vercel)
1. Sign up at [Vercel](https://vercel.com) and click **Add New** $\rightarrow$ **Project**.
2. Import the `CodeForge` repository.
3. Configure project settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
4. Add **Environment Variables**:
   ```env
   VITE_API_URL=https://<your-render-backend-url>/api/v1
   VITE_SOCKET_URL=https://<your-render-backend-url>
   ```
5. Click **Deploy**.
   > *Note:* Single Page Application (SPA) routing is pre-configured via [`frontend/vercel.json`](file:///e:/backend_code/CodeForge/frontend/vercel.json) to prevent 404 errors on page refreshes.

---

### Step 5: 24/7 Keep-Alive Monitor (UptimeRobot)
Render's free tier automatically spins down web services after 15 minutes of inactivity, resulting in a ~30–40s cold start when a user visits. To prevent this:

1. Sign up for free at [UptimeRobot](https://uptimerobot.com).
2. Click **Add New Monitor**:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `CodeForge Backend Keep-Alive`
   - **URL (or IP)**: `https://<your-render-backend-url>/health`
   - **Monitoring Interval**: `Every 5 minutes`
3. Save monitor. UptimeRobot now pings the `/health` endpoint every 5 minutes, keeping the backend warm 24/7 with **zero cold start delays**.

---

Further improvements 

1) Multi user platform
2) integrate different platforms like leetcode,codeforces,codechef etc....
3) manage individual profiles with their current ranking in each and live contest update
4) Ai chatbot that will assist you with solving the problems
5) 

## 👨‍💻 Author

**Kinnari & Aditi**
- GitHub: [@Lovejindal1](https://github.com/Lovejindal1)
- Live Project: [code-forge-iota-ten.vercel.app](https://code-forge-iota-ten.vercel.app)

---



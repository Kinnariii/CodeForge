import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getAllContests, joinContest } from "../services/contestService";
import { useAuth } from "../context/AuthContext";
import "./Contests.css";

function Contests() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [joiningId, setJoiningId] = useState(null);
  const [joinMessage, setJoinMessage] = useState({ id: null, text: "", type: "" });
  const [now, setNow] = useState(new Date());

  // Update clock every second for live countdowns
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchContests = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAllContests();
      setContests(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load contests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, []);

  const handleJoin = async (contestId) => {
    setJoiningId(contestId);
    setJoinMessage({ id: contestId, text: "", type: "" });
    try {
      await joinContest(contestId);
      setJoinMessage({
        id: contestId,
        text: "Successfully registered for contest! 🎉",
        type: "success"
      });
      // Refresh list to update participants
      fetchContests();
    } catch (err) {
      setJoinMessage({
        id: contestId,
        text: err.response?.data?.message || "Failed to join contest.",
        type: "error"
      });
    } finally {
      setJoiningId(null);
    }
  };

  const getContestStatus = (startStr, endStr) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (now < start) return "upcoming";
    if (now >= start && now < end) return "running";
    return "ended";
  };

  const formatCountdown = (targetDate) => {
    const diff = new Date(targetDate) - now;
    if (diff <= 0) return "00:00:00";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatDuration = (startStr, endStr) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffMins = Math.round((end - start) / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const sortedContests = [...contests].sort((a, b) => {
    const statusA = getContestStatus(a.startTime, a.endTime);
    const statusB = getContestStatus(b.startTime, b.endTime);

    const priority = { running: 1, upcoming: 2, ended: 3 };
    if (priority[statusA] !== priority[statusB]) {
      return priority[statusA] - priority[statusB];
    }

    // If both upcoming: closest starting time first (startTime ASC)
    if (statusA === "upcoming") {
      return new Date(a.startTime) - new Date(b.startTime);
    }

    // If both running: closest ending time first (endTime ASC)
    if (statusA === "running") {
      return new Date(a.endTime) - new Date(b.endTime);
    }

    // If both ended: most recently ended first (endTime DESC)
    return new Date(b.endTime) - new Date(a.endTime);
  });

  const filteredContests = sortedContests.filter((c) => {
    const status = getContestStatus(c.startTime, c.endTime);
    if (activeTab === "running") return status === "running";
    if (activeTab === "upcoming") return status === "upcoming";
    if (activeTab === "ended") return status === "ended";
    return true;
  });

  const runningCount = contests.filter(
    (c) => getContestStatus(c.startTime, c.endTime) === "running"
  ).length;
  const upcomingCount = contests.filter(
    (c) => getContestStatus(c.startTime, c.endTime) === "upcoming"
  ).length;
  const endedCount = contests.filter(
    (c) => getContestStatus(c.startTime, c.endTime) === "ended"
  ).length;

  return (
    <div className="contests-page">
      <Navbar />

      <main className="contests-main">
        {/* HERO SECTION */}
        <section className="contests-hero">
          <div className="hero-badge">
            <span className="live-dot" />
            Competitive Arena
          </div>
          <h1 className="hero-title">
            CodeForge <span className="gradient-text">Contests</span>
          </h1>
          <p className="hero-subtitle">
            Compete in rated coding rounds, climb the global leaderboard, and prove your algorithmic prowess in real-time.
          </p>
        </section>

        {/* TABS FILTER */}
        <div className="contests-controls">
          <div className="contest-tabs">
            <button
              className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All Contests <span className="tab-pill">{contests.length}</span>
            </button>
            <button
              className={`tab-btn ${activeTab === "running" ? "active" : ""}`}
              onClick={() => setActiveTab("running")}
            >
              {runningCount > 0 && <span className="live-ping" />}
              Running <span className="tab-pill">{runningCount}</span>
            </button>
            <button
              className={`tab-btn ${activeTab === "upcoming" ? "active" : ""}`}
              onClick={() => setActiveTab("upcoming")}
            >
              Upcoming <span className="tab-pill">{upcomingCount}</span>
            </button>
            <button
              className={`tab-btn ${activeTab === "ended" ? "active" : ""}`}
              onClick={() => setActiveTab("ended")}
            >
              Ended <span className="tab-pill">{endedCount}</span>
            </button>
          </div>

          <div className="controls-right">
            {user?.role === "admin" && (
              <button
                className="btn-create-contest-nav"
                onClick={() => navigate("/contests/create")}
              >
                + Create Contest
              </button>
            )}

            <button className="refresh-btn" onClick={fetchContests} title="Refresh Contests">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          </div>
        </div>

        {/* ERROR / LOADING */}
        {loading && (
          <div className="contests-loading">
            <div className="spinner" />
            <p>Loading contests...</p>
          </div>
        )}

        {error && (
          <div className="contests-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>{error}</p>
            <button onClick={fetchContests}>Retry</button>
          </div>
        )}

        {/* CONTESTS LIST */}
        {!loading && !error && (
          <div className="contests-grid">
            {filteredContests.length === 0 ? (
              <div className="empty-contests">
                <div className="empty-icon">🏆</div>
                <h3>No Contests Found</h3>
                <p>There are no contests in this category right now.</p>
              </div>
            ) : (
              filteredContests.map((contest) => {
                const status = getContestStatus(contest.startTime, contest.endTime);
                const isJoined = contest.participants?.some(
                  (p) => (p._id || p).toString() === (user?.id || user?._id)?.toString()
                );
                const participantCount = contest.participants?.length || 0;
                const problemCount = contest.problems?.length || 0;

                return (
                  <div key={contest._id} className={`contest-card status-${status}`}>
                    <div className="card-top">
                      <div className={`status-pill ${status}`}>
                        {status === "running" && <span className="pulse-indicator" />}
                        {status.toUpperCase()}
                      </div>
                      <span className="duration-pill">
                        ⏱️ {formatDuration(contest.startTime, contest.endTime)}
                      </span>
                    </div>

                    <h3 className="contest-title" onClick={() => navigate(`/contests/${contest._id}`)}>
                      {contest.title}
                    </h3>
                    <p className="contest-desc">{contest.description}</p>

                    <div className="contest-meta">
                      <div className="meta-item">
                        <span className="meta-label">Start Time</span>
                        <span className="meta-val">
                          {new Date(contest.startTime).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Participants</span>
                        <span className="meta-val">👥 {participantCount}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Problems</span>
                        <span className="meta-val">
                          🧩 {status === "upcoming" ? "Masked" : `${problemCount} Problems`}
                        </span>
                      </div>
                    </div>

                    {/* LIVE COUNTDOWN TIMER */}
                    {status === "running" && (
                      <div className="countdown-box running">
                        <span className="timer-label">Ends in</span>
                        <span className="timer-digits">{formatCountdown(contest.endTime)}</span>
                      </div>
                    )}

                    {status === "upcoming" && (
                      <div className="countdown-box upcoming">
                        <span className="timer-label">Starts in</span>
                        <span className="timer-digits">{formatCountdown(contest.startTime)}</span>
                      </div>
                    )}

                    {/* JOIN FEEDBACK MESSAGE */}
                    {joinMessage.id === contest._id && (
                      <div className={`join-feedback ${joinMessage.type}`}>
                        {joinMessage.text}
                      </div>
                    )}

                    {/* ACTIONS */}
                    <div className="card-actions">
                      {status === "upcoming" && (
                        <>
                          {isJoined ? (
                            <button className="btn-registered" disabled>
                              ✓ Registered
                            </button>
                          ) : (
                            <button
                              className="btn-join"
                              onClick={() => handleJoin(contest._id)}
                              disabled={joiningId === contest._id}
                            >
                              {joiningId === contest._id ? "Registering..." : "Register Now"}
                            </button>
                          )}
                          <button
                            className="btn-details"
                            onClick={() => navigate(`/contests/${contest._id}`)}
                          >
                            Details
                          </button>
                        </>
                      )}

                      {status === "running" && (
                        <button
                          className="btn-enter"
                          onClick={() => navigate(`/contests/${contest._id}`)}
                        >
                          {isJoined ? "Enter Arena 🚀" : "View Live Contest 🔴"}
                        </button>
                      )}

                      {status === "ended" && (
                        <button
                          className="btn-results"
                          onClick={() => navigate(`/contests/${contest._id}`)}
                        >
                          View Results & Leaderboard 🏆
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default Contests;

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  getContestById,
  getContestProblems,
  getContestLeaderboard,
  joinContest
} from "../services/contestService";
import { useAuth } from "../context/AuthContext";
import "./ContestDetail.css";

function ContestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("problems"); // "problems" | "leaderboard" | "rules"
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState({ text: "", type: "" });
  const [now, setNow] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchContestData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getContestById(id);
      const contestData = res.data.data;
      setContest(contestData);

      // If contestData already has populated problems, use them
      if (contestData.problems && contestData.problems.length > 0 && typeof contestData.problems[0] === "object" && contestData.problems[0].title) {
        setProblems(contestData.problems);
      } else {
        // Otherwise fetch via getContestProblems
        try {
          const probRes = await getContestProblems(id);
          setProblems(probRes.data.data || []);
        } catch (err) {
          setProblems([]);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load contest.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const res = await getContestLeaderboard(id);
      setLeaderboard(res.data.data || []);
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    fetchContestData();
    fetchLeaderboard();
  }, [id]);

  // Periodic leaderboard poll if running
  useEffect(() => {
    if (!contest) return;
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);
    const isRunning = now >= start && now < end;

    if (isRunning && activeTab === "leaderboard") {
      const interval = setInterval(() => {
        fetchLeaderboard();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [contest, activeTab, now]);

  const handleJoin = async () => {
    setJoining(true);
    setJoinMsg({ text: "", type: "" });
    try {
      await joinContest(id);
      setJoinMsg({ text: "Successfully registered for contest! 🎉", type: "success" });
      fetchContestData();
    } catch (err) {
      setJoinMsg({
        text: err.response?.data?.message || "Failed to register.",
        type: "error"
      });
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="contest-detail-page">
        <Navbar />
        <div className="cd-loading">
          <div className="spinner" />
          <p>Loading contest details...</p>
        </div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="contest-detail-page">
        <Navbar />
        <div className="cd-error">
          <h3>Contest Not Found</h3>
          <p>{error || "We couldn't find the contest you're looking for."}</p>
          <button onClick={() => navigate("/contests")}>← Back to Contests</button>
        </div>
      </div>
    );
  }

  const start = new Date(contest.startTime);
  const end = new Date(contest.endTime);
  const status = now < start ? "upcoming" : now < end ? "running" : "ended";

  const isJoined = contest.participants?.some(
    (p) => (p._id || p).toString() === (user?.id || user?._id)?.toString()
  );

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

  const getRankBadge = (rank) => {
    if (rank === 1) return <span className="rank-badge gold">🥇 1</span>;
    if (rank === 2) return <span className="rank-badge silver">🥈 2</span>;
    if (rank === 3) return <span className="rank-badge bronze">🥉 3</span>;
    return <span className="rank-badge normal">#{rank}</span>;
  };

  return (
    <div className="contest-detail-page">
      <Navbar />

      <main className="cd-main">
        {/* HEADER BAR */}
        <div className="cd-header">
          <button className="back-link" onClick={() => navigate("/contests")}>
            ← All Contests
          </button>

          <div className="cd-header-content">
            <div className="cd-title-row">
              <div className="title-left">
                <span className={`status-pill ${status}`}>
                  {status === "running" && <span className="pulse-indicator" />}
                  {status.toUpperCase()}
                </span>
                <h1 className="cd-title">{contest.title}</h1>
              </div>

              {/* COUNTDOWN CLOCK */}
              {status === "running" && (
                <div className="cd-timer running">
                  <span className="timer-text">Contest Ends In</span>
                  <span className="timer-val">{formatCountdown(contest.endTime)}</span>
                </div>
              )}
              {status === "upcoming" && (
                <div className="cd-timer upcoming">
                  <span className="timer-text">Starts In</span>
                  <span className="timer-val">{formatCountdown(contest.startTime)}</span>
                </div>
              )}
              {status === "ended" && (
                <div className="cd-timer ended">
                  <span className="timer-text">Status</span>
                  <span className="timer-val">CONTEST CONCLUDED</span>
                </div>
              )}
            </div>

            <p className="cd-desc">{contest.description}</p>

            <div className="cd-meta-row">
              <div className="cd-meta-item">
                <span className="meta-icon">📅</span>
                <div>
                  <span className="meta-sub">Start</span>
                  <strong>{start.toLocaleString()}</strong>
                </div>
              </div>
              <div className="cd-meta-item">
                <span className="meta-icon">🏁</span>
                <div>
                  <span className="meta-sub">End</span>
                  <strong>{end.toLocaleString()}</strong>
                </div>
              </div>
              <div className="cd-meta-item">
                <span className="meta-icon">👥</span>
                <div>
                  <span className="meta-sub">Participants</span>
                  <strong>{contest.participants?.length || 0} Joined</strong>
                </div>
              </div>

              {/* ACTION BTN IN HEADER */}
              {status === "upcoming" && !isJoined && (
                <div className="header-action">
                  <button
                    className="btn-header-join"
                    onClick={handleJoin}
                    disabled={joining}
                  >
                    {joining ? "Registering..." : "Register for Contest"}
                  </button>
                </div>
              )}
              {status === "upcoming" && isJoined && (
                <div className="header-action">
                  <span className="joined-tag">✓ You are registered</span>
                </div>
              )}
            </div>

            {joinMsg.text && (
              <div className={`join-alert ${joinMsg.type}`}>{joinMsg.text}</div>
            )}
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="cd-tabs">
          <button
            className={`cd-tab ${activeTab === "problems" ? "active" : ""}`}
            onClick={() => setActiveTab("problems")}
          >
            🧩 Problems ({problems.length || (contest.problems?.length || 0)})
          </button>
          <button
            className={`cd-tab ${activeTab === "leaderboard" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("leaderboard");
              fetchLeaderboard();
            }}
          >
            🏆 Live Leaderboard ({leaderboard.length})
          </button>
          <button
            className={`cd-tab ${activeTab === "rules" ? "active" : ""}`}
            onClick={() => setActiveTab("rules")}
          >
            📜 Rules & Scoring
          </button>
        </div>

        {/* TAB 1: PROBLEMS */}
        {activeTab === "problems" && (
          <div className="cd-tab-content">
            {status === "upcoming" ? (
              <div className="cd-notice-box">
                <div className="notice-icon">🔒</div>
                <h3>Problems are Locked</h3>
                <p>
                  Problems will be revealed automatically when the contest starts at{" "}
                  <strong>{start.toLocaleTimeString()}</strong>.
                </p>
                {!isJoined && (
                  <button className="btn-join-notice" onClick={handleJoin} disabled={joining}>
                    {joining ? "Registering..." : "Register Now to Compete"}
                  </button>
                )}
              </div>
            ) : !isJoined && status === "running" ? (
              <div className="cd-notice-box">
                <div className="notice-icon">⚠️</div>
                <h3>Contest in Progress</h3>
                <p>You did not register for this contest before start time. You can still watch the live leaderboard!</p>
                <button className="btn-join-notice" onClick={() => setActiveTab("leaderboard")}>
                  View Live Leaderboard 🏆
                </button>
              </div>
            ) : problems.length === 0 ? (
              <div className="cd-notice-box">
                <p>No problems found for this contest.</p>
              </div>
            ) : (
              <div className="problems-table-container">
                <table className="problems-table">
                  <thead>
                    <tr>
                      <th style={{ width: "60px" }}>#</th>
                      <th>Title</th>
                      <th style={{ width: "110px" }}>Status</th>
                      <th style={{ width: "120px" }}>Difficulty</th>
                      <th style={{ width: "130px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.map((prob, idx) => {
                      const letter = String.fromCharCode(65 + idx); // A, B, C, D
                      const probId = (prob._id || prob).toString();
                      const title = prob.title || `Problem ${letter}`;
                      const difficulty = prob.difficulty || "medium";

                      const currentUserEntry = leaderboard.find(
                        (entry) =>
                          (entry.user?._id || entry.user)?.toString() ===
                          (user?.id || user?._id)?.toString()
                      );
                      const pStatus = currentUserEntry?.problemStatus?.[probId];
                      const isSolved = pStatus?.solved;
                      const attempts = pStatus?.attempts || 0;

                      return (
                        <tr key={probId} className={`problem-row ${isSolved ? "solved-row" : ""}`}>
                          <td>
                            <span className="prob-letter">{letter}</span>
                          </td>
                          <td>
                            <div
                              className="prob-title"
                              onClick={() => navigate(`/problems/${probId}?contestId=${id}`)}
                            >
                              {title}
                            </div>
                          </td>
                          <td>
                            {isSolved ? (
                              <span className="prob-status-badge solved">✓ Solved</span>
                            ) : attempts > 0 ? (
                              <span className="prob-status-badge attempted">{attempts} Failed</span>
                            ) : (
                              <span className="prob-status-badge untouched">—</span>
                            )}
                          </td>
                          <td>
                            <span className={`diff-tag diff-${difficulty.toLowerCase()}`}>
                              {difficulty}
                            </span>
                          </td>
                          <td>
                            <button
                              className={`btn-solve ${isSolved ? "btn-solved" : ""}`}
                              onClick={() => navigate(`/problems/${probId}?contestId=${id}`)}
                            >
                              {isSolved ? "Solved ➔" : "Solve ➔"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LEADERBOARD */}
        {activeTab === "leaderboard" && (
          <div className="cd-tab-content">
            <div className="leaderboard-header-bar">
              <div>
                <h3 className="lb-heading">ACM-ICPC Standings</h3>
                <p className="lb-sub">
                  Ranked by Problems Solved (Desc) ➔ Total Penalty (Asc).
                </p>
              </div>
              <button
                className="btn-refresh-lb"
                onClick={fetchLeaderboard}
                disabled={leaderboardLoading}
              >
                {leaderboardLoading ? "Updating..." : "🔄 Refresh"}
              </button>
            </div>

            {leaderboardLoading && leaderboard.length === 0 ? (
              <div className="cd-loading">
                <div className="spinner" />
                <p>Fetching latest standings...</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="cd-notice-box">
                <div className="notice-icon">📊</div>
                <h3>No Submissions Yet</h3>
                <p>Be the first participant to solve a problem and take the #1 spot!</p>
              </div>
            ) : (
              <div className="leaderboard-table-container">
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th style={{ width: "80px" }}>Rank</th>
                      <th>Participant</th>
                      <th style={{ width: "90px", textAlign: "center" }}>Solved</th>
                      <th style={{ width: "110px", textAlign: "center" }}>Penalty</th>
                      {problems.map((_, idx) => (
                        <th key={idx} style={{ textAlign: "center", width: "90px" }}>
                          {String.fromCharCode(65 + idx)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry) => {
                      const isCurrentUser =
                        (entry.user?._id || entry.user)?.toString() ===
                        (user?.id || user?._id)?.toString();

                      return (
                        <tr
                          key={entry.user?._id || entry.rank}
                          className={`lb-row ${isCurrentUser ? "current-user-row" : ""}`}
                        >
                          <td>{getRankBadge(entry.rank)}</td>
                          <td>
                            <div className="lb-user">
                              <div className="lb-avatar">
                                {entry.user?.name?.charAt(0).toUpperCase() || "U"}
                              </div>
                              <span className="lb-name">
                                {entry.user?.name || "Anonymous"}
                                {isCurrentUser && <span className="you-pill">YOU</span>}
                              </span>
                            </div>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span className="solved-pill">{entry.solved}</span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span className="penalty-text">{entry.penalty}m</span>
                          </td>

                          {/* Per-problem breakdown */}
                          {problems.map((prob, idx) => {
                            const probId = (prob._id || prob).toString();
                            const pStatus = entry.problemStatus?.[probId];

                            if (!pStatus) {
                              return (
                                <td key={idx} className="prob-cell empty">
                                  —
                                </td>
                              );
                            }

                            return (
                              <td key={idx} className="prob-cell">
                                {pStatus.solved ? (
                                  <div className="cell-accepted">
                                    <span className="cell-plus">+{pStatus.attempts}</span>
                                    <span className="cell-time">{pStatus.time}m</span>
                                  </div>
                                ) : pStatus.attempts > 0 ? (
                                  <div className="cell-failed">
                                    <span className="cell-minus">-{pStatus.attempts}</span>
                                  </div>
                                ) : (
                                  "—"
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RULES */}
        {activeTab === "rules" && (
          <div className="cd-tab-content">
            <div className="rules-card">
              <h3>🏆 Contest Rules & Scoring System</h3>
              <ul>
                <li>
                  <strong>ACM-ICPC Scoring:</strong> The primary ranking criterion is the number of problems solved.
                </li>
                <li>
                  <strong>Penalty Calculation:</strong> Penalty for each solved problem equals the time (in minutes) from contest start to the first accepted submission + <strong>20 minutes</strong> for each previous wrong attempt on that problem.
                </li>
                <li>
                  <strong>Unsolved Problems:</strong> Attempts on unsolved problems do not add to your penalty time.
                </li>
                <li>
                  <strong>Rating Adjustments:</strong> Official ratings are calculated automatically upon contest conclusion using an ELO rank-performance formula.
                </li>
                <li>
                  <strong>Fair Play:</strong> Code sharing or multiple accounts will result in immediate disqualification.
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ContestDetail;

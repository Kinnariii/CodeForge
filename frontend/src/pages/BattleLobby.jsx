import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../services/socket";
import Navbar from "../components/Navbar";
import "./BattleLobby.css";

function getTier(rating = 1200) {
  if (rating < 1100) return { name: "Bronze", class: "tier-bronze" };
  if (rating < 1300) return { name: "Silver", class: "tier-silver" };
  if (rating < 1500) return { name: "Gold", class: "tier-gold" };
  if (rating < 1700) return { name: "Platinum", class: "tier-platinum" };
  if (rating < 1900) return { name: "Diamond", class: "tier-diamond" };
  return { name: "Grandmaster", class: "tier-master" };
}

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function BattleLobby() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isSearching, setIsSearching] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [matchData, setMatchData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const timerRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleQueueJoined = () => {
      setIsSearching(true);
      setErrorMessage("");
    };

    const handleQueueLeft = () => {
      setIsSearching(false);
      setElapsed(0);
    };

    const handleQueueError = (err) => {
      setErrorMessage(err.message || "Failed to join queue");
      setIsSearching(false);
      setElapsed(0);
    };

    const handleMatchFound = (data) => {
      setIsSearching(false);
      setMatchData(data);

      // Auto-redirect to battle arena after 3s faceoff
      setTimeout(() => {
        navigate(`/battle/${data.battleId}`, { state: { initialMatch: data } });
      }, 3000);
    };

    socket.on("queue_joined", handleQueueJoined);
    socket.on("queue_left", handleQueueLeft);
    socket.on("queue_error", handleQueueError);
    socket.on("match_found", handleMatchFound);

    return () => {
      socket.off("queue_joined", handleQueueJoined);
      socket.off("queue_left", handleQueueLeft);
      socket.off("queue_error", handleQueueError);
      socket.off("match_found", handleMatchFound);
    };
  }, [navigate]);

  // Elapsed timer ticker
  useEffect(() => {
    if (isSearching) {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSearching]);

  const handleStartSearch = () => {
    const socket = getSocket();
    if (!socket) {
      setErrorMessage("Socket connection unavailable. Please refresh.");
      return;
    }
    setErrorMessage("");
    socket.emit("join_queue");
  };

  const handleCancelSearch = () => {
    const socket = getSocket();
    if (socket) {
      socket.emit("leave_queue");
    }
    setIsSearching(false);
  };

  const rating = user?.battleRating ?? 1200;
  const tier = getTier(rating);

  return (
    <>
      <Navbar />
      <div className="battle-lobby-container">
        
        {/* Header */}
        <div className="lobby-header">
          <div className="lobby-badge">Competitive 1v1 Arena</div>
          <h1 className="lobby-title">Live Code Duels</h1>
          <p className="lobby-subtitle">
            Match against developers in your rating bracket. Solve the algorithmic challenge first to claim Elo points!
          </p>
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid var(--red)",
            color: "var(--red)",
            padding: "10px 20px",
            borderRadius: "var(--radius-md)",
            marginBottom: "20px",
            fontSize: "14px",
            fontWeight: "600"
          }}>
            {errorMessage}
          </div>
        )}

        {/* 3-Column Grid */}
        <div className="lobby-grid">
          
          {/* Left: User Stat Card */}
          <div className="lobby-card user-stat-card">
            <div className="user-avatar-large">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <h2 className="user-name-title">{user?.name || "Player"}</h2>
            <span className={`tier-badge ${tier.class}`}>{tier.name}</span>

            <div className="stat-rows">
              <div className="stat-row-item">
                <span className="stat-row-label">Battle Rating</span>
                <span className="stat-row-val rating-accent">{rating}</span>
              </div>
              <div className="stat-row-item">
                <span className="stat-row-label">Format</span>
                <span className="stat-row-val">1v1 Speed Code</span>
              </div>
              <div className="stat-row-item">
                <span className="stat-row-label">Match Duration</span>
                <span className="stat-row-val">15 Minutes</span>
              </div>
            </div>
          </div>

          {/* Center: Matchmaking Action Card */}
          <div className="lobby-card matchmaking-center-card">
            {isSearching ? (
              <>
                <div className="radar-container">
                  <div className="radar-pulse-ring" />
                  <div className="radar-sweep" />
                  <span className="radar-core-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                      <path d="M14.5 3.5a7 7 0 010 17M9.5 6.5a4 4 0 010 11M4 12h1m14 0h1" strokeLinecap="round"/>
                    </svg>
                  </span>
                </div>
                <div className="searching-timer">{formatElapsed(elapsed)}</div>
                <p className="searching-desc">Searching for an opponent (Rating: {Math.max(0, rating - 200)} - {rating + 200})...</p>
                <button className="cancel-match-btn" onClick={handleCancelSearch}>
                  Cancel Matchmaking
                </button>
              </>
            ) : (
              <>
                <div style={{ marginBottom: "18px" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="1.5" style={{ width: "64px", height: "64px", filter: "drop-shadow(0 0 16px rgba(255, 161, 22, 0.4))" }}>
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#fff", marginBottom: "8px" }}>
                  Ready for Battle?
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "28px", maxWidth: "260px" }}>
                  Enter the live matchmaking queue to face a coder of similar skill level.
                </p>
                <button className="find-match-btn" onClick={handleStartSearch}>
                  Find Match Now
                </button>
              </>
            )}
          </div>

          {/* Right: Rules & Scoring Info */}
          <div className="lobby-card battle-info-card">
            <h3 className="info-card-title">
              Battle Rules
            </h3>
            <div className="rule-item">
              <span className="rule-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </span>
              <div><strong>First to Solve Wins:</strong> The first player whose submission passes 100% of test cases immediately wins.</div>
            </div>
            <div className="rule-item">
              <span className="rule-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </span>
              <div><strong>Live Opponent Progress:</strong> Track how many test cases your opponent has passed in real-time.</div>
            </div>
            <div className="rule-item">
              <span className="rule-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </span>
              <div><strong>15-Minute Clock:</strong> If time expires, the player with more passed test cases wins or a Draw is awarded.</div>
            </div>
            <div className="rule-item">
              <span className="rule-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              </span>
              <div><strong>Elo Rating Stakes:</strong> Win rating points on victory, lose points on defeat.</div>
            </div>
          </div>

        </div>

        {/* MATCH FOUND OVERLAY */}
        {matchData && (
          <div className="match-found-overlay">
            <div className="match-found-modal">
              <div className="match-found-title">MATCH FOUND!</div>
              <div className="match-found-sub">Starting Battle Arena in 3 seconds...</div>

              <div className="vs-faceoff">
                <div className="player-box p1">
                  <div className="player-avatar">
                    {matchData.player1?.user?.name ? matchData.player1.user.name.charAt(0).toUpperCase() : "P1"}
                  </div>
                  <div className="player-name">{matchData.player1?.user?.name || "Player 1"}</div>
                  <div className="player-rating">{matchData.player1?.initialRating || 1200} Elo</div>
                </div>

                <div className="vs-badge">VS</div>

                <div className="player-box p2">
                  <div className="player-avatar">
                    {matchData.player2?.user?.name ? matchData.player2.user.name.charAt(0).toUpperCase() : "P2"}
                  </div>
                  <div className="player-name">{matchData.player2?.user?.name || "Player 2"}</div>
                  <div className="player-rating">{matchData.player2?.initialRating || 1200} Elo</div>
                </div>
              </div>

              <div className="countdown-bar-container">
                <div className="countdown-bar-fill" />
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

export default BattleLobby;

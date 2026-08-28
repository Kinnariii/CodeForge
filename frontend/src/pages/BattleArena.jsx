import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../services/socket";
import { getBattleById } from "../services/battleService";
import { runCode } from "../services/submissionService";
import "./BattleArena.css";

const STATUS_LABELS = {
  accepted: "Accepted",
  wrong_answer: "Wrong Answer",
  runtime_error: "Runtime Error",
  compile_error: "Compile Error",
  time_limit_exceeded: "Time Limit Exceeded",
  pending: "Pending",
  running: "Running",
};

function BattleArena() {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [battle, setBattle] = useState(location.state?.initialMatch || null);
  const [problem, setProblem] = useState(location.state?.initialMatch?.problem || null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(!battle);

  // Players info
  const [isPlayer1, setIsPlayer1] = useState(true);
  const [myProgress, setMyProgress] = useState({ passed: 0, total: 0 });
  const [oppProgress, setOppProgress] = useState({ passed: 0, total: 0 });
  const [oppTyping, setOppTyping] = useState(false);

  // Execution modes: 'testcases' | 'run' | 'submit'
  const [consoleMode, setConsoleMode] = useState("testcases");
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);

  // Run & Submit results
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [execError, setExecError] = useState("");

  // Timer (Default 15 minutes)
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  // Game over state
  const [gameOverData, setGameOverData] = useState(null);
  const [showSurrenderModal, setShowSurrenderModal] = useState(false);

  const textareaRef = useRef(null);
  const typingTimerRef = useRef(null);

  // 1. Initial Battle Data Fetch & Reconnect
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit("rejoin_battle", { battleId });
    }

    const fetchBattle = async () => {
      try {
        const res = await getBattleById(battleId);
        setBattle(res.data.data);
        if (res.data.data.problem) {
          setProblem(res.data.data.problem);
          if (!code && res.data.data.problem.starterCode) {
            setCode(res.data.data.problem.starterCode);
          }
        }
      } catch (err) {
        console.error("Failed to load battle:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBattle();
  }, [battleId]);

  // Determine if logged-in user is Player 1 or Player 2
  useEffect(() => {
    if (battle && user) {
      const p1Id = battle.player1?.user?._id || battle.player1?.user;
      const myId = user._id || user.id;
      setIsPlayer1(p1Id?.toString() === myId?.toString());

      if (battle.problem && !code) {
        setCode(battle.problem.starterCode || "// Write your C++ solution here\n");
      }
    }
  }, [battle, user]);

  // 2. Socket Event Listeners for Live Battle
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Opponent Live Progress (Passed test cases)
    const handleOpponentProgress = (data) => {
      setOppProgress({ passed: data.passedTests, total: data.totalTests });
    };

    // Opponent Code Sync / Typing
    const handleOpponentCodeSync = () => {
      setOppTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setOppTyping(false);
      }, 2000);
    };

    // Submission Queued
    const handleSubmissionQueued = () => {
      setSubmitting(true);
      setConsoleMode("submit");
      setSubmitResult({ status: "pending" });
    };

    // Submission Result from BullMQ worker
    const handleSubmissionResult = (data) => {
      setSubmitting(false);
      setSubmitResult(data);
      setConsoleMode("submit");

      if (data.passedTests != null && data.totalTests != null) {
        setMyProgress({ passed: data.passedTests, total: data.totalTests });
      }
    };

    // Game Ended (Victory / Defeat / Draw / Surrender)
    const handleBattleEnded = (data) => {
      setSubmitting(false);
      setRunning(false);
      setGameOverData(data);
    };

    const handleBattleError = (err) => {
      setSubmitting(false);
      setExecError(err.message || "Battle execution error");
      setConsoleMode("submit");
    };

    socket.on("opponent_progress", handleOpponentProgress);
    socket.on("opponent_code_sync", handleOpponentCodeSync);
    socket.on("battle_submission_queued", handleSubmissionQueued);
    socket.on("battle_submission_result", handleSubmissionResult);
    socket.on("battle_ended", handleBattleEnded);
    socket.on("battle_error", handleBattleError);

    return () => {
      socket.off("opponent_progress", handleOpponentProgress);
      socket.off("opponent_code_sync", handleOpponentCodeSync);
      socket.off("battle_submission_queued", handleSubmissionQueued);
      socket.off("battle_submission_result", handleSubmissionResult);
      socket.off("battle_ended", handleBattleEnded);
      socket.off("battle_error", handleBattleError);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  // 3. Countdown Timer
  useEffect(() => {
    if (gameOverData) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameOverData]);

  // Handle Code Typing & Broadcast Code Sync
  const handleCodeChange = (e) => {
    const val = e.target.value;
    setCode(val);

    const socket = getSocket();
    if (socket) {
      socket.emit("code_sync", {
        battleId,
        codeLength: val.length,
        linesCount: val.split("\n").length
      });
    }
  };

  // Keyboard Tab Support
  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + "    " + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  // Run Code (Sample tests validation)
  const handleRunCode = async () => {
    if (running || submitting || !problem) return;
    setRunning(true);
    setExecError("");
    setConsoleMode("run");
    setActiveCaseIdx(0);
    setRunResult(null);

    try {
      const res = await runCode({
        problem: problem._id,
        problemId: problem._id,
        language: "cpp",
        code
      });

      const data = res.data;
      setRunResult(data);

      // Broadcast sample progress update
      const socket = getSocket();
      if (socket && data.passedTests != null) {
        socket.emit("test_progress_update", {
          battleId,
          passedTests: data.passedTests,
          totalTests: data.totalTests || 2
        });
        setMyProgress({ passed: data.passedTests, total: data.totalTests || 2 });
      }
    } catch (err) {
      setExecError(err.response?.data?.message || err.message || "Failed to run test cases.");
    } finally {
      setRunning(false);
    }
  };

  // Submit Battle Code (Official Battle Submission)
  const handleSubmitCode = () => {
    if (submitting || !code.trim()) return;
    setSubmitting(true);
    setExecError("");
    setConsoleMode("submit");
    setSubmitResult({ status: "pending" });

    const socket = getSocket();
    if (socket) {
      socket.emit("submit_battle_code", {
        battleId,
        code,
        language: "cpp"
      });
    }
  };

  // Surrender Handler
  const handleSurrender = () => {
    const socket = getSocket();
    if (socket) {
      socket.emit("surrender_battle", { battleId });
    }
    setShowSurrenderModal(false);
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="battle-arena-wrapper" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
        <div style={{ marginTop: "16px", color: "var(--text-secondary)" }}>Entering Battle Arena...</div>
      </div>
    );
  }

  // Player & Opponent objects
  const me = isPlayer1 ? battle?.player1 : battle?.player2;
  const opp = isPlayer1 ? battle?.player2 : battle?.player1;
  const myName = me?.user?.name || user?.name || "You";
  const oppName = opp?.user?.name || "Opponent";
  const myRating = me?.initialRating || user?.battleRating || 1200;
  const oppRating = opp?.initialRating || 1200;

  // Outcome details if game over
  const isWinner = gameOverData && (gameOverData.winner?.toString() === (user?._id || user?.id)?.toString());
  const isDraw = gameOverData && !gameOverData.winner;
  const myRatingChange = isPlayer1 ? gameOverData?.player1?.ratingChange : gameOverData?.player2?.ratingChange;

  const sampleCases = problem?.examples || [];

  return (
    <div className="battle-arena-wrapper">
      
      {/* ─── HEADER BAR ─────────────────────────────────────── */}
      <header className="arena-header">
        
        {/* Left: You */}
        <div className="arena-player-card">
          <div className="arena-avatar you-avatar">
            {myName.charAt(0).toUpperCase()}
          </div>
          <div className="arena-player-info">
            <span className="arena-player-name">{myName} (You)</span>
            <span className="arena-player-rating">{myRating} Elo</span>
          </div>
          <div className="arena-progress-wrap">
            <div className="arena-progress-bar">
              <div 
                className="arena-progress-fill" 
                style={{ width: `${myProgress.total ? (myProgress.passed / myProgress.total) * 100 : 0}%` }}
              />
            </div>
            <span className="arena-progress-label">
              {myProgress.passed}/{myProgress.total || 0} Passed
            </span>
          </div>
        </div>

        {/* Center: Clock & VS */}
        <div className="arena-center-timer">
          <span className="arena-vs-text">1v1 Code Duel</span>
          <div className={`arena-clock ${timeLeft < 180 ? "urgent" : ""}`}>
            {formatTimer(timeLeft)}
          </div>
        </div>

        {/* Right: Opponent & Surrender */}
        <div className="arena-player-card opponent">
          <div className="arena-progress-wrap" style={{ alignItems: "flex-end" }}>
            <div className="arena-progress-bar" style={{ width: "100%" }}>
              <div 
                className="arena-progress-fill" 
                style={{ 
                  width: `${oppProgress.total ? (oppProgress.passed / oppProgress.total) * 100 : 0}%`,
                  background: "linear-gradient(90deg, #ef4444, #f59e0b)" 
                }}
              />
            </div>
            <span className="arena-progress-label">
              {oppProgress.passed}/{oppProgress.total || 0} Passed
            </span>
          </div>
          <div className="arena-player-info" style={{ alignItems: "flex-end" }}>
            <span className="arena-player-name">{oppName}</span>
            <span className="arena-player-rating">{oppRating} Elo</span>
          </div>
          <div className="arena-avatar opp-avatar">
            {oppName.charAt(0).toUpperCase()}
          </div>
          <button className="surrender-btn" onClick={() => setShowSurrenderModal(true)} title="Forfeit match">
            Surrender
          </button>
        </div>

      </header>

      {/* ─── ARENA BODY (SPLIT PANE) ─────────────────────────── */}
      <main className="arena-body">
        
        {/* Left: Problem Description */}
        <div className="arena-left-pane">
          <div className="pane-nav-tabs">
            <button className="pane-tab-btn active">Problem Statement</button>
          </div>

          <div className="pane-scrollable-content">
            {problem ? (
              <>
                <div className="problem-header-row">
                  <h1 className="problem-title">{problem.title}</h1>
                  <span className={`diff-badge ${problem.difficulty}`}>
                    {problem.difficulty?.toUpperCase()}
                  </span>
                </div>

                <p className="problem-desc-text">{problem.description}</p>

                {problem.examples && problem.examples.map((ex, idx) => (
                  <div key={idx} className="example-box">
                    <div className="example-title">Example {idx + 1}:</div>
                    <div className="example-content">
                      <div><strong>Input:</strong> {ex.input}</div>
                      <div><strong>Output:</strong> {ex.output}</div>
                      {ex.explanation && <div><strong>Explanation:</strong> {ex.explanation}</div>}
                    </div>
                  </div>
                ))}

                {problem.constraints && problem.constraints.length > 0 && (
                  <div className="constraints-box">
                    <div className="constraints-title">Constraints:</div>
                    <ul style={{ paddingLeft: "18px", fontSize: "12px", color: "var(--text-secondary)" }}>
                      {problem.constraints.map((c, i) => (
                        <li key={i} style={{ marginBottom: "4px" }}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: "var(--text-secondary)" }}>Loading problem statement...</div>
            )}
          </div>
        </div>

        {/* Right: Code Editor & Console */}
        <div className="arena-right-pane">
          
          {/* Editor Header Bar */}
          <div className="editor-toolbar">
            <span className="editor-lang-badge">C++ (g++ 17)</span>
            
            {oppTyping && (
              <div className="opponent-typing-indicator">
                <span className="typing-dot" />
                <span>Opponent is typing...</span>
              </div>
            )}

            <div className="action-buttons-group">
              <button 
                className="btn-run-code" 
                onClick={handleRunCode}
                disabled={running || submitting || !!gameOverData}
              >
                {running ? "Running..." : "Run Tests"}
              </button>
              <button 
                className="btn-submit-battle" 
                onClick={handleSubmitCode}
                disabled={submitting || running || !!gameOverData}
              >
                {submitting ? "Judging..." : "Submit Code"}
              </button>
            </div>
          </div>

          {/* Editor Workspace */}
          <div className="code-editor-area">
            <div className="editor-line-numbers">
              {code.split("\n").map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              className="code-textarea"
              value={code}
              onChange={handleCodeChange}
              onKeyDown={handleKeyDown}
              spellCheck="false"
              placeholder="// Write your C++ solution here..."
              disabled={!!gameOverData}
            />
          </div>

          {/* ─── BOTTOM TESTCASES & OUTPUT CONSOLE ────────────── */}
          <div className="arena-bottom-console">
            
            {/* Console Header Tabs */}
            <div className="console-header">
              <div className="console-tabs-list">
                <button 
                  className={`console-tab-btn ${consoleMode === "testcases" ? "active" : ""}`}
                  onClick={() => setConsoleMode("testcases")}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  Testcases
                </button>
                <button 
                  className={`console-tab-btn ${consoleMode === "run" ? "active" : ""}`}
                  onClick={() => setConsoleMode("run")}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Run Result
                </button>
                <button 
                  className={`console-tab-btn ${consoleMode === "submit" ? "active" : ""}`}
                  onClick={() => setConsoleMode("submit")}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Submission
                </button>
              </div>

              {consoleMode === "run" && runResult && (
                <span className={`diff-badge ${runResult.status === "accepted" ? "easy" : "hard"}`} style={{ fontWeight: "700" }}>
                  {runResult.status === "accepted" ? "✓ Passed" : "✗ Failed"}
                </span>
              )}

              {consoleMode === "submit" && submitResult && submitResult.status !== "pending" && (
                <span className={`diff-badge ${submitResult.status === "accepted" ? "easy" : "hard"}`} style={{ fontWeight: "700" }}>
                  {STATUS_LABELS[submitResult.status] || submitResult.status}
                </span>
              )}
            </div>

            {/* Console Body Panels */}
            <div className="console-body">
              
              {/* TAB 1: SAMPLE TEST CASES (EDITABLE/PREVIEW) */}
              {consoleMode === "testcases" && (
                <div>
                  <div className="case-pills-row">
                    {sampleCases.map((_, idx) => (
                      <button
                        key={idx}
                        className={`case-pill-btn ${activeCaseIdx === idx ? "active" : ""}`}
                        onClick={() => setActiveCaseIdx(idx)}
                      >
                        Case {idx + 1}
                      </button>
                    ))}
                  </div>

                  {sampleCases[activeCaseIdx] ? (
                    <div className="case-io-block">
                      <div className="io-field">
                        <span className="io-label">Input</span>
                        <div className="io-value-box">{sampleCases[activeCaseIdx].input}</div>
                      </div>
                      <div className="io-field">
                        <span className="io-label">Expected Output</span>
                        <div className="io-value-box">{sampleCases[activeCaseIdx].output}</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: "var(--text-secondary)" }}>No sample cases available.</div>
                  )}
                </div>
              )}

              {/* TAB 2: RUN RESULT */}
              {consoleMode === "run" && (
                <div>
                  {running ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--orange)", padding: "10px 0" }}>
                      <div className="spinner" style={{ width: "18px", height: "18px" }} />
                      <span>Running sample test cases on sandbox...</span>
                    </div>
                  ) : execError ? (
                    <div className="io-value-box diff-fail">
                      <strong>Execution Error:</strong>
                      <pre style={{ marginTop: "6px", whiteSpace: "pre-wrap" }}>{execError}</pre>
                    </div>
                  ) : !runResult ? (
                    <div style={{ color: "var(--text-secondary)", padding: "10px 0" }}>
                      Click "Run Tests" to test your solution on sample cases.
                    </div>
                  ) : runResult.error && (!runResult.results || runResult.results.length === 0) ? (
                    <div className="io-value-box diff-fail">
                      <strong>Error:</strong>
                      <pre style={{ marginTop: "6px", whiteSpace: "pre-wrap" }}>{runResult.error}</pre>
                    </div>
                  ) : (
                    <div>
                      {/* Summary Banner */}
                      <div className="verdict-header-banner">
                        <div className="verdict-title" style={{ color: runResult.status === "accepted" ? "#22c55e" : "#ef4444" }}>
                          <span>{runResult.status === "accepted" ? "✓" : "✗"}</span>
                          <span>{STATUS_LABELS[runResult.status] || runResult.status}</span>
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500", marginLeft: "6px" }}>
                            ({runResult.passedTests}/{runResult.totalTests} Passed)
                          </span>
                        </div>
                        <div className="verdict-metrics">
                          Runtime: {runResult.runtime || 0}ms | Memory: {runResult.memory || 0}KB
                        </div>
                      </div>

                      {/* Case Pills */}
                      {runResult.results && runResult.results.length > 0 && (
                        <>
                          <div className="case-pills-row">
                            {runResult.results.map((res, idx) => (
                              <button
                                key={idx}
                                className={`case-pill-btn ${activeCaseIdx === idx ? "active" : ""} ${res.status === "accepted" ? "passed" : "failed"}`}
                                onClick={() => setActiveCaseIdx(idx)}
                              >
                                <span>{res.status === "accepted" ? "✓" : "✗"}</span> Case {idx + 1}
                              </button>
                            ))}
                          </div>

                          {/* Selected Case IO Comparison */}
                          {runResult.results[activeCaseIdx] && (
                            <div className="case-io-block">
                              <div className="io-field">
                                <span className="io-label">Input</span>
                                <div className="io-value-box">{runResult.results[activeCaseIdx].input}</div>
                              </div>
                              <div className="io-field">
                                <span className="io-label">Expected Output</span>
                                <div className="io-value-box">{runResult.results[activeCaseIdx].expectedOutput}</div>
                              </div>
                              <div className="io-field">
                                <span className="io-label">Your Output</span>
                                <div className={`io-value-box ${runResult.results[activeCaseIdx].status === "accepted" ? "" : "diff-fail"}`}>
                                  {runResult.results[activeCaseIdx].actualOutput !== null 
                                    ? runResult.results[activeCaseIdx].actualOutput 
                                    : runResult.results[activeCaseIdx].error || "No Output"}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SUBMISSION RESULT */}
              {consoleMode === "submit" && (
                <div>
                  {submitting || submitResult?.status === "pending" ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#22c55e", padding: "10px 0" }}>
                      <div className="spinner" style={{ width: "18px", height: "18px", borderTopColor: "#22c55e" }} />
                      <span>Judging submission against all test cases...</span>
                    </div>
                  ) : !submitResult ? (
                    <div style={{ color: "var(--text-secondary)", padding: "10px 0" }}>
                      Click "Submit Code" for official evaluation.
                    </div>
                  ) : (
                    <div>
                      {/* Summary Banner */}
                      <div className="verdict-header-banner">
                        <div className="verdict-title" style={{ color: submitResult.status === "accepted" ? "#22c55e" : "#ef4444" }}>
                          <span>{submitResult.status === "accepted" ? "✓" : "✗"}</span>
                          <span>{STATUS_LABELS[submitResult.status] || submitResult.status}</span>
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500", marginLeft: "6px" }}>
                            ({submitResult.passedTests}/{submitResult.totalTests} Passed)
                          </span>
                        </div>
                        {submitResult.runtime != null && (
                          <div className="verdict-metrics">
                            Runtime: {submitResult.runtime}ms | Memory: {submitResult.memory}KB
                          </div>
                        )}
                      </div>

                      {/* Sample Passed Cases */}
                      {submitResult.sampleResults && submitResult.sampleResults.length > 0 && (
                        <div style={{ marginBottom: "16px" }}>
                          <div style={{ fontSize: "11px", fontWeight: "700", color: "#22c55e", marginBottom: "8px", textTransform: "uppercase" }}>
                            Passed Cases:
                          </div>
                          <div className="case-pills-row">
                            {submitResult.sampleResults.map((sCase) => (
                              <div key={sCase.index} className="case-pill-btn passed" style={{ cursor: "default" }}>
                                <span>✓</span> Case {sCase.index}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Failed Case Details - DIRECT DISPLAY (Input, Expected, Got) */}
                      {submitResult.failedCase && (
                        <div className="case-io-block">
                          <div style={{ fontSize: "12px", fontWeight: "700", color: "#ef4444", marginBottom: "6px" }}>
                            ✗ Failed on Case {submitResult.failedCase.index}:
                          </div>

                          <div className="io-field">
                            <span className="io-label">Input</span>
                            <div className="io-value-box">{submitResult.failedCase.input}</div>
                          </div>

                          <div className="io-field">
                            <span className="io-label">Expected Output</span>
                            <div className="io-value-box">{submitResult.failedCase.expectedOutput}</div>
                          </div>

                          <div className="io-field">
                            <span className="io-label">Your Output</span>
                            <div className="io-value-box diff-fail">
                              {submitResult.failedCase.actualOutput !== null 
                                ? submitResult.failedCase.actualOutput 
                                : submitResult.failedCase.error || "No Output"}
                            </div>
                          </div>

                          {submitResult.failedCase.error && (
                            <div className="io-field">
                              <span className="io-label">Error Details</span>
                              <pre className="io-value-box diff-fail">{submitResult.failedCase.error}</pre>
                            </div>
                          )}
                        </div>
                      )}

                      {/* General Error if no failedCase object */}
                      {submitResult.error && !submitResult.failedCase && (
                        <div className="io-value-box diff-fail">
                          <pre style={{ whiteSpace: "pre-wrap" }}>{submitResult.error}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>

        </div>

      </main>

      {/* ─── SURRENDER CONFIRMATION MODAL ────────────────────── */}
      {showSurrenderModal && (
        <div className="gameover-modal-overlay">
          <div className="gameover-card" style={{ maxWidth: "400px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--red)", marginBottom: "10px" }}>
              Surrender Battle?
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
              Are you sure you want to forfeit? Your opponent will be awarded the victory and your Elo rating will decrease.
            </p>
            <div className="modal-actions">
              <button className="btn-lobby-return" onClick={() => setShowSurrenderModal(false)}>
                Keep Fighting
              </button>
              <button className="btn-play-again" style={{ background: "var(--red)", color: "#fff" }} onClick={handleSurrender}>
                Yes, Surrender
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── GAME OVER MODAL (VICTORY / DEFEAT / DRAW) ───────── */}
      {gameOverData && (
        <div className="gameover-modal-overlay">
          <div className={`gameover-card ${isWinner ? "victory" : isDraw ? "draw" : "defeat"}`}>
            <div className="gameover-icon">
              {isWinner ? "Victory" : isDraw ? "Draw" : "Defeat"}
            </div>
            
            <h2 className="gameover-title">
              {isWinner ? "VICTORY!" : isDraw ? "MATCH DRAW!" : "DEFEAT"}
            </h2>

            <p className="gameover-subtitle">
              {isWinner 
                ? "Outstanding! You solved the problem first and won the duel."
                : isDraw
                ? "Time expired with equal test cases. The match resulted in a draw."
                : `Opponent claimed the victory (${gameOverData.reason || "solved first"}).`}
            </p>

            <div className={`rating-change-pill ${myRatingChange > 0 ? "positive" : myRatingChange < 0 ? "negative" : "neutral"}`}>
              <span>Elo Rating:</span>
              <span>{myRatingChange >= 0 ? `+${myRatingChange}` : myRatingChange}</span>
            </div>

            <div className="modal-actions">
              <button className="btn-lobby-return" onClick={() => navigate("/battle")}>
                Back to Lobby
              </button>
              <button className="btn-play-again" onClick={() => navigate("/battle")}>
                Find Another Match
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default BattleArena;

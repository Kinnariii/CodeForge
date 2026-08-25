import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { createContest } from "../services/contestService";
import { getProblems } from "../services/problemService";
import { useAuth } from "../context/AuthContext";
import "./CreateContest.css";

function CreateContest() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [availableProblems, setAvailableProblems] = useState([]);
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetchingProblems, setFetchingProblems] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load available problems for the selection checklist
  useEffect(() => {
    const fetchAllProblems = async () => {
      setFetchingProblems(true);
      try {
        const res = await getProblems({ limit: 100 });
        setAvailableProblems(res.data?.problems || res.data?.data?.problems || []);
      } catch (err) {
        console.error("Failed to load problems:", err);
      } finally {
        setFetchingProblems(false);
      }
    };

    fetchAllProblems();
  }, []);

  if (user?.role !== "admin") {
    return (
      <div className="create-contest-page">
        <Navbar />
        <div className="unauthorized-box">
          <div className="unauth-icon">🛡️</div>
          <h2>Admin Access Required</h2>
          <p>You must be an administrator to create official contests.</p>
          <button onClick={() => navigate("/contests")}>← Back to Contests</button>
        </div>
      </div>
    );
  }

  const toggleProblemSelection = (problemId) => {
    if (selectedProblems.includes(problemId)) {
      setSelectedProblems(selectedProblems.filter((id) => id !== problemId));
    } else {
      setSelectedProblems([...selectedProblems, problemId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Contest title is required.");
      return;
    }
    if (!description.trim()) {
      setError("Contest description is required.");
      return;
    }
    if (!startTime) {
      setError("Start time is required.");
      return;
    }
    if (!endTime) {
      setError("End time is required.");
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      setError("End time must be strictly after start time.");
      return;
    }
    if (start <= new Date()) {
      setError("Contest start time must be set in the future.");
      return;
    }
    if (selectedProblems.length === 0) {
      setError("Please select at least 1 problem for this contest.");
      return;
    }

    setLoading(true);
    try {
      await createContest({
        title: title.trim(),
        description: description.trim(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        problems: selectedProblems
      });

      setSuccess("Contest created successfully! Redirecting...");
      setTimeout(() => {
        navigate("/contests");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create contest.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProblems = availableProblems.filter((p) =>
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.difficulty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.problemNumber && String(p.problemNumber).includes(searchTerm))
  );

  return (
    <div className="create-contest-page">
      <Navbar />

      <main className="create-contest-main">
        <button className="back-link" onClick={() => navigate("/contests")}>
          ← Back to Contests
        </button>

        <div className="cc-card">
          <div className="cc-header">
            <span className="admin-badge">Admin Portal</span>
            <h1 className="cc-title">Create Official Contest</h1>
            <p className="cc-subtitle">
              Schedule a competitive round, set time windows, and curate problem sets.
            </p>
          </div>

          {error && <div className="cc-alert error">{error}</div>}
          {success && <div className="cc-alert success">{success}</div>}

          <form onSubmit={handleSubmit} className="cc-form">
            {/* TITLE */}
            <div className="form-group">
              <label>Contest Title *</label>
              <input
                type="text"
                placeholder="e.g. CodeForge Weekly Contest #4"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* DESCRIPTION */}
            <div className="form-group">
              <label>Description & Rules *</label>
              <textarea
                rows={3}
                placeholder="Brief description, scoring format, and instructions for participants..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* DATES GRID */}
            <div className="form-grid-2">
              <div className="form-group">
                <label>Start Date & Time *</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>End Date & Time *</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* PROBLEM SELECTION */}
            <div className="form-group">
              <div className="problem-select-header">
                <div>
                  <label>Curate Problem Set * ({selectedProblems.length} selected)</label>
                  <p className="field-hint">
                    Select problems from the library in the order you want them presented (A, B, C...).
                  </p>
                </div>

                <input
                  type="text"
                  placeholder="Search problems by name or difficulty..."
                  className="search-prob-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {fetchingProblems ? (
                <div className="prob-loading">Loading problems library...</div>
              ) : (
                <div className="problems-checklist">
                  {filteredProblems.length === 0 ? (
                    <div className="no-probs-found">No matching problems found.</div>
                  ) : (
                    filteredProblems.map((prob) => {
                      const isSelected = selectedProblems.includes(prob._id);
                      const orderIndex = selectedProblems.indexOf(prob._id);
                      const orderLetter =
                        orderIndex !== -1 ? String.fromCharCode(65 + orderIndex) : null;

                      return (
                        <div
                          key={prob._id}
                          className={`prob-select-item ${isSelected ? "selected" : ""}`}
                          onClick={() => toggleProblemSelection(prob._id)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent div click
                          />

                          <div className="prob-info">
                            <span className="prob-num">#{prob.problemNumber || "—"}</span>
                            <span className="prob-name">{prob.title}</span>
                            <span className={`diff-pill ${prob.difficulty?.toLowerCase()}`}>
                              {prob.difficulty}
                            </span>
                          </div>

                          {orderLetter && (
                            <span className="order-badge">Problem {orderLetter}</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <div className="form-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate("/contests")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-create-submit"
                disabled={loading}
              >
                {loading ? "Creating Contest..." : "Publish Contest 🚀"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CreateContest;

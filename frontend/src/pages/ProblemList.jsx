import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./ProblemList.css";
import { getProblems, deleteProblem } from "../services/problemService";
import { getMyStats } from "../services/submissionService";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

const DIFFICULTIES = ["all", "easy", "medium", "hard"];

function ProblemList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getMyStats();
        setStats(res.data);
      } catch {}
    };
    fetchStats();
  }, []);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (difficulty !== "all") params.difficulty = difficulty;
      const res = await getProblems(params);
      setProblems(res.data.problems);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load problems. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, search, difficulty]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleDeleteProblem = async (problemId, problemTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${problemTitle}"? All associated test cases will also be deleted.`)) {
      return;
    }
    try {
      await deleteProblem(problemId);
      fetchProblems();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete problem.");
    }
  };

  return (
    <div className="pl-page">
      <Navbar active="problems" />

      <div className="pl-layout">
        {/* ── SIDEBAR ── */}
        <aside className="pl-sidebar">
          <div className="sidebar-card">
            <div className="sidebar-heading">Difficulty</div>
            {DIFFICULTIES.map((lvl) => (
              <button
                key={lvl}
                className={`sidebar-item ${lvl} ${difficulty === lvl ? "active" : ""}`}
                onClick={() => { setDifficulty(lvl); setPage(1); }}
              >
                {lvl !== "all" && <span className={`dot dot-${lvl}`} />}
                <span>{lvl === "all" ? "All Problems" : lvl.charAt(0).toUpperCase() + lvl.slice(1)}</span>
                {difficulty === lvl && <span className="sidebar-check">✓</span>}
              </button>
            ))}
          </div>

          {stats && (
            <div className="sidebar-card stats-card">
              <div className="sidebar-heading">My Progress</div>
              <div className="progress-row">
                <span className="pr-label">Solved</span>
                <span className="pr-val">{stats.solvedProblems}</span>
              </div>
              <div className="progress-row">
                <span className="pr-label">Submissions</span>
                <span className="pr-val">{stats.totalSubmissions}</span>
              </div>
              <div className="progress-row">
                <span className="pr-label">Acceptance</span>
                <span className="pr-val accent">{stats.acceptanceRate}%</span>
              </div>
              {/* mini bar */}
              <div className="acceptance-bar">
                <div
                  className="acceptance-fill"
                  style={{ width: `${Math.min(stats.acceptanceRate, 100)}%` }}
                />
              </div>
            </div>
          )}
        </aside>

        {/* ── MAIN ── */}
        <main className="pl-main">
          {/* SEARCH + FILTER */}
          <div className="pl-filter-bar">
            <div className="search-wrap">
              <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search problems..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
              {search && (
                <button className="search-clear" onClick={() => { setSearch(""); setPage(1); }}>✕</button>
              )}
            </div>

            <div className="pl-chips">
              {DIFFICULTIES.filter((d) => d !== "all").map((lvl) => (
                <button
                  key={lvl}
                  className={`pl-chip ${lvl} ${difficulty === lvl ? "active" : ""}`}
                  onClick={() => { setDifficulty(difficulty === lvl ? "all" : lvl); setPage(1); }}
                >
                  {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                </button>
              ))}
            </div>

            {user?.role === "admin" && (
              <button
                className="pl-create-btn"
                onClick={() => navigate("/problems/create")}
              >
                + Create Problem
              </button>
            )}
          </div>

          {/* TABLE */}
          <div className="pl-table-wrap">
            <table className="pl-table">
              <thead>
                <tr>
                  <th className="th-num">#</th>
                  <th className="th-title">Title</th>
                  <th className="th-tags">Tags</th>
                  <th className="th-diff">Difficulty</th>
                  {user?.role === "admin" && <th className="th-actions">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {/* LOADING SKELETONS */}
                {loading && Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="sk-row">
                    <td><div className="skeleton" style={{ width: 28, height: 14 }} /></td>
                    <td><div className="skeleton" style={{ width: "60%", height: 14 }} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <div className="skeleton" style={{ width: 60, height: 20, borderRadius: 4 }} />
                        <div className="skeleton" style={{ width: 50, height: 20, borderRadius: 4 }} />
                      </div>
                    </td>
                    <td><div className="skeleton" style={{ width: 52, height: 22, borderRadius: 999 }} /></td>
                    {user?.role === "admin" && <td><div className="skeleton" style={{ width: 110, height: 24, borderRadius: 4 }} /></td>}
                  </tr>
                ))}

                {/* ERROR */}
                {!loading && error && (
                  <tr><td colSpan={user?.role === "admin" ? 5 : 4} className="td-msg">
                    <span className="err-txt">⚠ {error}</span>
                  </td></tr>
                )}

                {/* EMPTY */}
                {!loading && !error && problems.length === 0 && (
                  <tr><td colSpan={user?.role === "admin" ? 5 : 4} className="td-msg">
                    No problems found. Try adjusting your filters.
                  </td></tr>
                )}

                {/* ROWS */}
                {!loading && !error && problems.map((problem, idx) => (
                  <tr
                    key={problem._id}
                    className={`pl-row ${idx % 2 === 0 ? "" : "alt"}`}
                    onClick={() => navigate(`/problems/${problem._id}`)}
                  >
                    <td className="td-num">{problem.problemNumber}</td>
                    <td className="td-title">
                      <span className="problem-title-text">{problem.title}</span>
                    </td>
                    <td className="td-tags">
                      <div className="tags-wrap">
                        {problem.tags?.slice(0, 2).map((tag) => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="td-diff">
                      <span className={`diff-badge ${problem.difficulty}`}>
                        {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                      </span>
                    </td>
                    {user?.role === "admin" && (
                      <td className="td-actions" onClick={(e) => e.stopPropagation()}>
                        <div className="pl-action-btns">
                          <button
                            type="button"
                            className="pl-action-btn edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/problems/${problem._id}/edit`);
                            }}
                            title="Edit problem and test cases"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="pl-action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProblem(problem._id, problem.title);
                            }}
                            title="Delete problem"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {!loading && !error && problems.length > 0 && pagination.totalPages > 1 && (
            <div className="pl-pagination">
              <button
                className="pag-btn"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ‹ Prev
              </button>
              <span className="pag-info">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                className="pag-btn"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next ›
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default ProblemList;

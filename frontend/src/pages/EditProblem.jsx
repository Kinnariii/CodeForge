import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getProblemById, updateProblem, deleteProblem } from "../services/problemService";
import { getTestCasesByProblem, createTestCase, deleteTestCase } from "../services/testcaseService";
import { useAuth } from "../context/AuthContext";
import "./CreateProblem.css";
import "./EditProblem.css";

const SUPPORTED_TYPES = [
  "int", "long", "float", "double", "string", "bool",
  "vector<int>", "vector<string>", "vector<vector<int>>"
];

const BLANK_EXAMPLE  = { input: "", output: "", explanation: "" };
const BLANK_PARAM    = { name: "", type: "int" };
const BLANK_TESTCASE = { input: "", expectedOutput: "", isHidden: true };

function EditProblem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  /* ── Tab state: "problem" | "testcases" ── */
  const [activeTab, setActiveTab] = useState("problem");

  /* ── Loading and Messages ── */
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [savingProblem, setSavingProblem] = useState(false);
  const [problemMsg, setProblemMsg] = useState({ text: "", type: "" });

  /* ── Problem Form Fields ── */
  const [problemNumber, setProblemNumber] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [tags, setTags] = useState("");
  const [constraints, setConstraints] = useState("");
  const [functionName, setFunctionName] = useState("");
  const [returnType, setReturnType] = useState("int");
  const [parameters, setParameters] = useState([{ ...BLANK_PARAM }]);
  const [starterCode, setStarterCode] = useState("");
  const [examples, setExamples] = useState([{ ...BLANK_EXAMPLE }]);

  /* ── Test Cases State ── */
  const [existingTestCases, setExistingTestCases] = useState([]);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [deletingTcId, setDeletingTcId] = useState(null);
  const [newTestCases, setNewTestCases] = useState([{ ...BLANK_TESTCASE }]);
  const [savingNewTc, setSavingNewTc] = useState(false);
  const [tcMsg, setTcMsg] = useState({ text: "", type: "" });

  /* ── Delete Problem Modal ── */
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProblem, setDeletingProblem] = useState(false);

  /* ── Auth Guard ── */
  if (user && user.role !== "admin") {
    return (
      <div className="cp-page">
        <Navbar />
        <div className="cp-unauthorized">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="unauth-icon-svg">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <h2>Admin Access Required</h2>
          <p>You must be an administrator to edit problems and manage test cases.</p>
          <button onClick={() => navigate("/problems")}>Back to Problems</button>
        </div>
      </div>
    );
  }

  /* ── Load Problem and Testcases ── */
  const loadProblemData = async () => {
    setPageLoading(true);
    setPageError("");
    try {
      const res = await getProblemById(id);
      const prob = res.data;
      if (!prob) throw new Error("Problem data not found");

      setProblemNumber(prob.problemNumber || "");
      setTitle(prob.title || "");
      setDescription(prob.description || "");
      setDifficulty(prob.difficulty || "easy");
      setTags(Array.isArray(prob.tags) ? prob.tags.join(", ") : "");
      setConstraints(Array.isArray(prob.constraints) ? prob.constraints.join("\n") : "");
      setFunctionName(prob.functionName || "");
      setReturnType(prob.judgeConfig?.returnType || "int");
      setParameters(
        prob.judgeConfig?.parameters?.length
          ? prob.judgeConfig.parameters
          : [{ ...BLANK_PARAM }]
      );
      setStarterCode(prob.starterCode || "");
      setExamples(
        prob.examples?.length ? prob.examples : [{ ...BLANK_EXAMPLE }]
      );
    } catch (err) {
      setPageError(err.response?.data?.message || "Failed to load problem details.");
    } finally {
      setPageLoading(false);
    }
  };

  const loadTestCases = async () => {
    setLoadingTestCases(true);
    try {
      const res = await getTestCasesByProblem(id);
      setExistingTestCases(res.data || []);
    } catch (err) {
      console.error("Failed to load test cases:", err);
    } finally {
      setLoadingTestCases(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadProblemData();
      loadTestCases();
    }
  }, [id]);

  /* ── Parameter Helpers ── */
  const addParam = () => setParameters([...parameters, { ...BLANK_PARAM }]);
  const removeParam = (i) => setParameters(parameters.filter((_, idx) => idx !== i));
  const updateParam = (i, field, val) => {
    const u = [...parameters];
    u[i] = { ...u[i], [field]: val };
    setParameters(u);
  };

  /* ── Example Helpers ── */
  const addExample = () => setExamples([...examples, { ...BLANK_EXAMPLE }]);
  const removeExample = (i) => setExamples(examples.filter((_, idx) => idx !== i));
  const updateExample = (i, field, val) => {
    const u = [...examples];
    u[i] = { ...u[i], [field]: val };
    setExamples(u);
  };

  /* ── New Test Case Helpers ── */
  const addNewTestCase = () => setNewTestCases([...newTestCases, { ...BLANK_TESTCASE }]);
  const removeNewTestCase = (i) => setNewTestCases(newTestCases.filter((_, idx) => idx !== i));
  const updateNewTestCase = (i, field, val) => {
    const u = [...newTestCases];
    u[i] = { ...u[i], [field]: val };
    setNewTestCases(u);
  };

  /* ── Submit Problem Updates ── */
  const handleUpdateProblem = async (e) => {
    e.preventDefault();
    setProblemMsg({ text: "", type: "" });

    if (!problemNumber || isNaN(Number(problemNumber))) {
      return setProblemMsg({ text: "Problem number must be a valid number.", type: "error" });
    }
    if (!title.trim()) {
      return setProblemMsg({ text: "Problem title is required.", type: "error" });
    }
    if (!description.trim()) {
      return setProblemMsg({ text: "Problem description is required.", type: "error" });
    }
    if (!functionName.trim()) {
      return setProblemMsg({ text: "Function name is required.", type: "error" });
    }
    if (parameters.some((p) => !p.name.trim())) {
      return setProblemMsg({ text: "All parameter names must be filled.", type: "error" });
    }

    const payload = {
      problemNumber: Number(problemNumber),
      title: title.trim(),
      description: description.trim(),
      difficulty,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      constraints: constraints.split("\n").map((c) => c.trim()).filter(Boolean),
      examples: examples.map((ex) => ({
        input: ex.input.trim(),
        output: ex.output.trim(),
        ...(ex.explanation?.trim() && { explanation: ex.explanation.trim() }),
      })),
      functionName: functionName.trim(),
      ...(starterCode.trim() && { starterCode: starterCode.trim() }),
      judgeConfig: {
        returnType,
        parameters: parameters.map((p) => ({ name: p.name.trim(), type: p.type })),
      },
    };

    setSavingProblem(true);
    try {
      const res = await updateProblem(id, payload);
      setProblemMsg({ text: "Problem updated successfully!", type: "success" });
      setTimeout(() => setProblemMsg({ text: "", type: "" }), 3000);
    } catch (err) {
      setProblemMsg({
        text: err.response?.data?.message || "Failed to update problem.",
        type: "error",
      });
    } finally {
      setSavingProblem(false);
    }
  };

  /* ── Delete a Test Case ── */
  const handleDeleteTestCase = async (tcId) => {
    if (!window.confirm("Are you sure you want to delete this test case?")) return;
    setDeletingTcId(tcId);
    setTcMsg({ text: "", type: "" });
    try {
      await deleteTestCase(tcId);
      setExistingTestCases((prev) => prev.filter((tc) => tc._id !== tcId));
      setTcMsg({ text: "Test case deleted successfully.", type: "success" });
      setTimeout(() => setTcMsg({ text: "", type: "" }), 3000);
    } catch (err) {
      setTcMsg({
        text: err.response?.data?.message || "Failed to delete test case.",
        type: "error",
      });
    } finally {
      setDeletingTcId(null);
    }
  };

  /* ── Submit New Test Cases ── */
  const handleSaveNewTestCases = async () => {
    setTcMsg({ text: "", type: "" });
    const valid = newTestCases.every((tc) => tc.input.trim() && tc.expectedOutput.trim());
    if (!valid) {
      return setTcMsg({
        text: "Please fill both Input and Expected Output for each new test case.",
        type: "error",
      });
    }

    setSavingNewTc(true);
    let saved = 0;
    const errors = [];

    for (const tc of newTestCases) {
      try {
        await createTestCase({
          problem: id,
          input: tc.input.trim(),
          expectedOutput: tc.expectedOutput.trim(),
          isHidden: tc.isHidden,
        });
        saved++;
      } catch (err) {
        errors.push(err.response?.data?.message || "Failed to save testcase");
      }
    }

    setSavingNewTc(false);

    if (errors.length > 0) {
      setTcMsg({
        text: `${saved} test cases saved, but ${errors.length} failed.`,
        type: "error",
      });
    } else {
      setTcMsg({
        text: `Successfully added ${saved} test case${saved > 1 ? "s" : ""}!`,
        type: "success",
      });
      setNewTestCases([{ ...BLANK_TESTCASE }]);
      loadTestCases();
      setTimeout(() => setTcMsg({ text: "", type: "" }), 4000);
    }
  };

  /* ── Delete Entire Problem ── */
  const handleDeleteProblem = async () => {
    setDeletingProblem(true);
    try {
      await deleteProblem(id);
      navigate("/problems");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete problem.");
      setDeletingProblem(false);
      setShowDeleteModal(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="cp-page">
        <Navbar />
        <main className="cp-main">
          <div className="edit-loading-box">
            <div className="spinner" />
            <p>Loading problem details & test cases...</p>
          </div>
        </main>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="cp-page">
        <Navbar />
        <main className="cp-main">
          <button className="cp-back-link" onClick={() => navigate("/problems")}>
            ← Back to Problems
          </button>
          <div className="cp-alert error">{pageError}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="cp-page">
      <Navbar />

      <main className="cp-main">
        {/* Navigation Bar */}
        <div className="edit-top-nav">
          <button className="cp-back-link" onClick={() => navigate(`/problems/${id}`)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            View Problem #{problemNumber}
          </button>

          <button
            type="button"
            className="btn-danger-outline"
            onClick={() => setShowDeleteModal(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            Delete Problem
          </button>
        </div>

        {/* Card */}
        <div className="cp-card">
          <div className="cp-header">
            <div className="edit-header-row">
              <div>
                <span className="cp-admin-badge">Admin Portal</span>
                <h1 className="cp-title">
                  Edit Problem #{problemNumber}: {title}
                </h1>
                <p className="cp-subtitle">
                  Update problem definition, parameters, starter code, and manage hidden/visible test cases.
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="edit-tab-bar">
              <button
                type="button"
                className={`edit-tab-btn ${activeTab === "problem" ? "active" : ""}`}
                onClick={() => setActiveTab("problem")}
              >
                Problem Details
              </button>
              <button
                type="button"
                className={`edit-tab-btn ${activeTab === "testcases" ? "active" : ""}`}
                onClick={() => setActiveTab("testcases")}
              >
                Manage Test Cases ({existingTestCases.length})
              </button>
            </div>
          </div>

          {/* ══════════════ TAB 1: Problem Details Form ══════════════ */}
          {activeTab === "problem" && (
            <div>
              {problemMsg.text && (
                <div className={`cp-alert ${problemMsg.type}`}>{problemMsg.text}</div>
              )}

              <form onSubmit={handleUpdateProblem} className="cp-form">
                {/* SECTION 1 — Basic Info */}
                <div className="cp-section">
                  <div className="cp-section-title">
                    <span className="cp-section-num">1</span>
                    Basic Information
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Problem Number *</label>
                      <input
                        type="number"
                        min="1"
                        value={problemNumber}
                        onChange={(e) => setProblemNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Difficulty *</label>
                      <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Problem Title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Problem Description *</label>
                    <span className="field-hint">Problem statement clearly explaining the algorithmic task.</span>
                    <textarea
                      rows={7}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Tags</label>
                      <span className="field-hint">Comma-separated tags</span>
                      <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="Array, Hash Table"
                      />
                    </div>
                    <div className="form-group">
                      <label>Constraints</label>
                      <span className="field-hint">One constraint per line</span>
                      <textarea
                        rows={3}
                        value={constraints}
                        onChange={(e) => setConstraints(e.target.value)}
                        placeholder="1 <= nums.length <= 10^4"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2 — Examples */}
                <div className="cp-section">
                  <div className="cp-section-title">
                    <span className="cp-section-num">2</span>
                    Examples (Shown in Problem Description)
                  </div>

                  {examples.map((ex, i) => (
                    <div key={i} className="cp-example-block">
                      <div className="example-block-header">
                        <span className="example-num">Example {i + 1}</span>
                        {examples.length > 1 && (
                          <button
                            type="button"
                            className="btn-remove-item"
                            onClick={() => removeExample(i)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label>Input *</label>
                          <textarea
                            rows={2}
                            value={ex.input}
                            onChange={(e) => updateExample(i, "input", e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Output *</label>
                          <textarea
                            rows={2}
                            value={ex.output}
                            onChange={(e) => updateExample(i, "output", e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Explanation (optional)</label>
                        <input
                          type="text"
                          value={ex.explanation || ""}
                          onChange={(e) => updateExample(i, "explanation", e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn-add-item" onClick={addExample}>
                    + Add Example
                  </button>
                </div>

                {/* SECTION 3 — Judge Config */}
                <div className="cp-section">
                  <div className="cp-section-title">
                    <span className="cp-section-num">3</span>
                    Function & Judge Configuration
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Function Name *</label>
                      <input
                        type="text"
                        value={functionName}
                        onChange={(e) => setFunctionName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Return Type *</label>
                      <select value={returnType} onChange={(e) => setReturnType(e.target.value)}>
                        {SUPPORTED_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Parameters</label>
                    <div className="cp-param-header">
                      <span></span>
                      <span>Parameter Name</span>
                      <span>Type</span>
                      <span></span>
                    </div>
                    <div className="cp-params-list">
                      {parameters.map((param, i) => (
                        <div key={i} className="cp-param-row">
                          <span className="param-index">p{i + 1}</span>
                          <input
                            type="text"
                            className="param-name-input"
                            value={param.name}
                            onChange={(e) => updateParam(i, "name", e.target.value)}
                            placeholder="param name"
                            required
                          />
                          <select
                            className="param-type-select"
                            value={param.type}
                            onChange={(e) => updateParam(i, "type", e.target.value)}
                          >
                            {SUPPORTED_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          {parameters.length > 1 && (
                            <button
                              type="button"
                              className="param-remove-btn"
                              onClick={() => removeParam(i)}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn-add-item"
                      style={{ marginTop: 10 }}
                      onClick={addParam}
                    >
                      + Add Parameter
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Starter Code</label>
                    <span className="field-hint">Template displayed to users in Monaco editor.</span>
                    <textarea
                      rows={7}
                      className="cp-code-textarea"
                      value={starterCode}
                      onChange={(e) => setStarterCode(e.target.value)}
                    />
                  </div>
                </div>

                <div className="cp-form-footer">
                  <button
                    type="button"
                    className="btn-cp-cancel"
                    onClick={() => navigate(`/problems/${id}`)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-cp-submit" disabled={savingProblem}>
                    {savingProblem ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ══════════════ TAB 2: Manage Test Cases ══════════════ */}
          {activeTab === "testcases" && (
            <div className="edit-testcases-container">
              {tcMsg.text && <div className={`cp-alert ${tcMsg.type}`}>{tcMsg.text}</div>}

              {/* Instructions */}
              <div className="tc-info-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>
                  <strong>Test cases are used by the BullMQ execution runner & judge.</strong>
                  Hidden test cases protect against hardcoded answers. Visible test cases run in user's "Run Code" panel.
                </span>
              </div>

              {/* Existing Test Cases List */}
              <div className="existing-tc-section">
                <div className="existing-tc-header">
                  <h3>Existing Test Cases ({existingTestCases.length})</h3>
                  {loadingTestCases && <span className="tc-refreshing-tag">Refreshing...</span>}
                </div>

                {existingTestCases.length === 0 ? (
                  <div className="no-tc-box">
                    <p>No test cases added yet for this problem! Add your first test case below.</p>
                  </div>
                ) : (
                  <div className="existing-tc-grid">
                    {existingTestCases.map((tc, idx) => (
                      <div key={tc._id} className="existing-tc-card">
                        <div className="existing-tc-top">
                          <span className="existing-tc-num">#{idx + 1}</span>
                          <span className={`tc-hidden-badge ${tc.isHidden ? "hidden" : "visible"}`}>
                            {tc.isHidden ? "Hidden" : "Visible"}
                          </span>
                          <button
                            type="button"
                            className="btn-delete-tc"
                            onClick={() => handleDeleteTestCase(tc._id)}
                            disabled={deletingTcId === tc._id}
                            title="Delete this test case"
                          >
                            {deletingTcId === tc._id ? "Deleting..." : "✕ Delete"}
                          </button>
                        </div>
                        <div className="existing-tc-io">
                          <div>
                            <span className="io-label">Input</span>
                            <pre className="io-content">{tc.input}</pre>
                          </div>
                          <div>
                            <span className="io-label">Expected Output</span>
                            <pre className="io-content">{tc.expectedOutput}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Test Cases Section */}
              <div className="add-tc-section">
                <div className="cp-section-title">
                  <span className="cp-section-num">+</span>
                  Add New Test Cases
                </div>
                <p className="field-hint" style={{ marginBottom: 16 }}>
                  Enter one or multiple test cases to append to this problem.
                </p>

                <div className="cp-tc-list">
                  {newTestCases.map((tc, i) => (
                    <div key={i} className="cp-tc-block">
                      <div className="tc-block-header">
                        <div className="tc-header-left">
                          <span className="tc-num">New Case #{i + 1}</span>
                          <label className="tc-hidden-toggle">
                            <input
                              type="checkbox"
                              checked={tc.isHidden}
                              onChange={(e) => updateNewTestCase(i, "isHidden", e.target.checked)}
                            />
                            <span className={`tc-hidden-badge ${tc.isHidden ? "hidden" : "visible"}`}>
                              {tc.isHidden ? "Hidden" : "Visible"}
                            </span>
                          </label>
                        </div>
                        {newTestCases.length > 1 && (
                          <button
                            type="button"
                            className="btn-remove-item"
                            onClick={() => removeNewTestCase(i)}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label>Input *</label>
                          <textarea
                            rows={3}
                            className="cp-code-textarea"
                            value={tc.input}
                            onChange={(e) => updateNewTestCase(i, "input", e.target.value)}
                            placeholder="e.g. 2 or [2,7,11,15]\n9"
                          />
                        </div>
                        <div className="form-group">
                          <label>Expected Output *</label>
                          <textarea
                            rows={3}
                            className="cp-code-textarea"
                            value={tc.expectedOutput}
                            onChange={(e) => updateNewTestCase(i, "expectedOutput", e.target.value)}
                            placeholder="e.g. 2 or [0,1]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
                  <button type="button" className="btn-add-item" onClick={addNewTestCase}>
                    + Add Another Test Case
                  </button>
                  <button
                    type="button"
                    className="btn-cp-submit"
                    onClick={handleSaveNewTestCases}
                    disabled={savingNewTc}
                    style={{ marginLeft: "auto" }}
                  >
                    {savingNewTc
                      ? "Saving Test Cases..."
                      : `Save ${newTestCases.length} New Test Case${newTestCases.length > 1 ? "s" : ""}`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="delete-modal-overlay">
            <div className="delete-modal-card">
              <div className="delete-modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" width="32" height="32">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </div>
              <h3>Delete Problem #{problemNumber}?</h3>
              <p>
                Are you sure you want to permanently delete <strong>"{title}"</strong>?
                This will also delete all associated test cases and submissions. This action cannot be undone.
              </p>

              <div className="delete-modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deletingProblem}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-confirm-delete"
                  onClick={handleDeleteProblem}
                  disabled={deletingProblem}
                >
                  {deletingProblem ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default EditProblem;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { createProblem } from "../services/problemService";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./CreateProblem.css";

const SUPPORTED_TYPES = [
  "int", "long", "float", "double", "string", "bool",
  "vector<int>", "vector<string>", "vector<vector<int>>"
];

const BLANK_EXAMPLE   = { input: "", output: "", explanation: "" };
const BLANK_PARAM     = { name: "", type: "int" };
const BLANK_TESTCASE  = { input: "", expectedOutput: "", isHidden: true };

function CreateProblem() {
  const navigate = useNavigate();
  const { user } = useAuth();

  /* ── Phase tracking ── */
  const [phase, setPhase] = useState("problem"); // "problem" | "testcases"
  const [createdProblemId, setCreatedProblemId] = useState(null);
  const [createdProblemTitle, setCreatedProblemTitle] = useState("");

  /* ── Basic Info ── */
  const [problemNumber, setProblemNumber] = useState("");
  const [title,         setTitle]         = useState("");
  const [description,   setDescription]   = useState("");
  const [difficulty,    setDifficulty]    = useState("easy");
  const [tags,          setTags]          = useState("");
  const [constraints,   setConstraints]   = useState("");

  /* ── Judge Config ── */
  const [functionName, setFunctionName] = useState("");
  const [returnType,   setReturnType]   = useState("int");
  const [parameters,   setParameters]  = useState([{ ...BLANK_PARAM }]);
  const [starterCode,  setStarterCode] = useState("");

  /* ── Examples ── */
  const [examples, setExamples] = useState([{ ...BLANK_EXAMPLE }]);

  /* ── Test Cases ── */
  const [testCases,      setTestCases]      = useState([{ ...BLANK_TESTCASE }]);
  const [tcLoading,      setTcLoading]      = useState(false);
  const [tcError,        setTcError]        = useState("");
  const [tcSuccess,      setTcSuccess]      = useState("");
  const [savedTcCount,   setSavedTcCount]   = useState(0);

  /* ── General UI ── */
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  /* ─────────────── Auth Guard ──────────────── */
  if (user?.role !== "admin") {
    return (
      <div className="cp-page">
        <Navbar />
        <div className="cp-unauthorized">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="unauth-icon-svg">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <h2>Admin Access Required</h2>
          <p>You must be an administrator to create problems.</p>
          <button onClick={() => navigate("/problems")}>Back to Problems</button>
        </div>
      </div>
    );
  }

  /* ─────────────── Parameter helpers ──────────────── */
  const addParam    = () => setParameters([...parameters, { ...BLANK_PARAM }]);
  const removeParam = (i) => setParameters(parameters.filter((_, idx) => idx !== i));
  const updateParam = (i, field, val) => {
    const u = [...parameters]; u[i] = { ...u[i], [field]: val }; setParameters(u);
  };

  /* ─────────────── Example helpers ────────────────── */
  const addExample    = () => setExamples([...examples, { ...BLANK_EXAMPLE }]);
  const removeExample = (i) => setExamples(examples.filter((_, idx) => idx !== i));
  const updateExample = (i, field, val) => {
    const u = [...examples]; u[i] = { ...u[i], [field]: val }; setExamples(u);
  };

  /* ─────────────── Test Case helpers ──────────────── */
  const addTestCase    = () => setTestCases([...testCases, { ...BLANK_TESTCASE }]);
  const removeTestCase = (i) => setTestCases(testCases.filter((_, idx) => idx !== i));
  const updateTestCase = (i, field, val) => {
    const u = [...testCases]; u[i] = { ...u[i], [field]: val }; setTestCases(u);
  };

  /* ─────────────── Problem Submit ─────────────────── */
  const handleProblemSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (!problemNumber || isNaN(Number(problemNumber)) || Number(problemNumber) < 1)
      return setError("Problem number must be a positive integer.");
    if (!title.trim()) return setError("Problem title is required.");
    if (!description.trim()) return setError("Problem description is required.");
    if (!functionName.trim()) return setError("Function name is required.");
    if (parameters.some(p => !p.name.trim())) return setError("All parameter names must be filled.");
    if (!examples.every(ex => ex.input.trim() && ex.output.trim()))
      return setError("Each example must have both input and output.");

    const payload = {
      problemNumber: Number(problemNumber),
      title: title.trim(),
      description: description.trim(),
      difficulty,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      constraints: constraints.split("\n").map(c => c.trim()).filter(Boolean),
      examples: examples.map(ex => ({
        input: ex.input.trim(),
        output: ex.output.trim(),
        ...(ex.explanation.trim() && { explanation: ex.explanation.trim() }),
      })),
      functionName: functionName.trim(),
      ...(starterCode.trim() && { starterCode: starterCode.trim() }),
      judgeConfig: {
        returnType,
        parameters: parameters.map(p => ({ name: p.name.trim(), type: p.type })),
      },
    };

    setLoading(true);
    try {
      const res = await createProblem(payload);
      const pid   = res.data?._id;
      const ptitle = res.data?.title || title;
      setCreatedProblemId(pid);
      setCreatedProblemTitle(ptitle);
      setSuccess(`Problem "${ptitle}" created! Now add test cases below.`);
      setPhase("testcases");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create problem.");
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────── Test Cases Submit ──────────────── */
  const handleTestCasesSubmit = async () => {
    setTcError(""); setTcSuccess("");

    const valid = testCases.every(tc => tc.input.trim() && tc.expectedOutput.trim());
    if (!valid) return setTcError("Every test case must have both input and expected output.");

    setTcLoading(true);
    let saved = 0;
    const errors = [];

    for (const tc of testCases) {
      try {
        await api.post("/testcases", {
          problem: createdProblemId,
          input: tc.input.trim(),
          expectedOutput: tc.expectedOutput.trim(),
          isHidden: tc.isHidden,
        });
        saved++;
      } catch (err) {
        errors.push(err.response?.data?.message || "Failed to save a test case.");
      }
    }

    setSavedTcCount(saved);
    setTcLoading(false);

    if (errors.length > 0) {
      setTcError(`${saved} saved, but ${errors.length} failed: ${errors[0]}`);
    } else {
      setTcSuccess(`All ${saved} test cases saved successfully!`);
      setTimeout(() => navigate("/problems"), 1800);
    }
  };

  /* ─────────────── Render ─────────────────────────── */
  return (
    <div className="cp-page">
      <Navbar />
      <main className="cp-main">

        {/* Back Link */}
        <button className="cp-back-link" onClick={() => navigate("/problems")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to Problems
        </button>

        {/* ── PROGRESS STEPPER ── */}
        <div className="cp-stepper">
          <div className={`cp-step ${phase === "problem" ? "active" : "done"}`}>
            <span className="step-circle">{phase === "problem" ? "1" : "✓"}</span>
            <span className="step-label">Problem Details</span>
          </div>
          <div className="step-line" />
          <div className={`cp-step ${phase === "testcases" ? "active" : phase === "problem" ? "pending" : "done"}`}>
            <span className="step-circle">2</span>
            <span className="step-label">Test Cases</span>
          </div>
        </div>

        {/* ══════════════ PHASE 1 — Problem Form ══════════════ */}
        {phase === "problem" && (
          <div className="cp-card">
            <div className="cp-header">
              <span className="cp-admin-badge">Admin Portal</span>
              <h1 className="cp-title">Create New Problem</h1>
              <p className="cp-subtitle">
                Fill in the problem statement, examples, constraints, and judge config. Test cases come next.
              </p>
            </div>

            {error   && <div className="cp-alert error">{error}</div>}
            {success && <div className="cp-alert success">{success}</div>}

            <form onSubmit={handleProblemSubmit} className="cp-form">

              {/* SECTION 1 — Basic Info */}
              <div className="cp-section">
                <div className="cp-section-title">
                  <span className="cp-section-num">1</span>
                  Basic Information
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Problem Number *</label>
                    <input type="number" min="1" placeholder="e.g. 5"
                      value={problemNumber} onChange={e => setProblemNumber(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Difficulty *</label>
                    <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Problem Title *</label>
                  <input type="text" placeholder="e.g. Climbing Stairs"
                    value={title} onChange={e => setTitle(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label>Problem Description *</label>
                  <span className="field-hint">Describe the task clearly.</span>
                  <textarea rows={6}
                    placeholder="You are climbing a staircase. It takes n steps to reach the top..."
                    value={description} onChange={e => setDescription(e.target.value)} required />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Tags</label>
                    <span className="field-hint">Comma-separated</span>
                    <input type="text" placeholder="Dynamic Programming, Math"
                      value={tags} onChange={e => setTags(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Constraints</label>
                    <span className="field-hint">One per line</span>
                    <textarea rows={3} placeholder={"1 <= n <= 45"}
                      value={constraints} onChange={e => setConstraints(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* SECTION 2 — Examples */}
              <div className="cp-section">
                <div className="cp-section-title">
                  <span className="cp-section-num">2</span>
                  Examples <span className="section-sub">(shown to users)</span>
                </div>

                {examples.map((ex, i) => (
                  <div key={i} className="cp-example-block">
                    <div className="example-block-header">
                      <span className="example-num">Example {i + 1}</span>
                      {examples.length > 1 && (
                        <button type="button" className="btn-remove-item" onClick={() => removeExample(i)}>
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Input *</label>
                        <textarea rows={2} placeholder="n = 2"
                          value={ex.input} onChange={e => updateExample(i, "input", e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Output *</label>
                        <textarea rows={2} placeholder="2"
                          value={ex.output} onChange={e => updateExample(i, "output", e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Explanation (optional)</label>
                      <input type="text" placeholder="There are two ways: 1+1 or 2."
                        value={ex.explanation} onChange={e => updateExample(i, "explanation", e.target.value)} />
                    </div>
                  </div>
                ))}
                <button type="button" className="btn-add-item" onClick={addExample}>+ Add Example</button>
              </div>

              {/* SECTION 3 — Judge Config */}
              <div className="cp-section">
                <div className="cp-section-title">
                  <span className="cp-section-num">3</span>
                  Function & Judge Configuration
                </div>
                <p className="field-hint" style={{ marginBottom: "16px" }}>
                  Tells the judge how to call your function and parse inputs/outputs.
                </p>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Function Name *</label>
                    <input type="text" placeholder="climbStairs"
                      value={functionName} onChange={e => setFunctionName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Return Type *</label>
                    <select value={returnType} onChange={e => setReturnType(e.target.value)}>
                      {SUPPORTED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Parameters</label>
                  <div className="cp-param-header">
                    <span></span><span>Parameter Name</span><span>Type</span><span></span>
                  </div>
                  <div className="cp-params-list">
                    {parameters.map((param, i) => (
                      <div key={i} className="cp-param-row">
                        <span className="param-index">p{i + 1}</span>
                        <input type="text" className="param-name-input"
                          placeholder="name (e.g. n)"
                          value={param.name} onChange={e => updateParam(i, "name", e.target.value)} />
                        <select className="param-type-select" value={param.type}
                          onChange={e => updateParam(i, "type", e.target.value)}>
                          {SUPPORTED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        {parameters.length > 1 && (
                          <button type="button" className="param-remove-btn" onClick={() => removeParam(i)}>✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" className="btn-add-item" style={{ marginTop: "10px" }} onClick={addParam}>
                    + Add Parameter
                  </button>
                </div>

                <div className="form-group">
                  <label>Starter Code (optional)</label>
                  <span className="field-hint">Template shown in the editor.</span>
                  <textarea rows={7}
                    placeholder={"class Solution {\npublic:\n    int climbStairs(int n) {\n        // your code here\n    }\n};"}
                    value={starterCode} onChange={e => setStarterCode(e.target.value)}
                    className="cp-code-textarea" />
                </div>
              </div>

              {/* Footer */}
              <div className="cp-form-footer">
                <button type="button" className="btn-cp-cancel" onClick={() => navigate("/problems")}>
                  Cancel
                </button>
                <button type="submit" className="btn-cp-submit" disabled={loading}>
                  {loading ? "Creating..." : "Save & Add Test Cases →"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ══════════════ PHASE 2 — Test Cases ══════════════ */}
        {phase === "testcases" && (
          <div className="cp-card">
            <div className="cp-header">
              <span className="cp-admin-badge">Step 2 of 2</span>
              <h1 className="cp-title">Add Test Cases</h1>
              <p className="cp-subtitle">
                Problem <strong>"{createdProblemTitle}"</strong> created. Now add hidden test cases the judge will use to evaluate submissions.
              </p>
            </div>

            {tcError   && <div className="cp-alert error">{tcError}</div>}
            {tcSuccess && <div className="cp-alert success">{tcSuccess}</div>}

            {/* Test Case info box */}
            <div className="tc-info-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>
                <strong>Hidden</strong> test cases are not shown to users but are used for final evaluation.
                <strong> Visible</strong> test cases appear in the problem's "Run" panel.
              </span>
            </div>

            {/* Test Cases list */}
            <div className="cp-tc-list">
              {testCases.map((tc, i) => (
                <div key={i} className="cp-tc-block">
                  <div className="tc-block-header">
                    <div className="tc-header-left">
                      <span className="tc-num">Test Case {i + 1}</span>
                      <label className="tc-hidden-toggle">
                        <input
                          type="checkbox"
                          checked={tc.isHidden}
                          onChange={e => updateTestCase(i, "isHidden", e.target.checked)}
                        />
                        <span className={`tc-hidden-badge ${tc.isHidden ? "hidden" : "visible"}`}>
                          {tc.isHidden ? "Hidden" : "Visible"}
                        </span>
                      </label>
                    </div>
                    {testCases.length > 1 && (
                      <button type="button" className="btn-remove-item" onClick={() => removeTestCase(i)}>
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Input *</label>
                      <span className="field-hint">Exact input as the judge will receive</span>
                      <textarea rows={3}
                        placeholder={"2"}
                        className="cp-code-textarea"
                        value={tc.input}
                        onChange={e => updateTestCase(i, "input", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Expected Output *</label>
                      <span className="field-hint">Exact expected output string</span>
                      <textarea rows={3}
                        placeholder={"2"}
                        className="cp-code-textarea"
                        value={tc.expectedOutput}
                        onChange={e => updateTestCase(i, "expectedOutput", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="btn-add-item" style={{ marginTop: "4px" }} onClick={addTestCase}>
              + Add Test Case
            </button>

            {/* TC Footer */}
            <div className="cp-form-footer" style={{ marginTop: "24px" }}>
              <button
                type="button"
                className="btn-cp-cancel"
                onClick={() => navigate("/problems")}
              >
                Skip & Go to Problems
              </button>
              <button
                type="button"
                className="btn-cp-submit"
                onClick={handleTestCasesSubmit}
                disabled={tcLoading}
              >
                {tcLoading
                  ? `Saving... (${savedTcCount}/${testCases.length})`
                  : `Publish ${testCases.length} Test Case${testCases.length > 1 ? "s" : ""}`
                }
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default CreateProblem;

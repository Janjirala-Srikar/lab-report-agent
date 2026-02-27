import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../Styles/Upload.css";

const formatBytes = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

const LANGUAGES = [
  { key: "english", label: "English", flag: "EN" },
  { key: "telugu", label: "తెలుగు", flag: "TE" },
  { key: "hindi", label: "हिन्दी", flag: "HI" },
];

const Upload = () => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState(() => {
    const saved = sessionStorage.getItem("labResult");
    return saved ? JSON.parse(saved) : null;
  });

  const [activeLang, setActiveLang] = useState(() => {
    return sessionStorage.getItem("labLang") || "english";
  });

  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (result) sessionStorage.setItem("labResult", JSON.stringify(result));
  }, [result]);

  useEffect(() => {
    sessionStorage.setItem("labLang", activeLang);
  }, [activeLang]);

  const handleFile = (incoming) => {
    setError("");
    setResult(null);
    if (!incoming) return;
    if (incoming.type !== "application/pdf") {
      setError("Only .pdf files are supported.");
      return;
    }
    setFile(incoming);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleSubmit = async () => {
    if (!file) return;
    if (!token) { navigate("/login"); return; }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/upload", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const processed = res.data?.data?.[0];
      if (!processed) { setError("Invalid server response."); return; }
      setResult(processed);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setError(err.response?.data?.message || "Failed to process PDF.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatExplanation = (text) => {
    if (!text) return null;

    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);

      if (parts.length === 1) {
        if (line.startsWith('*   ') || line.startsWith('    *   ')) {
          const indent = line.startsWith('    *   ');
          const content = line.replace(/^\s*\*\s+/, '');
          const subParts = content.split(/\*\*(.*?)\*\*/g);
          return (
            <li key={i} className={indent ? "explanation-sub-item" : "explanation-item"}>
              {subParts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
            </li>
          );
        }
        if (!line.trim()) return null;
        return <p key={i} className="explanation-para">{line}</p>;
      }

      return (
        <p key={i} className="explanation-para">
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
        </p>
      );
    });
  };

  const getStatusClass = (test) => {
    const { value, reference_range } = test;
    if (!value || !reference_range) return "";
    const val = parseFloat(value);
    if (isNaN(val)) return "";
    const gtMatch = reference_range.match(/^>(\d+)/);
    const ltMatch = reference_range.match(/^<(\d+)/);
    const rangeMatch = reference_range.match(/^(\d+\.?\d*)-(\d+\.?\d*)/);
    if (gtMatch && val > parseFloat(gtMatch[1])) return "status-normal";
    if (ltMatch && val < parseFloat(ltMatch[1])) return "status-normal";
    if (rangeMatch) {
      const [, lo, hi] = rangeMatch;
      if (val >= parseFloat(lo) && val <= parseFloat(hi)) return "status-normal";
      return val < parseFloat(lo) ? "status-low" : "status-high";
    }
    return "";
  };

  return (
    <main className="up-page">
      <div className="up-inner">

        {!result ? (
          <div className="up-card">
            <h1>Analyse Your Lab Report</h1>

            <div
              className={`up-dropzone ${isDragging ? "up-dropzone--drag" : ""}`}
              onClick={() => !file && inputRef.current.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="up-input-hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
              {!file ? (
                <p>Drop PDF here or click to browse</p>
              ) : (
                <div>
                  <span>{file.name}</span>
                  <span>{formatBytes(file.size)}</span>
                </div>
              )}
            </div>

            {error && <p className="up-error">{error}</p>}

            <button onClick={handleSubmit} disabled={!file || loading}>
              {loading ? (
                <>
                  <span className="up-spinner" />
                  Analysing...
                </>
              ) : "Generate Report"}
            </button>
          </div>
        ) : (
          <div className="result-wrap">

            {/* Top bar */}
            <div className="result-topbar">
              <button
                className="result-new-btn"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setActiveLang("english");
                  sessionStorage.removeItem("labResult");
                  sessionStorage.removeItem("labLang");
                }}
              >
                ← New Report
              </button>
              <div className="result-patient-pill">
                <span className="patient-label">Patient</span>
                <span className="patient-name">{result.structured_data?.patient_name}</span>
                {result.structured_data?.age && (
                  <span className="patient-meta">{result.structured_data.age}</span>
                )}
                {result.structured_data?.gender && (
                  <span className="patient-meta">{result.structured_data.gender}</span>
                )}
              </div>
            </div>

            {/* Two-panel layout */}
            <div className="result-panels">

              {/* LEFT — scrollable table */}
              <div className="panel-left">
                <div className="panel-header">
                  <span>Test Results</span>
                  <div className="legend">
                    <span className="legend-dot normal" />Normal
                    <span className="legend-dot high" />High
                    <span className="legend-dot low" />Low
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Test</th>
                        <th>Value</th>
                        <th>Unit</th>
                        <th>Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.structured_data?.tests?.map((test, i) => (
                        <tr key={i} className={getStatusClass(test)}>
                          <td className="td-test">{test.test_name}</td>
                          <td className="td-value">{test.value || "—"}</td>
                          <td className="td-unit">{test.unit || "—"}</td>
                          <td className="td-range">{test.reference_range || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RIGHT — sticky explanation */}
              <div className="panel-right">
                <div className="lang-toggle">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.key}
                      className={activeLang === lang.key ? "lang-btn lang-active" : "lang-btn"}
                      onClick={() => setActiveLang(lang.key)}
                    >
                      <span className="lang-flag">{lang.flag}</span>
                      <span className="lang-label">{lang.label}</span>
                    </button>
                  ))}
                </div>

                <div className="explanation-scroll">
                  <div className="explanation-content">
                    {formatExplanation(result.explanation?.[activeLang])}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  );
};

export default Upload;
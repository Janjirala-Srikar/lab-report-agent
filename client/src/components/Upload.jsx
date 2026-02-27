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
  { key: "english", label: "English" },
  { key: "hindi", label: "हिन्दी" },
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synth = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const voicesRef = useRef([]);
  const stoppingRef = useRef(false);

  useEffect(() => {
    if (result) sessionStorage.setItem("labResult", JSON.stringify(result));
  }, [result]);

  useEffect(() => {
    sessionStorage.setItem("labLang", activeLang);
  }, [activeLang]);

  // If stored language is no longer available (e.g., Telugu removed), reset to English
  useEffect(() => {
    const keys = LANGUAGES.map(l => l.key);
    if (!keys.includes(activeLang)) {
      setActiveLang('english');
    }
  }, []);

  // Load available voices for SpeechSynthesis
  useEffect(() => {
    if (!synth.current) return;

    const load = () => {
      const list = synth.current.getVoices() || [];
      if (list.length) {
        voicesRef.current = list;
      }
    };

    load();
    synth.current.onvoiceschanged = load;

    return () => { if (synth.current) synth.current.onvoiceschanged = null; };
  }, []);

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

  const getLanguageCode = (lang) => {
    const langMap = {
      english: "en-US",
      hindi: "hi-IN",
    };
    return langMap[lang] || "en-US";
  };

  const findVoiceForLang = (prefix) => {
    const list = voicesRef.current || [];
    if (!list.length) return null;
    const p = prefix.toLowerCase();
    let v = list.find(v => v.lang && v.lang.toLowerCase().startsWith(p));
    if (!v) v = list.find(v => v.name && v.name.toLowerCase().includes(p));
    return v || null;
  };

  const handleSpeak = () => {
    const text = result?.explanation?.[activeLang];
    if (!text) { setError('No text available to speak'); return; }

    if (!synth.current) { setError('Speech Synthesis not supported in this browser'); return; }

    // If currently speaking -> stop
    if (isSpeaking) {
      stoppingRef.current = true;
      synth.current.cancel();
      setIsSpeaking(false);
      setTimeout(() => { stoppingRef.current = false; }, 500);
      return;
    }

    // Ensure voices are loaded (best-effort)
    const langCode = getLanguageCode(activeLang);
    const prefix = langCode.split('-')[0];
    const preferredVoice = findVoiceForLang(prefix);

    // Split long text into smaller chunks to avoid browser TTS truncation
    const MAX_CHUNK = 240; // chars
    const sentences = text.replace(/\s+/g, ' ').split(/(?<=[.?!])\s+/);
    let chunks = [];
    let buffer = '';
    for (const s of sentences) {
      if ((buffer + ' ' + s).trim().length <= MAX_CHUNK) {
        buffer = (buffer + ' ' + s).trim();
      } else {
        if (buffer) chunks.push(buffer);
        if (s.length <= MAX_CHUNK) buffer = s.trim();
        else {
          // further split long sentence
          for (let i = 0; i < s.length; i += MAX_CHUNK) {
            chunks.push(s.substring(i, i + MAX_CHUNK).trim());
          }
          buffer = '';
        }
      }
    }
    if (buffer) chunks.push(buffer);

    if (!chunks.length) { setError('No text to speak'); return; }

    let idx = 0;
    setError('');
    setIsSpeaking(true);

    const speakNext = () => {
      if (stoppingRef.current) { setIsSpeaking(false); stoppingRef.current = false; return; }
      if (idx >= chunks.length) { setIsSpeaking(false); return; }
      const u = new SpeechSynthesisUtterance(chunks[idx]);
      u.lang = langCode;
      if (preferredVoice) u.voice = preferredVoice;
      u.rate = 0.95; u.pitch = 1; u.volume = 1;
      u.onend = () => {
        idx += 1;
        // Small delay between chunks to be safe
        setTimeout(() => speakNext(), 80);
      };
      u.onerror = (e) => {
        console.error('TTS chunk error', e);
        if (e && (e.error === 'interrupted' || stoppingRef.current)) {
          stoppingRef.current = false; setIsSpeaking(false); return;
        }
        setError('Speech error: ' + (e?.error || 'unknown'));
        setIsSpeaking(false);
      };
      synth.current.speak(u);
    };

    // Start speaking
    idx = 0;
    synth.current.cancel();
    speakNext();
  };

  return (
    <main className="up-page">
      {!result ? (
        <div className="up-container">
          <div className="up-content">
            <h1 className="up-title">Upload Your Lab Report</h1>
            <p className="up-subtitle">Get instant insights about your health in seconds</p>

            <div
              className={`up-dropzone ${isDragging ? "up-dropzone--active" : ""}`}
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
              <div className="up-dropzone-content">
                {!file ? (
                  <>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span className="up-dropzone-text">Drop your PDF here or click to browse</span>
                  </>
                ) : (
                  <div className="up-file-info">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                      <polyline points="13 2 13 9 20 9" />
                    </svg>
                    <div>
                      <p className="up-file-name">{file.name}</p>
                      <p className="up-file-size">{formatBytes(file.size)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && <p className="up-error">{error}</p>}

            <button className="up-btn" onClick={handleSubmit} disabled={!file || loading}>
              {loading ? (
                <>
                  <span className="up-spinner" />
                  Analysing...
                </>
              ) : "Analyse Report"}
            </button>
          </div>
        </div>
      ) : (
        <div className="result-container">
          <div className="result-header">
            <div className="result-patient">
              <h2>{result.structured_data?.patient_name}</h2>
              <div className="result-meta">
                {result.structured_data?.age && <span>{result.structured_data.age}</span>}
                {result.structured_data?.gender && <span>{result.structured_data.gender}</span>}
              </div>
            </div>
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
              Upload New Report
            </button>
          </div>

          <div className="result-content">
            <div className="result-tests">
              <h3>Test Results</h3>
              <div className="tests-table">
                {result.structured_data?.tests?.map((test, i) => (
                  <div key={i} className={`test-row ${getStatusClass(test)}`}>
                    <div className="test-info">
                      <p className="test-name">{test.test_name}</p>
                      <p className="test-range">{test.reference_range || "—"}</p>
                    </div>
                    <div className="test-value">
                      <span className="value">{test.value || "—"}</span>
                      <span className="unit">{test.unit || "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="result-analysis">
              <div className="analysis-header">
                <h3>Analysis</h3>
                <div className="lang-switch">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.key}
                      className={`lang-btn ${activeLang === lang.key ? "lang-btn--active" : ""}`}
                      onClick={() => {
                        if (isSpeaking && synth.current) {
                          stoppingRef.current = true;
                          synth.current.cancel();
                          setTimeout(() => { stoppingRef.current = false; }, 500);
                        }
                        setActiveLang(lang.key);
                      }}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                className={`voice-btn ${isSpeaking ? "voice-btn--active" : ""}`}
                onClick={handleSpeak}
                title={isSpeaking ? "Stop" : "Listen"}
              >
                {isSpeaking ? "⏹" : "🔊"}
              </button>
              <div className="analysis-text">
                {formatExplanation(result.explanation?.[activeLang])}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Upload;
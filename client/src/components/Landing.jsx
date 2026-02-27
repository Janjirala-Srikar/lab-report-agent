import { useEffect, useRef, useState } from "react";
import "../styles/landing.css";
import { Link } from "react-router-dom";
import DotGrid from "./DotGrid";


const REPORT_ITEMS = [
  { label: "Hemoglobin (HGB)", value: "14.2 g/dL", tag: "normal" },
  { label: "RBC Count", value: "4.9 M/µL", tag: "normal" },
  { label: "Hematocrit (HCT)", value: "42%", tag: "normal" },
  { label: "MCV", value: "88 fL", tag: "normal" },

  { label: "WBC Count", value: "11.8 K/µL", tag: "high" },
  { label: "Neutrophils", value: "72%", tag: "high" },
  // { label: "Lymphocytes", value: "22%", tag: "normal" },
  // { label: "Monocytes", value: "4%", tag: "normal" },
  // { label: "Eosinophils", value: "1%", tag: "normal" },
];



const FEATURES = [
  { icon: "🧾", theme: "green", title: "Intelligent PDF Parsing", desc: "PDFPlumber extracts tabular lab data from any report format with high accuracy, handling varied layouts." },
  { icon: "📊", theme: "warm", title: "Medical Benchmark Comparison", desc: "Every value is compared against curated, up-to-date reference ranges stratified by age and gender." },
  { icon: "🤖", theme: "blue", title: "RAG-Powered Explanations", desc: "LangChain retrieval-augmented generation fetches relevant medical knowledge for contextual, accurate summaries." },
  { icon: "🔴", theme: "purple", title: "Abnormality Highlighting", desc: "Critical and borderline values are clearly flagged with severity indicators and plain-English context." },
  { icon: "💬", theme: "gold", title: "Patient-Friendly Language", desc: "Complex medical terminology is translated into clear, calming language that anyone can understand." },
  { icon: "🔒", theme: "teal", title: "Privacy First", desc: "Reports are processed securely and never stored. Your medical data stays yours." },
];



const DELIVERABLES = [
  {
    num: "1",
    title: "Lab Report Intelligence Agent",
    desc: "A fully functional AI agent that parses, analyzes, and interprets diagnostic lab reports end-to-end.",
  },
  {
    num: "2",
    title: "Human-Friendly Report Generator",
    desc: "Generates readable, structured summaries that patients can act on and bring to follow-up appointments.",
  },
  {
    num: "3",
    title: "Demo with Sample Lab Reports",
    desc: "Live demonstration using real-world sample reports covering CBC, metabolic panels, and lipid profiles.",
  },
  {
    num: "4",
    title: "Medical Benchmark Reference System",
    desc: "A curated, queryable database of clinical reference ranges used to contextualize every lab value.",
  },
];

function useScrollAnimate() {
  const refs = useRef([]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.12 }
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return (i) => (el) => { refs.current[i] = el; };
}

export default function App() {
  const ref = useScrollAnimate();
  const videoSectionRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="hero" style={{ margin: 0, padding: '0 0 120px 0', overflow: 'visible', minHeight: '100vh', position: 'relative' }}>
        <DotGrid 
          className="hero-dot-grid" 
          dotSize={8}
          gap={15}
          baseColor="#201731"
          activeColor="#691500"
          proximity={190}
          shockRadius={350}
          shockStrength={9}
          resistance={750}
          returnDuration={1.5}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, margin: 0, padding: 0 }}
        />

        {/* NAV - Glass Morphism Capsule Floating */}
        <nav style={{ 
          position: 'fixed', 
          top: '30px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          zIndex: 1000, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '12px 15px',
          // gap: '80px',
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(12px)',
          borderRadius: '100px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          maxWidth: scrolled ? '100%' : '98%',
          width: '500px',
        }}>
          <a href="#" className="nav-logo">
            <div className="logo">Quantera</div>
          </a>
          <ul className="nav-links">
            <li>
              <Link to="/register" className="nav-cta">Register</Link>
            </li>
            <li>
              <Link to="/login" className="nav-cta">Login</Link>
            </li>
          </ul>
        </nav>
        <div className="hero-badge">
          
        </div>
        <h1 style={{ position: 'relative', zIndex: 20 }} className="hi123">
          Lab reports, <em>finally</em>
          <br />
          explained clearly
        </h1>
        <p className="hero-sub" style={{ position: 'relative', zIndex: 20 }}>
          Turn complex lab reports into clear, human explanations.
        </p>
        <div className="hero-actions" style={{ position: 'relative', zIndex: 20 }}>
          <Link to="/login" className="btn-primary">
  Upload Medical Report
</Link>
          <a
            href="#"
            className="btn-ghost"
            onClick={e => {
              e.preventDefault();
              videoSectionRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span>▶</span> See how it works
          </a>
        </div>

        {/* DEMO REPORT */}
        <div className="hero-visual" style={{ position: 'relative', zIndex: 20 }}>
          <div className="report-header">
            <div className="report-dots">
              <span /><span /><span />
            </div>
            <span className="report-title">Complete Blood Count · Processed by Quantera</span>
          </div>
          <div className="report-body">
            <div>
              <p className="report-section-title">Raw Lab Values</p>
              {REPORT_ITEMS.map((item) => (
                <div className="report-item" key={item.label}>
                  <span className="report-label">{item.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="report-value">{item.value}</span>
                    <span className={`tag tag-${item.tag}`}>
                      {item.tag.charAt(0).toUpperCase() + item.tag.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <p className="report-section-title">AI-Generated Summary</p>
              <div className="report-summary">
  <div className="report-summary-header">
    <div className="report-summary-icon">✦</div>
    <span className="report-summary-label">Quantera Insight</span>
  </div>
  <p>
    Your Complete Blood Count indicates overall stable health parameters. Hemoglobin is within the optimal range, reflecting adequate oxygen transport and no signs of anemia. Fasting glucose remains well-controlled and does not suggest impaired glucose tolerance. However, your white blood cell countis mildly elevated, which may indicate an ongoing immune response due to infection, inflammation, recent physical stress, or recovery from illness. Platelets  are slightly below the typical reference threshold but remain close to normal, making this a borderline finding rather than an immediate concern.
  </p>
</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      {/* <section className="how-section" id="how-it-works">
        <div className="how-inner">
          <div ref={ref(0)} className="animate-in">
            <p className="section-label">How It Works</p>
            <h2 className="section-title">From raw data to clear understanding in seconds</h2>
            <p className="section-sub">
              A four-step pipeline designed around the patient experience — not the clinician's workflow.
            </p>
          </div>
          <div className="steps" ref={ref(1)}>
            {HOW_STEPS.map((s) => (
              <div className="step animate-in" key={s.num} ref={ref(`step-${s.num}`)}>
                <div className="step-num">{s.num}</div>
                <div className="step-content">
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* FEATURES */}
      <section id="features" style={{ maxWidth: "none" }}>
        <div className="features-section" style={{ maxWidth: 1140, margin: "0 auto" }}>
          <p className="section-label" ref={ref(10)} style={{}} >Features</p>
          <h2 className="section-title">Everything a patient needs to feel informed</h2>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div className="feature-card animate-in" key={f.title} ref={ref(20 + i)}>
                <div className={`feature-icon ${f.theme}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECH STACK */}
      {/* <section className="tech-section" id="tech-stack">
        <div className="tech-inner">
          <div ref={ref(30)} className="animate-in">
            <p className="section-label">Tech Stack</p>
            <h2 className="section-title">Built on a foundation of proven AI infrastructure</h2>
            <p className="section-sub">
              Python, LangChain, PDFPlumber, and a RAG pipeline combine to form a robust, scalable diagnostic intelligence system.
            </p>
          </div>
          <div ref={ref(31)} className="animate-in">
            <div className="tech-chips">
              {TECH_STACK.map((t) => (
                <div className="chip" key={t.label}>
                  <span className="chip-icon">{t.icon}</span>
                  {t.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section> */}

        {/* VIDEO DEMO */}
      {/* VIDEO DEMO */}
{/* VIDEO DEMO */}
<section className="video-demo-section" id="video-demo" ref={videoSectionRef}>
  <div className="video-demo-inner">
    <div className="video-demo-content animate-in" ref={ref(40)}>
      <p className="section-label">How It Works</p>
      <h2 className="section-title">See Quantera in action</h2>
      <p className="section-sub">
        Watch how our AI-powered platform transforms complex lab reports into clear, understandable summaries in just seconds. Upload a report, get instant insights, and take control of your health.
      </p>
      <ul className="demo-benefits">
        <li>Upload any lab report in PDF format</li>
        <li>AI automatically parses and analyzes your results</li>
        <li>Receive plain-English explanations</li>
        <li>Get flagged abnormalities with context</li>
      </ul>
    </div>

  <div className="video-demo-player animate-in" ref={ref(41)}>
  <video
    autoPlay
    muted
    loop
    playsInline
    style={{
      width: "100%",
      height: "100%",
      borderRadius: "12px",
      objectFit: "cover"
    }}
  >
    <source
      src="https://files.catbox.moe/v3swok.mp4"
      type="video/mp4"
    />
  </video>
</div>
  </div>
</section>

      {/* CTA */}
      <section className="cta-section" id="cta">
  <div className="cta-inner animate-in" ref={ref(60)}>
    <p className="section-label">Take Control</p>
    <h2 className="section-title">
      Understand your health in minutes, not hours
    </h2>
    <p className="section-sub">
      Upload your lab report and receive clear explanations, risk indicators,
      trend analysis, and actionable insights, powered by intelligent medical analysis.
      No jargon. No confusion. Just clarity.
    </p>
  </div>
</section>

      {/* FOOTER */}
      <footer>
  <div>
    <div className="footer-left">
      <img 
        src="https://files.catbox.moe/t8406d.svg" 
        alt="Quantera Logo" 
        style={{ height: '44px', width: 'auto', display: 'inline-block', marginRight: '8px' }}
      />
      
    </div>
    <p className="footer-tagline">
      AI-powered Lab Report Intelligence · Making Diagnostics Understandable
    </p>
  </div>
  <div className="footer-right">
    Team Lumora 
  </div>
</footer>
    </>
  );
}
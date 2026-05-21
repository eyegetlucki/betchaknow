import { useState, useRef } from "react";
import { api, saveSession } from "./api";

const C = {
  bg:       "#08070f",
  card:     "#110f1e",
  border:   "#1e1b35",
  border2:  "#2e2b4a",
  accent1:  "#ff6b6b",
  accent2:  "#ffd93d",
  accent3:  "#6bcb77",
  accent4:  "#4d96ff",
  accent5:  "#c77dff",
  text:     "#f0eeff",
  muted:    "#7b789a",
  muted2:   "#4a4768",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Boogaloo&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; }

  @keyframes fadeUp    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes popIn     { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
  @keyframes floatA    { 0%,100%{transform:translateY(0)   rotate(0deg)}  50%{transform:translateY(-18px) rotate(4deg)} }
  @keyframes floatB    { 0%,100%{transform:translateY(0)   rotate(0deg)}  50%{transform:translateY(-12px) rotate(-3deg)} }
  @keyframes spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes shake     { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-7px)} 40%{transform:translateX(7px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
  @keyframes successPop{ 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
  @keyframes orb1      { 0%,100%{transform:translate(0,0) scale(1)}    50%{transform:translate(30px,-20px) scale(1.1)} }
  @keyframes orb2      { 0%,100%{transform:translate(0,0) scale(1)}    50%{transform:translate(-25px,15px) scale(0.9)} }
  @keyframes orb3      { 0%,100%{transform:translate(0,0) scale(1)}    50%{transform:translate(20px,25px)  scale(1.05)} }

  .field-group { display:flex; flex-direction:column; gap:6px; }
  .label { font-family:'Plus Jakarta Sans',sans-serif; font-size:11px; font-weight:700;
           letter-spacing:1.2px; text-transform:uppercase; color:${C.muted}; }

  .input-wrap { position:relative; }
  .input-wrap input {
    width:100%; padding:13px 16px 13px 44px;
    background:#0d0b1a; border:1.5px solid ${C.border2};
    border-radius:12px; color:${C.text};
    font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; font-weight:500;
    outline:none; transition:border-color 0.2s, box-shadow 0.2s;
  }
  .input-wrap input::placeholder { color:${C.muted2}; }
  .input-wrap input:focus { border-color:${C.accent4}; box-shadow:0 0 0 3px ${C.accent4}22; }
  .input-wrap input.error { border-color:${C.accent1}; box-shadow:0 0 0 3px ${C.accent1}22; }
  .input-icon {
    position:absolute; left:14px; top:50%; transform:translateY(-50%);
    font-size:16px; pointer-events:none; line-height:1;
  }
  .input-toggle {
    position:absolute; right:14px; top:50%; transform:translateY(-50%);
    background:none; border:none; cursor:pointer; color:${C.muted};
    font-size:13px; font-family:'Plus Jakarta Sans',sans-serif; font-weight:600;
    padding:2px 6px; border-radius:6px; transition:color 0.15s;
  }
  .input-toggle:hover { color:${C.text}; }

  .err-msg { font-size:12px; color:${C.accent1}; font-weight:600;
             font-family:'Plus Jakarta Sans',sans-serif; margin-top:2px; }

  .divider { display:flex; align-items:center; gap:12px; }
  .divider-line { flex:1; height:1px; background:${C.border2}; }
  .divider-text { color:${C.muted2}; font-size:12px; font-weight:600;
                  font-family:'Plus Jakarta Sans',sans-serif; white-space:nowrap; }

  .oauth-btn {
    width:100%; padding:12px 20px; border-radius:12px;
    border:1.5px solid ${C.border2}; background:#0d0b1a;
    color:${C.text}; font-family:'Plus Jakarta Sans',sans-serif;
    font-size:14px; font-weight:700; cursor:pointer;
    display:flex; align-items:center; justify-content:center; gap:10px;
    transition:border-color 0.2s, background 0.2s, transform 0.12s;
  }
  .oauth-btn:hover { background:#13101f; transform:translateY(-1px); }
  .oauth-btn:active { transform:scale(0.97); }

  .primary-btn {
    width:100%; padding:14px 20px; border-radius:12px; border:none;
    font-family:'Plus Jakarta Sans',sans-serif; font-size:15px; font-weight:800;
    cursor:pointer; transition:transform 0.12s, box-shadow 0.2s; letter-spacing:0.3px;
  }
  .primary-btn:not(:disabled):hover  { transform:translateY(-2px); }
  .primary-btn:not(:disabled):active { transform:scale(0.97); }
  .primary-btn:disabled { opacity:0.5; cursor:not-allowed; }

  .link-btn {
    background:none; border:none; cursor:pointer; padding:0;
    font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:13px;
    transition:opacity 0.15s;
  }
  .link-btn:hover { opacity:0.75; }

  .strength-bar { height:4px; border-radius:2px; transition:width 0.3s, background 0.3s; }
  .check-item { display:flex; align-items:center; gap:8px;
                font-size:12px; font-family:'Plus Jakarta Sans',sans-serif; font-weight:500; }

  .code-input {
    width:52px; height:64px; text-align:center; font-size:24px; font-weight:800;
    background:#0d0b1a; border:2px solid ${C.border2}; border-radius:12px;
    color:${C.text}; font-family:'Boogaloo',cursive; outline:none;
    transition:border-color 0.2s, box-shadow 0.2s; caret-color:${C.accent4};
  }
  .code-input:focus { border-color:${C.accent4}; box-shadow:0 0 0 3px ${C.accent4}22; }
  .code-input.filled { border-color:${C.accent3}; }
`;

function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function pwStrength(pw) {
  let s = 0;
  if (pw.length >= 8)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const strengthLabel = ["Too short","Weak","Fair","Good","Strong"];
const strengthColor = [C.muted2, C.accent1, C.accent2, C.accent2, C.accent3];

function Orbs() {
  return (
    <div style={{ position:"fixed", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
      <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%",
        background:`radial-gradient(circle, ${C.accent5}18 0%, transparent 70%)`,
        top:"-10%", left:"-10%", animation:"orb1 12s ease-in-out infinite" }} />
      <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%",
        background:`radial-gradient(circle, ${C.accent4}14 0%, transparent 70%)`,
        top:"40%", right:"-8%", animation:"orb2 15s ease-in-out infinite" }} />
      <div style={{ position:"absolute", width:350, height:350, borderRadius:"50%",
        background:`radial-gradient(circle, ${C.accent1}10 0%, transparent 70%)`,
        bottom:"-5%", left:"30%", animation:"orb3 10s ease-in-out infinite" }} />
      <div style={{
        position:"absolute", inset:0,
        backgroundImage:`linear-gradient(${C.border}55 1px, transparent 1px),
                         linear-gradient(90deg, ${C.border}55 1px, transparent 1px)`,
        backgroundSize:"40px 40px", opacity:0.3,
      }} />
    </div>
  );
}

function Logo({ size = "md" }) {
  const big = size === "lg";
  return (
    <div style={{ textAlign:"center", animation:"fadeUp 0.5s ease" }}>
      <div style={{ fontSize: big ? 52 : 36, lineHeight:1, marginBottom: big ? 4 : 2,
                    animation:"floatA 5s ease-in-out infinite" }}>🎯</div>
      <h1 style={{ fontFamily:"'Boogaloo',cursive", fontSize: big ? 52 : 34,
                   lineHeight:1, letterSpacing:-0.5, margin:0 }}>
        <span style={{ color:C.accent1 }}>Betcha</span>
        <span style={{ color:C.accent2 }}> Know!</span>
      </h1>
      {big && (
        <p style={{ color:C.muted, fontSize:13, fontWeight:600, marginTop:6,
                    fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          Trivia · Wagering · Bluffing · Chaos
        </p>
      )}
    </div>
  );
}

function AuthCard({ children, style={} }) {
  return (
    <div style={{
      background:C.card, border:`1px solid ${C.border2}`, borderRadius:24, padding:32,
      width:"100%", maxWidth:420, boxShadow:"0 24px 80px #00000060",
      position:"relative", zIndex:1,
      animation:"popIn 0.4s cubic-bezier(.17,.67,.35,1.15)",
      ...style,
    }}>{children}</div>
  );
}

function LoginScreen({ onSwitch, onSuccess }) {
  const [email,   setEmail]   = useState("");
  const [pw,      setPw]      = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [shake,   setShake]   = useState(false);

  const validate = () => {
    const e = {};
    if (!validateEmail(email)) e.email = "Enter a valid email address";
    if (pw.length < 6)         e.pw    = "Password must be at least 6 characters";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); setShake(true); setTimeout(()=>setShake(false),500); return; }
    setLoading(true);
    try {
      const data = await api.login({ email, password: pw });
      saveSession({ token: data.token, refreshToken: data.refreshToken, username: data.user?.username });
      onSuccess("game");
    } catch (err) {
      setErrors({ pw: err.message || "Login failed" });
      setShake(true); setTimeout(()=>setShake(false),500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                  gap:24, width:"100%", maxWidth:420, animation:"fadeUp 0.5s ease" }}>
      <Logo size="lg" />
      <AuthCard style={{ animation: shake ? "shake 0.4s ease" : "popIn 0.4s ease" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <div>
            <h2 style={{ fontFamily:"'Boogaloo',cursive", fontSize:26, color:C.text, marginBottom:2 }}>
              Welcome back 👋
            </h2>
            <p style={{ color:C.muted, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:500 }}>
              Sign in to your account
            </p>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <button className="oauth-btn" onClick={() => onSuccess("game")}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <button className="oauth-btn" onClick={() => onSuccess("game")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              Continue with Discord
            </button>
          </div>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">or sign in with email</span>
            <div className="divider-line" />
          </div>

          <div className="field-group">
            <label className="label">Email</label>
            <div className="input-wrap">
              <span className="input-icon">✉️</span>
              <input type="email" placeholder="you@example.com" value={email}
                onChange={e => { setEmail(e.target.value); setErrors(v=>({...v,email:""})); }}
                className={errors.email ? "error" : ""} onKeyDown={e => e.key==="Enter" && handleSubmit()} />
            </div>
            {errors.email && <span className="err-msg">⚠ {errors.email}</span>}
          </div>

          <div className="field-group">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <label className="label">Password</label>
              <button className="link-btn" style={{ color:C.accent4, fontSize:12 }}
                onClick={() => onSwitch("forgot")}>Forgot password?</button>
            </div>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input type={showPw ? "text" : "password"} placeholder="Enter your password"
                value={pw} onChange={e => { setPw(e.target.value); setErrors(v=>({...v,pw:""})); }}
                className={errors.pw ? "error" : ""} onKeyDown={e => e.key==="Enter" && handleSubmit()} />
              <button className="input-toggle" onClick={() => setShowPw(s=>!s)}>
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
            {errors.pw && <span className="err-msg">⚠ {errors.pw}</span>}
          </div>

          <button className="primary-btn" disabled={loading} onClick={handleSubmit}
            style={{ background:`linear-gradient(135deg, ${C.accent4}, ${C.accent5})`,
                     color:"#fff", boxShadow:`0 4px 24px ${C.accent4}44` }}>
            {loading ? (
              <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <span style={{ width:16, height:16, border:"2px solid #fff4", borderTopColor:"#fff",
                               borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }} />
                Signing in...
              </span>
            ) : "Sign In →"}
          </button>

          <button className="primary-btn" onClick={() => onSuccess("game")}
            style={{ background:"transparent", color:C.muted,
                     border:`1.5px solid ${C.border2}`, fontSize:13 }}>
            👻 Play as Guest (limited features)
          </button>

          <p style={{ textAlign:"center", color:C.muted, fontSize:13,
                      fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:500 }}>
            Don't have an account?{" "}
            <button className="link-btn" style={{ color:C.accent2 }}
              onClick={() => onSwitch("signup")}>Create one free</button>
          </p>
        </div>
      </AuthCard>
    </div>
  );
}

function SignUpScreen({ onSwitch, onSuccess }) {
  const [username, setUsername] = useState("");
  const [email,    setEmail]    = useState("");
  const [pw,       setPw]       = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [agreed,   setAgreed]   = useState(false);
  const [shake,    setShake]    = useState(false);

  const strength  = pwStrength(pw);
  const strengthW = pw.length ? `${(strength / 4) * 100}%` : "0%";
  const checks = [
    { label:"At least 8 characters",  ok: pw.length >= 8 },
    { label:"One uppercase letter",    ok: /[A-Z]/.test(pw) },
    { label:"One number",              ok: /[0-9]/.test(pw) },
    { label:"One special character",   ok: /[^A-Za-z0-9]/.test(pw) },
  ];

  const validate = () => {
    const e = {};
    if (username.length < 3)              e.username = "Username must be at least 3 characters";
    if (username.length > 20)             e.username = "Username must be 20 characters or less";
    if (!/^[a-zA-Z0-9_]+$/.test(username)) e.username = "Only letters, numbers and underscores";
    if (!validateEmail(email))            e.email    = "Enter a valid email address";
    if (strength < 2)                     e.pw       = "Please choose a stronger password";
    if (pw !== confirm)                   e.confirm  = "Passwords don't match";
    if (!agreed)                          e.agreed   = "You must agree to the terms";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); setShake(true); setTimeout(()=>setShake(false),500); return; }
    setLoading(true);
    try {
      await api.signup({ username, email, password: pw });
      onSuccess("verify");
    } catch (err) {
      setErrors({ email: err.message || "Signup failed" });
      setShake(true); setTimeout(()=>setShake(false),500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                  gap:20, width:"100%", maxWidth:420, animation:"fadeUp 0.5s ease" }}>
      <Logo />
      <AuthCard style={{ animation: shake ? "shake 0.4s ease" : "popIn 0.4s ease" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          <div>
            <h2 style={{ fontFamily:"'Boogaloo',cursive", fontSize:26, color:C.text, marginBottom:2 }}>
              Create your account 🎉
            </h2>
            <p style={{ color:C.muted, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:500 }}>
              Free forever — no card required
            </p>
          </div>

          <div style={{ display:"flex", gap:8 }}>
            <button className="oauth-btn" style={{ flex:1, fontSize:13 }} onClick={() => onSuccess("game")}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button className="oauth-btn" style={{ flex:1, fontSize:13 }} onClick={() => onSuccess("game")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#5865F2">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              Discord
            </button>
          </div>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">or create with email</span>
            <div className="divider-line" />
          </div>

          <div className="field-group">
            <label className="label">Username</label>
            <div className="input-wrap">
              <span className="input-icon">🎮</span>
              <input placeholder="CoolPlayer99" value={username}
                onChange={e=>{setUsername(e.target.value);setErrors(v=>({...v,username:""}))}}
                className={errors.username?"error":""} maxLength={20} />
            </div>
            {errors.username
              ? <span className="err-msg">⚠ {errors.username}</span>
              : username.length > 0 && (
                <span style={{ fontSize:12, color:C.accent3, fontWeight:600,
                               fontFamily:"'Plus Jakarta Sans',sans-serif" }}>✓ Looks good</span>
              )
            }
          </div>

          <div className="field-group">
            <label className="label">Email</label>
            <div className="input-wrap">
              <span className="input-icon">✉️</span>
              <input type="email" placeholder="you@example.com" value={email}
                onChange={e=>{setEmail(e.target.value);setErrors(v=>({...v,email:""}))}}
                className={errors.email?"error":""} />
            </div>
            {errors.email && <span className="err-msg">⚠ {errors.email}</span>}
          </div>

          <div className="field-group">
            <label className="label">Password</label>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input type={showPw?"text":"password"} placeholder="Create a strong password"
                value={pw} onChange={e=>{setPw(e.target.value);setErrors(v=>({...v,pw:""}))}}
                className={errors.pw?"error":""} />
              <button className="input-toggle" onClick={()=>setShowPw(s=>!s)}>
                {showPw?"Hide":"Show"}
              </button>
            </div>
            {pw.length > 0 && (
              <div style={{ animation:"fadeIn 0.2s ease" }}>
                <div style={{ display:"flex", gap:3, marginBottom:6 }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} className="strength-bar" style={{
                      flex:1, background: i < strength ? strengthColor[strength] : C.border2,
                    }} />
                  ))}
                </div>
                <div style={{ fontSize:11, color:strengthColor[strength], fontWeight:700,
                              fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:8 }}>
                  {strengthLabel[strength]}
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 16px" }}>
                  {checks.map((c,i) => (
                    <div key={i} className="check-item" style={{ color: c.ok ? C.accent3 : C.muted2 }}>
                      <span>{c.ok ? "✓" : "○"}</span><span>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {errors.pw && <span className="err-msg">⚠ {errors.pw}</span>}
          </div>

          <div className="field-group">
            <label className="label">Confirm Password</label>
            <div className="input-wrap">
              <span className="input-icon">🔐</span>
              <input type="password" placeholder="Repeat your password"
                value={confirm} onChange={e=>{setConfirm(e.target.value);setErrors(v=>({...v,confirm:""}))}}
                className={errors.confirm?"error":""} />
            </div>
            {errors.confirm
              ? <span className="err-msg">⚠ {errors.confirm}</span>
              : confirm.length > 0 && pw === confirm && (
                <span style={{ fontSize:12, color:C.accent3, fontWeight:600,
                               fontFamily:"'Plus Jakarta Sans',sans-serif" }}>✓ Passwords match</span>
              )
            }
          </div>

          <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
            <button onClick={()=>{setAgreed(a=>!a);setErrors(v=>({...v,agreed:""}))}}
              style={{
                width:20, height:20, borderRadius:6, flexShrink:0, marginTop:1,
                border:`2px solid ${agreed ? C.accent4 : errors.agreed ? C.accent1 : C.border2}`,
                background: agreed ? C.accent4 : "transparent",
                display:"flex", alignItems:"center", justifyContent:"center",
                cursor:"pointer", transition:"all 0.15s",
              }}>
              {agreed && <span style={{ color:"#fff", fontSize:11, fontWeight:900 }}>✓</span>}
            </button>
            <p style={{ fontSize:12, color:C.muted, fontFamily:"'Plus Jakarta Sans',sans-serif",
                        lineHeight:1.5, fontWeight:500 }}>
              I agree to the{" "}
              <span style={{ color:C.accent4, cursor:"pointer", fontWeight:700 }}>Terms of Service</span>
              {" "}and{" "}
              <span style={{ color:C.accent4, cursor:"pointer", fontWeight:700 }}>Privacy Policy</span>.
            </p>
          </div>
          {errors.agreed && <span className="err-msg">⚠ {errors.agreed}</span>}

          <button className="primary-btn" disabled={loading} onClick={handleSubmit}
            style={{ background:`linear-gradient(135deg, ${C.accent1}, ${C.accent5})`,
                     color:"#fff", boxShadow:`0 4px 24px ${C.accent1}44` }}>
            {loading ? (
              <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <span style={{ width:16, height:16, border:"2px solid #fff4", borderTopColor:"#fff",
                               borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }} />
                Creating account...
              </span>
            ) : "Create Account 🎉"}
          </button>

          <p style={{ textAlign:"center", color:C.muted, fontSize:13,
                      fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:500 }}>
            Already have an account?{" "}
            <button className="link-btn" style={{ color:C.accent4 }}
              onClick={()=>onSwitch("login")}>Sign in</button>
          </p>
        </div>
      </AuthCard>
    </div>
  );
}

function VerifyScreen({ onSuccess }) {
  const [code,     setCode]     = useState(["","","","","",""]);
  const [loading,  setLoading]  = useState(false);
  const [resent,   setResent]   = useState(false);
  const [error,    setError]    = useState("");
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef([]);

  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !code[i] && i > 0) inputRefs.current[i-1]?.focus();
  };
  const handleChange = (i, val) => {
    const v = val.replace(/\D/g,"").slice(-1);
    const next = [...code]; next[i] = v; setCode(next); setError("");
    if (v && i < 5) inputRefs.current[i+1]?.focus();
  };
  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    if (pasted.length === 6) { setCode(pasted.split("")); inputRefs.current[5]?.focus(); }
  };
  const handleVerify = async () => {
    if (code.join("").length < 6) { setError("Please enter the full 6-digit code"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setVerified(true);
    setTimeout(() => onSuccess("game"), 1800);
  };

  if (verified) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                  gap:24, animation:"fadeUp 0.5s ease" }}>
      <AuthCard style={{ textAlign:"center", padding:"48px 32px" }}>
        <div style={{ fontSize:72, animation:"successPop 0.6s cubic-bezier(.17,.67,.35,1.4)" }}>✅</div>
        <h2 style={{ fontFamily:"'Boogaloo',cursive", fontSize:30, color:C.accent3, marginTop:16 }}>
          Email Verified!
        </h2>
        <p style={{ color:C.muted, fontSize:14, marginTop:8,
                    fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:500 }}>
          Welcome to Betcha Know! Loading your account...
        </p>
        <div style={{ marginTop:20, display:"flex", justifyContent:"center" }}>
          <span style={{ width:24, height:24, border:"3px solid #fff2", borderTopColor:C.accent3,
                         borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }} />
        </div>
      </AuthCard>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                  gap:20, width:"100%", maxWidth:420, animation:"fadeUp 0.5s ease" }}>
      <Logo />
      <AuthCard>
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:44, marginBottom:8, animation:"floatB 4s ease-in-out infinite" }}>📧</div>
            <h2 style={{ fontFamily:"'Boogaloo',cursive", fontSize:26, color:C.text, marginBottom:6 }}>
              Check your inbox
            </h2>
            <p style={{ color:C.muted, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif",
                        fontWeight:500, lineHeight:1.6 }}>
              We sent a 6-digit verification code to your email.
            </p>
          </div>

          <div style={{ display:"flex", justifyContent:"center", gap:8 }} onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input key={i} ref={el => inputRefs.current[i] = el}
                className={`code-input ${digit ? "filled" : ""}`}
                type="text" inputMode="numeric" maxLength={1} value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKey(i, e)} />
            ))}
          </div>

          {error && (
            <p style={{ textAlign:"center", color:C.accent1, fontSize:13, fontWeight:600,
                        fontFamily:"'Plus Jakarta Sans',sans-serif" }}>⚠ {error}</p>
          )}

          <button className="primary-btn" disabled={loading || code.join("").length < 6}
            onClick={handleVerify}
            style={{ background:`linear-gradient(135deg, ${C.accent3}, ${C.accent4})`,
                     color:"#fff", boxShadow:`0 4px 24px ${C.accent3}44` }}>
            {loading ? (
              <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <span style={{ width:16, height:16, border:"2px solid #fff4", borderTopColor:"#fff",
                               borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }} />
                Verifying...
              </span>
            ) : "Verify Email ✓"}
          </button>

          <div style={{ textAlign:"center" }}>
            <p style={{ color:C.muted, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif",
                        fontWeight:500, marginBottom:8 }}>Didn't receive the code?</p>
            {resent ? (
              <p style={{ color:C.accent3, fontSize:13, fontWeight:700,
                          fontFamily:"'Plus Jakarta Sans',sans-serif" }}>✓ New code sent!</p>
            ) : (
              <button className="link-btn" style={{ color:C.accent4, fontSize:13 }}
                onClick={() => { setResent(true); setTimeout(() => setResent(false), 4000); }}>
                Resend verification code
              </button>
            )}
          </div>
        </div>
      </AuthCard>
    </div>
  );
}

function ForgotScreen({ onSwitch }) {
  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSend = async () => {
    if (!validateEmail(email)) { setError("Enter a valid email address"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
  };

  if (sent) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                  gap:20, width:"100%", maxWidth:420, animation:"fadeUp 0.5s ease" }}>
      <Logo />
      <AuthCard style={{ textAlign:"center" }}>
        <div style={{ fontSize:52, marginBottom:12, animation:"floatA 4s ease-in-out infinite" }}>📬</div>
        <h2 style={{ fontFamily:"'Boogaloo',cursive", fontSize:26, color:C.text, marginBottom:8 }}>
          Reset link sent!
        </h2>
        <p style={{ color:C.muted, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif",
                    fontWeight:500, lineHeight:1.6, marginBottom:20 }}>
          Check your inbox for a password reset link. It expires in 15 minutes.
        </p>
        <button className="link-btn" style={{ color:C.accent4 }}
          onClick={() => onSwitch("login")}>← Back to sign in</button>
      </AuthCard>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                  gap:20, width:"100%", maxWidth:420, animation:"fadeUp 0.5s ease" }}>
      <Logo />
      <AuthCard>
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          <div>
            <h2 style={{ fontFamily:"'Boogaloo',cursive", fontSize:26, color:C.text, marginBottom:4 }}>
              Reset password 🔑
            </h2>
            <p style={{ color:C.muted, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:500 }}>
              Enter your email and we'll send a reset link
            </p>
          </div>
          <div className="field-group">
            <label className="label">Email</label>
            <div className="input-wrap">
              <span className="input-icon">✉️</span>
              <input type="email" placeholder="you@example.com" value={email}
                onChange={e=>{setEmail(e.target.value);setError("")}}
                className={error?"error":""} onKeyDown={e=>e.key==="Enter"&&handleSend()} />
            </div>
            {error && <span className="err-msg">⚠ {error}</span>}
          </div>
          <button className="primary-btn" disabled={loading} onClick={handleSend}
            style={{ background:`linear-gradient(135deg, ${C.accent2}, ${C.accent1})`,
                     color:"#111", boxShadow:`0 4px 24px ${C.accent2}44` }}>
            {loading ? (
              <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <span style={{ width:16, height:16, border:"2px solid #0004", borderTopColor:"#000",
                               borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }} />
                Sending...
              </span>
            ) : "Send Reset Link →"}
          </button>
          <button className="link-btn" style={{ color:C.muted, textAlign:"center" }}
            onClick={()=>onSwitch("login")}>← Back to sign in</button>
        </div>
      </AuthCard>
    </div>
  );
}

export default function AuthFlow({ onAuthenticated }) {
  const [screen, setScreen] = useState("login");

  const handleSuccess = (dest) => {
    if (dest === "verify") setScreen("verify");
    if (dest === "game")   onAuthenticated();
  };

  return (
    <div style={{
      minHeight:"100vh", background:C.bg,
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"24px 16px", position:"relative", overflowX:"hidden",
    }}>
      <style>{css}</style>
      <Orbs />
      {screen === "login"  && <LoginScreen  onSwitch={setScreen} onSuccess={handleSuccess} />}
      {screen === "signup" && <SignUpScreen  onSwitch={setScreen} onSuccess={handleSuccess} />}
      {screen === "verify" && <VerifyScreen  onSuccess={handleSuccess} />}
      {screen === "forgot" && <ForgotScreen  onSwitch={setScreen} />}
    </div>
  );
}

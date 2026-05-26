import { useState, useEffect, useMemo, useRef } from "react";
import { api, isLoggedIn, getUsername } from "./api";

const C = {
  bg:      "#08070f",
  card:    "#100e1c",
  card2:   "#13111f",
  border:  "#1e1b35",
  border2: "#2a2645",
  a1:      "#ff6b6b",
  a2:      "#ffd93d",
  a3:      "#6bcb77",
  a4:      "#4d96ff",
  a5:      "#c77dff",
  a6:      "#ff9f43",
  text:    "#f0eeff",
  muted:   "#6b6890",
  muted2:  "#3d3b5c",
};

const REWARD_MILESTONES = [
  { level:10, reward:"Club Avatar Pack — Phoenix avatar for all members", icon:"🎭" },
  { level:12, reward:"Custom Club Chat Color",                            icon:"💬" },
  { level:15, reward:"Diamond Card Skin for all members",                 icon:"💠" },
  { level:20, reward:"Holographic Club Tag in Lobbies",                   icon:"✨" },
  { level:25, reward:"Galaxy Victory FX for all members",                 icon:"🌟" },
];

const CLUB_ICONS = [
  "🏆","💎","⚡","🔥","🌟","👑","🎯","🎭","🃏","🎲",
  "🧠","💡","🚀","🌙","☄️","🎪","⚔️","🛡️","🎩","🦁",
  "🐉","🦅","🌊","🎆","🍀","🎰","🧩","🎮","🏅","✨",
];

const BANNERS = [
  { id:"b1",  label:"Ocean",    v:"linear-gradient(135deg, #4d96ff, #6bcb77)" },
  { id:"b2",  label:"Sunset",   v:"linear-gradient(135deg, #ff6b6b, #ffd93d)" },
  { id:"b3",  label:"Cosmic",   v:"linear-gradient(135deg, #c77dff, #4d96ff)" },
  { id:"b4",  label:"Inferno",  v:"linear-gradient(135deg, #ff6b6b, #ff9f43)" },
  { id:"b5",  label:"Galaxy",   v:"linear-gradient(135deg, #100e1c, #c77dff)" },
  { id:"b6",  label:"Emerald",  v:"linear-gradient(135deg, #6bcb77, #4d96ff)" },
  { id:"b7",  label:"Gold",     v:"linear-gradient(135deg, #ffd93d, #ff9f43)" },
  { id:"b8",  label:"Midnight", v:"linear-gradient(135deg, #1e1b35, #4d96ff)" },
  { id:"b9",  label:"Crimson",  v:"linear-gradient(135deg, #ff6b6b, #c77dff)" },
  { id:"b10", label:"Mint",     v:"linear-gradient(135deg, #6bcb77, #ffd93d)" },
];

const LANGUAGES = [
  "English","Spanish","French","German","Portuguese","Italian",
  "Dutch","Russian","Japanese","Korean","Chinese","Arabic","Hindi","Turkish","Polish",
];

const VIBES = [
  { id:"Casual",      label:"Casual",      icon:"😎" },
  { id:"Competitive", label:"Competitive", icon:"🏆" },
  { id:"Friendly",    label:"Friendly",    icon:"🤝" },
];

const MIN_LEVELS = [1, 5, 10, 20, 30, 50];

const RULE_TEXTS = [
  "I will keep this club active and welcoming",
  "I understand I can be removed as captain if inactive for 30+ days",
  "No hate speech, harassment, or cheating",
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Boogaloo&family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

  @keyframes fadeUp      { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes popIn       { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
  @keyframes float       { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes pulseDot    { 0%,100%{box-shadow:0 0 0 0 ${C.a3}66} 50%{box-shadow:0 0 0 6px ${C.a3}00} }
  @keyframes shine       { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
  @keyframes barGrow     { from{width:0} to{width:var(--w)} }
  @keyframes spin        { to{transform:rotate(360deg)} }
  @keyframes modalIn     { from{opacity:0;transform:scale(0.94) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes checkPop    { 0%{transform:scale(0)} 70%{transform:scale(1.25)} 100%{transform:scale(1)} }
  @keyframes successGlow { 0%,100%{text-shadow:0 0 20px ${C.a3}88} 50%{text-shadow:0 0 40px ${C.a3}} }
  @keyframes confettiA   { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(120px) rotate(600deg);opacity:0} }
  @keyframes confettiB   { 0%{transform:translateY(-10px) rotate(0deg);opacity:1} 100%{transform:translateY(100px) rotate(-480deg);opacity:0} }

  ::-webkit-scrollbar { width:5px; }
  ::-webkit-scrollbar-thumb { background:${C.border2}; border-radius:3px; }
  ::-webkit-scrollbar-track { background:transparent; }

  button:not(:disabled):active { transform:scale(0.97); }

  .nav-tab {
    padding:12px 18px; border:none; background:transparent;
    color:${C.muted}; font-family:'DM Sans',sans-serif;
    font-size:13px; font-weight:700; cursor:pointer;
    border-radius:10px 10px 0 0; white-space:nowrap;
    display:inline-flex; align-items:center; gap:6px;
    border-bottom:2px solid transparent;
    transition:color 0.15s, background 0.15s;
  }
  .nav-tab:hover { color:${C.text}; background:${C.card2}; }
  .nav-tab.active { color:${C.text}; border-bottom-color:${C.a4}; }

  .friend-row {
    display:grid; grid-template-columns: auto 1fr auto auto; gap:14px;
    align-items:center; padding:14px 16px;
    background:${C.card2}; border:1px solid ${C.border};
    border-radius:14px;
    transition:border-color 0.18s, transform 0.15s;
    animation:fadeUp 0.3s ease;
  }
  .friend-row:hover { border-color:${C.border2}; transform:translateX(2px); }

  .ico-btn {
    width:34px; height:34px; border-radius:10px;
    border:1px solid ${C.border2}; background:${C.card};
    color:${C.muted}; cursor:pointer;
    display:inline-flex; align-items:center; justify-content:center;
    transition:all 0.15s; font-size:14px;
  }
  .ico-btn:hover { color:${C.text}; border-color:${C.border2}; background:${C.border}; }

  .input-row {
    width:100%; padding:11px 16px;
    border-radius:12px; border:1.5px solid ${C.border2};
    background:${C.card}; color:${C.text};
    font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500;
    outline:none; transition:border-color 0.2s;
  }
  .input-row:focus { border-color:${C.a4}; }
  .input-row::placeholder { color:${C.muted2}; }

  .field-label {
    font-size:11px; font-weight:800; color:${C.muted};
    letter-spacing:0.8px; text-transform:uppercase; margin-bottom:8px;
    font-family:'DM Sans',sans-serif;
  }

  .section-block { display:flex; flex-direction:column; gap:0; }

  select.input-row { appearance:none; cursor:pointer; }
  textarea.input-row { resize:vertical; line-height:1.5; }
`;

// ─── Small helpers ───────────────────────────────────────────────────────────

function Spinner({ size = 32 }) {
  return (
    <div style={{ display:"flex", justifyContent:"center", padding:"40px 0" }}>
      <div style={{ width:size, height:size, borderRadius:"50%", border:`3px solid ${C.border2}`, borderTopColor:C.a4, animation:"spin 0.8s linear infinite" }} />
    </div>
  );
}

function GuestWall({ message }) {
  return (
    <div style={{ textAlign:"center", padding:"60px 20px" }}>
      <div style={{ fontSize:52, marginBottom:12 }}>🔒</div>
      <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:22, color:C.text, marginBottom:6 }}>Sign in to {message}</div>
      <div style={{ fontSize:13, color:C.muted, fontWeight:600 }}>Create a free account to join the community</div>
    </div>
  );
}

function StatusDot({ status }) {
  const colors = { online:"#6bcb77", "in-game":"#4d96ff", offline:"#3d3b5c" };
  return (
    <span style={{
      width:10, height:10, borderRadius:"50%",
      background: colors[status] || colors.offline,
      animation: status === "online" ? "pulseDot 2s ease-in-out infinite" : "none",
      flexShrink:0, display:"inline-block",
    }} />
  );
}

function VIPDot() {
  return (
    <span style={{
      background:`linear-gradient(135deg, ${C.a2}, ${C.a6})`, color:"#111",
      fontSize:9, fontWeight:900, padding:"2px 6px", borderRadius:6,
      letterSpacing:0.5, fontFamily:"'DM Sans',sans-serif",
    }}>VIP</span>
  );
}

function RoleBadge({ role }) {
  const styles = {
    Captain:   { bg:`linear-gradient(135deg, ${C.a2}, ${C.a6})`, color:"#111" },
    Moderator: { bg: C.a5 + "33", color: C.a5 },
    Member:    { bg: C.border,    color: C.muted },
  };
  const s = styles[role] || styles.Member;
  return (
    <span style={{
      background:s.bg, color:s.color,
      fontSize:9, fontWeight:900, padding:"2px 7px", borderRadius:6,
      letterSpacing:0.5, fontFamily:"'DM Sans',sans-serif", textTransform:"uppercase",
    }}>{role}</span>
  );
}

function Avatar({ icon, size = 42, online }) {
  const isUrl = typeof icon === "string" && (icon.startsWith("http://") || icon.startsWith("https://") || icon.startsWith("data:"));
  const radius = Math.round(size * 0.28);
  return (
    <div style={{ position:"relative", flexShrink:0 }}>
      <div style={{
        width:size, height:size, borderRadius:radius,
        background:`linear-gradient(135deg, ${C.a4}33, ${C.a5}22)`,
        border:`1.5px solid ${C.border2}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize: Math.round(size * 0.48),
        overflow:"hidden",
      }}>
        {isUrl
          ? <img src={icon} alt="" referrerPolicy="no-referrer" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:radius - 1 }} onError={e => { e.currentTarget.style.display = "none"; }} />
          : icon
        }
      </div>
      {online !== undefined && (
        <div style={{
          position:"absolute", bottom:-2, right:-2,
          width:12, height:12, borderRadius:"50%",
          background: online ? C.a3 : C.muted2,
          border:`2px solid ${C.bg}`,
          animation: online ? "pulseDot 2s ease-in-out infinite" : "none",
        }} />
      )}
    </div>
  );
}

// ─── Create Club Modal ───────────────────────────────────────────────────────

function CreateClubModal({ onClose, onCreated }) {
  const [name,       setName]       = useState("");
  const [tag,        setTag]        = useState("");
  const [tagEdited,  setTagEdited]  = useState(false);
  const [icon,       setIcon]       = useState("");
  const [banner,     setBanner]     = useState(BANNERS[0]);
  const [desc,       setDesc]       = useState("");
  const [privacy,    setPrivacy]    = useState("open");
  const [minLevel,   setMinLevel]   = useState(1);
  const [vibe,       setVibe]       = useState("");
  const [language,   setLanguage]   = useState("");
  const [rules,      setRules]      = useState([false, false, false]);
  const [nameStatus, setNameStatus] = useState(null);
  const [knownNames, setKnownNames] = useState([]);
  const [creating,   setCreating]   = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState("");

  useEffect(() => {
    api.clubs().then(d => setKnownNames((d.clubs || []).map(c => c.name.toLowerCase()))).catch(() => {});
  }, []);

  // Auto-generate tag from name unless user edited it manually
  useEffect(() => {
    if (tagEdited) return;
    const words = name.trim().split(/\s+/).filter(Boolean);
    const auto = words.length >= 2
      ? words.map(w => w[0]).join("").toUpperCase().slice(0, 6)
      : name.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 5);
    setTag(auto);
  }, [name]);

  // Debounced name availability check
  useEffect(() => {
    if (name.length < 3) { setNameStatus(null); return; }
    setNameStatus("checking");
    const t = setTimeout(() => {
      setNameStatus(knownNames.includes(name.trim().toLowerCase()) ? "taken" : "available");
    }, 500);
    return () => clearTimeout(t);
  }, [name, knownNames]);

  const nameValid = name.length >= 3 && name.length <= 30 && nameStatus === "available";
  const tagValid  = tag.length >= 2 && tag.length <= 6 && /^[A-Z0-9]+$/.test(tag);
  const canCreate = nameValid && tagValid && !!icon && !!vibe && rules.every(Boolean) && !creating;

  const handleCreate = () => {
    if (!canCreate) return;
    setError(""); setCreating(true);
    api.createClub({ name: name.trim(), tag, icon, banner: banner.v, description: desc, privacy, min_level: minLevel, vibe, language: language || undefined })
      .then(d => {
        setSuccess(true);
        setTimeout(() => onCreated(d.club || d), 2200);
      })
      .catch(e => {
        const msg = e.message || "Error creating club";
        if (msg.toLowerCase().includes("name")) setNameStatus("taken");
        setError(msg); setCreating(false);
      });
  };

  const prevName = name || "Club Name";
  const prevTag  = tag  || "TAG";
  const prevVibe = VIBES.find(v => v.id === vibe);

  // Confetti pieces for success
  const confetti = ["🟥","🟨","🟩","🟦","🟪","🟧","🟫","⬛"].map((c, i) => ({
    c, left: `${10 + i * 10}%`, delay: `${i * 0.08}s`,
    anim: i % 2 === 0 ? "confettiA" : "confettiB",
    dur: `${0.9 + (i % 3) * 0.3}s`,
  }));

  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:1000, background:"#000c", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background:C.card, border:`1px solid ${C.border2}`, borderRadius:24,
        width:"100%", maxWidth:940, maxHeight:"92vh",
        display:"flex", flexDirection:"column", overflow:"hidden",
        animation:"modalIn 0.25s ease", boxShadow:"0 28px 80px #0009",
        position:"relative",
      }}>

        {/* Success overlay */}
        {success && (
          <div style={{ position:"absolute", inset:0, zIndex:20, borderRadius:24, background:C.bg+"f2", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <div style={{ position:"relative", overflow:"hidden", width:"100%", display:"flex", flexDirection:"column", alignItems:"center" }}>
              {confetti.map((p, i) => (
                <span key={i} style={{ position:"absolute", top:0, left:p.left, fontSize:18, animation:`${p.anim} ${p.dur} ease ${p.delay} both`, pointerEvents:"none" }}>{p.c}</span>
              ))}
              <div style={{ fontSize:80, animation:"float 0.9s ease-in-out infinite", marginBottom:16 }}>🎉</div>
              <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:32, color:C.a3, animation:"successGlow 1.5s ease infinite" }}>Club Created!</div>
              <div style={{ fontSize:14, color:C.muted, fontWeight:600, marginTop:10 }}>Taking you to your new club...</div>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ padding:"18px 26px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <div>
            <h2 style={{ fontFamily:"'Boogaloo',cursive", fontSize:24, lineHeight:1 }}>🏰 Create a Club</h2>
            <p style={{ fontSize:12, color:C.muted, fontWeight:600, marginTop:3 }}>Build your community · Be the captain</p>
          </div>
          <button className="ico-btn" onClick={onClose} style={{ fontSize:16, width:38, height:38 }}>✕</button>
        </div>

        {/* Body: form + preview side-by-side */}
        <div style={{ flex:1, overflow:"hidden", display:"grid", gridTemplateColumns:"1fr 290px", minHeight:0 }}>

          {/* ── Left: Form ── */}
          <div style={{ overflowY:"auto", padding:"24px 26px", display:"flex", flexDirection:"column", gap:26 }}>

            {/* Section 1 — Identity */}
            <div>
              <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:18, marginBottom:16, color:C.text, display:"flex", alignItems:"center", gap:8 }}>✏️ Club Identity</div>

              {/* Name */}
              <div className="field-label">Club Name <span style={{ color:C.a1 }}>*</span></div>
              <div style={{ position:"relative" }}>
                <input className="input-row" placeholder="Enter club name..." value={name} maxLength={30}
                  onChange={e => setName(e.target.value)}
                  style={{ paddingRight:130, borderColor: nameStatus === "taken" ? C.a1 : nameStatus === "available" ? C.a3 : undefined }}
                />
                <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", fontSize:12, fontWeight:800, whiteSpace:"nowrap" }}>
                  {nameStatus === "checking"  && <span style={{ color:C.muted }}>⏳ Checking…</span>}
                  {nameStatus === "available" && <span style={{ color:C.a3 }}>✓ Available</span>}
                  {nameStatus === "taken"     && <span style={{ color:C.a1 }}>✗ Taken</span>}
                </span>
              </div>
              <div style={{ fontSize:11, color:C.muted, marginTop:5, display:"flex", justifyContent:"space-between" }}>
                <span>3–30 characters</span>
                <span style={{ color: name.length > 27 ? C.a2 : C.muted }}>{name.length}/30</span>
              </div>

              {/* Tag */}
              <div className="field-label" style={{ marginTop:16 }}>Club Tag <span style={{ color:C.a1 }}>*</span></div>
              <input className="input-row" placeholder="TAG" value={tag} maxLength={6}
                onChange={e => { setTagEdited(true); setTag(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6)); }}
                style={{ letterSpacing:4, fontWeight:900, borderColor: tagValid ? C.a3 + "88" : undefined, maxWidth:160 }}
              />
              <div style={{ fontSize:11, color:C.muted, marginTop:5 }}>
                2–6 chars · uppercase letters &amp; numbers · shown as [{tag || "TAG"}]
              </div>

              {/* Icon */}
              <div className="field-label" style={{ marginTop:16 }}>Club Icon <span style={{ color:C.a1 }}>*</span></div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(10, 1fr)", gap:6 }}>
                {CLUB_ICONS.map(ic => (
                  <button key={ic} onClick={() => setIcon(ic)} style={{
                    width:"100%", aspectRatio:"1", borderRadius:10, fontSize:20, cursor:"pointer",
                    border:`2px solid ${icon === ic ? C.a4 : C.border2}`,
                    background: icon === ic ? C.a4 + "22" : C.card2,
                    boxShadow: icon === ic ? `0 0 12px ${C.a4}44` : "none",
                    transition:"all 0.12s", display:"flex", alignItems:"center", justifyContent:"center",
                  }}>{ic}</button>
                ))}
              </div>

              {/* Banner */}
              <div className="field-label" style={{ marginTop:16 }}>Club Banner</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:8 }}>
                {BANNERS.map(b => (
                  <button key={b.id} onClick={() => setBanner(b)} title={b.label} style={{
                    height:40, borderRadius:10, cursor:"pointer",
                    background: b.v,
                    border:`2.5px solid ${banner.id === b.id ? "#fff" : "transparent"}`,
                    boxShadow: banner.id === b.id ? "0 0 0 1px #fff4, 0 4px 14px #0006" : "none",
                    transition:"all 0.12s", position:"relative", overflow:"hidden",
                  }}>
                    {banner.id === b.id && <span style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:14, textShadow:"0 1px 4px #0009" }}>✓</span>}
                  </button>
                ))}
              </div>
              <div style={{ fontSize:11, color:C.muted, marginTop:5 }}>{banner.label} gradient</div>

              {/* Description */}
              <div className="field-label" style={{ marginTop:16 }}>Description <span style={{ color:C.muted, fontWeight:600, fontSize:10, textTransform:"none", letterSpacing:0 }}>(optional)</span></div>
              <textarea className="input-row" placeholder="Tell players what your club is about…" value={desc} maxLength={200} rows={3}
                onChange={e => setDesc(e.target.value)} />
              <div style={{ fontSize:11, color: desc.length > 180 ? C.a2 : C.muted, marginTop:4, textAlign:"right" }}>{desc.length}/200</div>
            </div>

            {/* Section 2 — Settings */}
            <div>
              <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:18, marginBottom:16, color:C.text, display:"flex", alignItems:"center", gap:8 }}>⚙️ Club Settings</div>

              {/* Privacy */}
              <div className="field-label">Privacy</div>
              <div style={{ display:"flex", gap:8 }}>
                {[
                  { id:"open",   icon:"🌐", label:"Open",        desc:"Anyone can join"   },
                  { id:"apply",  icon:"📋", label:"Apply",       desc:"Captain approves"  },
                  { id:"invite", icon:"🔒", label:"Invite Only", desc:"By invite only"    },
                ].map(p => (
                  <button key={p.id} onClick={() => setPrivacy(p.id)} style={{
                    flex:1, padding:"10px 8px", borderRadius:12, cursor:"pointer", textAlign:"center",
                    border:`1.5px solid ${privacy === p.id ? C.a4 : C.border2}`,
                    background: privacy === p.id ? C.a4 + "22" : C.card2,
                    color: privacy === p.id ? C.a4 : C.muted,
                    fontWeight:800, fontSize:11, fontFamily:"'DM Sans',sans-serif",
                    transition:"all 0.15s",
                  }}>
                    <div style={{ fontSize:20, marginBottom:4 }}>{p.icon}</div>
                    <div>{p.label}</div>
                    <div style={{ fontSize:10, opacity:0.75, marginTop:2, fontWeight:600 }}>{p.desc}</div>
                  </button>
                ))}
              </div>

              {/* Min Level */}
              <div className="field-label" style={{ marginTop:16 }}>Minimum Level to Join</div>
              <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                {MIN_LEVELS.map(lv => (
                  <button key={lv} onClick={() => setMinLevel(lv)} style={{
                    padding:"7px 14px", borderRadius:10, cursor:"pointer",
                    border:`1.5px solid ${minLevel === lv ? C.a5 : C.border2}`,
                    background: minLevel === lv ? C.a5 + "22" : "transparent",
                    color: minLevel === lv ? C.a5 : C.muted,
                    fontWeight:800, fontSize:12, fontFamily:"'DM Sans',sans-serif",
                  }}>Lvl {lv}</button>
                ))}
              </div>

              {/* Vibe */}
              <div className="field-label" style={{ marginTop:16 }}>Club Vibe <span style={{ color:C.a1 }}>*</span></div>
              <div style={{ display:"flex", gap:8 }}>
                {VIBES.map(v => (
                  <button key={v.id} onClick={() => setVibe(v.id)} style={{
                    flex:1, padding:"12px 10px", borderRadius:12, cursor:"pointer", textAlign:"center",
                    border:`1.5px solid ${vibe === v.id ? C.a2 : C.border2}`,
                    background: vibe === v.id ? C.a2 + "22" : C.card2,
                    color: vibe === v.id ? C.a2 : C.muted,
                    fontWeight:800, fontSize:12, fontFamily:"'DM Sans',sans-serif",
                    transition:"all 0.15s",
                  }}>
                    <div style={{ fontSize:24, marginBottom:5 }}>{v.icon}</div>
                    <div>{v.label}</div>
                  </button>
                ))}
              </div>

              {/* Language */}
              <div className="field-label" style={{ marginTop:16 }}>Language <span style={{ color:C.muted, fontWeight:600, fontSize:10, textTransform:"none", letterSpacing:0 }}>(optional)</span></div>
              <select className="input-row" value={language} onChange={e => setLanguage(e.target.value)}
                style={{ color: language ? C.text : C.muted2 }}>
                <option value="">No preference</option>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {/* Section 3 — Rules */}
            <div>
              <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:18, marginBottom:16, color:C.text, display:"flex", alignItems:"center", gap:8 }}>📜 Rules Acknowledgment</div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {RULE_TEXTS.map((text, i) => (
                  <label key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, cursor:"pointer" }}>
                    <div onClick={() => setRules(prev => prev.map((r, j) => j === i ? !r : r))} style={{
                      width:22, height:22, borderRadius:7, flexShrink:0, marginTop:1, cursor:"pointer",
                      border:`2px solid ${rules[i] ? C.a3 : C.border2}`,
                      background: rules[i] ? C.a3 + "33" : "transparent",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      transition:"all 0.15s",
                      animation: rules[i] ? "checkPop 0.2s ease" : "none",
                    }}>
                      {rules[i] && <span style={{ color:C.a3, fontSize:14, fontWeight:900 }}>✓</span>}
                    </div>
                    <span style={{ fontSize:13, color:C.text, fontWeight:600, lineHeight:1.55 }}>{text}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ background:C.a1 + "22", border:`1px solid ${C.a1}55`, borderRadius:10, padding:"10px 16px", color:C.a1, fontSize:13, fontWeight:700 }}>
                ⚠ {error}
              </div>
            )}

            {/* Create button */}
            <button onClick={handleCreate} disabled={!canCreate} style={{
              width:"100%", padding:"16px", borderRadius:16, border:"none",
              background: canCreate ? `linear-gradient(135deg, ${C.a4}, ${C.a5})` : C.border2,
              color: canCreate ? "#fff" : C.muted2,
              fontFamily:"'Boogaloo',cursive", fontSize:22,
              cursor: canCreate ? "pointer" : "not-allowed",
              boxShadow: canCreate ? `0 6px 28px ${C.a4}55` : "none",
              transition:"all 0.2s",
              display:"flex", alignItems:"center", justifyContent:"center", gap:12,
            }}>
              {creating
                ? <><span style={{ width:22, height:22, borderRadius:"50%", border:`3px solid #fff4`, borderTopColor:"#fff", animation:"spin 0.7s linear infinite", display:"inline-block" }} /> Creating…</>
                : "🏰 Create Club"
              }
            </button>
          </div>

          {/* ── Right: Live Preview ── */}
          <div style={{ borderLeft:`1px solid ${C.border}`, padding:20, overflowY:"auto", background:C.bg + "66", display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ fontSize:10, color:C.a4, fontWeight:900, letterSpacing:1.5, textTransform:"uppercase" }}>Live Preview</div>

            {/* Preview club card */}
            <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:18, overflow:"hidden" }}>
              {/* Banner strip */}
              <div style={{ height:72, background:banner.v, position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(105deg, transparent 30%, #fff1 50%, transparent 70%)", animation:"shine 4s ease-in-out infinite" }} />
                <div style={{
                  position:"absolute", left:14, bottom:-20,
                  width:44, height:44, borderRadius:13, background:"#0008",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:24, backdropFilter:"blur(4px)", border:"2px solid #fff3",
                  animation:"float 3s ease-in-out infinite", overflow:"hidden",
                }}>{icon || "🏆"}</div>
              </div>

              <div style={{ padding:"28px 14px 14px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap", marginBottom:3 }}>
                  <span style={{ fontWeight:800, fontSize:15, color:C.text }}>{prevName}</span>
                  <span style={{ background:C.border, color:C.muted, fontSize:10, fontWeight:900, padding:"1px 6px", borderRadius:6, letterSpacing:0.5 }}>[{prevTag}]</span>
                </div>
                <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:desc ? 8 : 10 }}>Lvl 1 · Founded today</div>
                {desc && <p style={{ fontSize:12, color:C.muted, lineHeight:1.5, marginBottom:10 }}>{desc.slice(0, 80)}{desc.length > 80 ? "…" : ""}</p>}

                <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap" }}>
                  {[
                    { label:"Members", value:"1/50",                                                   color:C.a4 },
                    { label:"Vibe",    value: prevVibe ? `${prevVibe.icon} ${prevVibe.label}` : "—",   color:C.a5 },
                    { label:"Level",   value:"1",                                                      color:C.a3 },
                  ].map((s, i) => (
                    <div key={i}>
                      <div style={{ fontSize:9, color:C.muted, fontWeight:800, letterSpacing:0.5, textTransform:"uppercase" }}>{s.label}</div>
                      <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:14, color:s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ width:"100%", padding:"8px", borderRadius:8, border:"none", background:`linear-gradient(135deg, ${C.a4}, ${C.a5})`, color:"#fff", fontWeight:800, fontSize:12, textAlign:"center" }}>
                  Request to Join
                </div>
              </div>
            </div>

            {/* Validation checklist */}
            <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px" }}>
              <div style={{ fontSize:10, color:C.muted, fontWeight:800, letterSpacing:0.5, textTransform:"uppercase", marginBottom:10 }}>Requirements</div>
              {[
                { ok: nameValid,            label: "Name valid & available" },
                { ok: tagValid,             label: "Tag set (2–6 chars)"   },
                { ok: !!icon,               label: "Icon chosen"            },
                { ok: !!vibe,               label: "Vibe selected"          },
                { ok: rules.every(Boolean), label: "Rules acknowledged"     },
              ].map((item, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color: item.ok ? C.a3 : C.muted, fontWeight:700, marginBottom:6 }}>
                  <span style={{ fontSize:14 }}>{item.ok ? "✓" : "○"}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Friends page ────────────────────────────────────────────────────────────

function FriendRow({ friend, onAction }) {
  const ratio   = friend.wins / Math.max(1, friend.wins + friend.losses);
  const winRate = Math.round(ratio * 100);
  return (
    <div className="friend-row">
      <Avatar icon={friend.avatar} online={friend.isOnline} />
      <div style={{ minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <span style={{ fontWeight:800, fontSize:14, color:C.text }}>{friend.name}</span>
          {friend.isVIP && <VIPDot />}
        </div>
        <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginTop:2, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
          <StatusDot status={friend.status} />
          <span style={{ color: friend.status === "in-game" ? C.a4 : friend.status === "online" ? C.a3 : C.muted }}>
            {friend.status === "in-game" ? `Playing · ${friend.game || "a game"}` : friend.status === "online" ? "Online" : `Offline · ${friend.lastSeen}`}
          </span>
          <span style={{ color:C.muted2 }}>·</span>
          <span>Lvl {friend.level}</span>
        </div>
      </div>
      <div style={{ textAlign:"center", minWidth:80 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:4, fontFamily:"'Boogaloo',cursive", fontSize:18, lineHeight:1 }}>
          <span style={{ color: winRate >= 50 ? C.a3 : C.muted }}>{friend.wins}</span>
          <span style={{ color:C.muted2, fontSize:14 }}>—</span>
          <span style={{ color: winRate < 50 ? C.a1 : C.muted }}>{friend.losses}</span>
        </div>
        <div style={{ fontSize:9, color:C.muted, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", marginTop:2 }}>
          {winRate}% W
        </div>
      </div>
      <div style={{ display:"flex", gap:6 }}>
        {friend.isOnline && (
          <button className="ico-btn" title="Invite to lobby" onClick={() => onAction("invite", friend)} style={{ borderColor:C.a4+"44", color:C.a4 }}>🎮</button>
        )}
        <button className="ico-btn" title="Remove friend" onClick={() => onAction("remove", friend)} style={{ color:C.a1+"99" }}>✕</button>
      </div>
    </div>
  );
}

function PendingRow({ req, onAction }) {
  return (
    <div style={{
      display:"grid", gridTemplateColumns:"auto 1fr auto", gap:12, alignItems:"center",
      padding:"12px 16px", background:C.card2, borderRadius:14,
      border:`1px solid ${req.type === "incoming" ? C.a4+"44" : C.border}`,
      animation:"fadeUp 0.3s ease",
    }}>
      <Avatar icon={req.avatar} size={38} />
      <div>
        <div style={{ fontWeight:800, fontSize:14, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
          {req.name} {req.isVIP && <VIPDot />}
        </div>
        <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginTop:2 }}>
          Lvl {req.level} · {req.type === "incoming" ? "Wants to be friends" : "Request sent"}
        </div>
      </div>
      <div style={{ display:"flex", gap:6 }}>
        {req.type === "incoming" ? (
          <>
            <button onClick={() => onAction("accept", req)} style={{ padding:"8px 14px", borderRadius:10, border:"none", background:`linear-gradient(135deg, ${C.a3}, ${C.a4})`, color:"#fff", fontWeight:800, fontSize:12, cursor:"pointer", boxShadow:`0 2px 10px ${C.a3}33` }}>Accept</button>
            <button onClick={() => onAction("decline", req)} style={{ padding:"8px 14px", borderRadius:10, border:`1px solid ${C.border2}`, background:"transparent", color:C.muted, fontWeight:800, fontSize:12, cursor:"pointer" }}>Decline</button>
          </>
        ) : (
          <button onClick={() => onAction("cancel", req)} style={{ padding:"8px 14px", borderRadius:10, border:`1px solid ${C.border2}`, background:"transparent", color:C.muted, fontWeight:800, fontSize:12, cursor:"pointer" }}>Cancel</button>
        )}
      </div>
    </div>
  );
}

function FriendsPage() {
  const [filter,   setFilter]   = useState("all");
  const [search,   setSearch]   = useState("");
  const [showAdd,  setShowAdd]  = useState(false);
  const [addInput, setAddInput] = useState("");
  const [toast,    setToast]    = useState("");
  const [friends,  setFriends]  = useState([]);
  const [pending,  setPending]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { setLoading(false); return; }
    Promise.all([
      api.friends().catch(() => ({})),
      api.friendsPending().catch(() => ({})),
    ]).then(([fd, pd]) => {
      setFriends((fd.friends || []).map(f => ({
        id: f.id, name: f.username, avatar: f.avatar_icon || "🎯",
        level: f.level || 1, isVIP: f.is_vip || false,
        isOnline: false, status: "offline", lastSeen: "unknown",
        wins: f.rivalry?.wins || 0, losses: f.rivalry?.losses || 0,
        friendshipId: f.friendshipId,
      })));
      const inc = (pd.incoming || []).map(f => ({ id:f.id, name:f.requester?.username||"Unknown", avatar:f.requester?.avatar_icon||"🎯", level:f.requester?.level||1, isVIP:f.requester?.is_vip||false, type:"incoming" }));
      const out = (pd.outgoing || []).map(f => ({ id:f.id, name:f.recipient?.username||"Unknown", avatar:f.recipient?.avatar_icon||"🎯", level:f.recipient?.level||1, isVIP:f.recipient?.is_vip||false, type:"outgoing" }));
      setPending([...inc, ...out]);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => friends.filter(f => {
    if (filter === "online" && !f.isOnline) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [filter, search, friends]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const handleAction = (action, friend) => {
    if (!isLoggedIn()) return;
    if (action === "remove") {
      api.removeFriend(friend.friendshipId)
        .then(() => { setFriends(prev => prev.filter(f => f.id !== friend.id)); showToast(`${friend.name} removed from friends`); })
        .catch(e => showToast(e.message || "Error"));
      return;
    }
    if (action === "accept") {
      api.friendRespond({ friendshipId: friend.id, action: "accept" })
        .then(() => {
          setPending(prev => prev.filter(p => p.id !== friend.id));
          api.friends().then(fd => setFriends((fd.friends||[]).map(f => ({ id:f.id, name:f.username, avatar:f.avatar_icon||"🎯", level:f.level||1, isVIP:f.is_vip||false, isOnline:false, status:"offline", lastSeen:"unknown", wins:f.rivalry?.wins||0, losses:f.rivalry?.losses||0, friendshipId:f.friendshipId }))));
          showToast(`${friend.name} added to friends!`);
        }).catch(e => showToast(e.message || "Error"));
      return;
    }
    if (action === "decline" || action === "cancel") {
      api.friendRespond({ friendshipId: friend.id, action: "decline" })
        .then(() => setPending(prev => prev.filter(p => p.id !== friend.id))).catch(() => {});
      return;
    }
    if (action === "invite") showToast(`Lobby invite sent to ${friend.name}`);
  };

  const handleSendRequest = () => {
    if (!addInput.trim()) return;
    if (!isLoggedIn()) { showToast("Sign in to send friend requests"); return; }
    api.friendRequest({ username: addInput.trim() })
      .then(() => {
        showToast(`Friend request sent to ${addInput.trim()}!`);
        setPending(prev => [...prev, { id:`tmp_${Date.now()}`, name:addInput.trim(), avatar:"🎯", level:1, isVIP:false, type:"outgoing" }]);
      })
      .catch(e => showToast(e.message || "Error sending request"));
    setAddInput(""); setShowAdd(false);
  };

  if (!isLoggedIn()) return <GuestWall message="view your friends list" />;

  const onlineCount = friends.filter(f => f.isOnline).length;
  const inGameCount = friends.filter(f => f.status === "in-game").length;

  return (
    <div style={{ animation:"fadeUp 0.4s ease" }}>
      {toast && (
        <div style={{ position:"fixed", top:80, left:"50%", transform:"translateX(-50%)", background:C.card, border:`1.5px solid ${C.a3}`, borderRadius:12, padding:"10px 20px", color:C.a3, fontWeight:700, fontSize:13, zIndex:200, animation:"popIn 0.3s ease", boxShadow:`0 8px 32px ${C.a3}33` }}>✓ {toast}</div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap:10, marginBottom:20 }}>
        {[
          { icon:"👥", label:"Total Friends", value:friends.length,  color:C.a4 },
          { icon:"🟢", label:"Online Now",    value:onlineCount,     color:C.a3 },
          { icon:"🎮", label:"In Game",       value:inGameCount,     color:C.a5 },
          { icon:"📬", label:"Pending",       value:pending.length,  color:C.a2 },
        ].map((s, i) => (
          <div key={i} style={{ background:C.card2, border:`1px solid ${s.color}33`, borderRadius:14, padding:"12px 16px", display:"flex", alignItems:"center", gap:10, animation:`fadeUp 0.4s ease ${i*0.05}s both` }}>
            <span style={{ fontSize:24 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize:10, color:C.muted, fontWeight:800, letterSpacing:0.5, textTransform:"uppercase" }}>{s.label}</div>
              <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:22, color:s.color, lineHeight:1 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:14, padding:14, marginBottom:18, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
        {!showAdd ? (
          <button onClick={() => setShowAdd(true)} style={{ padding:"10px 18px", borderRadius:12, border:"none", background:`linear-gradient(135deg, ${C.a4}, ${C.a5})`, color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:`0 4px 14px ${C.a4}44`, display:"inline-flex", alignItems:"center", gap:6 }}>➕ Add Friend</button>
        ) : (
          <>
            <input className="input-row" autoFocus placeholder="Enter exact username…" value={addInput}
              style={{ flex:1, minWidth:200 }} onChange={e => setAddInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSendRequest()} />
            <button onClick={handleSendRequest} style={{ padding:"11px 18px", borderRadius:12, border:"none", background:`linear-gradient(135deg, ${C.a3}, ${C.a4})`, color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer", boxShadow:`0 4px 14px ${C.a3}44` }}>Send Request</button>
            <button onClick={() => { setShowAdd(false); setAddInput(""); }} style={{ padding:"11px 14px", borderRadius:12, border:`1px solid ${C.border2}`, background:"transparent", color:C.muted, fontWeight:800, fontSize:13, cursor:"pointer" }}>Cancel</button>
          </>
        )}
        <input className="input-row" placeholder="🔍 Search friends…" value={search}
          style={{ flex:1, minWidth:180, maxWidth:300 }} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        {[{ id:"all", label:"All", count:friends.length }, { id:"online", label:"Online", count:onlineCount }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding:"7px 14px", borderRadius:10, fontWeight:800, fontSize:12, cursor:"pointer",
            border:`1.5px solid ${filter === f.id ? C.a4 : C.border2}`,
            background: filter === f.id ? C.a4+"22" : "transparent",
            color: filter === f.id ? C.a4 : C.muted,
            fontFamily:"'DM Sans',sans-serif", display:"inline-flex", alignItems:"center", gap:5,
          }}>
            {f.label}
            <span style={{ background: filter === f.id ? C.a4+"33" : C.border, padding:"1px 7px", borderRadius:8, fontSize:10 }}>{f.count}</span>
          </button>
        ))}
      </div>

      {pending.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:18, marginBottom:10, display:"flex", alignItems:"center", gap:8 }}>
            📬 Pending Requests
            <span style={{ background:C.a4+"22", color:C.a4, fontSize:11, fontWeight:800, padding:"2px 8px", borderRadius:10 }}>{pending.length}</span>
          </h3>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {pending.map(r => <PendingRow key={r.id} req={r} onAction={handleAction} />)}
          </div>
        </div>
      )}

      <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:20, marginBottom:12 }}>
        👥 Friends {filtered.length > 0 && <span style={{ fontSize:13, color:C.muted, fontWeight:600 }}>· {filtered.length}</span>}
      </h3>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"40px 20px", color:C.muted }}>
            <div style={{ fontSize:48, marginBottom:10, opacity:0.5 }}>👻</div>
            <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{search ? `No matches for "${search}"` : friends.length === 0 ? "No friends yet" : "No friends online"}</div>
            {!search && friends.length === 0 && <div style={{ fontSize:12, marginTop:4 }}>Add a friend by entering their username above</div>}
          </div>
        ) : filtered.map(f => <FriendRow key={f.id} friend={f} onAction={handleAction} />)}
      </div>
    </div>
  );
}

// ─── Club pages ──────────────────────────────────────────────────────────────

function MemberRow({ member, rank, myRole, onPromote, onKick }) {
  const isCaptain   = myRole === "Captain";
  const isModerator = myRole === "Moderator";
  const canPromote  = isCaptain && !member.isMe && member.role !== "Captain";
  const canKick     = !member.isMe && member.role !== "Captain" &&
                      (isCaptain || (isModerator && member.role === "Member"));

  return (
    <div style={{
      display:"grid", gridTemplateColumns:"32px auto 1fr auto", gap:12, alignItems:"center",
      padding:"10px 14px",
      background: member.isMe ? `linear-gradient(90deg, ${C.a4}18, transparent)` : C.card2,
      border:`1px solid ${member.isMe ? C.a4+"55" : C.border}`,
      borderRadius:12, animation:"fadeUp 0.3s ease",
    }}>
      <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:15, color: rank <= 3 ? C.a2 : C.muted, textAlign:"center" }}>#{rank}</div>
      <Avatar icon={member.avatar} size={36} online={member.isOnline} />
      <div style={{ minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
          <span style={{ fontWeight:800, fontSize:13, color: member.isMe ? C.a4 : C.text }}>{member.name}</span>
          <RoleBadge role={member.role} />
          {member.isMe && <span style={{ background:C.a4+"22", color:C.a4, fontSize:9, fontWeight:900, padding:"2px 6px", borderRadius:6, letterSpacing:0.5, border:`1px solid ${C.a4}55` }}>YOU</span>}
        </div>
        <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginTop:2 }}>Lvl {member.level}{member.isOnline ? " · Online" : ""}</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:16, color:C.a2, lineHeight:1 }}>+{member.weekXP.toLocaleString()}</div>
          <div style={{ fontSize:9, color:C.muted, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", marginTop:2 }}>Week XP</div>
        </div>
        {(canPromote || canKick) && (
          <div style={{ display:"flex", gap:4 }}>
            {canPromote && (
              <button className="ico-btn" onClick={() => onPromote(member)}
                title={member.role === "Moderator" ? "Demote to Member" : "Promote to Moderator"}
                style={{ color: member.role === "Moderator" ? C.muted : C.a5, borderColor: member.role === "Moderator" ? C.border2 : C.a5+"44", fontSize:12 }}>
                {member.role === "Moderator" ? "⬇" : "⬆"}
              </button>
            )}
            {canKick && (
              <button className="ico-btn" onClick={() => onKick(member)}
                title="Kick from club" style={{ color:C.a1+"99" }}>✕</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatBubble({ msg }) {
  return (
    <div style={{ display:"flex", gap:8, alignItems:"flex-start", flexDirection: msg.isMe ? "row-reverse" : "row", animation:"fadeUp 0.3s ease" }}>
      <Avatar icon={msg.avatar} size={28} />
      <div style={{ maxWidth:"75%" }}>
        {!msg.isMe && <div style={{ fontSize:11, color:C.muted, fontWeight:700, marginBottom:3 }}>{msg.user}</div>}
        <div style={{
          background: msg.isMe ? `linear-gradient(135deg, ${C.a4}, ${C.a5})` : C.card2,
          color: msg.isMe ? "#fff" : C.text,
          padding:"8px 14px",
          borderRadius: msg.isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          fontSize:13, fontWeight:500, border: msg.isMe ? "none" : `1px solid ${C.border}`, lineHeight:1.4,
        }}>{msg.msg}</div>
        <div style={{ fontSize:10, color:C.muted, fontWeight:600, marginTop:3, textAlign: msg.isMe ? "right" : "left" }}>{msg.time}</div>
      </div>
    </div>
  );
}

const ROLE_MAP = { captain:"Captain", moderator:"Moderator", officer:"Moderator", member:"Member" };

function MyClubPage({ onCreateClub }) {
  const [chatMsg,     setChatMsg]     = useState("");
  const [messages,    setMessages]    = useState([]);
  const [club,        setClub]        = useState(null);
  const [clubMembers, setClubMembers] = useState([]);
  const [myRole,      setMyRole]      = useState("Member");
  const [clubId,      setClubId]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [leaving,     setLeaving]     = useState(false);
  const [toast,       setToast]       = useState("");
  const chatRef    = useRef(null);
  const myUsername = getUsername();
  const showToast  = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    if (!isLoggedIn()) { setLoading(false); return; }
    api.myClub().then(d => {
      if (!d.club) return;
      const c = d.club;
      setClubId(c.id);
      setMyRole(ROLE_MAP[d.myRole] || "Member");
      setClub({
        id:c.id, name:c.name, tag:c.tag, icon:c.icon||"🏆",
        banner: c.banner_style || `linear-gradient(135deg, ${C.a5}, ${C.a4})`,
        description:c.description||"",
        members:d.members?.length||0, maxMembers:50,
        weeklyXP:c.weekly_xp||0, rank:c.rank||0,
        founded:c.created_at?new Date(c.created_at).toLocaleDateString("en-US",{month:"short",year:"numeric"}):"",
        myRole:ROLE_MAP[d.myRole]||"Member", level:c.level||1,
        xpToNext:c.xp_to_next||0, xpForLevel:c.xp_for_level||10000,
      });
      setClubMembers((d.members||[]).map(m => ({
        id:m.profile?.id||m.user_id, name:m.profile?.username||"Player",
        avatar:m.profile?.avatar_icon||"🎯", level:m.profile?.level||1,
        role:ROLE_MAP[m.role] || "Member",
        weekXP:m.weekly_xp||0, isOnline:false, isMe:m.profile?.username===myUsername,
      })));
      return api.clubChat(c.id);
    }).then(chatRes => {
      if (!chatRes) return;
      setMessages((chatRes.messages||[]).map(m => ({
        id:m.id, user:m.user?.username||"Player", avatar:m.user?.avatar_icon||"🎯",
        msg:m.message, time:new Date(m.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),
        isMe:m.user?.username===myUsername,
      })));
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = () => {
    if (!chatMsg.trim() || !isLoggedIn()) return;
    const msg = chatMsg.trim(); setChatMsg("");
    const myAvatar = clubMembers.find(m => m.isMe)?.avatar || "🎯";
    setMessages(prev => [...prev, { id:Date.now(), user:myUsername||"You", avatar:myAvatar, msg, time:"now", isMe:true }]);
    if (clubId) api.sendChat(clubId, { message:msg }).catch(()=>{});
  };

  const handlePromote = (member) => {
    if (!clubId) return;
    const newRole = member.role === "Moderator" ? "member" : "moderator";
    api.promoteMember(clubId, member.id, newRole)
      .then(() => {
        setClubMembers(prev => prev.map(m =>
          m.id === member.id ? { ...m, role: ROLE_MAP[newRole] } : m
        ));
        showToast(newRole === "moderator" ? `${member.name} promoted to Moderator` : `${member.name} demoted to Member`);
      })
      .catch(e => showToast(e.message || "Error updating role"));
  };

  const handleKick = (member) => {
    if (!clubId) return;
    api.kickMember(clubId, member.id)
      .then(() => {
        setClubMembers(prev => prev.filter(m => m.id !== member.id));
        setClub(prev => prev ? { ...prev, members: prev.members - 1 } : prev);
        showToast(`${member.name} was kicked from the club`);
      })
      .catch(e => showToast(e.message || "Error kicking member"));
  };

  const handleLeave = () => {
    if (leaving) return;
    setLeaving(true);
    api.leaveClub().then(() => { setClub(null); setClubMembers([]); setMessages([]); setClubId(null); }).catch(()=>{}).finally(()=>setLeaving(false));
  };

  if (!isLoggedIn()) return <GuestWall message="view your club" />;
  if (loading) return <Spinner />;

  if (!club) {
    return (
      <div style={{ textAlign:"center", padding:"70px 20px", animation:"fadeUp 0.4s ease" }}>
        <div style={{ fontSize:64, marginBottom:14, animation:"float 3s ease-in-out infinite" }}>🏰</div>
        <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:26, color:C.text, marginBottom:8 }}>You're not in a club yet</div>
        <div style={{ fontSize:14, color:C.muted, fontWeight:600, marginBottom:28, maxWidth:360, margin:"0 auto 28px" }}>
          Clubs let you team up, compete together, and unlock exclusive rewards
        </div>
        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <button onClick={onCreateClub} style={{
            padding:"14px 28px", borderRadius:14, border:"none",
            background:`linear-gradient(135deg, ${C.a4}, ${C.a5})`, color:"#fff",
            fontFamily:"'Boogaloo',cursive", fontSize:20, cursor:"pointer",
            boxShadow:`0 6px 24px ${C.a4}44`,
          }}>🏰 Create a Club</button>
          <button onClick={onCreateClub} style={{
            padding:"14px 24px", borderRadius:14, border:`1.5px solid ${C.border2}`,
            background:"transparent", color:C.muted,
            fontFamily:"'Boogaloo',cursive", fontSize:18, cursor:"pointer",
          }}>🔍 Browse Clubs</button>
        </div>
      </div>
    );
  }

  const xpPct     = Math.round((club.xpToNext / Math.max(1, club.xpForLevel)) * 100);
  const memberPct = Math.round((club.members  / club.maxMembers) * 100);
  const sortedMembers = [...clubMembers].sort((a, b) => b.weekXP - a.weekXP);
  const rewards = REWARD_MILESTONES.map(r => ({ ...r, unlocked: club.level >= r.level }));

  return (
    <div style={{ animation:"fadeUp 0.4s ease" }}>
      {toast && (
        <div style={{ position:"fixed", top:80, left:"50%", transform:"translateX(-50%)", background:C.card, border:`1.5px solid ${C.a3}`, borderRadius:12, padding:"10px 20px", color:C.a3, fontWeight:700, fontSize:13, zIndex:200, animation:"popIn 0.3s ease", boxShadow:`0 8px 32px ${C.a3}33` }}>✓ {toast}</div>
      )}
      <div style={{ background:club.banner, borderRadius:20, padding:"24px 26px", marginBottom:20, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(105deg, transparent 30%, #fff2 50%, transparent 70%)", animation:"shine 4s ease-in-out infinite" }} />
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:14, marginBottom:14 }}>
            <div style={{ display:"flex", gap:14, alignItems:"center" }}>
              <div style={{ width:64, height:64, borderRadius:18, background:"#0008", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, backdropFilter:"blur(4px)", animation:"float 4s ease-in-out infinite" }}>{club.icon}</div>
              <div>
                <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                  <h2 style={{ fontFamily:"'Boogaloo',cursive", fontSize:24, color:"#fff", textShadow:"0 2px 8px #0008" }}>{club.name}</h2>
                  <span style={{ background:"#fff3", color:"#fff", fontSize:11, fontWeight:900, padding:"2px 8px", borderRadius:6, letterSpacing:1, backdropFilter:"blur(4px)" }}>[{club.tag}]</span>
                </div>
                <p style={{ fontSize:12, color:"#fffd", fontWeight:600, marginTop:4 }}>Founded {club.founded} · Club Level {club.level}</p>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8 }}>
              <div style={{ padding:"4px 12px", borderRadius:8, background:"#fff3", backdropFilter:"blur(4px)", color:"#fff", fontWeight:900, fontSize:13 }}>👑 {myRole}</div>
              <button onClick={handleLeave} disabled={leaving} style={{ padding:"6px 12px", borderRadius:8, border:"1px solid #fff4", background:"#fff1", color:"#fffa", fontWeight:700, fontSize:11, cursor:"pointer" }}>{leaving ? "Leaving…" : "Leave Club"}</button>
            </div>
          </div>
          {club.description && <p style={{ fontSize:13, color:"#fffe", fontWeight:500, lineHeight:1.5, maxWidth:600 }}>{club.description}</p>}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap:10, marginBottom:20 }}>
        {[
          { icon:"👥", label:"Members",   value:`${club.members}/${club.maxMembers}`, color:C.a4, sub:`${memberPct}% full` },
          { icon:"🏆", label:"Club Rank", value: club.rank ? `#${club.rank}` : "—",  color:C.a2, sub:"Global" },
          { icon:"⚡", label:"Week XP",   value:(club.weeklyXP||0).toLocaleString(), color:C.a5, sub:"Earned" },
          { icon:"📊", label:"Level",     value:club.level,                          color:C.a3, sub:`${xpPct}% to next` },
        ].map((s, i) => (
          <div key={i} style={{ background:C.card2, border:`1px solid ${s.color}33`, borderRadius:14, padding:"12px 16px", animation:`fadeUp 0.4s ease ${i*0.05}s both` }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ fontSize:18 }}>{s.icon}</span>
              <span style={{ fontSize:10, color:C.muted, fontWeight:800, letterSpacing:0.5, textTransform:"uppercase" }}>{s.label}</span>
            </div>
            <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:20, color:s.color, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:10, color:C.muted, fontWeight:600, marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:14, padding:16, marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8, flexWrap:"wrap", gap:8 }}>
          <span style={{ fontSize:12, fontWeight:800, color:C.text, letterSpacing:0.5, textTransform:"uppercase" }}>🚀 Club Level Progress</span>
          <span style={{ fontSize:12, fontWeight:700, color:C.a3 }}>{(club.xpToNext||0).toLocaleString()} / {(club.xpForLevel||10000).toLocaleString()} XP</span>
        </div>
        <div style={{ height:10, background:C.border2, borderRadius:5, overflow:"hidden" }}>
          <div style={{ "--w":`${xpPct}%`, height:"100%", borderRadius:5, background:`linear-gradient(90deg, ${C.a3}, ${C.a4})`, width:`${xpPct}%`, boxShadow:`0 0 14px ${C.a3}66`, animation:"barGrow 1.2s cubic-bezier(.4,0,.2,1) forwards" }} />
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1.4fr) minmax(0,1fr)", gap:18, marginBottom:20 }}>
        <div>
          <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:18, marginBottom:12 }}>🏆 Top Members This Week</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:480, overflowY:"auto", paddingRight:4 }}>
            {sortedMembers.length === 0
              ? <div style={{ color:C.muted, fontSize:13, padding:16 }}>No members yet</div>
              : sortedMembers.map((m, i) => (
                  <MemberRow key={m.id} member={m} rank={i+1}
                    myRole={myRole} onPromote={handlePromote} onKick={handleKick} />
                ))
            }
          </div>
        </div>
        <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden", display:"flex", flexDirection:"column", maxHeight:520 }}>
          <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:18 }}>💬 Club Chat</h3>
            <span style={{ fontSize:11, color:C.a3, fontWeight:800, display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:C.a3, animation:"pulseDot 2s ease-in-out infinite" }} />
              {clubMembers.filter(m=>m.isOnline).length} online
            </span>
          </div>
          <div ref={chatRef} style={{ flex:1, padding:14, overflowY:"auto", display:"flex", flexDirection:"column", gap:12, minHeight:300 }}>
            {messages.length === 0
              ? <div style={{ color:C.muted, fontSize:13, textAlign:"center", paddingTop:40 }}>No messages yet — say hi!</div>
              : messages.map(m => <ChatBubble key={m.id} msg={m} />)
            }
          </div>
          <div style={{ padding:12, borderTop:`1px solid ${C.border}`, display:"flex", gap:8 }}>
            <input className="input-row" placeholder="Type a message…" value={chatMsg}
              style={{ flex:1, padding:"9px 14px", fontSize:13 }}
              onChange={e => setChatMsg(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()} />
            <button onClick={sendMessage} style={{ padding:"9px 14px", borderRadius:10, border:"none", background:chatMsg.trim()?`linear-gradient(135deg, ${C.a4}, ${C.a5})`:C.border, color:chatMsg.trim()?"#fff":C.muted, fontWeight:800, fontSize:13, cursor:"pointer" }}>Send</button>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:18, marginBottom:12 }}>🎁 Club Rewards</h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:10 }}>
          {rewards.map((r, i) => (
            <div key={i} style={{ background:C.card2, border:`1px solid ${r.unlocked?C.a3+"55":C.border}`, borderRadius:14, padding:"14px 16px", opacity:r.unlocked?1:0.55, animation:`fadeUp 0.4s ease ${i*0.06}s both` }}>
              <div style={{ fontSize:24, marginBottom:6, filter:r.unlocked?"none":"grayscale(0.6)" }}>{r.icon}</div>
              <div style={{ fontSize:11, color:r.unlocked?C.a3:C.muted, fontWeight:800, letterSpacing:0.5, textTransform:"uppercase" }}>{r.unlocked?"✓ Unlocked":`Lvl ${r.level}`}</div>
              <div style={{ fontSize:13, fontWeight:700, color:C.text, marginTop:2 }}>{r.reward}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BrowseClubsPage({ onCreateClub }) {
  const [search,  setSearch]  = useState("");
  const [toast,   setToast]   = useState("");
  const [clubs,   setClubs]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.clubs().then(d => {
      setClubs((d.clubs||[]).map(c => ({
        id:c.id, name:c.name, tag:c.tag, icon:c.icon||"🏆",
        members:c.member_count?.[0]?.count||0, maxMembers:50,
        weekXP:c.weekly_xp||0, rank:c.rank||0, level:c.level||1, vibe:c.vibe||"Friendly",
      })));
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const filtered = clubs.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.tag.toLowerCase().includes(search.toLowerCase()));
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),2500); };

  const handleJoin = (club) => {
    if (!isLoggedIn()) { showToast("Sign in to join clubs"); return; }
    api.joinClub(club.id).then(()=>showToast(`Joined ${club.name}!`)).catch(e=>showToast(e.message||"Error joining club"));
  };

  return (
    <div style={{ animation:"fadeUp 0.4s ease" }}>
      {toast && (
        <div style={{ position:"fixed", top:80, left:"50%", transform:"translateX(-50%)", background:C.card, border:`1.5px solid ${C.a3}`, borderRadius:12, padding:"10px 20px", color:C.a3, fontWeight:700, fontSize:13, zIndex:200, animation:"popIn 0.3s ease", boxShadow:`0 8px 32px ${C.a3}33` }}>✓ {toast}</div>
      )}
      <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:14, padding:14, marginBottom:18, display:"flex", gap:10, flexWrap:"wrap" }}>
        <input className="input-row" placeholder="🔍 Search clubs by name or tag…" value={search}
          style={{ flex:1, minWidth:200 }} onChange={e=>setSearch(e.target.value)} />
        <button onClick={onCreateClub} style={{ padding:"11px 18px", borderRadius:12, border:"none", background:`linear-gradient(135deg, ${C.a3}, ${C.a4})`, color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer", boxShadow:`0 4px 14px ${C.a3}44` }}>+ Create Club</button>
      </div>

      <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:20, marginBottom:12 }}>⭐ Clubs to Join</h3>
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"40px 20px", color:C.muted }}>
          <div style={{ fontSize:48, marginBottom:10, opacity:0.5 }}>🔍</div>
          <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{search?`No clubs matching "${search}"`:"No clubs available yet"}</div>
          <div style={{ fontSize:12, marginTop:4 }}>Be the first to create one!</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:14, marginBottom:24 }}>
          {filtered.map((club, i) => (
            <div key={club.id} style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:18, padding:18, position:"relative", overflow:"hidden", animation:`fadeUp 0.4s ease ${i*0.07}s both` }}>
              <div style={{ position:"absolute", inset:0, opacity:0.15, background:`radial-gradient(circle at 80% 0%, ${C.a4}44, transparent 60%)`, pointerEvents:"none" }} />
              <div style={{ position:"relative", zIndex:1 }}>
                <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:12 }}>
                  <div style={{ width:54, height:54, borderRadius:14, background:`linear-gradient(135deg, ${C.a4}33, ${C.a5}22)`, border:`1.5px solid ${C.a4}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, animation:"float 3.5s ease-in-out infinite" }}>{club.icon}</div>
                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                      <span style={{ fontWeight:800, fontSize:15, color:C.text }}>{club.name}</span>
                      <span style={{ background:C.border, color:C.muted, fontSize:10, fontWeight:900, padding:"1px 6px", borderRadius:6, letterSpacing:0.5 }}>[{club.tag}]</span>
                    </div>
                    <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginTop:2 }}>Lvl {club.level}{club.rank?` · #${club.rank} globally`:""}</div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:12, marginBottom:14, flexWrap:"wrap" }}>
                  {[
                    { label:"Members", value:`${club.members}/${club.maxMembers}`, color:C.a4 },
                    { label:"Week XP", value:club.weekXP.toLocaleString(),         color:C.a2 },
                    { label:"Vibe",    value:club.vibe,                            color:C.a5 },
                  ].map((s,j)=>(
                    <div key={j}>
                      <div style={{ fontSize:9, color:C.muted, fontWeight:800, letterSpacing:0.5, textTransform:"uppercase" }}>{s.label}</div>
                      <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:16, color:s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <button onClick={()=>handleJoin(club)} disabled={club.members>=club.maxMembers} style={{
                  width:"100%", padding:"10px", borderRadius:10, border:"none",
                  background:club.members>=club.maxMembers?C.border:`linear-gradient(135deg, ${C.a4}, ${C.a5})`,
                  color:club.members>=club.maxMembers?C.muted:"#fff",
                  fontWeight:800, fontSize:13, cursor:club.members>=club.maxMembers?"not-allowed":"pointer",
                  fontFamily:"'DM Sans',sans-serif",
                  boxShadow:club.members>=club.maxMembers?"none":`0 4px 14px ${C.a4}33`,
                }}>{club.members>=club.maxMembers?"🔒 Club Full":"Request to Join"}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────

export default function FriendsFlow() {
  const [section,    setSection]    = useState("friends");
  const [showCreate, setShowCreate] = useState(false);
  const [clubKey,    setClubKey]    = useState(0);

  const handleClubCreated = () => {
    setShowCreate(false);
    setSection("club");
    setClubKey(k => k + 1);
  };

  return (
    <div style={{ minHeight:"100vh", background:"transparent", color:C.text, fontFamily:"'DM Sans',sans-serif", paddingBottom:60 }}>
      <style>{css}</style>

      {showCreate && <CreateClubModal onClose={() => setShowCreate(false)} onCreated={handleClubCreated} />}

      <div style={{ background:`linear-gradient(180deg, ${C.a4}11 0%, transparent 100%)`, borderBottom:`1px solid ${C.border}`, padding:"28px 24px 0", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(${C.border}44 1px, transparent 1px), linear-gradient(90deg, ${C.border}44 1px, transparent 1px)`, backgroundSize:"32px 32px", opacity:0.3 }} />
        <div style={{ maxWidth:1100, margin:"0 auto", position:"relative", zIndex:1 }}>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:C.a4, fontWeight:900, letterSpacing:1.5, textTransform:"uppercase", marginBottom:4 }}>Community</div>
            <h1 style={{ fontFamily:"'Boogaloo',cursive", fontSize:32, lineHeight:1 }}>👥 Friends & Clubs</h1>
            <p style={{ fontSize:13, color:C.muted, fontWeight:600, marginTop:4 }}>Connect, compete, and play with your crew</p>
          </div>
          <div style={{ display:"flex", gap:4, overflowX:"auto", borderBottom:`1px solid ${C.border}` }}>
            {[{ id:"friends", label:"👥 Friends" }, { id:"club", label:"💎 My Club" }, { id:"browse", label:"🔍 Browse Clubs" }].map(t => (
              <button key={t.id} onClick={() => setSection(t.id)} className={`nav-tab ${section === t.id ? "active" : ""}`}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"24px 24px 0" }}>
        {section === "friends" && <FriendsPage />}
        {section === "club"    && <MyClubPage    key={clubKey} onCreateClub={() => setShowCreate(true)} />}
        {section === "browse"  && <BrowseClubsPage             onCreateClub={() => setShowCreate(true)} />}
      </div>
    </div>
  );
}

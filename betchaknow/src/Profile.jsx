import { useState, useEffect, useRef } from "react";
import { api, isLoggedIn } from "./api";

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

const PLAYER = {
  username:   "BluffMaster99",
  title:      "The Shark",
  level:      42,
  xp:         8750,
  xpNext:     10000,
  bluffBucks: 1340,
  avatar:     "🎯",
  joinDate:   "March 2024",
  country:    "🇺🇸",
  vip:        true,
  stats: {
    gamesPlayed:   312,
    wins:          187,
    winRate:       60,
    totalCorrect:  2841,
    accuracy:      72,
    bluffsLanded:  94,
    biggestWin:    1800,
    longestStreak: 11,
    allInWins:     7,
    pointsEarned:  148200,
  },
};

const CATEGORIES = [
  { id:"sports",     label:"🏆 Sports",      rank:4, progress:78 },
  { id:"science",    label:"🔬 Science",     rank:5, progress:32 },
  { id:"popculture", label:"🎬 Pop Culture", rank:6, progress:91 },
  { id:"history",    label:"📜 History",     rank:3, progress:55 },
  { id:"movies",     label:"🎥 Movies",      rank:5, progress:64 },
  { id:"music",      label:"🎵 Music",       rank:2, progress:20 },
  { id:"geography",  label:"🌍 Geography",   rank:4, progress:88 },
];

const RANKS = ["Bronze","Silver","Gold","Diamond","Hall of Fame","Legend"];
const RANK_COLORS = [C.a6,"#c0c0c0","#ffd700","#00cfff","#ff6b6b",C.a5];
const RANK_ICONS  = ["🥉","🥈","🥇","💎","🏆","👑"];

const ALL_BADGES = [
  { id:"b1",  icon:"🔥", name:"On Fire",         desc:"10 correct in a row",        rarity:"epic",   earned:true  },
  { id:"b2",  icon:"🃏", name:"Master Bluffer",  desc:"50 successful bluffs",       rarity:"rare",   earned:true  },
  { id:"b3",  icon:"💰", name:"The Shark",        desc:"Highest betting ROI",        rarity:"epic",   earned:true  },
  { id:"b4",  icon:"👑", name:"Legend",           desc:"Reach Legend rank",          rarity:"legend", earned:true  },
  { id:"b5",  icon:"🎰", name:"All-In King",      desc:"Win 5 All-In bets",          rarity:"rare",   earned:true  },
  { id:"b6",  icon:"🏆", name:"Hall of Famer",    desc:"Top 10 all-time",            rarity:"legend", earned:true  },
  { id:"b7",  icon:"⚡", name:"Speed Demon",      desc:"Fastest answer 100x",        rarity:"common", earned:true  },
  { id:"b8",  icon:"🎯", name:"Sharpshooter",     desc:"90%+ accuracy in a game",    rarity:"rare",   earned:true  },
  { id:"b9",  icon:"🌟", name:"MVP",              desc:"MVP award 20 times",         rarity:"epic",   earned:true  },
  { id:"b10", icon:"🗓️", name:"Dedicated",        desc:"30-day login streak",        rarity:"common", earned:true  },
  { id:"b11", icon:"🌍", name:"Globe Trotter",    desc:"Play with 50 countries",     rarity:"rare",   earned:false },
  { id:"b12", icon:"💎", name:"Diamond Mind",     desc:"Diamond in 3 categories",    rarity:"epic",   earned:false },
  { id:"b13", icon:"🏅", name:"Season I Champ",   desc:"Win Season I leaderboard",   rarity:"legend", earned:false },
  { id:"b14", icon:"🤝", name:"Club Captain",     desc:"Found a club with 50 members",rarity:"rare",  earned:false },
  { id:"b15", icon:"📚", name:"Trivia Scholar",   desc:"Answer 5000 questions",      rarity:"epic",   earned:false },
];

const RARITY_COLORS = { common: C.muted, rare: C.a4, epic: C.a5, legend: C.a2 };
const RARITY_BG     = { common: C.muted+"18", rare: C.a4+"18", epic: C.a5+"18", legend: C.a2+"18" };

const ACHIEVEMENTS = [
  { icon:"🎮", name:"First Blood",    desc:"Win your first game",          progress:1,   total:1,   done:true  },
  { icon:"🔥", name:"Hot Streak",     desc:"Get 10 correct in a row",      progress:10,  total:10,  done:true  },
  { icon:"🃏", name:"Bluff God",      desc:"Land 100 successful bluffs",   progress:94,  total:100, done:false },
  { icon:"🏆", name:"Century Club",   desc:"Win 100 games",                progress:100, total:100, done:true  },
  { icon:"💰", name:"High Roller",    desc:"Earn 100,000 total points",    progress:100, total:100, done:true  },
  { icon:"📅", name:"Committed",      desc:"Log in 7 days in a row",       progress:7,   total:7,   done:true  },
  { icon:"🌍", name:"World Traveler", desc:"Play with players from 20 countries", progress:14, total:20, done:false },
  { icon:"⚡", name:"Speed King",     desc:"Answer first 200 times",       progress:156, total:200, done:false },
];

const RECENT_GAMES = [
  { date:"Today",      result:"Win",  pts:+420, accuracy:85, bluffs:2 },
  { date:"Today",      result:"Win",  pts:+310, accuracy:79, bluffs:1 },
  { date:"Yesterday",  result:"Loss", pts:-120, accuracy:60, bluffs:0 },
  { date:"Yesterday",  result:"Win",  pts:+580, accuracy:92, bluffs:3 },
  { date:"2 days ago", result:"Loss", pts:-85,  accuracy:55, bluffs:1 },
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Boogaloo&family=DM+Sans:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes popIn    { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
  @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes shimmer  { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes glow     { 0%,100%{box-shadow:0 0 12px var(--glow)} 50%{box-shadow:0 0 28px var(--glow)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes xpFill   { from{width:0} to{width:var(--xp-w)} }
  @keyframes barFill  { from{width:0} to{width:var(--bar-w)} }
  @keyframes badgePop { 0%{transform:scale(0.6) rotate(-10deg);opacity:0} 70%{transform:scale(1.1) rotate(2deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:${C.border2}; border-radius:2px; }
  .tab-btn { padding:8px 18px; border-radius:10px; border:none; background:transparent; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:700; cursor:pointer; transition:all 0.15s; white-space:nowrap; }
  .tab-btn.active { background:${C.border2}; color:${C.text}; }
  .tab-btn:not(.active) { color:${C.muted}; }
  .tab-btn:not(.active):hover { color:${C.text}; }
  .stat-card { background:${C.card2}; border:1px solid ${C.border}; border-radius:16px; padding:16px 20px; display:flex; flex-direction:column; gap:4px; transition:border-color 0.2s, transform 0.15s; animation:fadeUp 0.4s ease; }
  .stat-card:hover { border-color:${C.border2}; transform:translateY(-2px); }
  .badge-item { border-radius:14px; padding:14px; cursor:pointer; transition:all 0.18s; position:relative; border:2px solid transparent; }
  .badge-item:hover { transform:translateY(-3px); }
  .showcase-slot { width:72px; height:72px; border-radius:16px; display:flex; align-items:center; justify-content:center; transition:all 0.2s; cursor:pointer; }
  .progress-bar-track { height:6px; border-radius:3px; background:${C.border2}; overflow:hidden; }
  .progress-bar-fill { height:100%; border-radius:3px; animation:barFill 1s cubic-bezier(.4,0,.2,1) forwards; }
  .game-row { display:flex; align-items:center; justify-content:space-between; padding:10px 16px; border-radius:12px; border:1px solid ${C.border}; background:${C.card2}; transition:border-color 0.15s; animation:fadeUp 0.3s ease; }
  .game-row:hover { border-color:${C.border2}; }
`;

function StatCard({ icon, label, value, color, delay="0s" }) {
  return (
    <div className="stat-card" style={{ animationDelay:delay }}>
      <div style={{ fontSize:20 }}>{icon}</div>
      <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:26, color: color || C.text }}>{value}</div>
      <div style={{ fontSize:12, color:C.muted, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>{label}</div>
    </div>
  );
}

function RankBadge({ rank }) {
  return (
    <span style={{
      background: RANK_COLORS[rank-1] + "22", color: RANK_COLORS[rank-1],
      border: `1px solid ${RANK_COLORS[rank-1]}55`, borderRadius:20, padding:"2px 10px",
      fontSize:11, fontWeight:800, fontFamily:"'DM Sans',sans-serif",
      display:"inline-flex", alignItems:"center", gap:4,
    }}>
      {RANK_ICONS[rank-1]} {RANKS[rank-1]}
    </span>
  );
}

function VIPBadge() {
  return (
    <span style={{
      background:"linear-gradient(135deg,#ffd93d,#ff9f43)", color:"#111", borderRadius:20, padding:"2px 10px",
      fontSize:11, fontWeight:900, fontFamily:"'DM Sans',sans-serif", letterSpacing:0.5,
    }}>⭐ VIP</span>
  );
}

function BadgePicker({ equipped, onEquip }) {
  const [picking, setPicking] = useState(null);
  const earned = ALL_BADGES.filter(b => b.earned);

  const handleSlotClick = (i) => setPicking(i === picking ? null : i);
  const handleBadgePick = (badge) => {
    if (picking === null) return;
    onEquip(picking, badge);
    setPicking(null);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div>
        <div style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", marginBottom:10 }}>
          Showcase (choose up to 3)
        </div>
        <div style={{ display:"flex", gap:12 }}>
          {[0,1,2].map(i => {
            const b      = equipped[i];
            const active = picking === i;
            const rColor = b ? RARITY_COLORS[b.rarity] : C.muted2;
            return (
              <div key={i} className="showcase-slot"
                onClick={() => handleSlotClick(i)}
                style={{
                  background: b ? RARITY_BG[b.rarity] : C.card2,
                  border: `2px solid ${active ? C.a4 : b ? rColor+"66" : C.border}`,
                  boxShadow: active ? `0 0 0 3px ${C.a4}33` : b ? `0 0 16px ${rColor}22` : "none",
                }}>
                {b
                  ? <span style={{ fontSize:32, filter:"drop-shadow(0 2px 6px #0006)" }}>{b.icon}</span>
                  : <span style={{ fontSize:22, color:C.muted2 }}>+</span>
                }
              </div>
            );
          })}
        </div>
      </div>

      {picking !== null && (
        <div style={{ background:C.card2, border:`1px solid ${C.a4}55`, borderRadius:16, padding:16, animation:"popIn 0.25s ease" }}>
          <div style={{ fontSize:12, color:C.a4, fontWeight:700, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", marginBottom:12 }}>
            Pick badge for slot {picking + 1}
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {earned.map(b => {
              const isEquipped = equipped.some(e => e?.id === b.id);
              return (
                <button key={b.id}
                  onClick={() => !isEquipped && handleBadgePick(b)}
                  style={{
                    background: isEquipped ? C.border : RARITY_BG[b.rarity],
                    border:`1.5px solid ${isEquipped ? C.border2 : RARITY_COLORS[b.rarity]+"55"}`,
                    borderRadius:10, padding:"8px 12px",
                    display:"flex", alignItems:"center", gap:6,
                    cursor: isEquipped ? "not-allowed" : "pointer",
                    opacity: isEquipped ? 0.4 : 1, transition:"all 0.15s",
                  }}>
                  <span style={{ fontSize:18 }}>{b.icon}</span>
                  <div style={{ textAlign:"left" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:RARITY_COLORS[b.rarity], fontFamily:"'DM Sans',sans-serif" }}>{b.name}</div>
                    <div style={{ fontSize:10, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>{b.rarity}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const [tab,        setTab]       = useState("overview");
  const [equipped,   setEquipped]  = useState([ALL_BADGES[3], ALL_BADGES[2], ALL_BADGES[8]]);
  const [profilePic, setProfilePic] = useState(null);
  const [avatarHover, setAvatarHover] = useState(false);
  const [player,     setPlayer]    = useState(PLAYER);
  const [categories, setCategories] = useState(CATEGORIES);
  const [recentGames, setRecentGames] = useState(RECENT_GAMES);
  const fileInputRef = useRef(null);

  const [editingUsername,  setEditingUsername]  = useState(false);
  const [newUsername,      setNewUsername]      = useState("");
  const [usernameError,    setUsernameError]    = useState("");
  const [usernameLoading,  setUsernameLoading]  = useState(false);

  const handleSaveUsername = async () => {
    const trimmed = newUsername.trim();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed)) {
      setUsernameError("3–20 chars, letters/numbers/underscores only");
      return;
    }
    setUsernameLoading(true);
    try {
      await api.updateMe({ username: trimmed });
      localStorage.setItem("bk_username", trimmed);
      setPlayer(prev => ({ ...prev, username: trimmed }));
      setEditingUsername(false);
      setUsernameError("");
    } catch (err) {
      setUsernameError(err.message || "Username already taken, try another");
    } finally {
      setUsernameLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn()) return;
    api.me().then(d => {
      const p = d.profile;
      if (!p) return;
      setPlayer(prev => ({
        ...prev,
        username:   p.username   || prev.username,
        avatar:     p.avatar_icon || prev.avatar,
        level:      p.level      || prev.level,
        xp:         p.xp         ?? prev.xp,
        xpNext:     p.xp_next    || prev.xpNext,
        bluffBucks: p.coins      ?? prev.bluffBucks,
        country:    p.country    || prev.country,
        vip:        p.is_vip     ?? prev.vip,
        title:      p.title      || prev.title,
        joinDate:   p.created_at ? new Date(p.created_at).toLocaleDateString("en-US",{month:"long",year:"numeric"}) : prev.joinDate,
        stats: {
          ...prev.stats,
          gamesPlayed:   p.games_played   ?? prev.stats.gamesPlayed,
          wins:          p.games_won       ?? prev.stats.wins,
          winRate:       p.games_played > 0 ? Math.round((p.games_won / p.games_played) * 100) : prev.stats.winRate,
          accuracy:      p.accuracy        ?? prev.stats.accuracy,
          bluffsLanded:  p.bluffs_landed   ?? prev.stats.bluffsLanded,
          biggestWin:    p.biggest_win     ?? prev.stats.biggestWin,
          longestStreak: p.longest_streak  ?? prev.stats.longestStreak,
          allInWins:     p.all_in_wins     ?? prev.stats.allInWins,
          pointsEarned:  p.season_points   ?? prev.stats.pointsEarned,
        },
      }));

      if (d.mastery?.length > 0) {
        setCategories(d.mastery.map(m => {
          const existing = CATEGORIES.find(c => c.id === m.category) || {};
          return { ...existing, id: m.category, rank: m.rank || 1, progress: m.progress || 0 };
        }));
      }

      if (d.history?.length > 0) {
        setRecentGames(d.history.map(g => ({
          date:     g.played_at ? new Date(g.played_at).toLocaleDateString() : "Unknown",
          result:   g.won ? "Win" : "Loss",
          pts:      g.points_delta ?? 0,
          accuracy: g.accuracy ?? 0,
          bluffs:   g.bluffs_landed ?? 0,
        })));
      }
    }).catch(() => {});
  }, []);

  const handleEquip = (slot, badge) => {
    setEquipped(prev => { const next = [...prev]; next[slot] = badge; return next; });
  };

  const xpPct = Math.round((player.xp / player.xpNext) * 100);

  const tabs = [
    { id:"overview",     label:"Overview"     },
    { id:"mastery",      label:"Mastery"      },
    { id:"badges",       label:"Badges"       },
    { id:"achievements", label:"Achievements" },
    { id:"history",      label:"Game History" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'DM Sans',sans-serif", color:C.text, padding:"0 0 60px" }}>
      <style>{css}</style>

      <div style={{
        background:`linear-gradient(160deg, ${C.a5}22 0%, ${C.a4}18 40%, ${C.a1}10 100%)`,
        borderBottom:`1px solid ${C.border}`, padding:"32px 24px 0",
        position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(${C.border}44 1px,transparent 1px),linear-gradient(90deg,${C.border}44 1px,transparent 1px)`, backgroundSize:"32px 32px", opacity:0.4 }} />
        <div style={{ maxWidth:860, margin:"0 auto", position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", gap:20, alignItems:"flex-start", marginBottom:24, flexWrap:"wrap" }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display:"none" }}
                onChange={e => {
                  const f = e.target.files[0];
                  if (f) setProfilePic(URL.createObjectURL(f));
                }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={() => setAvatarHover(true)}
                onMouseLeave={() => setAvatarHover(false)}
                title="Click to upload profile picture"
                style={{
                  width:88, height:88, borderRadius:24,
                  background: profilePic ? "transparent" : `linear-gradient(135deg,${C.a5}44,${C.a4}44)`,
                  border:`2px solid ${C.a5}88`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:44, boxShadow:`0 0 32px ${C.a5}44`,
                  animation:"float 4s ease-in-out infinite",
                  cursor:"pointer", overflow:"hidden", position:"relative",
                }}>
                {profilePic
                  ? <img src={profilePic} alt="Profile" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : player.avatar
                }
                <div style={{
                  position:"absolute", inset:0, borderRadius:22,
                  background:"#00000077",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  opacity: avatarHover ? 1 : 0, transition:"opacity 0.2s",
                  fontSize:22,
                }}>📷</div>
              </div>
              <div style={{
                position:"absolute", bottom:-6, right:-6,
                background:C.a2, color:"#111", borderRadius:10,
                fontSize:11, fontWeight:900, padding:"2px 7px",
                fontFamily:"'Boogaloo',cursive", letterSpacing:0.5,
              }}>Lv.{player.level}</div>
            </div>

            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:6 }}>
                {editingUsername ? (
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                    <input
                      value={newUsername}
                      onChange={e => { setNewUsername(e.target.value); setUsernameError(""); }}
                      maxLength={20}
                      onKeyDown={e => { if (e.key === "Enter") handleSaveUsername(); if (e.key === "Escape") setEditingUsername(false); }}
                      style={{
                        background:"#0d0b1a", border:`1.5px solid ${usernameError ? C.a1 : C.a4}`,
                        borderRadius:10, padding:"6px 12px", color:C.text,
                        fontFamily:"'Boogaloo',cursive", fontSize:24, outline:"none",
                        width:180,
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveUsername}
                      disabled={usernameLoading}
                      style={{
                        background:C.a4, border:"none", borderRadius:8, padding:"6px 14px",
                        color:"#fff", fontFamily:"'DM Sans',sans-serif", fontWeight:700,
                        fontSize:13, cursor:"pointer",
                      }}
                    >{usernameLoading ? "..." : "Save"}</button>
                    <button
                      onClick={() => { setEditingUsername(false); setUsernameError(""); }}
                      style={{
                        background:"transparent", border:`1px solid ${C.border2}`, borderRadius:8,
                        padding:"6px 12px", color:C.muted,
                        fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer",
                      }}
                    >Cancel</button>
                    {usernameError && <span style={{ fontSize:12, color:C.a1, fontWeight:600 }}>{usernameError}</span>}
                  </div>
                ) : (
                  <>
                    <h1 style={{ fontFamily:"'Boogaloo',cursive", fontSize:32, lineHeight:1 }}>{player.username}</h1>
                    {isLoggedIn() && (
                      <button
                        onClick={() => { setNewUsername(player.username); setEditingUsername(true); setUsernameError(""); }}
                        title="Change username"
                        style={{
                          background:"none", border:"none", cursor:"pointer",
                          fontSize:16, color:C.muted, padding:4, lineHeight:1,
                          transition:"color 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = C.text}
                        onMouseLeave={e => e.currentTarget.style.color = C.muted}
                      >✏️</button>
                    )}
                  </>
                )}
                <span style={{ fontSize:18 }}>{player.country}</span>
                {player.vip && <VIPBadge />}
              </div>
              <div style={{ display:"flex", gap:8, marginBottom:10, flexWrap:"wrap" }}>
                {equipped.map((b,i) => b && (
                  <div key={i} style={{
                    background: RARITY_BG[b.rarity], border:`1px solid ${RARITY_COLORS[b.rarity]}55`,
                    borderRadius:10, padding:"4px 10px",
                    display:"flex", alignItems:"center", gap:5,
                    animation:`badgePop 0.5s cubic-bezier(.17,.67,.35,1.3) ${i*0.1}s both`,
                  }}>
                    <span style={{ fontSize:14 }}>{b.icon}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:RARITY_COLORS[b.rarity] }}>{b.name}</span>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <span style={{ fontSize:13, color:C.a2, fontWeight:700 }}>"{player.title}"</span>
                <span style={{ color:C.muted2 }}>·</span>
                <span style={{ fontSize:12, color:C.muted }}>Joined {player.joinDate}</span>
              </div>
            </div>

            <div style={{ background:C.card2, border:`1px solid ${C.a2}44`, borderRadius:16, padding:"12px 20px", textAlign:"center" }}>
              <div style={{ fontSize:24, marginBottom:2 }}>💰</div>
              <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:24, color:C.a2 }}>{player.bluffBucks.toLocaleString()}</div>
              <div style={{ fontSize:11, color:C.muted, fontWeight:600 }}>BK Bucks</div>
            </div>
          </div>

          <div style={{ marginBottom:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:12, fontWeight:700, color:C.muted }}>LEVEL {player.level} → {player.level+1}</span>
              <span style={{ fontSize:12, fontWeight:700, color:C.a4 }}>{player.xp.toLocaleString()} / {player.xpNext.toLocaleString()} XP</span>
            </div>
            <div style={{ height:8, background:C.border2, borderRadius:4, overflow:"hidden" }}>
              <div style={{
                "--xp-w":`${xpPct}%`, height:"100%", borderRadius:4,
                background:`linear-gradient(90deg,${C.a4},${C.a5})`,
                width:`${xpPct}%`, boxShadow:`0 0 10px ${C.a4}88`,
                animation:"xpFill 1.2s cubic-bezier(.4,0,.2,1) forwards",
              }} />
            </div>
          </div>

          <div style={{ display:"flex", gap:2, marginTop:20, overflowX:"auto", borderBottom:`1px solid ${C.border}` }}>
            {tabs.map(t => (
              <button key={t.id} className={`tab-btn ${tab===t.id?"active":""}`} onClick={() => setTab(t.id)}
                style={{ borderBottom: tab===t.id ? `2px solid ${C.a4}` : "2px solid transparent", borderRadius:"10px 10px 0 0", paddingBottom:10, color: tab===t.id ? C.text : C.muted }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:860, margin:"0 auto", padding:"24px 24px 0" }}>
        {tab === "overview" && (
          <div style={{ display:"flex", flexDirection:"column", gap:24, animation:"fadeUp 0.4s ease" }}>
            <div>
              <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:20, marginBottom:14 }}>📊 Career Stats</h3>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
                <StatCard icon="🎮" label="Games Played"  value={player.stats.gamesPlayed}           color={C.a4} delay="0s"    />
                <StatCard icon="🏆" label="Total Wins"    value={player.stats.wins}                  color={C.a3} delay="0.05s" />
                <StatCard icon="📈" label="Win Rate"      value={`${player.stats.winRate}%`}         color={C.a2} delay="0.1s"  />
                <StatCard icon="🎯" label="Accuracy"      value={`${player.stats.accuracy}%`}        color={C.a5} delay="0.15s" />
                <StatCard icon="🃏" label="Bluffs Landed" value={player.stats.bluffsLanded}          color={C.a1} delay="0.2s"  />
                <StatCard icon="🔥" label="Best Streak"   value={`${player.stats.longestStreak}x`}  color={C.a6} delay="0.25s" />
                <StatCard icon="💸" label="Biggest Win"   value={`+${player.stats.biggestWin}`}     color={C.a3} delay="0.3s"  />
                <StatCard icon="🎰" label="All-In Wins"   value={player.stats.allInWins}             color={C.a2} delay="0.35s" />
              </div>
            </div>

            <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:20, padding:20 }}>
              <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:20, marginBottom:16 }}>🏅 Badge Showcase</h3>
              <BadgePicker equipped={equipped} onEquip={handleEquip} />
            </div>

            <div>
              <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:20, marginBottom:14 }}>🕹️ Recent Games</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {recentGames.map((g,i) => (
                  <div key={i} className="game-row" style={{ animationDelay:`${i*0.06}s` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background: g.result==="Win" ? C.a3+"22" : C.a1+"22", border:`1.5px solid ${g.result==="Win" ? C.a3+"66" : C.a1+"44"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{g.result==="Win" ? "🏆" : "💀"}</div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14, color: g.result==="Win" ? C.a3 : C.a1 }}>{g.result}</div>
                        <div style={{ fontSize:11, color:C.muted }}>{g.date}</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
                      <div style={{ textAlign:"center" }}><div style={{ fontFamily:"'Boogaloo',cursive", fontSize:18, color: g.pts > 0 ? C.a3 : C.a1 }}>{g.pts > 0 ? `+${g.pts}` : g.pts}</div><div style={{ fontSize:10, color:C.muted }}>pts</div></div>
                      <div style={{ textAlign:"center" }}><div style={{ fontFamily:"'Boogaloo',cursive", fontSize:18, color:C.a4 }}>{g.accuracy}%</div><div style={{ fontSize:10, color:C.muted }}>accuracy</div></div>
                      <div style={{ textAlign:"center" }}><div style={{ fontFamily:"'Boogaloo',cursive", fontSize:18, color:C.a5 }}>{g.bluffs}</div><div style={{ fontSize:10, color:C.muted }}>bluffs</div></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "mastery" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16, animation:"fadeUp 0.4s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:22 }}>📚 Category Mastery</h3>
              <span style={{ fontSize:12, color:C.muted, fontWeight:600 }}>{categories.filter(c=>c.rank===6).length} / {categories.length} Legend</span>
            </div>
            {categories.map((cat, i) => {
              const rank = cat.rank;
              const rankColor = RANK_COLORS[rank-1];
              return (
                <div key={cat.id} style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:18, padding:20, animation:`fadeUp 0.4s ease ${i*0.07}s both`, transition:"border-color 0.2s" }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=rankColor+"44"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:22 }}>{cat.label.split(" ")[0]}</span>
                      <div>
                        <div style={{ fontWeight:800, fontSize:15 }}>{cat.label.split(" ").slice(1).join(" ")}</div>
                        <RankBadge rank={rank} />
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      {rank < 6 ? <div style={{ fontSize:11, color:C.muted, fontWeight:600 }}>{cat.progress}% → {RANKS[rank]}</div> : <div style={{ fontSize:11, color:C.a2, fontWeight:700 }}>👑 MAX RANK</div>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:4, marginBottom:10, alignItems:"center" }}>
                    {RANKS.map((r,ri) => <div key={r} style={{ flex:1, height:6, borderRadius:3, background: ri < rank ? RANK_COLORS[ri] : C.border2 }} />)}
                  </div>
                  {rank < 6 && (
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ "--bar-w":`${cat.progress}%`, background:`linear-gradient(90deg,${rankColor},${RANK_COLORS[rank]||rankColor})`, width:`${cat.progress}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "badges" && (
          <div style={{ display:"flex", flexDirection:"column", gap:20, animation:"fadeUp 0.4s ease" }}>
            <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:20, padding:20 }}>
              <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:20, marginBottom:16 }}>🏅 Badge Showcase</h3>
              <BadgePicker equipped={equipped} onEquip={handleEquip} />
            </div>
            {["legend","epic","rare","common"].map(rarity => {
              const group = ALL_BADGES.filter(b => b.rarity === rarity);
              return (
                <div key={rarity}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                    <h4 style={{ fontFamily:"'Boogaloo',cursive", fontSize:18, color:RARITY_COLORS[rarity], textTransform:"capitalize" }}>
                      {rarity === "legend" ? "👑" : rarity === "epic" ? "✨" : rarity === "rare" ? "💎" : "⚪"} {rarity}
                    </h4>
                    <span style={{ fontSize:11, color:C.muted, fontWeight:600 }}>{group.filter(b=>b.earned).length}/{group.length} earned</span>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:10 }}>
                    {group.map((b,i) => (
                      <div key={b.id} className="badge-item" style={{ background: b.earned ? RARITY_BG[b.rarity] : C.card2, border:`2px solid ${b.earned ? RARITY_COLORS[b.rarity]+"55" : C.border}`, opacity: b.earned ? 1 : 0.45, animation:`fadeUp 0.4s ease ${i*0.05}s both` }}>
                        <div style={{ fontSize:32, marginBottom:6, filter: b.earned ? "none" : "grayscale(1)" }}>{b.icon}</div>
                        <div style={{ fontWeight:800, fontSize:13, color: b.earned ? RARITY_COLORS[b.rarity] : C.muted }}>{b.name}</div>
                        <div style={{ fontSize:11, color:C.muted, marginTop:3, lineHeight:1.4 }}>{b.desc}</div>
                        {!b.earned && <div style={{ marginTop:6, fontSize:10, color:C.muted2, fontWeight:700 }}>🔒 Locked</div>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "achievements" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12, animation:"fadeUp 0.4s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
              <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:22 }}>🎖️ Achievements</h3>
              <span style={{ fontSize:12, color:C.muted, fontWeight:600 }}>{ACHIEVEMENTS.filter(a=>a.done).length} / {ACHIEVEMENTS.length} complete</span>
            </div>
            {ACHIEVEMENTS.map((a, i) => {
              const pct = Math.min(100, Math.round((a.progress/a.total)*100));
              return (
                <div key={i} style={{ background:C.card2, border:`1px solid ${a.done ? C.a3+"44" : C.border}`, borderRadius:16, padding:"14px 18px", display:"flex", gap:14, alignItems:"center", animation:`fadeUp 0.4s ease ${i*0.06}s both` }}>
                  <div style={{ width:48, height:48, borderRadius:14, flexShrink:0, background: a.done ? C.a3+"22" : C.border, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, border:`1.5px solid ${a.done ? C.a3+"66" : C.border2}` }}>{a.done ? a.icon : "🔒"}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                      <span style={{ fontWeight:800, fontSize:14, color: a.done ? C.text : C.muted }}>{a.name}</span>
                      <span style={{ fontSize:12, fontWeight:700, color: a.done ? C.a3 : C.muted }}>{a.done ? "✓ Complete" : `${a.progress}/${a.total}`}</span>
                    </div>
                    <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>{a.desc}</div>
                    {!a.done && <div className="progress-bar-track"><div className="progress-bar-fill" style={{ "--bar-w":`${pct}%`, background:`linear-gradient(90deg,${C.a4},${C.a5})`, width:`${pct}%` }} /></div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "history" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12, animation:"fadeUp 0.4s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
              <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:22 }}>🕹️ Game History</h3>
              <div style={{ display:"flex", gap:16, fontSize:13, fontWeight:700 }}>
                <span style={{ color:C.a3 }}>{recentGames.filter(g=>g.result==="Win").length}W</span>
                <span style={{ color:C.a1 }}>{recentGames.filter(g=>g.result==="Loss").length}L</span>
              </div>
            </div>
            {recentGames.map((g,i) => (
              <div key={i} className="game-row" style={{ animationDelay:`${i*0.07}s` }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:42, height:42, borderRadius:12, background: g.result==="Win" ? C.a3+"22" : C.a1+"18", border:`1.5px solid ${g.result==="Win" ? C.a3+"55" : C.a1+"44"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{g.result==="Win" ? "🏆" : "💀"}</div>
                  <div>
                    <div style={{ fontWeight:800, fontSize:15, color: g.result==="Win" ? C.a3 : C.a1 }}>{g.result}</div>
                    <div style={{ fontSize:12, color:C.muted }}>{g.date}</div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
                  {[
                    { label:"Points",   val: g.pts > 0 ? `+${g.pts}` : `${g.pts}`, color: g.pts>0 ? C.a3 : C.a1 },
                    { label:"Accuracy", val: `${g.accuracy}%`, color: C.a4 },
                    { label:"Bluffs",   val: `${g.bluffs}`,    color: C.a5 },
                  ].map((s,si) => (
                    <div key={si} style={{ textAlign:"center" }}>
                      <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:20, color:s.color }}>{s.val}</div>
                      <div style={{ fontSize:11, color:C.muted }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

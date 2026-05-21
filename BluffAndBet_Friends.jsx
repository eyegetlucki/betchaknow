import { useState, useEffect, useMemo, useRef } from "react";

// ─── THEME ────────────────────────────────────────────────────────────────────
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

// ─── DATA ─────────────────────────────────────────────────────────────────────
const ME = { username:"BluffMaster99", avatar:"🎯", level:42 };

const FRIENDS = [
  { id:"f1", name:"TriviaKing42",  avatar:"🃏", level:48, status:"in-game",  game:"Quick Match", wins:18, losses:12, lastSeen:"now",     isVIP:true,  isOnline:true,  isFav:true  },
  { id:"f2", name:"QuizQueen",      avatar:"👑", level:45, status:"online",   wins:8,  losses:14, lastSeen:"now",     isVIP:false, isOnline:true,  isFav:true  },
  { id:"f3", name:"FastFingers",    avatar:"⚡", level:38, status:"in-game",  game:"Private Lobby", wins:11, losses:9,  lastSeen:"now",     isVIP:true,  isOnline:true,  isFav:false },
  { id:"f4", name:"BetWizard",      avatar:"🧙", level:51, status:"online",   wins:22, losses:7,  lastSeen:"now",     isVIP:true,  isOnline:true,  isFav:true  },
  { id:"f5", name:"SmartCookie",    avatar:"🍪", level:33, status:"offline",                       wins:5,  losses:8,  lastSeen:"2h ago",   isVIP:false, isOnline:false, isFav:false },
  { id:"f6", name:"NerdAlert",      avatar:"🤓", level:29, status:"offline",                       wins:3,  losses:11, lastSeen:"5h ago",   isVIP:false, isOnline:false, isFav:false },
  { id:"f7", name:"WildCard",       avatar:"🎴", level:42, status:"online",   wins:14, losses:14, lastSeen:"now",     isVIP:false, isOnline:true,  isFav:false },
  { id:"f8", name:"DiamondHands",   avatar:"💎", level:55, status:"in-game",  game:"Public Match", wins:25, losses:5,  lastSeen:"now",     isVIP:true,  isOnline:true,  isFav:false },
  { id:"f9", name:"LuckyStrike",    avatar:"🍀", level:21, status:"offline",                       wins:2,  losses:6,  lastSeen:"1d ago",   isVIP:false, isOnline:false, isFav:false },
  { id:"f10",name:"BluffMaster",    avatar:"🎭", level:37, status:"offline",                       wins:9,  losses:9,  lastSeen:"3d ago",   isVIP:false, isOnline:false, isFav:false },
];

const PENDING = [
  { id:"p1", name:"NewChallenger", avatar:"🥷", level:28, isVIP:false, type:"incoming" },
  { id:"p2", name:"AceOfBluffs",   avatar:"🃏", level:35, isVIP:true,  type:"incoming" },
  { id:"p3", name:"QuestSeeker",   avatar:"🗺️", level:19, isVIP:false, type:"outgoing" },
];

const MY_CLUB = {
  id:"c1",
  name:"The High Rollers",
  tag:"HROLL",
  icon:"💎",
  banner:`linear-gradient(135deg, ${C.a5}, ${C.a4})`,
  description:"Competitive trivia players who play to win. Active daily, friendly community, no toxic vibes!",
  members:34,
  maxMembers:50,
  weeklyXP:48200,
  rank:7,
  founded:"Jan 2026",
  myRole:"Captain",
  level:12,
  xpToNext:8200,
  xpForLevel:10000,
};

const CLUB_MEMBERS = [
  { id:"m1", name:"BluffMaster99",  avatar:"🎯", level:42, role:"Captain",  weekXP:3400, isOnline:true,  isMe:true },
  { id:"m2", name:"TriviaKing42",   avatar:"🃏", level:48, role:"Officer",  weekXP:5800, isOnline:true  },
  { id:"m3", name:"DiamondHands",   avatar:"💎", level:55, role:"Officer",  weekXP:5200, isOnline:true  },
  { id:"m4", name:"BetWizard",      avatar:"🧙", level:51, role:"Member",   weekXP:4100, isOnline:true  },
  { id:"m5", name:"QuizQueen",      avatar:"👑", level:45, role:"Member",   weekXP:3800, isOnline:true  },
  { id:"m6", name:"FastFingers",    avatar:"⚡", level:38, role:"Member",   weekXP:3300, isOnline:true  },
  { id:"m7", name:"WildCard",       avatar:"🎴", level:42, role:"Member",   weekXP:2700, isOnline:true  },
  { id:"m8", name:"SmartCookie",    avatar:"🍪", level:33, role:"Member",   weekXP:2100, isOnline:false },
  { id:"m9", name:"NerdAlert",      avatar:"🤓", level:29, role:"Member",   weekXP:1900, isOnline:false },
  { id:"m10",name:"LuckyStrike",    avatar:"🍀", level:21, role:"Member",   weekXP:1500, isOnline:false },
];

const CLUB_CHAT = [
  { id:1, user:"TriviaKing42",  avatar:"🃏", msg:"Just hit a 12 streak! 🔥",         time:"2m",  isMe:false },
  { id:2, user:"DiamondHands",  avatar:"💎", msg:"GG, that's insane",                 time:"2m",  isMe:false },
  { id:3, user:"BluffMaster99", avatar:"🎯", msg:"We're so close to club level 13",   time:"1m",  isMe:true  },
  { id:4, user:"QuizQueen",     avatar:"👑", msg:"Anyone want to do public matches?", time:"30s", isMe:false },
  { id:5, user:"BetWizard",     avatar:"🧙", msg:"Im in",                              time:"15s", isMe:false },
];

const RECOMMENDED_CLUBS = [
  { id:"r1", name:"Trivia Masters", tag:"TM", icon:"📚", members:42, maxMembers:50, weekXP:62100, rank:3, level:14, vibe:"Hardcore" },
  { id:"r2", name:"Bluff Brigade",  tag:"BB", icon:"🃏", members:28, maxMembers:50, weekXP:41800, rank:11,level:10, vibe:"Casual"   },
  { id:"r3", name:"Brain Trust",    tag:"BT", icon:"🧠", members:50, maxMembers:50, weekXP:71200, rank:1, level:18, vibe:"Hardcore" },
  { id:"r4", name:"Lucky Sevens",   tag:"L7", icon:"🎰", members:21, maxMembers:50, weekXP:28400, rank:18,level:7,  vibe:"Friendly" },
];

const CLUB_REWARDS = [
  { level:5,  reward:"Club Banner Customization",        icon:"🎨", unlocked:true  },
  { level:10, reward:"Club Avatar Pack",                 icon:"🎭", unlocked:true  },
  { level:12, reward:"Custom Club Chat Color",           icon:"💬", unlocked:true  },
  { level:15, reward:"Exclusive Club Card Skin",         icon:"💠", unlocked:false },
  { level:20, reward:"Holographic Club Tag in Lobbies",  icon:"✨", unlocked:false },
  { level:25, reward:"Animated Club Banner",             icon:"🌟", unlocked:false },
];

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Boogaloo&family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

  @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes popIn    { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
  @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
  @keyframes pulse    { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.05);opacity:0.85} }
  @keyframes pulseDot { 0%,100%{box-shadow:0 0 0 0 ${C.a3}66} 50%{box-shadow:0 0 0 6px ${C.a3}00} }
  @keyframes shine    { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
  @keyframes shimmer  { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes barGrow  { from{width:0} to{width:var(--w)} }
  @keyframes typing   { 0%,100%{opacity:0.3} 50%{opacity:1} }

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
  .friend-row.fav { border-color:${C.a2}33; }

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
`;

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function StatusDot({ status }) {
  const colors = {
    online:    C.a3,
    "in-game": C.a4,
    offline:   C.muted2,
  };
  return (
    <span style={{
      width:10, height:10, borderRadius:"50%",
      background: colors[status],
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
    Captain: { bg:`linear-gradient(135deg, ${C.a2}, ${C.a6})`, color:"#111" },
    Officer: { bg: C.a4 + "33", color: C.a4 },
    Member:  { bg: C.border, color: C.muted },
  };
  const s = styles[role];
  return (
    <span style={{
      ...s, background:s.bg,
      fontSize:9, fontWeight:900, padding:"2px 7px", borderRadius:6,
      letterSpacing:0.5, fontFamily:"'DM Sans',sans-serif", textTransform:"uppercase",
    }}>{role}</span>
  );
}

function Avatar({ icon, size = 42, online, gradient }) {
  return (
    <div style={{ position:"relative", flexShrink:0 }}>
      <div style={{
        width:size, height:size, borderRadius: Math.round(size * 0.28),
        background: gradient || `linear-gradient(135deg, ${C.a4}33, ${C.a5}22)`,
        border:`1.5px solid ${C.border2}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize: Math.round(size * 0.48),
      }}>{icon}</div>
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

// ─── FRIEND ROW ───────────────────────────────────────────────────────────────
function FriendRow({ friend, onAction }) {
  const ratio = friend.wins / Math.max(1, friend.wins + friend.losses);
  const winRate = Math.round(ratio * 100);

  return (
    <div className={`friend-row ${friend.isFav ? "fav" : ""}`}>
      <Avatar icon={friend.avatar} online={friend.isOnline} />

      <div style={{ minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <span style={{ fontWeight:800, fontSize:14, color:C.text }}>{friend.name}</span>
          {friend.isVIP && <VIPDot />}
          {friend.isFav && <span style={{ color:C.a2, fontSize:13 }}>⭐</span>}
        </div>
        <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginTop:2,
                      display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
          <StatusDot status={friend.status} />
          <span style={{
            color: friend.status === "in-game" ? C.a4
                 : friend.status === "online"  ? C.a3
                 : C.muted,
          }}>
            {friend.status === "in-game" ? `Playing · ${friend.game}` :
             friend.status === "online"  ? "Online" :
             `Offline · ${friend.lastSeen}`}
          </span>
          <span style={{ color:C.muted2 }}>·</span>
          <span>Lvl {friend.level}</span>
        </div>
      </div>

      {/* Rivalry */}
      <div style={{ textAlign:"center", minWidth:90 }}>
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"center", gap:4,
          fontFamily:"'Boogaloo',cursive", fontSize:18, lineHeight:1,
        }}>
          <span style={{ color: winRate >= 50 ? C.a3 : C.muted }}>{friend.wins}</span>
          <span style={{ color:C.muted2, fontSize:14 }}>—</span>
          <span style={{ color: winRate < 50 ? C.a1 : C.muted }}>{friend.losses}</span>
        </div>
        <div style={{ fontSize:9, color:C.muted, fontWeight:700, letterSpacing:0.5,
                      textTransform:"uppercase", marginTop:2 }}>
          Rivalry · {winRate}% W
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display:"flex", gap:6 }}>
        {friend.isOnline && (
          <button className="ico-btn" title="Invite to lobby"
            onClick={() => onAction("invite", friend)}
            style={{ borderColor: C.a4 + "44", color: C.a4 }}>🎮</button>
        )}
        <button className="ico-btn" title="Message"
          onClick={() => onAction("message", friend)}>💬</button>
        <button className="ico-btn" title="View profile"
          onClick={() => onAction("profile", friend)}>👤</button>
      </div>
    </div>
  );
}

// ─── PENDING REQUESTS ─────────────────────────────────────────────────────────
function PendingRow({ req, onAction }) {
  return (
    <div style={{
      display:"grid", gridTemplateColumns:"auto 1fr auto", gap:12, alignItems:"center",
      padding:"12px 16px", background:C.card2, borderRadius:14,
      border:`1px solid ${req.type === "incoming" ? C.a4 + "44" : C.border}`,
      animation:"fadeUp 0.3s ease",
    }}>
      <Avatar icon={req.avatar} size={38} />
      <div>
        <div style={{ fontWeight:800, fontSize:14, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
          {req.name}
          {req.isVIP && <VIPDot />}
        </div>
        <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginTop:2 }}>
          Lvl {req.level} · {req.type === "incoming" ? "Wants to be friends" : "Request sent"}
        </div>
      </div>
      <div style={{ display:"flex", gap:6 }}>
        {req.type === "incoming" ? (
          <>
            <button onClick={() => onAction("accept", req)} style={{
              padding:"8px 14px", borderRadius:10, border:"none",
              background:`linear-gradient(135deg, ${C.a3}, ${C.a4})`, color:"#fff",
              fontWeight:800, fontSize:12, cursor:"pointer",
              boxShadow:`0 2px 10px ${C.a3}33`,
            }}>Accept</button>
            <button onClick={() => onAction("decline", req)} style={{
              padding:"8px 14px", borderRadius:10, border:`1px solid ${C.border2}`,
              background:"transparent", color:C.muted, fontWeight:800, fontSize:12, cursor:"pointer",
            }}>Decline</button>
          </>
        ) : (
          <button onClick={() => onAction("cancel", req)} style={{
            padding:"8px 14px", borderRadius:10, border:`1px solid ${C.border2}`,
            background:"transparent", color:C.muted, fontWeight:800, fontSize:12, cursor:"pointer",
          }}>Cancel</button>
        )}
      </div>
    </div>
  );
}

// ─── FRIENDS PAGE ─────────────────────────────────────────────────────────────
function FriendsPage() {
  const [filter, setFilter] = useState("all"); // all | online | favorites
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addInput, setAddInput] = useState("");
  const [toast, setToast] = useState("");

  const filtered = useMemo(() => {
    return FRIENDS.filter(f => {
      if (filter === "online"    && !f.isOnline) return false;
      if (filter === "favorites" && !f.isFav)    return false;
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [filter, search]);

  const onlineCount = FRIENDS.filter(f => f.isOnline).length;
  const inGameCount = FRIENDS.filter(f => f.status === "in-game").length;

  const handleAction = (action, friend) => {
    const labels = {
      invite:  `Lobby invite sent to ${friend.name}`,
      message: `Opening chat with ${friend.name}...`,
      profile: `Viewing ${friend.name}'s profile...`,
      accept:  `${friend.name} added to friends!`,
      decline: `Declined ${friend.name}'s request`,
      cancel:  `Request to ${friend.name} cancelled`,
    };
    setToast(labels[action]);
    setTimeout(() => setToast(""), 2000);
  };

  const handleSendRequest = () => {
    if (!addInput.trim()) return;
    setToast(`Friend request sent to ${addInput}!`);
    setAddInput("");
    setShowAdd(false);
    setTimeout(() => setToast(""), 2000);
  };

  return (
    <div style={{ animation:"fadeUp 0.4s ease" }}>
      {toast && (
        <div style={{
          position:"fixed", top:80, left:"50%", transform:"translateX(-50%)",
          background:C.card, border:`1.5px solid ${C.a3}`,
          borderRadius:12, padding:"10px 20px", color:C.a3, fontWeight:700,
          fontSize:13, zIndex:100, animation:"popIn 0.3s ease",
          boxShadow:`0 8px 32px ${C.a3}33`,
        }}>✓ {toast}</div>
      )}

      {/* Stats bar */}
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))",
        gap:10, marginBottom:20,
      }}>
        {[
          { icon:"👥", label:"Total Friends", value: FRIENDS.length, color: C.a4 },
          { icon:"🟢", label:"Online Now",     value: onlineCount,     color: C.a3 },
          { icon:"🎮", label:"In Game",        value: inGameCount,     color: C.a5 },
          { icon:"📬", label:"Pending",        value: PENDING.length,   color: C.a2 },
        ].map((s, i) => (
          <div key={i} style={{
            background:C.card2, border:`1px solid ${s.color}33`,
            borderRadius:14, padding:"12px 16px",
            display:"flex", alignItems:"center", gap:10,
            animation:`fadeUp 0.4s ease ${i*0.05}s both`,
          }}>
            <span style={{ fontSize:24 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize:10, color:C.muted, fontWeight:800,
                            letterSpacing:0.5, textTransform:"uppercase" }}>{s.label}</div>
              <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:22, color:s.color, lineHeight:1 }}>
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add friend bar */}
      <div style={{
        background:C.card2, border:`1px solid ${C.border}`,
        borderRadius:14, padding:14, marginBottom:18,
        display:"flex", gap:10, flexWrap:"wrap", alignItems:"center",
      }}>
        {!showAdd ? (
          <button onClick={() => setShowAdd(true)} style={{
            padding:"10px 18px", borderRadius:12, border:"none",
            background:`linear-gradient(135deg, ${C.a4}, ${C.a5})`,
            color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif",
            boxShadow:`0 4px 14px ${C.a4}44`,
            display:"inline-flex", alignItems:"center", gap:6,
          }}>➕ Add Friend</button>
        ) : (
          <>
            <input className="input-row" autoFocus
              placeholder="Enter username..." value={addInput}
              style={{ flex:1, minWidth:200 }}
              onChange={e => setAddInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSendRequest()} />
            <button onClick={handleSendRequest} style={{
              padding:"11px 18px", borderRadius:12, border:"none",
              background:`linear-gradient(135deg, ${C.a3}, ${C.a4})`,
              color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer",
              boxShadow:`0 4px 14px ${C.a3}44`,
            }}>Send Request</button>
            <button onClick={() => { setShowAdd(false); setAddInput(""); }} style={{
              padding:"11px 14px", borderRadius:12, border:`1px solid ${C.border2}`,
              background:"transparent", color:C.muted, fontWeight:800, fontSize:13, cursor:"pointer",
            }}>Cancel</button>
          </>
        )}

        <input className="input-row"
          placeholder="🔍 Search friends..." value={search}
          style={{ flex:1, minWidth:180, maxWidth:300 }}
          onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Filter pills */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        {[
          { id:"all",       label:"All",       count: FRIENDS.length },
          { id:"online",    label:"Online",    count: onlineCount    },
          { id:"favorites", label:"⭐ Favorites", count: FRIENDS.filter(f=>f.isFav).length },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding:"7px 14px", borderRadius:10,
            border:`1.5px solid ${filter === f.id ? C.a4 : C.border2}`,
            background: filter === f.id ? C.a4 + "22" : "transparent",
            color: filter === f.id ? C.a4 : C.muted,
            fontWeight:800, fontSize:12, cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif",
            display:"inline-flex", alignItems:"center", gap:5,
          }}>
            {f.label}
            <span style={{
              background: filter === f.id ? C.a4 + "33" : C.border,
              padding:"1px 7px", borderRadius:8, fontSize:10,
            }}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Pending requests section */}
      {PENDING.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:18, marginBottom:10,
                       display:"flex", alignItems:"center", gap:8 }}>
            📬 Pending Requests
            <span style={{
              background: C.a4 + "22", color: C.a4,
              fontSize:11, fontWeight:800, padding:"2px 8px", borderRadius:10,
            }}>{PENDING.length}</span>
          </h3>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {PENDING.map(r => <PendingRow key={r.id} req={r} onAction={handleAction} />)}
          </div>
        </div>
      )}

      {/* Friends list */}
      <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:20, marginBottom:12 }}>
        👥 Friends {filtered.length > 0 && <span style={{ fontSize:13, color:C.muted, fontWeight:600 }}>· {filtered.length}</span>}
      </h3>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"40px 20px", color:C.muted }}>
            <div style={{ fontSize:48, marginBottom:10, opacity:0.5 }}>👻</div>
            <div style={{ fontSize:14, fontWeight:700, color:C.text }}>No friends found</div>
            <div style={{ fontSize:12, marginTop:4 }}>
              {search ? `No matches for "${search}"` : "Try changing your filter"}
            </div>
          </div>
        ) : filtered.map(f => (
          <FriendRow key={f.id} friend={f} onAction={handleAction} />
        ))}
      </div>
    </div>
  );
}

// ─── CLUB MEMBER ROW ─────────────────────────────────────────────────────────
function MemberRow({ member, rank }) {
  return (
    <div style={{
      display:"grid", gridTemplateColumns:"32px auto 1fr auto", gap:12, alignItems:"center",
      padding:"10px 14px",
      background: member.isMe ? `linear-gradient(90deg, ${C.a4}18, transparent)` : C.card2,
      border:`1px solid ${member.isMe ? C.a4 + "55" : C.border}`,
      borderRadius:12,
      animation:"fadeUp 0.3s ease",
    }}>
      <div style={{
        fontFamily:"'Boogaloo',cursive", fontSize:15,
        color: rank <= 3 ? C.a2 : C.muted, textAlign:"center",
      }}>#{rank}</div>
      <Avatar icon={member.avatar} size={36} online={member.isOnline} />
      <div style={{ minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
          <span style={{ fontWeight:800, fontSize:13, color: member.isMe ? C.a4 : C.text }}>
            {member.name}
          </span>
          <RoleBadge role={member.role} />
          {member.isMe && (
            <span style={{
              background:C.a4 + "22", color:C.a4, fontSize:9, fontWeight:900,
              padding:"2px 6px", borderRadius:6, letterSpacing:0.5,
              border:`1px solid ${C.a4}55`,
            }}>YOU</span>
          )}
        </div>
        <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginTop:2 }}>
          Lvl {member.level} {member.isOnline ? "· Online" : ""}
        </div>
      </div>
      <div style={{ textAlign:"right" }}>
        <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:16, color:C.a2, lineHeight:1 }}>
          +{member.weekXP.toLocaleString()}
        </div>
        <div style={{ fontSize:9, color:C.muted, fontWeight:700, letterSpacing:0.5,
                      textTransform:"uppercase", marginTop:2 }}>
          Week XP
        </div>
      </div>
    </div>
  );
}

// ─── CLUB CHAT BUBBLE ────────────────────────────────────────────────────────
function ChatBubble({ msg }) {
  return (
    <div style={{
      display:"flex", gap:8, alignItems:"flex-start",
      flexDirection: msg.isMe ? "row-reverse" : "row",
      animation:"fadeUp 0.3s ease",
    }}>
      <Avatar icon={msg.avatar} size={28} />
      <div style={{ maxWidth:"75%" }}>
        {!msg.isMe && (
          <div style={{ fontSize:11, color:C.muted, fontWeight:700, marginBottom:3,
                        textAlign: msg.isMe ? "right" : "left" }}>
            {msg.user}
          </div>
        )}
        <div style={{
          background: msg.isMe
            ? `linear-gradient(135deg, ${C.a4}, ${C.a5})`
            : C.card2,
          color: msg.isMe ? "#fff" : C.text,
          padding:"8px 14px",
          borderRadius: msg.isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          fontSize:13, fontWeight:500,
          border: msg.isMe ? "none" : `1px solid ${C.border}`,
          lineHeight:1.4,
        }}>
          {msg.msg}
        </div>
        <div style={{ fontSize:10, color:C.muted, fontWeight:600, marginTop:3,
                      textAlign: msg.isMe ? "right" : "left" }}>
          {msg.time}
        </div>
      </div>
    </div>
  );
}

// ─── MY CLUB PAGE ────────────────────────────────────────────────────────────
function MyClubPage() {
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState(CLUB_CHAT);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = () => {
    if (!chatMsg.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now(), user: ME.username, avatar: ME.avatar,
      msg: chatMsg.trim(), time: "now", isMe: true,
    }]);
    setChatMsg("");
  };

  const xpPct = Math.round((MY_CLUB.xpToNext / MY_CLUB.xpForLevel) * 100);
  const memberPct = Math.round((MY_CLUB.members / MY_CLUB.maxMembers) * 100);
  const sortedMembers = [...CLUB_MEMBERS].sort((a, b) => b.weekXP - a.weekXP);

  return (
    <div style={{ animation:"fadeUp 0.4s ease" }}>
      {/* Banner */}
      <div style={{
        background: MY_CLUB.banner, borderRadius:20, padding:"24px 26px",
        marginBottom:20, position:"relative", overflow:"hidden",
      }}>
        <div style={{
          position:"absolute", inset:0,
          background:`linear-gradient(105deg, transparent 30%, #fff22 50%, transparent 70%)`,
          animation:"shine 4s ease-in-out infinite",
        }} />
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between",
                        alignItems:"flex-start", flexWrap:"wrap", gap:14, marginBottom:14 }}>
            <div style={{ display:"flex", gap:14, alignItems:"center" }}>
              <div style={{
                width:64, height:64, borderRadius:18,
                background:"#0008", display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:32, backdropFilter:"blur(4px)",
                animation:"float 4s ease-in-out infinite",
              }}>{MY_CLUB.icon}</div>
              <div>
                <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                  <h2 style={{ fontFamily:"'Boogaloo',cursive", fontSize:24, color:"#fff",
                               textShadow:"0 2px 8px #0008" }}>
                    {MY_CLUB.name}
                  </h2>
                  <span style={{
                    background:"#fff3", color:"#fff",
                    fontSize:11, fontWeight:900, padding:"2px 8px", borderRadius:6,
                    letterSpacing:1, backdropFilter:"blur(4px)",
                  }}>[{MY_CLUB.tag}]</span>
                </div>
                <p style={{ fontSize:12, color:"#fffd", fontWeight:600, marginTop:4 }}>
                  Founded {MY_CLUB.founded} · Club Level {MY_CLUB.level}
                </p>
              </div>
            </div>

            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10, color:"#fffa", fontWeight:800,
                            letterSpacing:0.8, textTransform:"uppercase" }}>
                Your Role
              </div>
              <div style={{
                marginTop:4, padding:"4px 12px", borderRadius:8,
                background:"#fff3", backdropFilter:"blur(4px)",
                color:"#fff", fontWeight:900, fontSize:13,
                display:"inline-block",
              }}>👑 {MY_CLUB.myRole}</div>
            </div>
          </div>

          <p style={{ fontSize:13, color:"#fffe", fontWeight:500,
                      lineHeight:1.5, maxWidth:600 }}>
            {MY_CLUB.description}
          </p>
        </div>
      </div>

      {/* Club stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))",
                    gap:10, marginBottom:20 }}>
        {[
          { icon:"👥", label:"Members",  value:`${MY_CLUB.members}/${MY_CLUB.maxMembers}`, color:C.a4, sub:`${memberPct}% full` },
          { icon:"🏆", label:"Club Rank", value:`#${MY_CLUB.rank}`,                          color:C.a2, sub:"Global" },
          { icon:"⚡", label:"Week XP",   value:MY_CLUB.weeklyXP.toLocaleString(),          color:C.a5, sub:"Earned" },
          { icon:"📊", label:"Level",     value:MY_CLUB.level,                               color:C.a3, sub:`${xpPct}% to ${MY_CLUB.level+1}` },
        ].map((s, i) => (
          <div key={i} style={{
            background:C.card2, border:`1px solid ${s.color}33`,
            borderRadius:14, padding:"12px 16px",
            animation:`fadeUp 0.4s ease ${i*0.05}s both`,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ fontSize:18 }}>{s.icon}</span>
              <span style={{ fontSize:10, color:C.muted, fontWeight:800, letterSpacing:0.5,
                              textTransform:"uppercase" }}>{s.label}</span>
            </div>
            <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:20, color:s.color, lineHeight:1 }}>
              {s.value}
            </div>
            <div style={{ fontSize:10, color:C.muted, fontWeight:600, marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Club XP bar */}
      <div style={{
        background:C.card2, border:`1px solid ${C.border}`,
        borderRadius:14, padding:16, marginBottom:20,
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8, flexWrap:"wrap", gap:8 }}>
          <span style={{ fontSize:12, fontWeight:800, color:C.text,
                          letterSpacing:0.5, textTransform:"uppercase" }}>
            🚀 Club Level Progress
          </span>
          <span style={{ fontSize:12, fontWeight:700, color:C.a3 }}>
            {MY_CLUB.xpToNext.toLocaleString()} / {MY_CLUB.xpForLevel.toLocaleString()} XP
          </span>
        </div>
        <div style={{ height:10, background:C.border2, borderRadius:5, overflow:"hidden" }}>
          <div style={{
            "--w": `${xpPct}%`, height:"100%", borderRadius:5,
            background:`linear-gradient(90deg, ${C.a3}, ${C.a4})`,
            width:`${xpPct}%`, boxShadow:`0 0 14px ${C.a3}66`,
            animation:"barGrow 1.2s cubic-bezier(.4,0,.2,1) forwards",
          }} />
        </div>
        <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginTop:6 }}>
          {Math.round((1 - MY_CLUB.xpToNext/MY_CLUB.xpForLevel) * 100)}% to Club Level {MY_CLUB.level + 1}
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display:"grid", gridTemplateColumns:"minmax(0, 1.4fr) minmax(0, 1fr)",
                    gap:18, marginBottom:20 }}>
        {/* Members */}
        <div>
          <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:18, marginBottom:12,
                       display:"flex", alignItems:"center", gap:8 }}>
            🏆 Top Members This Week
          </h3>
          <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:480, overflowY:"auto", paddingRight:4 }}>
            {sortedMembers.map((m, i) => (
              <MemberRow key={m.id} member={m} rank={i+1} />
            ))}
          </div>
        </div>

        {/* Club chat */}
        <div style={{
          background:C.card2, border:`1px solid ${C.border}`,
          borderRadius:16, overflow:"hidden", display:"flex", flexDirection:"column",
          maxHeight:520,
        }}>
          <div style={{
            padding:"12px 16px", borderBottom:`1px solid ${C.border}`,
            display:"flex", justifyContent:"space-between", alignItems:"center",
          }}>
            <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:18 }}>💬 Club Chat</h3>
            <span style={{ fontSize:11, color:C.a3, fontWeight:800,
                            display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:C.a3,
                              animation:"pulseDot 2s ease-in-out infinite" }} />
              {CLUB_MEMBERS.filter(m => m.isOnline).length} online
            </span>
          </div>
          <div ref={chatRef} style={{
            flex:1, padding:14, overflowY:"auto",
            display:"flex", flexDirection:"column", gap:12,
            minHeight:300,
          }}>
            {messages.map(m => <ChatBubble key={m.id} msg={m} />)}
          </div>
          <div style={{ padding:12, borderTop:`1px solid ${C.border}`,
                         display:"flex", gap:8 }}>
            <input className="input-row" placeholder="Type a message..."
              value={chatMsg} style={{ flex:1, padding:"9px 14px", fontSize:13 }}
              onChange={e => setChatMsg(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()} />
            <button onClick={sendMessage} style={{
              padding:"9px 14px", borderRadius:10, border:"none",
              background: chatMsg.trim()
                ? `linear-gradient(135deg, ${C.a4}, ${C.a5})`
                : C.border,
              color: chatMsg.trim() ? "#fff" : C.muted,
              fontWeight:800, fontSize:13, cursor:"pointer",
            }}>Send</button>
          </div>
        </div>
      </div>

      {/* Club rewards */}
      <div>
        <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:18, marginBottom:12,
                     display:"flex", alignItems:"center", gap:8 }}>
          🎁 Club Rewards
        </h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))",
                      gap:10 }}>
          {CLUB_REWARDS.map((r, i) => (
            <div key={i} style={{
              background:C.card2, border:`1px solid ${r.unlocked ? C.a3 + "55" : C.border}`,
              borderRadius:14, padding:"14px 16px",
              opacity: r.unlocked ? 1 : 0.55,
              animation:`fadeUp 0.4s ease ${i*0.06}s both`,
            }}>
              <div style={{
                fontSize:24, marginBottom:6,
                filter: r.unlocked ? "none" : "grayscale(0.6)",
              }}>{r.icon}</div>
              <div style={{ fontSize:11, color: r.unlocked ? C.a3 : C.muted,
                            fontWeight:800, letterSpacing:0.5, textTransform:"uppercase" }}>
                {r.unlocked ? "✓ Unlocked" : `Lvl ${r.level}`}
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:C.text, marginTop:2 }}>
                {r.reward}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── BROWSE CLUBS PAGE ───────────────────────────────────────────────────────
function BrowseClubsPage() {
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const filtered = RECOMMENDED_CLUBS.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
              c.tag.toLowerCase().includes(search.toLowerCase())
  );

  const handleJoin = (club) => {
    setToast(`Request sent to ${club.name}!`);
    setTimeout(() => setToast(""), 2000);
  };

  return (
    <div style={{ animation:"fadeUp 0.4s ease" }}>
      {toast && (
        <div style={{
          position:"fixed", top:80, left:"50%", transform:"translateX(-50%)",
          background:C.card, border:`1.5px solid ${C.a3}`,
          borderRadius:12, padding:"10px 20px", color:C.a3, fontWeight:700,
          fontSize:13, zIndex:100, animation:"popIn 0.3s ease",
          boxShadow:`0 8px 32px ${C.a3}33`,
        }}>✓ {toast}</div>
      )}

      {/* Search + create */}
      <div style={{
        background:C.card2, border:`1px solid ${C.border}`,
        borderRadius:14, padding:14, marginBottom:18,
        display:"flex", gap:10, flexWrap:"wrap",
      }}>
        <input className="input-row"
          placeholder="🔍 Search clubs by name or tag..." value={search}
          style={{ flex:1, minWidth:200 }}
          onChange={e => setSearch(e.target.value)} />
        <button style={{
          padding:"11px 18px", borderRadius:12, border:"none",
          background:`linear-gradient(135deg, ${C.a3}, ${C.a4})`,
          color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer",
          boxShadow:`0 4px 14px ${C.a3}44`,
        }}>+ Create Club</button>
      </div>

      {/* Featured clubs */}
      <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:20, marginBottom:12 }}>
        ⭐ Top Clubs to Join
      </h3>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",
                    gap:14, marginBottom:24 }}>
        {filtered.map((club, i) => (
          <div key={club.id} style={{
            background:C.card2, border:`1px solid ${C.border}`,
            borderRadius:18, padding:18, position:"relative", overflow:"hidden",
            animation:`fadeUp 0.4s ease ${i*0.07}s both`,
          }}>
            <div style={{
              position:"absolute", inset:0, opacity:0.15,
              background:`radial-gradient(circle at 80% 0%, ${C.a4}44, transparent 60%)`,
              pointerEvents:"none",
            }} />
            <div style={{ position:"relative", zIndex:1 }}>
              <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:12 }}>
                <div style={{
                  width:54, height:54, borderRadius:14,
                  background:`linear-gradient(135deg, ${C.a4}33, ${C.a5}22)`,
                  border:`1.5px solid ${C.a4}44`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:26, animation:"float 3.5s ease-in-out infinite",
                }}>{club.icon}</div>
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                    <span style={{ fontWeight:800, fontSize:15, color:C.text }}>{club.name}</span>
                    <span style={{
                      background: C.border, color: C.muted,
                      fontSize:10, fontWeight:900, padding:"1px 6px", borderRadius:6,
                      letterSpacing:0.5,
                    }}>[{club.tag}]</span>
                  </div>
                  <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginTop:2 }}>
                    Lvl {club.level} · #{club.rank} globally
                  </div>
                </div>
              </div>

              <div style={{ display:"flex", gap:12, marginBottom:14, flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontSize:9, color:C.muted, fontWeight:800, letterSpacing:0.5,
                                  textTransform:"uppercase" }}>Members</div>
                  <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:16, color:C.a4 }}>
                    {club.members}/{club.maxMembers}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:9, color:C.muted, fontWeight:800, letterSpacing:0.5,
                                  textTransform:"uppercase" }}>Week XP</div>
                  <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:16, color:C.a2 }}>
                    {club.weekXP.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:9, color:C.muted, fontWeight:800, letterSpacing:0.5,
                                  textTransform:"uppercase" }}>Vibe</div>
                  <div style={{ fontSize:13, fontWeight:800, color:C.a5 }}>{club.vibe}</div>
                </div>
              </div>

              <button onClick={() => handleJoin(club)}
                disabled={club.members >= club.maxMembers}
                style={{
                  width:"100%", padding:"10px", borderRadius:10, border:"none",
                  background: club.members >= club.maxMembers
                    ? C.border
                    : `linear-gradient(135deg, ${C.a4}, ${C.a5})`,
                  color: club.members >= club.maxMembers ? C.muted : "#fff",
                  fontWeight:800, fontSize:13, cursor: club.members >= club.maxMembers ? "not-allowed" : "pointer",
                  fontFamily:"'DM Sans',sans-serif",
                  boxShadow: club.members >= club.maxMembers ? "none" : `0 4px 14px ${C.a4}33`,
                }}>
                {club.members >= club.maxMembers ? "🔒 Club Full" : "Request to Join"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [section, setSection] = useState("friends"); // friends | club | browse

  return (
    <div style={{
      minHeight:"100vh", background:C.bg, color:C.text,
      fontFamily:"'DM Sans',sans-serif", paddingBottom:60,
    }}>
      <style>{css}</style>

      {/* HEADER */}
      <div style={{
        background:`linear-gradient(180deg, ${C.a4}11 0%, transparent 100%)`,
        borderBottom:`1px solid ${C.border}`,
        padding:"28px 24px 0",
        position:"relative", overflow:"hidden",
      }}>
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`linear-gradient(${C.border}44 1px, transparent 1px),
                           linear-gradient(90deg, ${C.border}44 1px, transparent 1px)`,
          backgroundSize:"32px 32px", opacity:0.3,
        }} />

        <div style={{ maxWidth:1100, margin:"0 auto", position:"relative", zIndex:1 }}>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:C.a4, fontWeight:900, letterSpacing:1.5,
                          textTransform:"uppercase", marginBottom:4 }}>Community</div>
            <h1 style={{ fontFamily:"'Boogaloo',cursive", fontSize:32, lineHeight:1 }}>
              👥 Friends & Clubs
            </h1>
            <p style={{ fontSize:13, color:C.muted, fontWeight:600, marginTop:4 }}>
              Connect, compete, and play with your crew
            </p>
          </div>

          {/* Section tabs */}
          <div style={{ display:"flex", gap:4, overflowX:"auto",
                        borderBottom:`1px solid ${C.border}` }}>
            {[
              { id:"friends", label:"👥 Friends" },
              { id:"club",    label:"💎 My Club" },
              { id:"browse",  label:"🔍 Browse Clubs" },
            ].map(t => (
              <button key={t.id} onClick={() => setSection(t.id)}
                className={`nav-tab ${section === t.id ? "active" : ""}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"24px 24px 0" }}>
        {section === "friends" && <FriendsPage />}
        {section === "club"    && <MyClubPage />}
        {section === "browse"  && <BrowseClubsPage />}
      </div>
    </div>
  );
}

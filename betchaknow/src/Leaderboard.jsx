import { useState, useMemo, useEffect } from "react";
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

const ME = {
  username:    "BluffMaster99",
  avatar:      "🎯",
  country:     "USA",
  countryFlag: "🇺🇸",
  state:       "California",
  score:       12480,
  globalRank:  47,
  nationalRank:18,
  stateRank:   6,
  level:       42,
};

const SEASON = {
  number:    "I",
  name:      "Origins",
  resetIn:   "8d 14h",
  totalDays: 14,
  daysLeft:  8,
};

const FIRST = ["Trivia","Bluff","Quiz","Bet","Smart","Wild","Speed","Sharp","Fast","Lucky","Cosmic","Brain","Code","Storm","Iron","Silver","Golden","Diamond","Pixel","Nova","Echo","Zen","Mystic","Rogue","Cyber"];
const LAST  = ["King","Master","Queen","Wizard","Ace","Ninja","Lord","Champ","Hunter","Phoenix","Dragon","Wolf","Tiger","Shark","Hawk","Bear","Fox","Cat","Spider","Eagle"];
const COUNTRIES = [
  { flag:"🇺🇸", name:"USA"       }, { flag:"🇬🇧", name:"UK"         },
  { flag:"🇨🇦", name:"Canada"    }, { flag:"🇩🇪", name:"Germany"    },
  { flag:"🇯🇵", name:"Japan"     }, { flag:"🇫🇷", name:"France"     },
  { flag:"🇦🇺", name:"Australia" }, { flag:"🇧🇷", name:"Brazil"     },
  { flag:"🇰🇷", name:"S. Korea"  }, { flag:"🇲🇽", name:"Mexico"     },
  { flag:"🇮🇳", name:"India"     }, { flag:"🇮🇹", name:"Italy"      },
  { flag:"🇪🇸", name:"Spain"     }, { flag:"🇳🇱", name:"Netherlands"}, { flag:"🇸🇪", name:"Sweden" },
];
const STATES = ["California","Texas","Florida","New York","Illinois","Pennsylvania","Ohio","Georgia","North Carolina","Michigan","Virginia","Washington","Arizona","Massachusetts","Tennessee"];

function countryObj(name) {
  if (!name) return { flag: "🌐", name: "Unknown" };
  return COUNTRIES.find(c => c.name === name) || { flag: "🌐", name };
}

function mapServerList(players) {
  const me = getUsername();
  return (players || []).map(p => ({
    rank:     p.rank,
    username: p.username,
    avatar:   p.avatar_icon || "🎯",
    country:  countryObj(p.country),
    state:    p.state || "",
    score:    p.season_points || 0,
    level:    p.level || 1,
    change:   0,
    isMe:     p.username === me,
    isFriend: false,
    isVIP:    p.is_vip || false,
  }));
}
const AVATARS = ["🎯","🃏","🦈","👑","💎","🎰","🔥","⚡","🌟","🚀","🎭","🦅","🐉","🦁","🐺","🦊","🎪","💫","🌈","🎲","🎮","♠","♥","♦","♣"];

function seeded(i, max) {
  return Math.floor((Math.sin(i * 9999.31) * 100000) % max + max) % max;
}

function generatePlayers(count, isFriends = false) {
  const players = [];
  for (let i = 0; i < count; i++) {
    const isMe = isFriends ? false : i === ME.globalRank - 1;
    const country = isMe ? { flag:ME.countryFlag, name:ME.country } : COUNTRIES[seeded(i+1, COUNTRIES.length)];
    players.push({
      rank: i + 1,
      username: isMe ? ME.username : FIRST[seeded(i+13, FIRST.length)] + LAST[seeded(i+71, LAST.length)] + (10 + seeded(i+5, 90)),
      avatar:   isMe ? ME.avatar : AVATARS[seeded(i+3, AVATARS.length)],
      country,
      state:    isMe ? ME.state : STATES[seeded(i+29, STATES.length)],
      score:    Math.floor(20000 - (i * 75) - seeded(i+11, 60)),
      level:    isMe ? ME.level : Math.floor(80 - i*0.4 + seeded(i+17, 8) - 4),
      change:   ((seeded(i+91, 20) - 10)),
      isMe,
      isFriend: isFriends || seeded(i+47, 10) < 1,
      isVIP:    seeded(i+19, 10) < 3,
    });
  }
  return players;
}

const GLOBAL_TOP   = generatePlayers(100);
GLOBAL_TOP[ME.globalRank - 1] = { ...GLOBAL_TOP[ME.globalRank - 1], isMe:true, username:ME.username, avatar:ME.avatar, score:ME.score };

const NATIONAL_TOP = GLOBAL_TOP
  .filter(p => p.country.name === ME.country || p.isMe)
  .slice(0, 100)
  .map((p, i) => ({ ...p, rank: i + 1 }));

const STATE_TOP = NATIONAL_TOP
  .filter((p, i) => p.state === ME.state || p.isMe || i < 30)
  .slice(0, 100)
  .map((p, i) => ({ ...p, rank: i + 1 }));

const FRIENDS_TOP = generatePlayers(12, true);
FRIENDS_TOP.splice(seeded(99, 5), 0, {
  rank: seeded(99, 5) + 1, username: ME.username, avatar: ME.avatar,
  country: { flag: ME.countryFlag, name: ME.country },
  state: ME.state, score: ME.score, level: ME.level,
  change: 3, isMe:true, isFriend:true, isVIP: false,
});
FRIENDS_TOP.forEach((p,i) => p.rank = i+1);
FRIENDS_TOP.sort((a,b) => b.score - a.score).forEach((p,i) => p.rank = i+1);

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Boogaloo&family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

  @keyframes fadeUp     { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes popIn      { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
  @keyframes float      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
  @keyframes pulse      { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
  @keyframes shine      { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
  @keyframes spinSlow   { to{transform:rotate(360deg)} }
  @keyframes barGrow    { from{height:0} to{height:var(--h)} }
  @keyframes meTracker  { 0%,100%{box-shadow:0 0 0 0 ${C.a4}66} 50%{box-shadow:0 0 0 8px ${C.a4}00} }
  @keyframes tickerPulse{ 0%,100%{opacity:1} 50%{opacity:0.6} }

  ::-webkit-scrollbar { width:5px; }
  ::-webkit-scrollbar-thumb { background:${C.border2}; border-radius:3px; }
  ::-webkit-scrollbar-track { background:transparent; }

  .row {
    display:grid;
    grid-template-columns: 60px 1fr auto auto;
    gap:14px; align-items:center;
    padding:12px 18px; border-radius:14px;
    transition: background 0.15s, border-color 0.15s;
    animation:fadeUp 0.3s ease;
    border:1.5px solid transparent;
  }
  .row:hover { background:${C.card2}; border-color:${C.border}; }
  .row.me {
    background:linear-gradient(90deg, ${C.a4}18, ${C.a5}10);
    border-color:${C.a4}66;
    box-shadow:0 0 24px ${C.a4}22;
    animation:fadeUp 0.3s ease, meTracker 2.5s ease-in-out infinite;
  }
  .row.top3 { background:${C.card2}; border-color:${C.a2}33; }

  .me-floater {
    position:sticky; bottom:16px;
    margin:0 16px; z-index:30;
    box-shadow:0 12px 48px #000d, 0 0 0 1px ${C.a4}66, 0 0 32px ${C.a4}33;
    background:${C.card};
    border-radius:14px;
    backdrop-filter:blur(12px);
    animation:fadeUp 0.4s ease;
  }

  button:not(:disabled):active { transform:scale(0.97); }
`;

function Medal({ rank }) {
  const medals = {
    1: { icon:"🥇", colors:[C.a2, C.a6],        glow:C.a2 },
    2: { icon:"🥈", colors:["#e5e7eb","#9ca3af"], glow:"#cbd5e1" },
    3: { icon:"🥉", colors:[C.a6, "#b87333"],     glow:C.a6 },
  };
  const m = medals[rank];
  if (!m) return null;
  return (
    <div style={{
      width:36, height:36, borderRadius:"50%",
      background:`linear-gradient(135deg, ${m.colors[0]}, ${m.colors[1]})`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:18, color:"#111", fontWeight:900,
      boxShadow:`0 0 16px ${m.glow}66, inset 0 -3px 6px #0003`,
      animation:"pulse 2.5s ease-in-out infinite",
    }}>{m.icon}</div>
  );
}

function RankBadge({ rank }) {
  if (rank <= 3) return <Medal rank={rank} />;
  return (
    <div style={{
      width:36, height:36, borderRadius:10,
      background: rank <= 10 ? C.a4 + "18" : rank <= 100 ? C.card2 : "transparent",
      border:`1.5px solid ${rank <= 10 ? C.a4 + "55" : C.border}`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'Boogaloo',cursive", fontSize:16,
      color: rank <= 10 ? C.a4 : C.text,
    }}>#{rank}</div>
  );
}

function ChangeArrow({ change }) {
  if (change === 0) return <span style={{ color:C.muted, fontSize:11, fontWeight:700 }}>—</span>;
  const up = change > 0;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:2, color: up ? C.a3 : C.a1, fontSize:11, fontWeight:800 }}>
      {up ? "▲" : "▼"} {Math.abs(change)}
    </span>
  );
}

function VIPDot() {
  return (
    <span style={{
      background:`linear-gradient(135deg, ${C.a2}, ${C.a6})`, color:"#111",
      fontSize:9, fontWeight:900, padding:"2px 6px", borderRadius:6,
      letterSpacing:0.5, fontFamily:"'DM Sans',sans-serif",
      boxShadow:`0 0 6px ${C.a2}66`,
    }}>VIP</span>
  );
}

function FriendDot() {
  return (
    <span title="Friend" style={{
      background:C.a3+"22", color:C.a3, fontSize:9, fontWeight:900,
      padding:"2px 6px", borderRadius:6, letterSpacing:0.5,
      border:`1px solid ${C.a3}44`,
    }}>FRIEND</span>
  );
}

function Podium({ top3 }) {
  if (!top3 || top3.length < 3) return null;
  const heights = [110, 130, 90];
  const order   = [top3[1], top3[0], top3[2]];

  return (
    <div style={{
      display:"flex", justifyContent:"center", alignItems:"flex-end",
      gap:14, padding:"28px 16px 18px", position:"relative",
    }}>
      <div style={{
        position:"absolute", inset:0, opacity:0.3, pointerEvents:"none",
        background:`radial-gradient(ellipse at center top, ${C.a2}22, transparent 60%)`,
      }} />

      {order.map((p, idx) => {
        const place    = idx === 0 ? 2 : idx === 1 ? 1 : 3;
        const heightVal = idx === 0 ? heights[1] : idx === 1 ? heights[0] : heights[2];
        const colors   = {
          1: { primary: C.a2, secondary: C.a6 },
          2: { primary: "#cbd5e1", secondary: "#94a3b8" },
          3: { primary: C.a6, secondary: "#b87333" },
        };
        const col = colors[place];

        return (
          <div key={p.rank} style={{
            display:"flex", flexDirection:"column", alignItems:"center", gap:8,
            position:"relative", zIndex:1,
            animation:`popIn 0.5s cubic-bezier(.17,.67,.35,1.2) ${idx * 0.15}s both`,
          }}>
            <div style={{
              width: place === 1 ? 72 : 60, height: place === 1 ? 72 : 60, borderRadius:"50%",
              background:`linear-gradient(135deg, ${col.primary}, ${col.secondary})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize: place === 1 ? 32 : 28,
              boxShadow:`0 0 24px ${col.primary}66, 0 4px 16px #000a`,
              border:`3px solid ${col.primary}`,
              animation:"float 3s ease-in-out infinite",
              animationDelay:`${idx * 0.3}s`,
              position:"relative",
            }}>
              {p.avatar}
              {p.isVIP && <div style={{ position:"absolute", top:-4, right:-4, fontSize:18 }}>👑</div>}
            </div>

            <div style={{ textAlign:"center", minWidth:0, maxWidth:120 }}>
              <div style={{
                fontFamily:"'DM Sans',sans-serif", fontWeight:800,
                fontSize: place === 1 ? 14 : 13, color: p.isMe ? C.a4 : C.text,
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
              }}>{p.username}{p.isMe && " (You)"}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>
                {p.country.flag} Lvl {p.level}
              </div>
            </div>

            <div style={{
              fontFamily:"'Boogaloo',cursive", fontSize: place === 1 ? 26 : 22,
              color: col.primary, lineHeight:1,
              textShadow:`0 0 12px ${col.primary}66`,
            }}>{p.score.toLocaleString()}</div>

            <div style={{
              width: place === 1 ? 110 : 90, height: heightVal,
              background:`linear-gradient(180deg, ${col.primary}22, ${col.primary}08)`,
              border:`1.5px solid ${col.primary}55`,
              borderTopLeftRadius:12, borderTopRightRadius:12,
              display:"flex", alignItems:"center", justifyContent:"center",
              position:"relative", overflow:"hidden",
              "--h": `${heightVal}px`, animation:`barGrow 0.8s cubic-bezier(.4,0,.2,1) ${idx*0.15 + 0.3}s both`,
            }}>
              <div style={{
                fontFamily:"'Boogaloo',cursive", fontSize: place === 1 ? 56 : 42,
                color: col.primary, lineHeight:1, opacity:0.9,
                textShadow:`0 2px 12px ${col.primary}88`,
              }}>{place}</div>
              <div style={{
                position:"absolute", inset:0,
                background:`linear-gradient(105deg, transparent 40%, ${col.primary}33 50%, transparent 60%)`,
                animation:"shine 3s ease-in-out infinite",
                animationDelay:`${idx * 0.4}s`,
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PlayerRow({ player, showLocation = "country" }) {
  return (
    <div className={`row ${player.isMe ? "me" : ""} ${player.rank <= 3 ? "top3" : ""}`}>
      <RankBadge rank={player.rank} />

      <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
        <div style={{
          width:36, height:36, borderRadius:10, flexShrink:0,
          background: player.isMe ? `linear-gradient(135deg, ${C.a4}, ${C.a5})` : C.card2,
          border:`1.5px solid ${player.isMe ? C.a4 : C.border2}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:18, boxShadow: player.isMe ? `0 0 12px ${C.a4}44` : "none",
        }}>{player.avatar}</div>

        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            <span style={{
              fontWeight:800, fontSize:14,
              color: player.isMe ? C.a4 : C.text,
              whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:"100%",
            }}>{player.username}</span>
            {player.isMe && (
              <span style={{
                background:C.a4+"22", color:C.a4, fontSize:9, fontWeight:900,
                padding:"2px 6px", borderRadius:6, letterSpacing:0.5, border:`1px solid ${C.a4}55`,
              }}>YOU</span>
            )}
            {player.isVIP && <VIPDot />}
            {player.isFriend && !player.isMe && <FriendDot />}
          </div>
          <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginTop:2,
                        display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            <span>{showLocation === "country" ? player.country.flag : "📍"} {showLocation === "country" ? player.country.name : player.state}</span>
            <span style={{ color:C.muted2 }}>·</span>
            <span>Lvl {player.level}</span>
          </div>
        </div>
      </div>

      <ChangeArrow change={player.change} />

      <div style={{ textAlign:"right" }}>
        <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:18, color: player.isMe ? C.a4 : C.text, lineHeight:1 }}>
          {player.score.toLocaleString()}
        </div>
        <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginTop:2 }}>pts</div>
      </div>
    </div>
  );
}

function MyRankCard({ me = ME }) {
  const stats = [
    { icon:"🌍", label:"Global",   rank: me.globalRank,   accent: C.a4, max: 100 },
    { icon:"🇺🇸", label:"National", rank: me.nationalRank, accent: C.a5, max: 100 },
    { icon:"📍", label:"State",    rank: me.stateRank,    accent: C.a3, max: 100 },
  ];

  return (
    <div style={{
      background:`linear-gradient(135deg, ${C.a4}13, ${C.a5}08)`,
      border:`1px solid ${C.a4}44`,
      borderRadius:18, padding:20, marginBottom:20,
      position:"relative", overflow:"hidden",
    }}>
      <div style={{
        position:"absolute", inset:0, opacity:0.3, pointerEvents:"none",
        backgroundImage:`radial-gradient(circle at 80% 20%, ${C.a4}33, transparent 50%)`,
      }} />
      <div style={{ position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                      marginBottom:14, flexWrap:"wrap", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              width:42, height:42, borderRadius:12,
              background:`linear-gradient(135deg, ${C.a4}, ${C.a5})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:22, boxShadow:`0 0 16px ${C.a4}44`,
            }}>{me.avatar}</div>
            <div>
              <div style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:0.8, textTransform:"uppercase" }}>Your Position</div>
              <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:20, color:C.text }}>{me.username}</div>
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:30, color:C.a2, lineHeight:1 }}>
              {me.score.toLocaleString()}
            </div>
            <div style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase" }}>Season Points</div>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:10 }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              background:C.card2, border:`1px solid ${s.accent}44`,
              borderRadius:12, padding:"12px 14px",
              display:"flex", alignItems:"center", justifyContent:"space-between",
              animation:`fadeUp 0.4s ease ${i*0.07}s both`,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:18 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase" }}>{s.label}</div>
                  <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:18, color:s.accent }}>#{s.rank}</div>
                </div>
              </div>
              {s.rank <= s.max && (
                <div style={{
                  background:s.accent+"22", color:s.accent,
                  fontSize:9, fontWeight:900, padding:"2px 6px", borderRadius:6, letterSpacing:0.5,
                  border:`1px solid ${s.accent}55`,
                }}>TOP {s.max}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MyRankFloater({ player }) {
  if (!player) return null;
  return (
    <div className="me-floater" style={{ padding:"10px 14px" }}>
      <div className="row me" style={{ margin:0, padding:0, border:"none", background:"transparent", animation:"none", boxShadow:"none" }}>
        <RankBadge rank={player.rank} />
        <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
          <div style={{
            width:36, height:36, borderRadius:10, flexShrink:0,
            background:`linear-gradient(135deg, ${C.a4}, ${C.a5})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:18, boxShadow:`0 0 12px ${C.a4}44`,
          }}>{player.avatar}</div>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontWeight:800, fontSize:14, color:C.a4 }}>{player.username}</span>
              <span style={{
                background:C.a4+"22", color:C.a4, fontSize:9, fontWeight:900,
                padding:"2px 6px", borderRadius:6, letterSpacing:0.5, border:`1px solid ${C.a4}55`,
              }}>YOU</span>
            </div>
            <div style={{ fontSize:11, color:C.muted, fontWeight:600 }}>
              {player.country.flag} {player.country.name} · Lvl {player.level}
            </div>
          </div>
        </div>
        <ChangeArrow change={player.change} />
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:18, color:C.a4, lineHeight:1 }}>
            {player.score.toLocaleString()}
          </div>
          <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginTop:2 }}>pts</div>
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [view, setView] = useState("global");
  const [serverList, setServerList] = useState(null);
  const [myProfile, setMyProfile]   = useState(null);
  const [myRankData, setMyRankData] = useState(null);
  const myUsername = getUsername();

  useEffect(() => {
    if (!isLoggedIn()) return;
    Promise.all([api.me(), api.myRank()])
      .then(([meRes, rankRes]) => { setMyProfile(meRes.profile); setMyRankData(rankRes); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) return;
    const params = { scope: view };
    if (view === "national" && myProfile?.country) params.country = myProfile.country;
    if (view === "state"    && myProfile?.state)   params.state   = myProfile.state;
    api.leaderboard(params)
      .then(d => setServerList(mapServerList(d.leaderboard)))
      .catch(() => setServerList(null));
  }, [view, myProfile]);

  const effectiveMe = myProfile ? {
    username:     myProfile.username    || myUsername    || ME.username,
    avatar:       myProfile.avatar_icon || ME.avatar,
    country:      myProfile.country     || ME.country,
    countryFlag:  countryObj(myProfile.country)?.flag || ME.countryFlag,
    state:        myProfile.state       || ME.state,
    score:        myRankData?.score        ?? ME.score,
    globalRank:   myRankData?.globalRank   ?? ME.globalRank,
    nationalRank: myRankData?.nationalRank ?? ME.nationalRank,
    stateRank:    myRankData?.stateRank    ?? ME.stateRank,
    level:        myProfile.level          || ME.level,
  } : ME;

  const list = useMemo(() => {
    if (serverList !== null) return serverList;
    if (view === "global")   return GLOBAL_TOP;
    if (view === "national") return NATIONAL_TOP;
    if (view === "state")    return STATE_TOP;
    if (view === "friends")  return FRIENDS_TOP;
    return [];
  }, [view, serverList]);

  const me   = list.find(p => p.isMe);
  const top3 = list.slice(0, 3);
  const rest = list.slice(3, 100);
  const showLocation = view === "state" ? "state" : "country";

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'DM Sans',sans-serif", paddingBottom:90 }}>
      <style>{css}</style>

      <div style={{
        background:`linear-gradient(180deg, ${C.a2}11 0%, ${C.a5}06 40%, transparent 100%)`,
        borderBottom:`1px solid ${C.border}`,
        padding:"28px 24px 0",
        position:"relative", overflow:"hidden",
      }}>
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`linear-gradient(${C.border}44 1px, transparent 1px), linear-gradient(90deg, ${C.border}44 1px, transparent 1px)`,
          backgroundSize:"32px 32px", opacity:0.3,
        }} />

        <div style={{ maxWidth:840, margin:"0 auto", position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:16, marginBottom:20 }}>
            <div>
              <div style={{ fontSize:11, color:C.a2, fontWeight:900, letterSpacing:1.5, textTransform:"uppercase", marginBottom:4 }}>Leaderboard</div>
              <h1 style={{ fontFamily:"'Boogaloo',cursive", fontSize:32, lineHeight:1 }}>🏆 Top Players</h1>
              <p style={{ fontSize:13, color:C.muted, fontWeight:600, marginTop:4 }}>
                Season {SEASON.number}: {SEASON.name} · Top 100 ranks
              </p>
            </div>

            <div style={{
              background:C.card2, border:`1px solid ${C.a1}44`,
              borderRadius:14, padding:"10px 18px",
              display:"flex", alignItems:"center", gap:10,
            }}>
              <div style={{ fontSize:22, animation:"spinSlow 12s linear infinite" }}>⏱️</div>
              <div>
                <div style={{ fontSize:10, color:C.muted, fontWeight:800, letterSpacing:0.5, textTransform:"uppercase" }}>Resets in (bi-weekly)</div>
                <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:20, color:C.a1, animation:"tickerPulse 1.5s ease-in-out infinite" }}>
                  {SEASON.resetIn}
                </div>
              </div>
            </div>
          </div>

          <MyRankCard me={effectiveMe} />

          <div style={{ display:"flex", gap:4, overflowX:"auto", borderBottom:`1px solid ${C.border}`, padding:"0" }}>
            {[
              { id:"global",   label:"🌍 Global",   sub:"Worldwide"   },
              { id:"national", label:"🇺🇸 National", sub: effectiveMe.country },
              { id:"state",    label:"📍 State",    sub: effectiveMe.state   },
              { id:"friends",  label:"👥 Friends",  sub:"Your circle"  },
            ].map(t => (
              <button key={t.id} onClick={() => setView(t.id)} style={{
                padding:"12px 18px", border:"none", background:"transparent",
                color: view===t.id ? C.text : C.muted,
                borderRadius:"10px 10px 0 0",
                borderBottom: view===t.id ? `2px solid ${C.a4}` : "2px solid transparent",
                fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700,
                cursor:"pointer", whiteSpace:"nowrap",
                display:"flex", flexDirection:"column", alignItems:"center", gap:1,
              }}>
                <span>{t.label}</span>
                <span style={{ fontSize:10, color:C.muted, fontWeight:600 }}>{t.sub}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:840, margin:"0 auto", padding:"0 24px" }}>
        <Podium top3={top3} />

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", marginBottom:8, flexWrap:"wrap", gap:8 }}>
          <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:18 }}>
            {view === "global"   && "🌍 Global Rankings"}
            {view === "national" && `🇺🇸 ${effectiveMe.country} Top Players`}
            {view === "state"    && `📍 ${effectiveMe.state} Top Players`}
            {view === "friends"  && "👥 Friends Leaderboard"}
          </h3>
          <div style={{ display:"flex", gap:6, fontSize:11, color:C.muted, fontWeight:700 }}>
            <span>RANK</span>
            <span style={{ color:C.muted2 }}>·</span>
            <span style={{ color:C.a3 }}>▲ UP</span>
            <span style={{ color:C.a1 }}>▼ DOWN</span>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {rest.map((p, i) => (
            <div key={p.rank} style={{ animationDelay:`${Math.min(i*0.015, 0.5)}s` }}>
              <PlayerRow player={p} showLocation={showLocation} />
            </div>
          ))}
        </div>

        <div style={{ textAlign:"center", color:C.muted, fontSize:12, fontWeight:600, padding:"24px 0 8px" }}>
          {view === "friends"
            ? `${list.length} friend${list.length !== 1 ? "s" : ""} on the leaderboard`
            : `Showing top ${rest.length + 3} players · Updated live`}
        </div>

        <div style={{
          background:`linear-gradient(135deg, ${C.a2}11, ${C.a5}06)`,
          border:`1px solid ${C.a2}33`,
          borderRadius:16, padding:18, marginTop:16, marginBottom:8,
        }}>
          <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:18, color:C.a2, marginBottom:10 }}>🏆 Season Rewards</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:10 }}>
            {[
              { rank:"🥇 #1",      reward:"Hall of Fame Badge + 5000 coins", color:C.a2      },
              { rank:"🥈 #2-3",     reward:"Legendary avatar + 2000 coins",   color:"#cbd5e1" },
              { rank:"🥉 Top 10",   reward:"Exclusive title + 1000 coins",     color:C.a6      },
              { rank:"⭐ Top 100",   reward:"Season badge + 500 coins",          color:C.a4      },
            ].map((r, i) => (
              <div key={i} style={{
                background:C.card2, border:`1px solid ${r.color}33`,
                borderRadius:10, padding:"10px 12px",
                animation:`fadeUp 0.4s ease ${i*0.06}s both`,
              }}>
                <div style={{ fontSize:13, fontWeight:800, color:r.color, marginBottom:2 }}>{r.rank}</div>
                <div style={{ fontSize:11, color:C.muted, fontWeight:500, lineHeight:1.4 }}>{r.reward}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {me && me.rank > 3 && me.rank > 20 && <MyRankFloater player={me} />}
    </div>
  );
}

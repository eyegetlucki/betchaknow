import { useState, useEffect } from "react";
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

const DIFFICULTY = {
  easy:   { color: C.a3, label: "Easy"   },
  medium: { color: C.a2, label: "Medium" },
  hard:   { color: C.a1, label: "Hard"   },
};

function useCountdown(targetHours, targetMinutes = 0) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      const now    = new Date();
      const target = new Date();
      target.setHours(targetHours, targetMinutes, 0, 0);
      if (target < now) target.setDate(target.getDate() + 1);
      const diff = target - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetHours, targetMinutes]);
  return time;
}

function useWeeklyCountdown() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      const now  = new Date();
      const next = new Date(now);
      const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
      next.setDate(now.getDate() + daysUntilSunday);
      next.setHours(0, 0, 0, 0);
      const diff = next - now;
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTime(`${d}d ${h}h ${m}m`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);
  return time;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Boogaloo&family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

  @keyframes fadeUp     { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
  @keyframes popIn      { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
  @keyframes float      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes pulse      { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.05);opacity:0.9} }
  @keyframes glow       { 0%,100%{box-shadow:0 0 16px var(--glow)} 50%{box-shadow:0 0 32px var(--glow)} }
  @keyframes shine      { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
  @keyframes barFill    { from{width:0} to{width:var(--w)} }
  @keyframes confetti   { to{transform:translateY(120px) rotate(720deg);opacity:0} }
  @keyframes flameWave  { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-3px) scale(1.1)} }
  @keyframes tickerPulse{ 0%,100%{opacity:1} 50%{opacity:0.5} }

  ::-webkit-scrollbar { width:5px; }
  ::-webkit-scrollbar-thumb { background:${C.border2}; border-radius:3px; }
  ::-webkit-scrollbar-track { background:transparent; }

  .glass-card {
    background:${C.card2}; border:1px solid ${C.border};
    border-radius:18px; padding:18px;
    transition:transform 0.18s, border-color 0.18s, box-shadow 0.18s;
    animation:fadeUp 0.4s ease; position:relative; overflow:hidden;
  }
  .glass-card:hover { border-color:${C.border2}; }
  .glass-card.completed { border-color:${C.a3}55; box-shadow:0 0 24px ${C.a3}22; }
  .glass-card.claimed { opacity:0.6; }

  .shimmer-bg::before {
    content:""; position:absolute; top:0; left:0; width:100%; height:100%;
    background:linear-gradient(105deg, transparent 30%, ${C.a3}11 50%, transparent 70%);
    animation:shine 3s ease-in-out infinite;
  }

  .day-tile {
    aspect-ratio:1; border-radius:14px; position:relative;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:2px; padding:6px; transition:transform 0.15s, box-shadow 0.2s;
  }

  button:not(:disabled):active { transform:scale(0.97); }

  .progress-track { height:8px; border-radius:4px; background:${C.border2}; overflow:hidden; position:relative; }
  .progress-fill  { height:100%; border-radius:4px; animation:barFill 1s cubic-bezier(.4,0,.2,1) forwards; }
`;

function CoinIcon({ size = 14 }) {
  return (
    <span style={{
      display:"inline-flex", width:size, height:size,
      background:`linear-gradient(135deg,${C.a2},${C.a6})`,
      borderRadius:"50%", boxShadow:`0 0 6px ${C.a2}66, inset 0 0 4px #0004`,
      alignItems:"center", justifyContent:"center",
      fontSize:Math.round(size*0.55), color:"#111", fontWeight:900,
    }}>$</span>
  );
}

function DifficultyTag({ difficulty }) {
  const d = DIFFICULTY[difficulty];
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:3,
      background: d.color + "18", color: d.color, border: `1px solid ${d.color}44`,
      borderRadius:8, padding:"2px 8px", fontSize:10, fontWeight:800,
      letterSpacing:0.5, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif",
    }}>{d.label}</span>
  );
}

function RewardChip({ reward }) {
  if (reward.type === "xp") return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, background: C.a4+"18", color:C.a4, border:`1px solid ${C.a4}33`, borderRadius:8, padding:"3px 10px", fontSize:12, fontWeight:800, fontFamily:"'DM Sans',sans-serif" }}>⭐ {reward.amount} XP</span>
  );
  if (reward.type === "coins") return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, background: C.a2+"18", color:C.a2, border:`1px solid ${C.a2}33`, borderRadius:8, padding:"3px 10px", fontSize:12, fontWeight:800, fontFamily:"'DM Sans',sans-serif" }}><CoinIcon size={12} /> {reward.amount}</span>
  );
  if (reward.type === "bp") return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, background: C.a5+"18", color:C.a5, border:`1px solid ${C.a5}33`, borderRadius:8, padding:"3px 10px", fontSize:12, fontWeight:800, fontFamily:"'DM Sans',sans-serif" }}>🎯 {reward.amount} BP</span>
  );
  if (reward.type === "cosmetic") return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, background: C.a3+"18", color:C.a3, border:`1px solid ${C.a3}33`, borderRadius:8, padding:"3px 10px", fontSize:12, fontWeight:800, fontFamily:"'DM Sans',sans-serif" }}>{reward.icon} {reward.name}</span>
  );
  return null;
}

function ChallengeCard({ challenge, onClaim, accent }) {
  const pct      = Math.min(100, Math.round((challenge.progress / challenge.total) * 100));
  const canClaim = challenge.completed && !challenge.claimed;

  return (
    <div className={`glass-card ${challenge.completed ? "completed" : ""} ${challenge.claimed ? "claimed" : ""} ${canClaim ? "shimmer-bg" : ""}`}
      style={{ "--glow": accent + "44" }}>

      <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:14 }}>
        <div style={{
          width:56, height:56, borderRadius:14,
          background: challenge.completed ? `linear-gradient(135deg, ${C.a3}33, ${C.a3}11)` : `linear-gradient(135deg, ${accent}22, ${accent}08)`,
          border: `1.5px solid ${challenge.completed ? C.a3 + "55" : accent + "33"}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:28, flexShrink:0,
          filter: challenge.claimed ? "grayscale(1)" : "none",
          animation: canClaim ? "float 2.5s ease-in-out infinite" : "none",
          boxShadow: canClaim ? `0 0 20px ${accent}44` : "none",
        }}>{challenge.icon}</div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", gap:8, alignItems:"flex-start", marginBottom:4, flexWrap:"wrap" }}>
            <h4 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:800, color: challenge.claimed ? C.muted : C.text }}>{challenge.name}</h4>
            <DifficultyTag difficulty={challenge.difficulty} />
          </div>
          <p style={{ fontSize:12, color:C.muted, fontWeight:500, lineHeight:1.4 }}>{challenge.desc}</p>
        </div>
      </div>

      <div style={{ marginBottom:14, position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase" }}>Progress</span>
          <span style={{ fontSize:12, color: challenge.completed ? C.a3 : accent, fontWeight:800 }}>{challenge.progress} / {challenge.total}</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{
            "--w": `${pct}%`,
            background: challenge.completed ? `linear-gradient(90deg, ${C.a3}, ${C.a3}cc)` : `linear-gradient(90deg, ${accent}, ${accent}cc)`,
            width: `${pct}%`,
            boxShadow: challenge.completed ? `0 0 10px ${C.a3}66` : `0 0 8px ${accent}44`,
          }} />
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", flex:1 }}>
          {challenge.rewards.map((r, i) => <RewardChip key={i} reward={r} />)}
        </div>

        {challenge.claimed ? (
          <span style={{ display:"inline-flex", alignItems:"center", gap:4, color:C.muted, fontSize:12, fontWeight:700, background:C.border, padding:"6px 12px", borderRadius:10 }}>✓ Claimed</span>
        ) : canClaim ? (
          <button onClick={() => onClaim(challenge)} style={{
            padding:"8px 18px", borderRadius:10, border:"none",
            background:`linear-gradient(135deg, ${C.a3}, ${C.a4})`, color:"#fff", fontWeight:900, fontSize:13, cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif", boxShadow:`0 4px 14px ${C.a3}55`,
            animation:"pulse 1.6s ease-in-out infinite",
          }}>🎁 Claim</button>
        ) : (
          <span style={{ display:"inline-flex", alignItems:"center", gap:4, color:C.muted, fontSize:11, fontWeight:700 }}>{100 - pct}% to go</span>
        )}
      </div>
    </div>
  );
}

function LoginStreak({ data }) {
  return (
    <div style={{
      background:`linear-gradient(135deg, ${C.a6}18, ${C.a1}10)`,
      border:`1px solid ${C.a6}44`, borderRadius:20, padding:20, position:"relative", overflow:"hidden",
    }}>
      <div style={{ position:"absolute", inset:0, opacity:0.4, backgroundImage:`radial-gradient(circle at 20% 20%, ${C.a6}22, transparent 50%)`, pointerEvents:"none" }} />
      <div style={{ position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10, marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:32, animation:"flameWave 1.8s ease-in-out infinite" }}>🔥</div>
            <div>
              <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:22, color:C.text }}>Login Streak</div>
              <div style={{ fontSize:12, color:C.muted, fontWeight:600 }}>{data.current} day{data.current !== 1 ? "s" : ""} in a row · Keep it going!</div>
            </div>
          </div>
          <div style={{
            background: data.todayClaimed ? C.a3 + "22" : C.a2 + "22",
            color: data.todayClaimed ? C.a3 : C.a2,
            border: `1px solid ${data.todayClaimed ? C.a3 : C.a2}55`,
            borderRadius:10, padding:"6px 14px", fontSize:12, fontWeight:800,
          }}>{data.todayClaimed ? "✓ Claimed Today" : "Claim Today's Reward"}</div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:6 }}>
          {data.days.map((day, i) => {
            const isToday = day.day === data.current;
            const isLast  = day.day === 7;
            return (
              <div key={i} className="day-tile" style={{
                background: day.claimed
                  ? (isLast ? `linear-gradient(135deg, ${C.a2}22, ${C.a6}18)` : C.a3 + "18")
                  : isToday ? `linear-gradient(135deg, ${C.a2}22, ${C.a6}22)` : isLast ? `linear-gradient(135deg, ${C.a2}11, ${C.a6}08)` : C.card2,
                border: `1.5px solid ${day.claimed ? (isLast ? C.a2 + "66" : C.a3 + "55") : isToday ? C.a2 : isLast ? C.a2 + "44" : C.border2}`,
                boxShadow: isToday && !data.todayClaimed ? `0 0 16px ${C.a2}55` : "none",
                animation: isToday && !data.todayClaimed ? "pulse 1.6s ease-in-out infinite" : "none",
              }}>
                <div style={{ fontSize:10, fontWeight:800, color:C.muted, letterSpacing:0.5 }}>DAY {day.day}</div>
                <div style={{ fontSize:22, marginTop:2, filter: day.claimed && !isLast ? "grayscale(0.5)" : "none" }}>{day.reward.icon}</div>
                <div style={{ fontSize:11, fontWeight:800, color: day.claimed ? C.muted : isLast ? C.a2 : C.text }}>{day.reward.amount}</div>
                {day.claimed && (
                  <div style={{ position:"absolute", top:4, right:4, width:16, height:16, borderRadius:"50%", background:C.a3, color:"#0a1a0c", fontSize:10, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center" }}>✓</div>
                )}
                {isLast && (
                  <div style={{ position:"absolute", top:-6, right:-6, background:`linear-gradient(135deg, ${C.a2}, ${C.a6})`, color:"#111", fontSize:9, fontWeight:900, padding:"2px 6px", borderRadius:6, letterSpacing:0.5, boxShadow:`0 2px 6px ${C.a2}66` }}>BONUS</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ClaimPopup({ data, onClose }) {
  if (!data) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"#000a", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, animation:"fadeIn 0.2s ease", padding:20 }} onClick={onClose}>
      {Array.from({ length: 24 }).map((_, i) => (
        <div key={i} style={{
          position:"absolute", top:"45%", left:`${Math.random()*100}%`,
          width:8, height:14, borderRadius:2,
          background: [C.a1,C.a2,C.a3,C.a4,C.a5][i%5],
          animation:`confetti ${1+Math.random()*1.5}s ease-out forwards`,
          animationDelay:`${Math.random()*0.4}s`,
        }} />
      ))}
      <div style={{
        background:C.card, border:`2px solid ${C.a3}`, borderRadius:24, padding:"32px 36px",
        textAlign:"center", maxWidth:380,
        animation:"popIn 0.4s cubic-bezier(.17,.67,.35,1.3)",
        boxShadow:`0 0 60px ${C.a3}33`, position:"relative", zIndex:2,
      }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontSize:60, marginBottom:12, animation:"float 2.5s ease-in-out infinite", filter:`drop-shadow(0 4px 12px ${C.a3}66)` }}>{data.icon}</div>
        <div style={{ fontSize:11, color:C.a3, fontWeight:900, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>Challenge Complete!</div>
        <h2 style={{ fontFamily:"'Boogaloo',cursive", fontSize:26, color:C.text, marginBottom:14 }}>{data.name}</h2>
        <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:14, padding:14, marginBottom:18 }}>
          <div style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", marginBottom:8 }}>Rewards Earned</div>
          <div style={{ display:"flex", justifyContent:"center", gap:8, flexWrap:"wrap" }}>
            {data.rewards.map((r,i) => <RewardChip key={i} reward={r} />)}
          </div>
        </div>
        <button onClick={onClose} style={{
          padding:"12px 32px", borderRadius:12, border:"none",
          background:`linear-gradient(135deg, ${C.a3}, ${C.a4})`, color:"#fff", fontWeight:900, fontSize:14, cursor:"pointer",
          fontFamily:"'DM Sans',sans-serif", boxShadow:`0 4px 18px ${C.a3}44`,
        }}>Awesome!</button>
      </div>
    </div>
  );
}

export default function ChallengesPage() {
  const [dailies,     setDailies]     = useState(null);
  const [weeklies,    setWeeklies]    = useState(null);
  const [loginStreak, setLoginStreak] = useState(null);
  const [popup,       setPopup]       = useState(null);
  const [tab,         setTab]         = useState("active");
  const [loading,     setLoading]     = useState(true);

  const dailyTime  = useCountdown(0);
  const weeklyTime = useWeeklyCountdown();

  useEffect(() => {
    if (!isLoggedIn()) { setLoading(false); return; }
    api.challenges().then(d => {
      setDailies(d.daily   || []);
      setWeeklies(d.weekly || []);
      setLoginStreak(d.loginStreak?.days?.length ? d.loginStreak : null);
    }).catch(() => {
      setDailies([]);
      setWeeklies([]);
    }).finally(() => setLoading(false));
  }, []);

  const handleClaim = (challenge) => {
    const updater = challenge.challengeType === "daily" ? setDailies : setWeeklies;
    updater(prev => prev.map(c => c.id === challenge.id ? { ...c, claimed: true } : c));
    setPopup(challenge);
    if (isLoggedIn()) {
      api.claimChallenge({ challengeId: challenge.id }).catch(() => {});
    }
  };

  const d = dailies  || [];
  const w = weeklies || [];

  const dailyCompleted  = d.filter(c => c.completed).length;
  const weeklyCompleted = w.filter(c => c.completed).length;
  const dailyClaimable  = d.filter(c => c.completed && !c.claimed).length;
  const weeklyClaimable = w.filter(c => c.completed && !c.claimed).length;
  const totalClaimable  = dailyClaimable + weeklyClaimable;

  const filterDaily  = tab === "completed" ? d.filter(c=>c.completed)  : tab === "active" ? d.filter(c=>!c.claimed)  : d;
  const filterWeekly = tab === "completed" ? w.filter(c=>c.completed) : tab === "active" ? w.filter(c=>!c.claimed) : w;

  const loggedIn = isLoggedIn();

  return (
    <div style={{ minHeight:"100vh", background:"transparent", color:C.text, fontFamily:"'DM Sans',sans-serif", paddingBottom:60 }}>
      <style>{css}</style>

      <div style={{
        background:`linear-gradient(180deg, ${C.a4}11 0%, ${C.a3}06 40%, transparent 100%)`,
        borderBottom:`1px solid ${C.border}`,
        padding:"28px 24px 0", position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(${C.border}44 1px, transparent 1px), linear-gradient(90deg, ${C.border}44 1px, transparent 1px)`, backgroundSize:"32px 32px", opacity:0.3 }} />

        <div style={{ maxWidth:900, margin:"0 auto", position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:16, marginBottom:24 }}>
            <div>
              <div style={{ fontSize:11, color:C.a4, fontWeight:900, letterSpacing:1.5, textTransform:"uppercase", marginBottom:4 }}>Quests & Challenges</div>
              <h1 style={{ fontFamily:"'Boogaloo',cursive", fontSize:32, lineHeight:1 }}>🎯 Daily Missions</h1>
              <p style={{ fontSize:13, color:C.muted, fontWeight:600, marginTop:4 }}>Complete challenges to earn XP, coins, and exclusive rewards</p>
            </div>

            {totalClaimable > 0 && (
              <div style={{
                background:`linear-gradient(135deg, ${C.a3}22, ${C.a4}18)`,
                border:`1.5px solid ${C.a3}55`, borderRadius:14, padding:"10px 18px",
                display:"flex", alignItems:"center", gap:10,
                animation:"glow 2.5s ease-in-out infinite", "--glow": C.a3 + "55",
              }}>
                <span style={{ fontSize:24 }}>🎁</span>
                <div>
                  <div style={{ fontSize:13, color:C.a3, fontWeight:900, lineHeight:1 }}>{totalClaimable} Reward{totalClaimable !== 1 ? "s" : ""} Ready</div>
                  <div style={{ fontSize:11, color:C.muted, fontWeight:600 }}>Tap challenges to claim</div>
                </div>
              </div>
            )}
          </div>

          {!loading && loggedIn && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:12, marginBottom:20 }}>
              <div style={{ background:C.card2, border:`1px solid ${C.a3}44`, borderRadius:14, padding:"14px 18px", display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ fontSize:30 }}>📅</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase" }}>Daily</div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                    <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:22, color:C.text }}>{dailyCompleted}/{d.length}</div>
                    <div style={{ fontSize:11, color:C.a3, fontWeight:700 }}>⏱ Resets in {dailyTime}</div>
                  </div>
                </div>
              </div>
              <div style={{ background:C.card2, border:`1px solid ${C.a5}44`, borderRadius:14, padding:"14px 18px", display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ fontSize:30 }}>📆</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase" }}>Weekly</div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                    <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:22, color:C.text }}>{weeklyCompleted}/{w.length}</div>
                    <div style={{ fontSize:11, color:C.a5, fontWeight:700 }}>⏱ {weeklyTime}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && loggedIn && (
            <div style={{ display:"flex", gap:2, borderBottom:`1px solid ${C.border}`, overflowX:"auto" }}>
              {[
                { id:"active",    label:"Active",    count: d.filter(c=>!c.claimed).length + w.filter(c=>!c.claimed).length },
                { id:"completed", label:"Completed", count: dailyCompleted + weeklyCompleted },
                { id:"all",       label:"All",       count: d.length + w.length },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  padding:"10px 16px", border:"none", background:"transparent",
                  color: tab===t.id ? C.text : C.muted,
                  borderRadius:"10px 10px 0 0",
                  borderBottom: tab===t.id ? `2px solid ${C.a4}` : "2px solid transparent",
                  fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, cursor:"pointer",
                  display:"inline-flex", alignItems:"center", gap:6,
                }}>
                  {t.label}
                  <span style={{ background: tab===t.id ? C.a4+"33" : C.border2, color: tab===t.id ? C.a4 : C.muted, fontSize:11, padding:"1px 7px", borderRadius:10, fontWeight:800 }}>{t.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"24px 24px 0" }}>

        {loading && (
          <div style={{ textAlign:"center", padding:"80px 0", color:C.muted }}>
            <div style={{ fontSize:48, marginBottom:16, animation:"pulse 1.4s ease-in-out infinite" }}>🎯</div>
            <p style={{ fontSize:14, fontWeight:600 }}>Loading challenges…</p>
          </div>
        )}

        {!loading && !loggedIn && (
          <div style={{ textAlign:"center", padding:"80px 24px", color:C.muted }}>
            <div style={{ fontSize:64, marginBottom:16 }}>🔒</div>
            <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:26, color:C.text, marginBottom:8 }}>Sign in to track progress</h3>
            <p style={{ fontSize:13, fontWeight:600 }}>Log in or create an account to earn XP, coins, and streak rewards from daily challenges.</p>
          </div>
        )}

        {!loading && loggedIn && (
          <>
            {loginStreak && (
              <div style={{ marginBottom:28 }}>
                <LoginStreak data={loginStreak} />
              </div>
            )}

            {filterDaily.length > 0 && (
              <div style={{ marginBottom:32 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:8 }}>
                  <h2 style={{ fontFamily:"'Boogaloo',cursive", fontSize:24, display:"flex", alignItems:"center", gap:8 }}>
                    📅 Daily Challenges
                    <span style={{ fontSize:13, color:C.muted, fontWeight:600 }}>{dailyCompleted}/{d.length} done</span>
                  </h2>
                  <div style={{ display:"flex", alignItems:"center", gap:6, background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:"4px 12px" }}>
                    <span style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>Resets in</span>
                    <span style={{ fontSize:13, color:C.a3, fontWeight:900, animation:"tickerPulse 1.5s ease-in-out infinite" }}>{dailyTime}</span>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:14 }}>
                  {filterDaily.map(c => <ChallengeCard key={c.id} challenge={c} accent={C.a3} onClaim={handleClaim} />)}
                </div>
              </div>
            )}

            {filterWeekly.length > 0 && (
              <div style={{ marginBottom:32 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:8 }}>
                  <h2 style={{ fontFamily:"'Boogaloo',cursive", fontSize:24, display:"flex", alignItems:"center", gap:8 }}>
                    📆 Weekly Challenges
                    <span style={{ fontSize:13, color:C.muted, fontWeight:600 }}>{weeklyCompleted}/{w.length} done</span>
                  </h2>
                  <div style={{ display:"flex", alignItems:"center", gap:6, background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:"4px 12px" }}>
                    <span style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>Resets</span>
                    <span style={{ fontSize:13, color:C.a5, fontWeight:900 }}>{weeklyTime}</span>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:14 }}>
                  {filterWeekly.map(c => <ChallengeCard key={c.id} challenge={c} accent={C.a5} onClaim={handleClaim} />)}
                </div>
              </div>
            )}

            {filterDaily.length === 0 && filterWeekly.length === 0 && (
              <div style={{ textAlign:"center", padding:"60px 0", color:C.muted }}>
                <div style={{ fontSize:64, marginBottom:14, opacity:0.5 }}>{tab === "completed" ? "🏅" : "🎯"}</div>
                <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:24, color:C.text, marginBottom:6 }}>
                  {tab === "completed" ? "No completed challenges yet" : d.length + w.length === 0 ? "No challenges available" : "All caught up!"}
                </h3>
                <p style={{ fontSize:13, color:C.muted, fontWeight:600 }}>
                  {tab === "completed" ? "Complete some challenges to see them here." : d.length + w.length === 0 ? "Check back soon — new challenges are coming!" : "Check back later for more."}
                </p>
              </div>
            )}

            {(d.length > 0 || w.length > 0) && (
              <div style={{ background:`linear-gradient(135deg, ${C.a4}11, ${C.a5}08)`, border:`1px solid ${C.a4}33`, borderRadius:16, padding:"16px 20px", marginTop:16, display:"flex", alignItems:"center", gap:14 }}>
                <span style={{ fontSize:28 }}>💡</span>
                <div>
                  <div style={{ fontWeight:800, fontSize:13, color:C.text }}>Pro Tip</div>
                  <div style={{ fontSize:12, color:C.muted, fontWeight:500, marginTop:2 }}>Completing all daily challenges gives you bonus battle pass XP. Hit your weekly goals for exclusive cosmetics!</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ClaimPopup data={popup} onClose={() => setPopup(null)} />
    </div>
  );
}

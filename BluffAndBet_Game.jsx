import { useState, useEffect, useRef } from "react";

// ─── THEME ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#0f0e17",
  card: "#1a1828",
  cardBorder: "#2e2b4a",
  accent1: "#ff6b6b",
  accent2: "#ffd93d",
  accent3: "#6bcb77",
  accent4: "#4d96ff",
  accent5: "#c77dff",
  text: "#fffffe",
  muted: "#a7a9be",
};

const PLAYER_COLORS = [C.accent4, C.accent1, C.accent3, C.accent5, C.accent2, "#ff9f43", "#00d2d3", "#54a0ff"];

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_PLAYERS = [
  { id: "p1", name: "You", color: PLAYER_COLORS[0], isMe: true },
  { id: "p2", name: "Alex", color: PLAYER_COLORS[1], isMe: false },
  { id: "p3", name: "Jordan", color: PLAYER_COLORS[2], isMe: false },
  { id: "p4", name: "Sam", color: PLAYER_COLORS[3], isMe: false },
];

const MOCK_QUESTIONS = [
  { q: "What is the capital of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Brisbane"], correct: 2 },
  { q: "How many bones are in the adult human body?", options: ["196", "206", "216", "226"], correct: 1 },
  { q: "Which planet has the most moons?", options: ["Jupiter", "Saturn", "Uranus", "Neptune"], correct: 1 },
  { q: "In what year did the Titanic sink?", options: ["1910", "1911", "1912", "1913"], correct: 2 },
  { q: "What element has the chemical symbol 'Au'?", options: ["Silver", "Copper", "Gold", "Platinum"], correct: 2 },
];

const TOTAL_ROUNDS = 5;
const TIMER_SECS = 20;
const START_POINTS = 500;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function initPlayers() {
  return MOCK_PLAYERS.map(p => ({
    ...p,
    points: START_POINTS,
    streak: 0,
    allInUsed: false,
    allInAmount: null,
    bet: null,       // { type: "self"|"other"|"none"|"allin", amount, targetId? }
    answer: null,
    doubleDown: false,
    correct: null,
  }));
}

function calcPayout(player, correctPlayerId, allPlayers) {
  const { bet, answer, doubleDown, correct, streak } = player;
  if (!bet) return 0;

  const streakMult = streak >= 3 ? 1.75 : 1;
  const ddMult = doubleDown ? 2 : 1;

  if (bet.type === "none") return correct ? 50 : 0;

  if (bet.type === "allin") {
    return correct ? player.allInAmount : -player.allInAmount;
  }

  if (bet.type === "self") {
    const mult = streakMult * ddMult;
    return correct ? Math.round(bet.amount * mult) : -bet.amount;
  }

  if (bet.type === "other") {
    const target = allPlayers.find(p => p.id === bet.targetId);
    return target?.correct ? bet.amount : -bet.amount;
  }

  return 0;
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Boogaloo&family=Nunito:wght@400;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes popIn    { from{opacity:0;transform:scale(0.75)} to{opacity:1;transform:scale(1)} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
  @keyframes shake    { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
  @keyframes timerBar { from{width:100%} to{width:0%} }
  @keyframes scoreUp  { 0%{opacity:0;transform:translateY(0)} 60%{opacity:1;transform:translateY(-28px)} 100%{opacity:0;transform:translateY(-48px)} }
  @keyframes reveal   { from{opacity:0;transform:scale(0.8) rotateY(90deg)} to{opacity:1;transform:scale(1) rotateY(0deg)} }
  @keyframes confetti { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(120px) rotate(720deg);opacity:0} }
  button { font-family:'Nunito',sans-serif; cursor:pointer; transition:transform 0.12s,box-shadow 0.12s; }
  button:not(:disabled):hover  { transform:scale(1.03) !important; }
  button:not(:disabled):active { transform:scale(0.96) !important; }
  input  { font-family:'Nunito',sans-serif; }
  ::-webkit-scrollbar { width:5px; }
  ::-webkit-scrollbar-thumb { background:#2e2b4a; border-radius:3px; }
`;

function Particle({ style }) {
  return <div style={{ position:"absolute", borderRadius:"50%", opacity:0.12, animation:"float 7s ease-in-out infinite", ...style }} />;
}

function Btn({ children, color, outline, onClick, disabled, style={} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width:"100%", padding:"13px 20px", borderRadius:14,
        border: outline ? `2px solid ${color}` : "none",
        background: disabled ? "#2a2840" : outline ? "transparent" : color,
        color: disabled ? C.muted : outline ? color : "#fff",
        fontSize:15, fontWeight:800, letterSpacing:0.4,
        boxShadow: disabled||outline ? "none" : `0 4px 18px ${color}55`,
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >{children}</button>
  );
}

function Card({ children, style={} }) {
  return (
    <div style={{
      background:C.card, border:`1px solid ${C.cardBorder}`,
      borderRadius:24, padding:28, width:"100%", maxWidth:560,
      boxShadow:"0 12px 60px #0009", position:"relative", zIndex:1, ...style,
    }}>{children}</div>
  );
}

function ScorePill({ player, showDelta, delta }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:8,
      background: player.color+"18", border:`1px solid ${player.color}44`,
      borderRadius:24, padding:"5px 12px", position:"relative",
    }}>
      <div style={{
        width:26, height:26, borderRadius:"50%", background:player.color,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:12, fontWeight:900, color:"#fff", fontFamily:"'Nunito',sans-serif",
      }}>{player.name[0]}</div>
      <span style={{ color:C.text, fontWeight:800, fontSize:13, fontFamily:"'Nunito',sans-serif" }}>
        {player.name}
      </span>
      <span style={{ color:C.accent2, fontWeight:900, fontSize:13, fontFamily:"'Boogaloo',cursive" }}>
        {player.points}
      </span>
      {player.streak >= 3 && (
        <span style={{ fontSize:12 }} title="On a streak!">🔥</span>
      )}
      {showDelta && delta !== 0 && (
        <div style={{
          position:"absolute", top:-8, right:0,
          color: delta > 0 ? C.accent3 : C.accent1,
          fontWeight:900, fontSize:14, fontFamily:"'Boogaloo',cursive",
          animation:"scoreUp 1.4s ease forwards",
          pointerEvents:"none", whiteSpace:"nowrap",
        }}>
          {delta > 0 ? `+${delta}` : delta}
        </div>
      )}
    </div>
  );
}

// ─── SCREENS ─────────────────────────────────────────────────────────────────

// PHASE 1: BLIND BET
function BlindBetScreen({ players, myPlayer, round, totalRounds, onConfirm }) {
  const [betType, setBetType] = useState(null);   // "self"|"other"|"none"|"allin"
  const [betAmt, setBetAmt]   = useState("");
  const [targetId, setTargetId] = useState(null);
  const others = players.filter(p => !p.isMe);

  const amtNum = parseInt(betAmt) || 0;
  const canConfirm = (
    (betType === "none") ||
    (betType === "allin" && !myPlayer.allInUsed) ||
    (betType === "self" && amtNum >= 5 && amtNum <= myPlayer.points) ||
    (betType === "other" && amtNum >= 5 && amtNum <= myPlayer.points && targetId)
  );

  const typeCards = [
    { id:"self",  icon:"🎯", label:"Bet on Yourself",   desc:"Wager on your own answer", color:C.accent4 },
    { id:"other", icon:"👥", label:"Bet on Someone",    desc:"Wager on another player",  color:C.accent5 },
    { id:"none",  icon:"💸", label:"No Bet",            desc:"+50 pts if you're correct", color:C.accent3 },
    { id:"allin", icon:"🎰", label:"All-In Token",      desc: myPlayer.allInUsed ? "Already used!" : "Double or lose it all", color:C.accent2, disabled: myPlayer.allInUsed },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20, animation:"fadeUp 0.4s ease" }}>
      {/* Header */}
      <div style={{ textAlign:"center" }}>
        <div style={{ color:C.muted, fontSize:12, fontWeight:800, letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>
          Round {round} of {totalRounds}
        </div>
        <h2 style={{ margin:0, fontFamily:"'Boogaloo',cursive", fontSize:30, color:C.text }}>
          🎲 Place Your Bet
        </h2>
        <div style={{ color:C.muted, fontSize:13, marginTop:4 }}>
          The question hasn't been revealed yet — bet blind!
        </div>
      </div>

      {/* Balance */}
      <div style={{
        background:"#13121f", borderRadius:14, padding:"12px 20px",
        display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        <span style={{ color:C.muted, fontWeight:700, fontSize:13 }}>Your Balance</span>
        <span style={{ fontFamily:"'Boogaloo',cursive", fontSize:26, color:C.accent2 }}>
          💰 {myPlayer.points} pts
        </span>
      </div>

      {/* Bet type cards */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {typeCards.map(t => (
          <button
            key={t.id}
            disabled={t.disabled}
            onClick={() => { setBetType(t.id); setBetAmt(""); setTargetId(null); }}
            style={{
              background: betType===t.id ? t.color+"22" : "#13121f",
              border: `2px solid ${betType===t.id ? t.color : C.cardBorder}`,
              borderRadius:16, padding:"14px 12px", textAlign:"left",
              opacity: t.disabled ? 0.4 : 1,
              cursor: t.disabled ? "not-allowed" : "pointer",
              transition:"all 0.15s",
            }}
          >
            <div style={{ fontSize:24, marginBottom:4 }}>{t.icon}</div>
            <div style={{ color:betType===t.id ? t.color : C.text, fontWeight:800, fontSize:13 }}>{t.label}</div>
            <div style={{ color:C.muted, fontSize:11, marginTop:2 }}>{t.desc}</div>
          </button>
        ))}
      </div>

      {/* Bet amount input */}
      {(betType === "self" || betType === "other") && (
        <div style={{ animation:"fadeUp 0.25s ease" }}>
          <label style={{ color:C.muted, fontSize:11, fontWeight:800, letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:6 }}>
            Bet Amount (min 5, max {myPlayer.points})
          </label>
          <div style={{ display:"flex", gap:8 }}>
            <input
              type="number"
              min={5}
              max={myPlayer.points}
              value={betAmt}
              onChange={e => setBetAmt(e.target.value)}
              placeholder="Enter amount..."
              style={{
                flex:1, padding:"11px 14px", borderRadius:12,
                border:`1.5px solid ${C.cardBorder}`, background:"#13121f",
                color:C.text, fontSize:15, fontWeight:700, outline:"none",
              }}
            />
            {[25,50,100].map(pct => (
              <button
                key={pct}
                onClick={() => setBetAmt(String(Math.floor(myPlayer.points * pct / 100)))}
                style={{
                  padding:"0 12px", borderRadius:10, border:`1.5px solid ${C.cardBorder}`,
                  background:"#13121f", color:C.muted, fontSize:12, fontWeight:800,
                }}
              >{pct}%</button>
            ))}
          </div>
          {amtNum > 0 && amtNum < 5 && (
            <div style={{ color:C.accent1, fontSize:12, marginTop:4, fontWeight:700 }}>⚠️ Minimum bet is 5 pts</div>
          )}
        </div>
      )}

      {/* Target player selector */}
      {betType === "other" && (
        <div style={{ animation:"fadeUp 0.25s ease" }}>
          <label style={{ color:C.muted, fontSize:11, fontWeight:800, letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:8 }}>
            Who are you betting on?
          </label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {others.map(p => (
              <button
                key={p.id}
                onClick={() => setTargetId(p.id)}
                style={{
                  padding:"8px 16px", borderRadius:20,
                  border:`2px solid ${targetId===p.id ? p.color : C.cardBorder}`,
                  background: targetId===p.id ? p.color+"22" : "#13121f",
                  color: targetId===p.id ? p.color : C.muted,
                  fontWeight:800, fontSize:13,
                }}
              >
                <span style={{ marginRight:6 }}>{p.name[0]}</span>{p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All-in confirmation */}
      {betType === "allin" && (
        <div style={{
          background:C.accent2+"18", border:`1px solid ${C.accent2}44`,
          borderRadius:14, padding:"14px 16px", animation:"fadeUp 0.25s ease",
        }}>
          <div style={{ color:C.accent2, fontWeight:900, fontSize:15 }}>🎰 Going All-In!</div>
          <div style={{ color:C.muted, fontSize:13, marginTop:4 }}>
            Win → <strong style={{color:C.accent3}}>double your {myPlayer.points} pts = {myPlayer.points*2} pts</strong><br/>
            Lose → <strong style={{color:C.accent1}}>lose all {myPlayer.points} pts → 0 pts</strong>
          </div>
        </div>
      )}

      <Btn
        color={C.accent1}
        disabled={!canConfirm}
        onClick={() => onConfirm({ type:betType, amount:betType==="allin"||betType==="none" ? myPlayer.points : amtNum, targetId })}
      >
        {canConfirm ? "Lock In Bet →" : "Select a bet to continue"}
      </Btn>
    </div>
  );
}

// PHASE 2: QUESTION + DOUBLE DOWN
function QuestionScreen({ question, players, myPlayer, myBet, timerSecs, onSubmit }) {
  const [selected, setSelected]       = useState(null);
  const [doubleDown, setDoubleDown]   = useState(false);
  const [timeLeft, setTimeLeft]       = useState(timerSecs);
  const [submitted, setSubmitted]     = useState(false);
  const timerRef = useRef(null);

  const ddBlocked = myBet.type === "self" && myPlayer.points < myBet.amount * 2;
  const canDD     = myBet.type === "self" && !ddBlocked;

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          if (!submitted) handleSubmit(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleSubmit = (ans) => {
    if (submitted) return;
    setSubmitted(true);
    clearInterval(timerRef.current);
    onSubmit({ answer: ans ?? selected, doubleDown });
  };

  const timerPct   = (timeLeft / timerSecs) * 100;
  const timerColor = timerPct > 50 ? C.accent3 : timerPct > 25 ? C.accent2 : C.accent1;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18, animation:"fadeUp 0.35s ease" }}>
      {/* Timer bar */}
      <div style={{ position:"relative" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
          <span style={{ color:C.muted, fontSize:12, fontWeight:800, letterSpacing:1, textTransform:"uppercase" }}>
            Answer the question
          </span>
          <span style={{
            fontFamily:"'Boogaloo',cursive", fontSize:22,
            color:timerColor, animation: timeLeft <= 5 ? "pulse 0.5s ease infinite" : "none",
          }}>⏱ {timeLeft}s</span>
        </div>
        <div style={{ height:6, background:"#13121f", borderRadius:3, overflow:"hidden" }}>
          <div style={{
            height:"100%", background:timerColor, borderRadius:3,
            width:`${timerPct}%`, transition:"width 1s linear",
          }} />
        </div>
      </div>

      {/* Question */}
      <div style={{
        background:"#13121f", borderRadius:18, padding:"20px 22px",
        border:`1px solid ${C.cardBorder}`,
      }}>
        <div style={{ color:C.muted, fontSize:11, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
          Question
        </div>
        <div style={{ color:C.text, fontWeight:800, fontSize:18, lineHeight:1.4, fontFamily:"'Nunito',sans-serif" }}>
          {question.q}
        </div>
      </div>

      {/* Answer options */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {question.options.map((opt, i) => {
          const letters = ["A","B","C","D"];
          const isSelected = selected === i;
          return (
            <button
              key={i}
              disabled={submitted}
              onClick={() => setSelected(i)}
              style={{
                background: isSelected ? C.accent4+"22" : "#13121f",
                border:`2px solid ${isSelected ? C.accent4 : C.cardBorder}`,
                borderRadius:14, padding:"13px 14px", textAlign:"left",
                color: isSelected ? C.accent4 : C.text,
                fontWeight:800, fontSize:14,
                transition:"all 0.15s",
              }}
            >
              <span style={{
                display:"inline-block", width:22, height:22, borderRadius:6,
                background: isSelected ? C.accent4 : C.cardBorder,
                color:"#fff", fontSize:12, fontWeight:900,
                textAlign:"center", lineHeight:"22px", marginRight:8,
              }}>{letters[i]}</span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Double Down */}
      {canDD && !submitted && (
        <button
          onClick={() => setDoubleDown(d => !d)}
          style={{
            background: doubleDown ? C.accent5+"22" : "#13121f",
            border:`2px solid ${doubleDown ? C.accent5 : C.cardBorder}`,
            borderRadius:14, padding:"12px 16px",
            display:"flex", justifyContent:"space-between", alignItems:"center",
            transition:"all 0.15s",
          }}
        >
          <div style={{ textAlign:"left" }}>
            <div style={{ color: doubleDown ? C.accent5 : C.text, fontWeight:800, fontSize:14 }}>
              ⬇️ Double Down
            </div>
            <div style={{ color:C.muted, fontSize:12 }}>
              {doubleDown
                ? `Active! Win/lose ${myBet.amount*2} pts instead of ${myBet.amount}`
                : `Double your ${myBet.amount}pt bet — win or lose x2`}
            </div>
          </div>
          <div style={{
            width:44, height:24, borderRadius:12,
            background: doubleDown ? C.accent5 : "#333",
            position:"relative", transition:"background 0.2s",
            border:`2px solid ${doubleDown ? C.accent5 : "#555"}`, flexShrink:0,
          }}>
            <div style={{
              position:"absolute", top:2, left: doubleDown ? 20 : 2,
              width:16, height:16, borderRadius:"50%", background:"#fff",
              transition:"left 0.2s", boxShadow:"0 1px 4px #0006",
            }} />
          </div>
        </button>
      )}

      {ddBlocked && myBet.type === "self" && (
        <div style={{
          background:C.accent1+"18", border:`1px solid ${C.accent1}33`,
          borderRadius:12, padding:"10px 14px", color:C.accent1,
          fontSize:13, fontWeight:700,
        }}>
          ⛔ Double Down blocked — you need {myBet.amount*2} pts but only have {myPlayer.points}
        </div>
      )}

      {/* Bet reminder */}
      <div style={{
        background:"#13121f", borderRadius:12, padding:"10px 16px",
        display:"flex", gap:16, flexWrap:"wrap",
      }}>
        <span style={{ color:C.muted, fontSize:12, fontWeight:700 }}>Your bet:</span>
        <span style={{ color:C.accent2, fontSize:12, fontWeight:800 }}>
          {myBet.type==="none" && "No bet — +50 if correct"}
          {myBet.type==="self" && `${myBet.amount} pts on yourself${doubleDown?" (2x)":""}`}
          {myBet.type==="other" && `${myBet.amount} pts on ${MOCK_PLAYERS.find(p=>p.id===myBet.targetId)?.name}`}
          {myBet.type==="allin" && "🎰 ALL IN!"}
        </span>
      </div>

      <Btn
        color={selected !== null ? C.accent3 : "#333"}
        disabled={selected === null || submitted}
        onClick={() => handleSubmit(selected)}
      >
        {submitted ? "✓ Answer Submitted!" : selected !== null ? "Submit Answer →" : "Select an answer"}
      </Btn>
    </div>
  );
}

// PHASE 3: ROUND REVEAL
function RevealScreen({ question, players, round, totalRounds, onNext }) {
  const [step, setStep] = useState(0); // 0=answer, 1=bets, 2=scores

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1200),
      setTimeout(() => setStep(2), 2400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const correctIdx = question.correct;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18, animation:"fadeUp 0.4s ease" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ color:C.muted, fontSize:12, fontWeight:800, letterSpacing:2, textTransform:"uppercase" }}>
          Round {round} of {totalRounds} — Reveal
        </div>
        <h2 style={{ margin:"6px 0 0", fontFamily:"'Boogaloo',cursive", fontSize:26, color:C.text }}>
          🎬 Results
        </h2>
      </div>

      {/* Question recap */}
      <div style={{ background:"#13121f", borderRadius:14, padding:"14px 18px", color:C.muted, fontSize:14, fontWeight:700 }}>
        {question.q}
      </div>

      {/* Answer options with correct highlighted */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {question.options.map((opt, i) => {
          const letters = ["A","B","C","D"];
          const isCorrect = i === correctIdx;
          const myAns = players.find(p=>p.isMe)?.answer === i;
          return (
            <div
              key={i}
              style={{
                background: isCorrect ? C.accent3+"22" : "#13121f",
                border:`2px solid ${isCorrect ? C.accent3 : myAns ? C.accent1 : C.cardBorder}`,
                borderRadius:12, padding:"11px 14px",
                animation: isCorrect && step >= 0 ? "popIn 0.4s ease" : "none",
                display:"flex", alignItems:"center", gap:10,
              }}
            >
              <span style={{
                display:"inline-flex", width:22, height:22, borderRadius:6,
                background: isCorrect ? C.accent3 : C.cardBorder,
                color:"#fff", fontSize:12, fontWeight:900,
                alignItems:"center", justifyContent:"center",
              }}>{isCorrect ? "✓" : letters[i]}</span>
              <span style={{ color: isCorrect ? C.accent3 : C.muted, fontWeight:800, fontSize:13 }}>{opt}</span>
            </div>
          );
        })}
      </div>

      {/* Player results */}
      {step >= 1 && (
        <div style={{ display:"flex", flexDirection:"column", gap:8, animation:"fadeUp 0.3s ease" }}>
          <div style={{ color:C.muted, fontSize:11, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase" }}>
            Player Results
          </div>
          {players.map(p => {
            const payout = calcPayout(p, null, players);
            const correct = p.answer === correctIdx;
            return (
              <div key={p.id} style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                background: correct ? C.accent3+"12" : C.accent1+"10",
                border:`1px solid ${correct ? C.accent3+"44" : C.accent1+"33"}`,
                borderRadius:12, padding:"10px 14px",
                animation:"fadeUp 0.3s ease",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{
                    width:30, height:30, borderRadius:"50%", background:p.color,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:13, fontWeight:900, color:"#fff",
                  }}>{p.name[0]}</div>
                  <div>
                    <div style={{ color:C.text, fontWeight:800, fontSize:14 }}>{p.name}</div>
                    <div style={{ color:C.muted, fontSize:11 }}>
                      {p.answer !== null
                        ? `Answered: ${question.options[p.answer]}`
                        : "No answer submitted"}
                      {p.bet?.type === "allin" ? " · 🎰 All-In" : ""}
                      {p.doubleDown ? " · ⬇️ 2x" : ""}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{
                    fontFamily:"'Boogaloo',cursive", fontSize:20,
                    color: payout > 0 ? C.accent3 : payout < 0 ? C.accent1 : C.muted,
                  }}>
                    {payout > 0 ? `+${payout}` : payout === 0 ? "±0" : payout}
                  </div>
                  <div style={{ color:C.muted, fontSize:11 }}>
                    {correct ? "✓ Correct" : "✗ Wrong"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scoreboard */}
      {step >= 2 && (
        <div style={{ animation:"fadeUp 0.3s ease" }}>
          <div style={{ color:C.muted, fontSize:11, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
            Standings
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {[...players].sort((a,b) => b.points - a.points).map((p, rank) => (
              <ScorePill key={p.id} player={p} showDelta={true} delta={calcPayout(p, null, players)} />
            ))}
          </div>
        </div>
      )}

      {step >= 2 && (
        <Btn color={C.accent1} onClick={onNext} style={{ marginTop:4 }}>
          {round >= totalRounds ? "🏆 See Final Results →" : `Next Round →`}
        </Btn>
      )}
    </div>
  );
}

// END SCREEN
function EndScreen({ players, onPlayAgain }) {
  const sorted = [...players].sort((a,b) => b.points - a.points);
  const winner = sorted[0];

  const awards = [
    { icon:"🥇", label:"Winner",       desc:`Most points`, player: sorted[0] },
    { icon:"🎯", label:"Sharpshooter", desc:"Best accuracy", player: sorted[Math.floor(Math.random()*players.length)] },
    { icon:"🔥", label:"On Fire",      desc:"Longest streak", player: players.reduce((a,b) => a.streak>b.streak?a:b) },
    { icon:"💰", label:"Shark",        desc:"Best betting ROI", player: sorted[0] },
    { icon:"💀", label:"Biggest Loser",desc:"Most pts lost", player: sorted[sorted.length-1] },
    { icon:"🌟", label:"MVP",          desc:"Best all-round", player: sorted[0] },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20, animation:"fadeUp 0.5s ease" }}>
      {/* Trophy */}
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:64, animation:"float 3s ease-in-out infinite" }}>🏆</div>
        <h2 style={{ fontFamily:"'Boogaloo',cursive", fontSize:36, color:C.accent2, margin:"8px 0 0" }}>
          Game Over!
        </h2>
        <div style={{ color:C.muted, fontSize:14, marginTop:4 }}>
          <span style={{ color:winner.color, fontWeight:900 }}>{winner.name}</span> wins with{" "}
          <span style={{ color:C.accent2, fontWeight:900 }}>{winner.points} points</span>!
        </div>
      </div>

      {/* Final leaderboard */}
      <div>
        <div style={{ color:C.muted, fontSize:11, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>
          Final Standings
        </div>
        {sorted.map((p, i) => (
          <div key={p.id} style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            background: i===0 ? C.accent2+"18" : "#13121f",
            border:`1px solid ${i===0 ? C.accent2+"66" : C.cardBorder}`,
            borderRadius:12, padding:"10px 16px", marginBottom:8,
            animation:`fadeUp ${0.1 + i*0.1}s ease`,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{
                fontFamily:"'Boogaloo',cursive", fontSize:22,
                color:["🥇","🥈","🥉"][i] ? C.accent2 : C.muted, width:28,
              }}>{["🥇","🥈","🥉"][i] || `#${i+1}`}</div>
              <div style={{
                width:32, height:32, borderRadius:"50%", background:p.color,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:14, fontWeight:900, color:"#fff",
              }}>{p.name[0]}</div>
              <div>
                <div style={{ color:C.text, fontWeight:800, fontSize:15 }}>{p.name}</div>
                <div style={{ color:C.muted, fontSize:11 }}>
                  {p.streak >= 3 ? `🔥 Best streak: ${p.streak}` : ""}
                </div>
              </div>
            </div>
            <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:26, color:C.accent2 }}>
              {p.points}
            </div>
          </div>
        ))}
      </div>

      {/* Awards */}
      <div>
        <div style={{ color:C.muted, fontSize:11, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>
          Awards
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {awards.map((a, i) => (
            <div key={i} style={{
              background:"#13121f", border:`1px solid ${C.cardBorder}`,
              borderRadius:14, padding:"12px 14px",
              animation:`popIn ${0.2 + i*0.08}s ease`,
            }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{a.icon}</div>
              <div style={{ color:C.text, fontWeight:800, fontSize:13 }}>{a.label}</div>
              <div style={{ color:a.player.color, fontWeight:900, fontSize:12 }}>{a.player.name}</div>
              <div style={{ color:C.muted, fontSize:11 }}>{a.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <Btn color={C.accent1} onClick={onPlayAgain}>🔄 Play Again</Btn>
        <Btn color={C.accent4} outline onClick={onPlayAgain}>🏠 Back to Lobby</Btn>
      </div>
    </div>
  );
}

// ─── MAIN GAME CONTROLLER ─────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase]     = useState("blindbet"); // blindbet|question|reveal|end
  const [round, setRound]     = useState(1);
  const [players, setPlayers] = useState(initPlayers);
  const [myBet, setMyBet]     = useState(null);

  const myPlayer  = players.find(p => p.isMe);
  const question  = MOCK_QUESTIONS[(round - 1) % MOCK_QUESTIONS.length];

  // Simulate other players' bets + answers
  function simulateOthers(myBetData) {
    return players.map(p => {
      if (p.isMe) return { ...p, bet: myBetData, allInAmount: p.points };
      const correct = Math.random() > 0.45;
      const answerIdx = correct ? question.correct : (question.correct + 1 + Math.floor(Math.random()*3)) % 4;
      const betAmt = Math.max(5, Math.floor(Math.random() * Math.min(p.points * 0.4, 150)));
      return {
        ...p,
        bet: { type: "self", amount: betAmt },
        answer: answerIdx,
        doubleDown: Math.random() > 0.75 && p.points >= betAmt*2,
        correct,
        allInAmount: p.points,
      };
    });
  }

  function handleBetConfirm(bet) {
    setMyBet(bet);
    setPhase("question");
  }

  function handleAnswerSubmit({ answer, doubleDown }) {
    const correct = answer === question.correct;
    const updated = simulateOthers(myBet).map(p => {
      if (!p.isMe) return p;
      return { ...p, answer, doubleDown, correct, allInAmount: myPlayer.points };
    });

    // Apply payouts
    const withPayouts = updated.map(p => {
      const payout = calcPayout(p, null, updated);
      const newPoints = Math.max(0, p.points + payout);
      const newStreak = p.correct ? p.streak + 1 : 0;
      return {
        ...p,
        points: newPoints,
        streak: newStreak,
        allInUsed: p.isMe && myBet.type === "allin" ? true : p.allInUsed,
      };
    });

    setPlayers(withPayouts);
    setPhase("reveal");
  }

  function handleNext() {
    if (round >= TOTAL_ROUNDS) {
      setPhase("end");
      return;
    }
    setRound(r => r + 1);
    setMyBet(null);
    setPlayers(prev => prev.map(p => ({ ...p, bet:null, answer:null, doubleDown:false, correct:null })));
    setPhase("blindbet");
  }

  function handlePlayAgain() {
    setPlayers(initPlayers());
    setRound(1);
    setMyBet(null);
    setPhase("blindbet");
  }

  const bg = {
    minHeight:"100vh", background:C.bg,
    display:"flex", flexDirection:"column",
    alignItems:"center", justifyContent:"center",
    padding:20, position:"relative", overflow:"hidden",
    fontFamily:"'Nunito',sans-serif",
  };

  const particles = [
    { width:110, height:110, background:C.accent1, top:"8%", left:"4%" },
    { width:70,  height:70,  background:C.accent4, top:"18%", right:"6%" },
    { width:55,  height:55,  background:C.accent2, bottom:"12%", left:"10%" },
    { width:90,  height:90,  background:C.accent5, bottom:"20%", right:"4%" },
    { width:38,  height:38,  background:C.accent3, top:"48%", left:"1%" },
  ];

  return (
    <div style={bg}>
      <style>{css}</style>
      {particles.map((p,i) => <Particle key={i} style={{...p, animationDelay:`${i*0.9}s`}} />)}

      {/* Top bar */}
      {phase !== "end" && (
        <div style={{
          position:"fixed", top:0, left:0, right:0,
          background:C.bg+"ee", backdropFilter:"blur(8px)",
          borderBottom:`1px solid ${C.cardBorder}`,
          padding:"10px 20px", display:"flex",
          justifyContent:"space-between", alignItems:"center",
          zIndex:10,
        }}>
          <span style={{ fontFamily:"'Boogaloo',cursive", fontSize:22, color:C.text }}>
            <span style={{color:C.accent1}}>Bluff</span> & <span style={{color:C.accent2}}>Bet</span>
          </span>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {players.map(p => (
              <div key={p.id} style={{
                display:"flex", alignItems:"center", gap:4,
                background:p.color+"18", border:`1px solid ${p.color}44`,
                borderRadius:20, padding:"3px 10px",
              }}>
                <span style={{ color:p.color, fontWeight:900, fontSize:12 }}>{p.name}</span>
                <span style={{ fontFamily:"'Boogaloo',cursive", color:C.accent2, fontSize:13 }}>{p.points}</span>
                {p.streak >= 3 && <span style={{fontSize:10}}>🔥</span>}
              </div>
            ))}
          </div>
          <span style={{ color:C.muted, fontSize:13, fontWeight:700 }}>
            Round {round}/{TOTAL_ROUNDS}
          </span>
        </div>
      )}

      <Card style={{ marginTop: phase !== "end" ? 70 : 0 }}>
        {phase === "blindbet" && (
          <BlindBetScreen
            players={players}
            myPlayer={myPlayer}
            round={round}
            totalRounds={TOTAL_ROUNDS}
            onConfirm={handleBetConfirm}
          />
        )}
        {phase === "question" && (
          <QuestionScreen
            question={question}
            players={players}
            myPlayer={myPlayer}
            myBet={myBet}
            timerSecs={TIMER_SECS}
            onSubmit={handleAnswerSubmit}
          />
        )}
        {phase === "reveal" && (
          <RevealScreen
            question={question}
            players={players}
            round={round}
            totalRounds={TOTAL_ROUNDS}
            onNext={handleNext}
          />
        )}
        {phase === "end" && (
          <EndScreen
            players={players}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </Card>
    </div>
  );
}

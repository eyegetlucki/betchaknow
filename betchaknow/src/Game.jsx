import { useState, useEffect, useRef, useCallback } from "react";
import { getSocket, connectSocket } from "./socket";

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

function initPlayers() {
  return MOCK_PLAYERS.map(p => ({
    ...p,
    points: START_POINTS,
    streak: 0,
    allInUsed: false,
    allInAmount: null,
    bet: null,
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
  if (bet.type === "allin") return correct ? player.allInAmount : -player.allInAmount;
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

function BlindBetScreen({ players, myPlayer, round, totalRounds, timerSecs, onConfirm }) {
  const [betType, setBetType]   = useState(null);
  const [betAmt, setBetAmt]     = useState("");
  const [targetId, setTargetId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(timerSecs);
  const betTypeRef  = useRef(null);
  const betAmtRef   = useRef("");
  const targetIdRef = useRef(null);
  betTypeRef.current  = betType;
  betAmtRef.current   = betAmt;
  targetIdRef.current = targetId;
  const others = players.filter(p => !p.isMe);

  const amtNum = parseInt(betAmt) || 0;
  const canConfirm = (
    (betType === "none") ||
    (betType === "allin" && !myPlayer.allInUsed) ||
    (betType === "self" && amtNum >= 5 && amtNum <= myPlayer.points) ||
    (betType === "other" && amtNum >= 5 && amtNum <= myPlayer.points && targetId)
  );

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id);
          const bt  = betTypeRef.current;
          const amt = parseInt(betAmtRef.current) || 0;
          const tid = targetIdRef.current;
          const ok  = (bt==="none") || (bt==="allin" && !myPlayer.allInUsed) ||
                      (bt==="self" && amt>=5 && amt<=myPlayer.points) ||
                      (bt==="other" && amt>=5 && amt<=myPlayer.points && tid);
          onConfirm(ok
            ? { type:bt, amount:bt==="allin"||bt==="none" ? myPlayer.points : amt, targetId:tid }
            : { type:"none", amount:0, targetId:null }
          );
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const timerColor = timeLeft > timerSecs * 0.5 ? C.accent3 : timeLeft > timerSecs * 0.25 ? C.accent2 : C.accent1;

  const typeCards = [
    { id:"self",  icon:"🎯", label:"Bet on Yourself",   desc:"Wager on your own answer", color:C.accent4 },
    { id:"other", icon:"👥", label:"Bet on Someone",    desc:"Wager on another player",  color:C.accent5 },
    { id:"none",  icon:"💸", label:"No Bet",            desc:"+50 pts if you're correct", color:C.accent3 },
    { id:"allin", icon:"🎰", label:"All-In Token",      desc: myPlayer.allInUsed ? "Already used this game" : "One use per game · 2× if right · free if wrong", color:C.accent2, disabled: myPlayer.allInUsed },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20, animation:"fadeUp 0.4s ease" }}>
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
          <span style={{ color:C.muted, fontSize:11, fontWeight:800, letterSpacing:1, textTransform:"uppercase" }}>
            Time to bet
          </span>
          <span style={{ fontFamily:"'Boogaloo',cursive", fontSize:22, color:timerColor, animation: timeLeft <= 4 ? "pulse 0.5s ease infinite" : "none" }}>
            ⏱ {timeLeft}s
          </span>
        </div>
        <div style={{ height:6, background:"#13121f", borderRadius:3, overflow:"hidden" }}>
          <div style={{ height:"100%", background:timerColor, borderRadius:3, width:`${(timeLeft/timerSecs)*100}%`, transition:"width 1s linear" }} />
        </div>
      </div>
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

      <div style={{
        background:"#13121f", borderRadius:14, padding:"12px 20px",
        display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        <span style={{ color:C.muted, fontWeight:700, fontSize:13 }}>Your Balance</span>
        <span style={{ fontFamily:"'Boogaloo',cursive", fontSize:26, color:C.accent2 }}>
          💰 {myPlayer.points} pts
        </span>
      </div>

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

      {betType === "allin" && (
        <div style={{
          background:C.accent2+"18", border:`1px solid ${C.accent2}44`,
          borderRadius:14, padding:"14px 16px", animation:"fadeUp 0.25s ease",
        }}>
          <div style={{ color:C.accent2, fontWeight:900, fontSize:15 }}>🎰 All-In Token!</div>
          <div style={{ color:C.muted, fontSize:13, marginTop:4 }}>
            Bet: <strong style={{color:C.accent2}}>{myPlayer.points} pts (your full balance)</strong><br/>
            Win → <strong style={{color:C.accent3}}>+{myPlayer.points} pts → {myPlayer.points*2} total</strong><br/>
            Lose → <strong style={{color:C.accent3}}>keep all {myPlayer.points} pts (no penalty!)</strong>
          </div>
          <div style={{ color:C.muted, fontSize:11, marginTop:8, fontStyle:"italic" }}>
            ⚠ One use per game
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

function QuestionScreen({ question, players, myPlayer, myBet: myBetProp, timerSecs, onSubmit }) {
  const myBet = myBetProp ?? { type: "none", amount: 0, targetId: null };
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

      {!submitted && myBet.type !== "self" && (
        <div style={{
          background:"#13121f", border:`2px solid ${C.cardBorder}`,
          borderRadius:14, padding:"12px 16px",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          opacity:0.45, cursor:"not-allowed",
        }}>
          <div>
            <div style={{ color:C.muted, fontWeight:800, fontSize:14 }}>⬇️ Double Down</div>
            <div style={{ color:C.muted, fontSize:12 }}>
              {myBet.type === "none" ? "No bet placed — not available" : "Only available on self-bets"}
            </div>
          </div>
          <div style={{
            width:44, height:24, borderRadius:12, background:"#333",
            position:"relative", border:"2px solid #555", flexShrink:0,
          }}>
            <div style={{ position:"absolute", top:2, left:2, width:16, height:16, borderRadius:"50%", background:"#fff" }} />
          </div>
        </div>
      )}

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

function RevealScreen({ question, players, round, totalRounds, onNext }) {
  const [step, setStep] = useState(0);

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

      <div style={{ background:"#13121f", borderRadius:14, padding:"14px 18px", color:C.muted, fontSize:14, fontWeight:700 }}>
        {question.q}
      </div>

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
                      {p.answer !== null ? `Answered: ${question.options[p.answer]}` : "No answer submitted"}
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

function EndScreen({ players, onPlayAgain, onExit }) {
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
        <Btn color={C.accent4} outline onClick={onExit}>🏠 Back to Lobby</Btn>
      </div>
    </div>
  );
}

const VOTE_CATS = [
  { id:"science",    icon:"🔬", label:"Science"     },
  { id:"history",    icon:"📜", label:"History"     },
  { id:"sports",     icon:"🏆", label:"Sports"      },
  { id:"popculture", icon:"🎬", label:"Pop Culture" },
  { id:"geography",  icon:"🌍", label:"Geography"   },
  { id:"music",      icon:"🎵", label:"Music"       },
];

function CategoryVoteScreen({ round, totalRounds, timerSecs, players, onDone, onVote }) {
  const [myVote,   setMyVote]   = useState(null);
  const [votes,    setVotes]    = useState({});
  const [timeLeft, setTimeLeft] = useState(timerSecs);
  const doneRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const mock = {};
      VOTE_CATS.forEach(c => { mock[c.id] = Math.floor(Math.random() * players.length); });
      setVotes(mock);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id);
          if (!doneRef.current) { doneRef.current = true; onDone(); }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleVote = (catId) => {
    if (myVote) return;
    setMyVote(catId);
    setVotes(v => ({ ...v, [catId]: (v[catId] || 0) + 1 }));
    onVote && onVote(catId);
  };

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
  const topCat = Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0];
  const timerColor = timeLeft > 5 ? C.accent4 : timeLeft > 2 ? C.accent2 : C.accent1;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, animation:"fadeUp 0.4s ease" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ color:C.muted, fontSize:12, fontWeight:800, letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>
          Between Rounds · {round}/{totalRounds}
        </div>
        <h2 style={{ margin:0, fontFamily:"'Boogaloo',cursive", fontSize:28, color:C.text }}>
          🗳️ Vote for Next Category
        </h2>
      </div>

      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
          <span style={{ color:C.muted, fontSize:11, fontWeight:800, letterSpacing:1, textTransform:"uppercase" }}>
            {myVote ? "Waiting for others…" : "Cast your vote!"}
          </span>
          <span style={{ fontFamily:"'Boogaloo',cursive", fontSize:20, color:timerColor, animation: timeLeft <= 3 ? "pulse 0.5s ease infinite" : "none" }}>
            ⏱ {timeLeft}s
          </span>
        </div>
        <div style={{ height:5, background:"#13121f", borderRadius:3, overflow:"hidden" }}>
          <div style={{ height:"100%", background:timerColor, borderRadius:3, width:`${(timeLeft/timerSecs)*100}%`, transition:"width 1s linear" }} />
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {VOTE_CATS.map(c => {
          const voteCount = votes[c.id] || 0;
          const pct = totalVotes ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isTop = c.id === topCat && totalVotes > 0;
          const isMyVote = myVote === c.id;
          return (
            <button
              key={c.id}
              disabled={!!myVote}
              onClick={() => handleVote(c.id)}
              style={{
                background: isMyVote ? C.accent4+"22" : isTop ? C.accent2+"11" : "#13121f",
                border:`2px solid ${isMyVote ? C.accent4 : isTop ? C.accent2+"88" : C.cardBorder}`,
                borderRadius:14, padding:"12px 14px", textAlign:"left",
                cursor: myVote ? "default" : "pointer",
                transition:"all 0.15s", position:"relative", overflow:"hidden",
              }}
            >
              {myVote && totalVotes > 0 && (
                <div style={{
                  position:"absolute", left:0, top:0, bottom:0,
                  width:`${pct}%`, background: isMyVote ? C.accent4+"22" : "#ffffff06",
                  transition:"width 0.6s ease", pointerEvents:"none",
                }} />
              )}
              <div style={{ position:"relative", zIndex:1 }}>
                <div style={{ fontSize:20, marginBottom:2 }}>{c.icon}</div>
                <div style={{ color: isMyVote ? C.accent4 : isTop && myVote ? C.accent2 : C.text, fontWeight:800, fontSize:13 }}>{c.label}</div>
                {myVote && (
                  <div style={{ color:C.muted, fontSize:11, marginTop:2 }}>
                    {voteCount} vote{voteCount !== 1 ? "s" : ""} · {pct}%
                    {isTop && " 🏆"}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <Btn
        color={C.accent3}
        onClick={() => { if (!doneRef.current) { doneRef.current = true; onDone(); } }}
      >
        {myVote
          ? `▶ Continue with ${VOTE_CATS.find(c => c.id === topCat)?.label ?? "next"} →`
          : "Skip vote →"}
      </Btn>
    </div>
  );
}

export default function GameFlow({ onExit }) {
  // ── state ──────────────────────────────────────────────────────────────────
  const [phase,         setPhase]         = useState("lobby");
  const [round,         setRound]         = useState(0);
  const [totalRounds,   setTotalRounds]   = useState(TOTAL_ROUNDS);
  const [players,       setPlayers]       = useState([]);
  const [question,      setQuestion]      = useState(null);
  const [timerSecs,     setTimerSecs]     = useState(TIMER_SECS);
  const [betTimerSecs,  setBetTimerSecs]  = useState(15);
  const [voteTimerSecs, setVoteTimerSecs] = useState(10);
  const [myBet,       setMyBet]       = useState(null);
  const [betLocked,   setBetLocked]   = useState(false);
  const [answered,    setAnswered]    = useState(false);
  const [voteOpts,    setVoteOpts]    = useState([]);
  const [roomCode,    setRoomCode]    = useState("");
  const [isHost,      setIsHost]      = useState(false);
  const [err,         setErr]         = useState(null);

  const myUsername = localStorage.getItem("bk_username") || "You";

  // Normalize server player shape → UI shape
  const mapPlayers = useCallback((serverPlayers) =>
    serverPlayers.map(p => ({
      ...p,
      name:  p.username || p.name || "?",
      isMe:  (p.username || p.name) === myUsername,
      allInAmount: p.allInAmount ?? p.points,
    })), [myUsername]);

  const myPlayer = players.find(p => p.isMe) ?? { points: START_POINTS, allInUsed: false, name: myUsername, isMe: true };

  // ── socket wiring ──────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = connectSocket();

    const on = (event, handler) => socket.on(event, handler);

    on("roomCreated", ({ code, state }) => {
      setRoomCode(code);
      setIsHost(true);
      setPlayers(mapPlayers(state.players));
    });

    on("roomJoined", ({ code, state }) => {
      setRoomCode(code);
      setIsHost(false);
      setPlayers(mapPlayers(state.players));
    });

    on("playerJoined", ({ state }) => setPlayers(mapPlayers(state.players)));
    on("playerLeft",   ({ state }) => setPlayers(mapPlayers(state.players)));

    on("roundStart", ({ round, total, betTimer, state }) => {
      setRound(round);
      setTotalRounds(total);
      setBetTimerSecs(betTimer || 15);
      setMyBet(null);
      setBetLocked(false);
      setAnswered(false);
      setPlayers(mapPlayers(state.players));
      setPhase("blindbet");
    });

    on("questionReveal", ({ question: q, timer, state }) => {
      setQuestion(q);
      setTimerSecs(timer || TIMER_SECS);
      setPlayers(mapPlayers(state.players));
      setMyBet(prev => prev ?? { type: "none", amount: 0, targetId: null });
      setPhase("question");
    });

    on("roundReveal", ({ question: q, results, state }) => {
      setQuestion(q);
      // Merge server-calculated payouts into player objects so calcPayout is accurate
      const merged = mapPlayers(state.players).map(p => {
        const r = (results || []).find(r => r.id === p.id || r.username === p.name);
        return r ? { ...p, bet: r.bet ?? p.bet, answer: r.answer ?? p.answer,
                      doubleDown: r.doubleDown ?? false, correct: r.correct ?? false,
                      payout: r.payout ?? 0 } : p;
      });
      setPlayers(merged);
      setPhase("reveal");
    });

    on("categoryVote", ({ options, timer }) => {
      const icons = { Sports:"🏆", Science:"🔬", History:"📜", "Pop Culture":"🎬", Geography:"🌍", Music:"🎵", Movies:"🎥", Technology:"💻", Food:"🍔", Art:"🎨" };
      setVoteOpts((options || []).map((label, i) => ({ id: String(i), icon: icons[label] || "❓", label })));
      setVoteTimerSecs(timer || 10);
      setPhase("categoryvote");
    });

    on("voteUpdate", ({ totalVotes, totalPlayers }) => {
      if (totalVotes >= totalPlayers) setPhase("blindbet");
    });

    on("gameEnd", ({ stats, state }) => {
      setPlayers(mapPlayers(state.players));
      setPhase("end");
    });

    on("error", (msg) => setErr(String(msg)));

    return () => {
      ["roomCreated","roomJoined","playerJoined","playerLeft",
       "roundStart","questionReveal","roundReveal","categoryVote","voteUpdate","gameEnd","error"]
        .forEach(e => socket.off(e));
    };
  }, [mapPlayers]);

  // ── actions ────────────────────────────────────────────────────────────────
  function handleBetConfirm(bet) {
    setMyBet(bet);
    setBetLocked(true);
    getSocket().emit("placeBet", bet);
  }

  function handleAnswerSubmit({ answer, doubleDown }) {
    setAnswered(true);
    getSocket().emit("submitAnswer", { answerIdx: answer, doubleDown });
  }

  function handleVoteDone(categoryIndex) {
    getSocket().emit("voteCategory", { categoryIndex: Number(categoryIndex) });
  }

  function handleNext() {
    // Server auto-advances; this is just UI — advance locally if reveal lingers
    if (round >= totalRounds) setPhase("end");
    else setPhase("categoryvote");
  }

  function handlePlayAgain() { onExit(); }

  const particles = [
    { width:110, height:110, background:C.accent1, top:"8%", left:"4%" },
    { width:70,  height:70,  background:C.accent4, top:"18%", right:"6%" },
    { width:55,  height:55,  background:C.accent2, bottom:"12%", left:"10%" },
    { width:90,  height:90,  background:C.accent5, bottom:"20%", right:"4%" },
    { width:38,  height:38,  background:C.accent3, top:"48%", left:"1%" },
  ];

  const inGame = phase !== "end" && phase !== "lobby";

  return (
    <div style={{ minHeight:"100vh", background:C.bg, position:"relative", overflow:"hidden", fontFamily:"'Nunito',sans-serif" }}>
      <style>{css}</style>
      {particles.map((p,i) => <Particle key={i} style={{...p, animationDelay:`${i*0.9}s`}} />)}

      {inGame && (
        <button
          onClick={onExit}
          style={{
            position:"fixed", top:12, right:14, zIndex:20,
            background:C.accent1+"22", border:`1px solid ${C.accent1}66`,
            borderRadius:10, padding:"6px 14px",
            color:C.accent1, fontSize:13, fontWeight:800,
            cursor:"pointer", fontFamily:"'Nunito',sans-serif",
          }}
        >✕ Leave</button>
      )}

      <div style={{ display:"flex", minHeight:"100vh" }}>
        {inGame && (
          <div style={{
            width:120, flexShrink:0,
            background:"#0e0c1a", borderRight:`1px solid ${C.cardBorder}`,
            display:"flex", flexDirection:"column", gap:8,
            padding:"12px 8px", overflowY:"auto",
          }}>
            <div style={{ color:C.muted, fontSize:9, fontWeight:800, letterSpacing:1, textTransform:"uppercase", textAlign:"center", marginBottom:2 }}>
              Standings
            </div>
            {[...players].sort((a,b) => b.points - a.points).map((p, rank) => (
              <div key={p.id} style={{
                display:"flex", flexDirection:"column", alignItems:"center",
                gap:3, padding:"8px 4px", borderRadius:12,
                background: p.isMe ? p.color+"22" : "#ffffff08",
                border:`1px solid ${p.isMe ? p.color+"55" : "#ffffff0a"}`,
              }}>
                <div style={{ fontSize:9, color:C.muted, fontWeight:800 }}>#{rank+1}</div>
                <div style={{
                  width:40, height:40, borderRadius:10,
                  background:p.color, display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:17, fontWeight:900, color:"#fff",
                  boxShadow:`0 0 10px ${p.color}44`,
                }}>{p.name[0]}</div>
                <div style={{ fontSize:10, fontWeight:800, color: p.isMe ? C.text : C.muted, textAlign:"center", lineHeight:1.2 }}>
                  {p.name}
                </div>
                <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:14, color:C.accent2 }}>
                  {p.points}
                </div>
                {p.streak >= 3 && <span style={{fontSize:9}}>🔥×{p.streak}</span>}
              </div>
            ))}
          </div>
        )}

        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <Card style={{ width:"100%", maxWidth:520 }}>
            {/* ── Lobby waiting room ─────────────────────────────────── */}
            {phase === "lobby" && (
              <div style={{ display:"flex", flexDirection:"column", gap:20, animation:"fadeUp 0.4s ease" }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:48, marginBottom:8 }}>🎯</div>
                  <h2 style={{ margin:0, fontFamily:"'Boogaloo',cursive", fontSize:30, color:C.text }}>
                    {roomCode ? `Room ${roomCode}` : "Waiting for room..."}
                  </h2>
                  <p style={{ color:C.muted, fontSize:13, marginTop:4 }}>
                    {isHost ? "Share the code — start when everyone is in" : "Waiting for the host to start…"}
                  </p>
                </div>

                {roomCode && (
                  <div style={{ background:"#13121f", borderRadius:14, padding:"14px 20px", textAlign:"center" }}>
                    <div style={{ color:C.muted, fontSize:11, fontWeight:800, letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>Room Code</div>
                    <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:40, color:C.accent2, letterSpacing:6 }}>{roomCode}</div>
                  </div>
                )}

                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  <div style={{ color:C.muted, fontSize:11, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase", marginBottom:4 }}>
                    Players ({players.length})
                  </div>
                  {players.map(p => (
                    <div key={p.id} style={{
                      display:"flex", alignItems:"center", gap:12,
                      background: p.isMe ? p.color+"18" : "#13121f",
                      border:`1px solid ${p.isMe ? p.color+"55" : C.cardBorder}`,
                      borderRadius:12, padding:"10px 14px",
                    }}>
                      <div style={{ width:32, height:32, borderRadius:"50%", background:p.color, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:"#fff", fontSize:14 }}>
                        {p.name[0]}
                      </div>
                      <span style={{ fontWeight:800, color:C.text, fontSize:14 }}>{p.name}</span>
                      {p.isHost && <span style={{ marginLeft:"auto", fontSize:11, color:C.accent2, fontWeight:800 }}>HOST</span>}
                      {p.isMe  && <span style={{ marginLeft: p.isHost ? 4 : "auto", fontSize:11, color:C.accent4, fontWeight:800 }}>YOU</span>}
                    </div>
                  ))}
                  {players.length === 0 && (
                    <div style={{ color:C.muted, fontSize:13, textAlign:"center", padding:16 }}>
                      Connecting…
                    </div>
                  )}
                </div>

                {err && <div style={{ color:C.accent1, fontSize:13, fontWeight:700, textAlign:"center" }}>⚠️ {err}</div>}

                {isHost && (
                  <Btn
                    color={C.accent3}
                    disabled={players.length < 2}
                    onClick={() => getSocket().emit("startGame")}
                  >
                    {players.length < 2 ? "Need at least 2 players" : "▶ Start Game"}
                  </Btn>
                )}

                <Btn color={C.accent1} outline onClick={onExit}>← Leave Lobby</Btn>
              </div>
            )}

            {/* ── Game phases ────────────────────────────────────────── */}
            {phase === "blindbet" && (
              <BlindBetScreen
                players={players}
                myPlayer={myPlayer}
                round={round}
                totalRounds={totalRounds}
                timerSecs={betTimerSecs}
                onConfirm={handleBetConfirm}
              />
            )}
            {phase === "question" && (
              <QuestionScreen
                question={question}
                players={players}
                myPlayer={myPlayer}
                myBet={myBet}
                timerSecs={timerSecs}
                onSubmit={handleAnswerSubmit}
              />
            )}
            {phase === "reveal" && (
              <RevealScreen
                question={question}
                players={players}
                round={round}
                totalRounds={totalRounds}
                onNext={handleNext}
              />
            )}
            {phase === "categoryvote" && (
              <CategoryVoteScreen
                round={round}
                totalRounds={totalRounds}
                timerSecs={voteTimerSecs}
                players={players}
                onDone={handleVoteDone}
                onVote={handleVoteDone}
              />
            )}
            {phase === "end" && (
              <EndScreen
                players={players}
                onPlayAgain={handlePlayAgain}
                onExit={onExit}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

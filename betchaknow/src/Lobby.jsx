import { useState, useEffect } from "react";
import { connectSocket, getSocket } from "./socket";

const COLORS = {
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

const CATEGORIES = [
  { id: "sports", label: "🏆 Sports" },
  { id: "science", label: "🔬 Science" },
  { id: "popculture", label: "🎬 Pop Culture" },
  { id: "history", label: "📜 History" },
  { id: "movies", label: "🎥 Movies" },
  { id: "music", label: "🎵 Music" },
  { id: "geography", label: "🌍 Geography" },
];

const TOGGLES = [
  { id: "bluffing", label: "🃏 Bluffing", desc: "Submit fake answers to trick others" },
  { id: "anonymousBets", label: "🕵️ Anonymous Bets", desc: "Bets on others hidden until reveal" },
  { id: "streakMultiplier", label: "🔥 Streak Multiplier", desc: "3-in-a-row = 1.75x self-bet payout" },
  { id: "doubleDown", label: "⬇️ Double Down", desc: "Double your bet after seeing the question" },
  { id: "allInToken", label: "🎰 All-In Token", desc: "One-time nuclear bet per player" },
  { id: "betOnOthers", label: "👥 Bet on Others", desc: "Wager points on other players" },
  { id: "noBetBonus", label: "💸 No-Bet Bonus", desc: "+50 flat points for correct with no bet" },
];

const MOCK_PLAYERS = [
  { id: 1, name: "You", color: COLORS.accent4, isHost: true },
];

function FloatingParticle({ style }) {
  return (
    <div style={{
      position: "absolute",
      borderRadius: "50%",
      opacity: 0.15,
      animation: "float 6s ease-in-out infinite",
      ...style,
    }} />
  );
}

function Badge({ children, color }) {
  return (
    <span style={{
      background: color + "22",
      color: color,
      border: `1px solid ${color}44`,
      borderRadius: 20,
      padding: "2px 10px",
      fontSize: 12,
      fontFamily: "'Nunito', sans-serif",
      fontWeight: 700,
    }}>{children}</span>
  );
}

function Toggle({ enabled, onChange }) {
  return (
    <div onClick={onChange} style={{
      width: 44,
      height: 24,
      borderRadius: 12,
      background: enabled ? COLORS.accent3 : "#333",
      position: "relative",
      cursor: "pointer",
      transition: "background 0.2s",
      flexShrink: 0,
      border: `2px solid ${enabled ? COLORS.accent3 : "#555"}`,
    }}>
      <div style={{
        position: "absolute",
        top: 2,
        left: enabled ? 20 : 2,
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "#fff",
        transition: "left 0.2s",
        boxShadow: "0 1px 4px #0006",
      }} />
    </div>
  );
}

function PlayerChip({ player }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: player.color + "18",
      border: `1px solid ${player.color}44`,
      borderRadius: 24,
      padding: "6px 14px",
      animation: "popIn 0.3s cubic-bezier(.17,.67,.35,1.4)",
    }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: player.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 900,
        color: "#fff",
        fontFamily: "'Nunito', sans-serif",
      }}>{player.name[0]}</div>
      <span style={{ color: COLORS.text, fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 14 }}>
        {player.name}
      </span>
      {player.isHost && <Badge color={COLORS.accent2}>HOST</Badge>}
    </div>
  );
}

export default function LobbyFlow({ onStartGame, onLogin, loggedIn }) {
  const [screen, setScreen] = useState("home"); // home | create | join | lobby
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [rounds, setRounds] = useState(10);
  const [timer, setTimer] = useState(30);
  const [categories, setCategories] = useState(Object.fromEntries(CATEGORIES.map(c => [c.id, true])));
  const [toggles, setToggles] = useState(Object.fromEntries(TOGGLES.map(t => [t.id, true])));
  const [players, setPlayers] = useState(MOCK_PLAYERS);
  const [customQ, setCustomQ] = useState("");
  const [customQList, setCustomQList] = useState([]);
  const [tab, setTab] = useState("settings");
  const [copied, setCopied] = useState(false);
  const storedUsername = localStorage.getItem("bk_username") || "";
  const [nameInput, setNameInput] = useState(loggedIn && storedUsername ? storedUsername : "");
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(interval);
  }, []);

  // Simulate players joining
  useEffect(() => {
    if (screen !== "lobby") return;
    const names = ["Alex", "Jordan", "Sam", "Riley", "Morgan"];
    const colors = [COLORS.accent1, COLORS.accent2, COLORS.accent3, COLORS.accent5, COLORS.accent4];
    let i = 0;
    const interval = setInterval(() => {
      if (i >= 3) { clearInterval(interval); return; }
      setPlayers(p => [...p, { id: Date.now(), name: names[i], color: colors[i + 1], isHost: false }]);
      i++;
    }, 1800);
    return () => clearInterval(interval);
  }, [screen]);

  const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const effectiveName = (loggedIn && storedUsername) ? storedUsername : nameInput.trim();

  const handleCreate = () => {
    if (!effectiveName) return;
    setPlayerName(effectiveName);
    if (!loggedIn) localStorage.setItem("bk_username", effectiveName);
    const socket = connectSocket();
    socket.once("roomCreated", ({ code }) => {
      setRoomCode(code);
      setScreen("lobby");
    });
    socket.once("error", (msg) => alert("Error: " + msg));
    socket.emit("createRoom", { isPrivate: true, settings: { rounds, timerSecs: timer } });
  };

  const handleJoin = () => {
    if (!effectiveName || !joinCode.trim()) return;
    setPlayerName(effectiveName);
    if (!loggedIn) localStorage.setItem("bk_username", effectiveName);
    const code = joinCode.toUpperCase();
    const socket = connectSocket();
    socket.once("roomJoined", () => {
      setRoomCode(code);
      setScreen("lobby");
    });
    socket.once("error", (msg) => alert("Error: " + msg));
    socket.emit("joinRoom", { code });
  };

  const handleQuickMatch = () => {
    if (!effectiveName) return;
    setPlayerName(effectiveName);
    if (!loggedIn) localStorage.setItem("bk_username", effectiveName);
    const socket = connectSocket();
    const handleRoom = ({ code }) => {
      setRoomCode(code);
      setScreen("lobby");
    };
    socket.once("roomCreated", handleRoom);
    socket.once("roomJoined",  handleRoom);
    socket.once("error", (msg) => alert("Error: " + msg));
    socket.emit("quickMatch");
  };

  const copyCode = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addCustomQ = () => {
    if (!customQ.trim()) return;
    setCustomQList(q => [...q, customQ.trim()]);
    setCustomQ("");
  };

  const particles = [
    { width: 120, height: 120, background: COLORS.accent1, top: "10%", left: "5%" },
    { width: 80, height: 80, background: COLORS.accent4, top: "20%", right: "8%" },
    { width: 60, height: 60, background: COLORS.accent2, bottom: "15%", left: "12%" },
    { width: 100, height: 100, background: COLORS.accent5, bottom: "25%", right: "5%" },
    { width: 40, height: 40, background: COLORS.accent3, top: "50%", left: "2%" },
  ];

  const styles = {
    root: {
      minHeight: "100vh",
      background: COLORS.bg,
      fontFamily: "'Nunito', sans-serif",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    card: {
      background: COLORS.card,
      border: `1px solid ${COLORS.cardBorder}`,
      borderRadius: 24,
      padding: 32,
      width: "100%",
      maxWidth: 520,
      position: "relative",
      zIndex: 1,
      boxShadow: "0 8px 48px #0008",
    },
    title: {
      fontFamily: "'Boogaloo', cursive",
      fontSize: 64,
      color: COLORS.text,
      textAlign: "center",
      margin: 0,
      lineHeight: 1,
      letterSpacing: -1,
    },
    subtitle: {
      color: COLORS.muted,
      textAlign: "center",
      fontSize: 16,
      marginTop: 8,
      marginBottom: 32,
      fontWeight: 600,
    },
    btn: (color, outline) => ({
      width: "100%",
      padding: "14px 24px",
      borderRadius: 14,
      border: outline ? `2px solid ${color}` : "none",
      background: outline ? "transparent" : color,
      color: outline ? color : "#fff",
      fontSize: 16,
      fontWeight: 800,
      fontFamily: "'Nunito', sans-serif",
      cursor: "pointer",
      transition: "transform 0.1s, box-shadow 0.1s",
      boxShadow: outline ? "none" : `0 4px 20px ${color}55`,
      letterSpacing: 0.5,
    }),
    input: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: 12,
      border: `1.5px solid ${COLORS.cardBorder}`,
      background: "#13121f",
      color: COLORS.text,
      fontSize: 15,
      fontFamily: "'Nunito', sans-serif",
      fontWeight: 700,
      outline: "none",
      boxSizing: "border-box",
    },
    label: {
      color: COLORS.muted,
      fontSize: 12,
      fontWeight: 800,
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 6,
      display: "block",
    },
    sectionTitle: {
      color: COLORS.text,
      fontFamily: "'Boogaloo', cursive",
      fontSize: 22,
      marginBottom: 16,
      marginTop: 0,
    },
    divider: {
      border: "none",
      borderTop: `1px solid ${COLORS.cardBorder}`,
      margin: "24px 0",
    },
    backBtn: {
      background: "none",
      border: "none",
      color: COLORS.muted,
      cursor: "pointer",
      fontSize: 14,
      fontFamily: "'Nunito', sans-serif",
      fontWeight: 700,
      padding: "0 0 16px 0",
      display: "flex",
      alignItems: "center",
      gap: 6,
    },
  };

  // HOME SCREEN
  if (screen === "home") return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Boogaloo&family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-20px) rotate(5deg)} }
        @keyframes popIn { from{transform:scale(0.7);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        button:hover { transform: scale(1.02) !important; }
        button:active { transform: scale(0.97) !important; }
        input:focus { border-color: ${COLORS.accent4} !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #1a1828; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      `}</style>
      {particles.map((p, i) => <FloatingParticle key={i} style={{ ...p, animationDelay: `${i * 0.8}s` }} />)}

      <div style={styles.card}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 48 }}>🎯</span>
        </div>
        <h1 style={styles.title}>
          <span style={{ color: COLORS.accent1 }}>Betcha</span>
          <span style={{ color: COLORS.accent2 }}> Know!</span>
        </h1>
        <p style={styles.subtitle}>Trivia · Wagering · Bluffing · Chaos</p>

        {loggedIn && storedUsername ? (
          <div style={{ animation: "popIn 0.3s ease" }}>
            <div style={{
              textAlign: "center", marginBottom: 20,
              padding: "10px 16px", borderRadius: 12,
              background: "#ffffff0a", border: `1px solid ${COLORS.cardBorder}`,
            }}>
              <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 700 }}>Playing as </span>
              <span style={{ fontSize: 14, color: COLORS.text, fontWeight: 900 }}>{storedUsername}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button style={styles.btn(COLORS.accent1)} onClick={() => setScreen("create")}>
                🏠 Create Private Lobby
              </button>
              <button style={styles.btn(COLORS.accent4)} onClick={() => setScreen("join")}>
                🚪 Join with Code
              </button>
              <button style={styles.btn(COLORS.accent3)} onClick={handleQuickMatch}>
                ⚡ Quick Match
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Your Name</label>
              <input
                style={styles.input}
                placeholder="Enter your name..."
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && nameInput && setScreen("options")}
                maxLength={20}
              />
            </div>
            {nameInput.trim() ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "popIn 0.3s ease" }}>
                <button style={styles.btn(COLORS.accent1)} onClick={() => setScreen("create")}>
                  🏠 Create Private Lobby
                </button>
                <button style={styles.btn(COLORS.accent4)} onClick={() => setScreen("join")}>
                  🚪 Join with Code
                </button>
                <button style={styles.btn(COLORS.accent3)} onClick={handleQuickMatch}>
                  ⚡ Quick Match
                </button>
              </div>
            ) : (
              <div style={{ textAlign: "center", color: COLORS.muted, fontSize: 14, fontWeight: 600, marginTop: 8 }}>
                Enter your name to get started
              </div>
            )}
          </>
        )}

        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
          {["2-10 Players", "Betcha Know!", "All Categories"].map((t, i) => (
            <Badge key={i} color={[COLORS.accent2, COLORS.accent1, COLORS.accent4][i]}>{t}</Badge>
          ))}
        </div>

        {!loggedIn && (
          <>
            <hr style={{ border: "none", borderTop: `1px solid ${COLORS.cardBorder}`, margin: "20px 0 16px" }} />
            <button
              style={{ ...styles.btn(COLORS.accent5, true), display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              onClick={onLogin}
            >
              👤 Login / Create Account
            </button>
          </>
        )}
      </div>
    </div>
  );

  // JOIN SCREEN
  if (screen === "join") return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Boogaloo&family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes popIn { from{transform:scale(0.7);opacity:0} to{transform:scale(1);opacity:1} }
        button:hover { transform: scale(1.02) !important; }
        button:active { transform: scale(0.97) !important; }
        input:focus { border-color: ${COLORS.accent4} !important; }
      `}</style>
      {particles.map((p, i) => <FloatingParticle key={i} style={{ ...p, animationDelay: `${i * 0.8}s` }} />)}
      <div style={styles.card}>
        <button style={styles.backBtn} onClick={() => setScreen("home")}>← Back</button>
        <h2 style={{ ...styles.sectionTitle, fontSize: 32, fontFamily: "'Boogaloo', cursive" }}>
          🚪 Join a Lobby
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={styles.label}>Room Code</label>
            <input
              style={{ ...styles.input, textTransform: "uppercase", letterSpacing: 4, fontSize: 20, textAlign: "center" }}
              placeholder="XXXXXX"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
          </div>
          <button
            style={styles.btn(joinCode.length === 6 ? COLORS.accent4 : "#333")}
            onClick={handleJoin}
            disabled={joinCode.length < 4}
          >
            Join Game →
          </button>
        </div>
      </div>
    </div>
  );

  // CREATE SCREEN
  if (screen === "create") return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Boogaloo&family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes popIn { from{transform:scale(0.7);opacity:0} to{transform:scale(1);opacity:1} }
        button:hover { transform: scale(1.02) !important; }
        button:active { transform: scale(0.97) !important; }
        input:focus { border-color: ${COLORS.accent4} !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #1a1828; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      `}</style>
      {particles.map((p, i) => <FloatingParticle key={i} style={{ ...p, animationDelay: `${i * 0.8}s` }} />)}
      <div style={{ ...styles.card, maxWidth: 560 }}>
        <button style={styles.backBtn} onClick={() => setScreen("home")}>← Back</button>
        <h2 style={{ ...styles.sectionTitle, fontSize: 28, fontFamily: "'Boogaloo', cursive", marginBottom: 24 }}>
          🏠 Create Private Lobby
        </h2>

        <h3 style={styles.sectionTitle}>⚙️ Game Settings</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={styles.label}>Rounds</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => setRounds(r => Math.max(3, r - 1))} style={{ ...styles.btn(COLORS.cardBorder, true), width: 36, padding: "6px", fontSize: 18 }}>−</button>
              <span style={{ color: COLORS.text, fontWeight: 900, fontSize: 22, minWidth: 32, textAlign: "center" }}>{rounds}</span>
              <button onClick={() => setRounds(r => Math.min(20, r + 1))} style={{ ...styles.btn(COLORS.cardBorder, true), width: 36, padding: "6px", fontSize: 18 }}>+</button>
            </div>
          </div>
          <div>
            <label style={styles.label}>Timer (seconds)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => setTimer(t => Math.max(10, t - 5))} style={{ ...styles.btn(COLORS.cardBorder, true), width: 36, padding: "6px", fontSize: 18 }}>−</button>
              <span style={{ color: COLORS.text, fontWeight: 900, fontSize: 22, minWidth: 32, textAlign: "center" }}>{timer}s</span>
              <button onClick={() => setTimer(t => Math.min(60, t + 5))} style={{ ...styles.btn(COLORS.cardBorder, true), width: 36, padding: "6px", fontSize: 18 }}>+</button>
            </div>
          </div>
        </div>

        <hr style={styles.divider} />

        <h3 style={styles.sectionTitle}>📚 Categories</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategories(c => ({ ...c, [cat.id]: !c[cat.id] }))}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: `2px solid ${categories[cat.id] ? COLORS.accent4 : COLORS.cardBorder}`,
                background: categories[cat.id] ? COLORS.accent4 + "22" : "transparent",
                color: categories[cat.id] ? COLORS.accent4 : COLORS.muted,
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "'Nunito', sans-serif",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >{cat.label}</button>
          ))}
        </div>

        <hr style={styles.divider} />

        <h3 style={styles.sectionTitle}>🎮 Mechanics</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 }}>
          {TOGGLES.map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ color: COLORS.text, fontWeight: 800, fontSize: 14 }}>{t.label}</div>
                <div style={{ color: COLORS.muted, fontSize: 12 }}>{t.desc}</div>
              </div>
              <Toggle enabled={toggles[t.id]} onChange={() => setToggles(v => ({ ...v, [t.id]: !v[t.id] }))} />
            </div>
          ))}
        </div>

        <hr style={styles.divider} />

        <h3 style={styles.sectionTitle}>✏️ Custom Questions</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            style={{ ...styles.input, flex: 1 }}
            placeholder="Add a custom question..."
            value={customQ}
            onChange={e => setCustomQ(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCustomQ()}
          />
          <button onClick={addCustomQ} style={{ ...styles.btn(COLORS.accent3), width: "auto", padding: "12px 18px" }}>+</button>
        </div>
        {customQList.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 120, overflowY: "auto" }}>
            {customQList.map((q, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#13121f", borderRadius: 8, padding: "6px 12px" }}>
                <span style={{ color: COLORS.muted, fontSize: 13 }}>{q}</span>
                <button onClick={() => setCustomQList(l => l.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: COLORS.accent1, cursor: "pointer", fontSize: 16 }}>×</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <button style={styles.btn(COLORS.accent1)} onClick={handleCreate}>
            🚀 Create Lobby
          </button>
        </div>
      </div>
    </div>
  );

  // LOBBY SCREEN
  if (screen === "lobby") return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Boogaloo&family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes popIn { from{transform:scale(0.8);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        button:hover { transform: scale(1.02) !important; }
        button:active { transform: scale(0.97) !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #1a1828; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      `}</style>
      {particles.map((p, i) => <FloatingParticle key={i} style={{ ...p, animationDelay: `${i * 0.8}s` }} />)}

      <div style={{ ...styles.card, maxWidth: 580 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: "'Boogaloo', cursive", fontSize: 28, color: COLORS.text }}>
              🎯 Betcha Know!
            </h2>
            <div style={{ color: COLORS.muted, fontSize: 13, fontWeight: 700, marginTop: 2 }}>
              Waiting for players...
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: COLORS.muted, fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>Room Code</div>
            <div
              onClick={copyCode}
              style={{
                fontFamily: "'Boogaloo', cursive",
                fontSize: 28,
                color: COLORS.accent2,
                letterSpacing: 4,
                cursor: "pointer",
                userSelect: "none",
                transition: "opacity 0.2s",
              }}
              title="Click to copy"
            >
              {roomCode} {copied ? "✓" : "📋"}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ color: COLORS.muted, fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>
              Players ({players.length}/10)
            </span>
            <span style={{ color: players.length >= 2 ? COLORS.accent3 : COLORS.accent1, fontSize: 12, fontWeight: 800 }}>
              {players.length >= 2 ? "✓ Ready to start" : "Need at least 2 players"}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {players.map(p => <PlayerChip key={p.id} player={p} />)}
            {players.length < 10 && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "#ffffff08", border: `1px dashed ${COLORS.cardBorder}`,
                borderRadius: 24, padding: "6px 14px",
                animation: "pulse 2s ease-in-out infinite",
              }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>?</div>
                <span style={{ color: COLORS.muted, fontWeight: 700, fontSize: 14 }}>Waiting...</span>
              </div>
            )}
          </div>
        </div>

        <hr style={styles.divider} />

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["settings", "categories", "mechanics"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: 10,
                border: `2px solid ${tab === t ? COLORS.accent4 : COLORS.cardBorder}`,
                background: tab === t ? COLORS.accent4 + "22" : "transparent",
                color: tab === t ? COLORS.accent4 : COLORS.muted,
                fontSize: 12,
                fontWeight: 800,
                fontFamily: "'Nunito', sans-serif",
                cursor: "pointer",
                textTransform: "capitalize",
                transition: "all 0.15s",
              }}
            >{t === "settings" ? "⚙️ Settings" : t === "categories" ? "📚 Categories" : "🎮 Mechanics"}</button>
          ))}
        </div>

        {tab === "settings" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, animation: "popIn 0.2s ease" }}>
            <div>
              <label style={styles.label}>Rounds</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={() => setRounds(r => Math.max(3, r - 1))} style={{ ...styles.btn(COLORS.cardBorder, true), width: 36, padding: "6px", fontSize: 18 }}>−</button>
                <span style={{ color: COLORS.text, fontWeight: 900, fontSize: 24, minWidth: 36, textAlign: "center" }}>{rounds}</span>
                <button onClick={() => setRounds(r => Math.min(20, r + 1))} style={{ ...styles.btn(COLORS.cardBorder, true), width: 36, padding: "6px", fontSize: 18 }}>+</button>
              </div>
            </div>
            <div>
              <label style={styles.label}>Timer</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={() => setTimer(t => Math.max(10, t - 5))} style={{ ...styles.btn(COLORS.cardBorder, true), width: 36, padding: "6px", fontSize: 18 }}>−</button>
                <span style={{ color: COLORS.text, fontWeight: 900, fontSize: 24, minWidth: 36, textAlign: "center" }}>{timer}s</span>
                <button onClick={() => setTimer(t => Math.min(60, t + 5))} style={{ ...styles.btn(COLORS.cardBorder, true), width: 36, padding: "6px", fontSize: 18 }}>+</button>
              </div>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={styles.label}>Starting Points</label>
              <div style={{
                background: "#13121f", borderRadius: 12, padding: "12px 16px",
                color: COLORS.accent2, fontWeight: 900, fontSize: 20,
                fontFamily: "'Boogaloo', cursive", letterSpacing: 1,
              }}>💰 500 points per player</div>
            </div>
          </div>
        )}

        {tab === "categories" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, animation: "popIn 0.2s ease" }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategories(c => ({ ...c, [cat.id]: !c[cat.id] }))}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  border: `2px solid ${categories[cat.id] ? COLORS.accent4 : COLORS.cardBorder}`,
                  background: categories[cat.id] ? COLORS.accent4 + "22" : "transparent",
                  color: categories[cat.id] ? COLORS.accent4 : COLORS.muted,
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'Nunito', sans-serif",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >{cat.label}</button>
            ))}
          </div>
        )}

        {tab === "mechanics" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "popIn 0.2s ease" }}>
            {TOGGLES.map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ color: COLORS.text, fontWeight: 800, fontSize: 14 }}>{t.label}</div>
                  <div style={{ color: COLORS.muted, fontSize: 12 }}>{t.desc}</div>
                </div>
                <Toggle enabled={toggles[t.id]} onChange={() => setToggles(v => ({ ...v, [t.id]: !v[t.id] }))} />
              </div>
            ))}
          </div>
        )}

        <hr style={styles.divider} />

        <button
          style={{
            ...styles.btn(players.length >= 2 ? COLORS.accent1 : "#333"),
            fontSize: 18,
            padding: "16px",
            opacity: players.length >= 2 ? 1 : 0.5,
          }}
          disabled={players.length < 2}
          onClick={() => {
            if (players.length < 2) return;
            getSocket().emit("startGame");
            onStartGame && onStartGame();
          }}
        >
          {players.length >= 2 ? "🚀 Start Game!" : `⏳ Waiting for players (${players.length}/2 min)`}
        </button>

        <div style={{ textAlign: "center", marginTop: 12, color: COLORS.muted, fontSize: 12, fontWeight: 600 }}>
          Share code <span style={{ color: COLORS.accent2, fontWeight: 900 }}>{roomCode}</span> with friends to invite them
        </div>
      </div>
    </div>
  );
}

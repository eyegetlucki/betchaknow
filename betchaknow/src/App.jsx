import { useState } from 'react';
import AuthFlow       from './Auth';
import LobbyFlow      from './Lobby';
import GameFlow       from './Game';
import ProfilePage    from './Profile';
import LeaderboardPage from './Leaderboard';
import ShopPage       from './Shop';
import FriendsFlow    from './Friends';
import ChallengesPage from './Challenges';
import BattlePassPage from './BattlePass';

const NAV_ITEMS = [
  { id:"lobby",       icon:"🎯", label:"Play"    },
  { id:"leaderboard", icon:"🏆", label:"Ranks"   },
  { id:"challenges",  icon:"🎮", label:"Quests"  },
  { id:"shop",        icon:"🛒", label:"Shop"    },
  { id:"friends",     icon:"👥", label:"Social"  },
  { id:"battlepass",  icon:"⭐", label:"Pass"    },
  { id:"profile",     icon:"👤", label:"Profile" },
];

const navCss = `
  .bk-nav-btn {
    flex:1; border:none; background:transparent; cursor:pointer;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:3px; padding:8px 2px; transition:color 0.15s;
    font-family:'DM Sans',sans-serif;
    color:#6b6890;
  }
  .bk-nav-btn.active { color:#4d96ff; }
  .bk-nav-btn:hover:not(.active) { color:#f0eeff; }
  .bk-nav-btn .bk-icon { font-size:20px; line-height:1; }
  .bk-nav-btn .bk-label { font-size:10px; font-weight:700; letter-spacing:0.4px; }
  .bk-nav-btn.active .bk-icon { filter:drop-shadow(0 0 6px #4d96ff88); }
`;

export default function App() {
  const [screen,  setScreen]  = useState("main");   // auth | main | game
  const [section, setSection] = useState("lobby");

  if (screen === "auth") {
    return (
      <div style={{ position:"relative" }}>
        <button
          onClick={() => setScreen("main")}
          style={{
            position:"fixed", top:64, left:14, zIndex:200,
            background:"#100e1c", border:"1px solid #2e2b4a",
            borderRadius:12, padding:"6px 12px",
            display:"flex", alignItems:"center", gap:6,
            color:"#f0eeff", fontSize:13, fontWeight:700,
            cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
            boxShadow:"0 2px 12px #00000066",
          }}
        >
          🎯 Home
        </button>
        <AuthFlow onAuthenticated={() => setScreen("main")} />
      </div>
    );
  }

  if (screen === "game") {
    return <GameFlow onExit={() => setScreen("main")} />;
  }

  return (
    <div style={{ minHeight:"100vh", background:"#08070f", paddingTop:58 }}>
      <style>{navCss}</style>

      {section !== "lobby" && (
        <button
          onClick={() => setSection("lobby")}
          style={{
            position:"fixed", top:64, left:14, zIndex:200,
            background:"#100e1c", border:"1px solid #2e2b4a",
            borderRadius:12, padding:"6px 12px",
            display:"flex", alignItems:"center", gap:6,
            color:"#f0eeff", fontSize:13, fontWeight:700,
            cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
            boxShadow:"0 2px 12px #00000066",
          }}
        >
          🎯 Home
        </button>
      )}

      {section === "lobby"       && <LobbyFlow onStartGame={() => setScreen("game")} onLogin={() => setScreen("auth")} />}
      {section === "leaderboard" && <LeaderboardPage />}
      {section === "challenges"  && <ChallengesPage />}
      {section === "shop"        && <ShopPage />}
      {section === "friends"     && <FriendsFlow />}
      {section === "battlepass"  && <BattlePassPage />}
      {section === "profile"     && <ProfilePage />}

      <nav style={{
        position:"fixed", top:0, left:0, right:0,
        background:"#100e1c",
        borderBottom:"1px solid #1e1b35",
        display:"flex",
        zIndex:100,
        paddingTop:"env(safe-area-inset-top, 0px)",
      }}>
        {NAV_ITEMS.map(tab => (
          <button
            key={tab.id}
            className={`bk-nav-btn ${section === tab.id ? "active" : ""}`}
            onClick={() => setSection(tab.id)}
          >
            <span className="bk-icon">{tab.icon}</span>
            <span className="bk-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

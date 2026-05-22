import { useState, useEffect } from 'react';
import AuthFlow       from './Auth';
import LobbyFlow      from './Lobby';
import GameFlow       from './Game';
import ProfilePage    from './Profile';
import LeaderboardPage from './Leaderboard';
import ShopPage       from './Shop';
import FriendsFlow    from './Friends';
import ChallengesPage from './Challenges';
import BattlePassPage from './BattlePass';
import { isLoggedIn, api, saveSession } from './api';
import { supabase } from './supabaseClient';

const NAV_ITEMS = [
  { id:"lobby",       icon:"🎯", label:"Play"    },
  { id:"leaderboard", icon:"🏆", label:"Ranks"   },
  { id:"challenges",  icon:"🎮", label:"Quests"  },
  { id:"shop",        icon:"🛒", label:"Shop"    },
  { id:"friends",     icon:"👥", label:"Social"  },
  { id:"battlepass",  icon:"⭐", label:"Pass"    },
  { id:"profile",     icon:"👤", label:"Profile" },
];

const SECTION_LABELS = {
  leaderboard: { icon:"🏆", name:"Rankings",    desc:"See where you stand globally" },
  challenges:  { icon:"🎮", name:"Daily Quests", desc:"Complete missions, earn rewards" },
  shop:        { icon:"🛒", name:"Shop",         desc:"Cosmetics, coin packs & more" },
  friends:     { icon:"👥", name:"Social",       desc:"Friends, clubs & rivalries" },
  battlepass:  { icon:"⭐", name:"Battle Pass",  desc:"Season rewards & VIP perks" },
  profile:     { icon:"👤", name:"Profile",      desc:"Stats, history & customisation" },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Boogaloo&family=DM+Sans:wght@400;600;700;800&display=swap');

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

  @keyframes bk-fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes bk-popIn  { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
  @keyframes bk-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes bk-orb    { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-20px) scale(1.1)} }
`;

function AuthGate({ section, onLogin, onClose }) {
  const info = SECTION_LABELS[section] || { icon:"🔒", name:"This section", desc:"" };
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:150,
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"24px 20px",
    }}>
      {/* blurred backdrop — sits over the page content beneath */}
      <div style={{
        position:"absolute", inset:0,
        backdropFilter:"blur(18px) brightness(0.45)",
        WebkitBackdropFilter:"blur(18px) brightness(0.45)",
        background:"#08070fbb",
      }} onClick={onClose} />

      {/* floating orbs for atmosphere */}
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
        <div style={{
          position:"absolute", width:320, height:320, borderRadius:"50%",
          background:"radial-gradient(circle, #4d96ff22 0%, transparent 70%)",
          top:"10%", left:"5%", animation:"bk-orb 8s ease-in-out infinite",
        }} />
        <div style={{
          position:"absolute", width:260, height:260, borderRadius:"50%",
          background:"radial-gradient(circle, #c77dff22 0%, transparent 70%)",
          bottom:"15%", right:"8%", animation:"bk-orb 10s ease-in-out infinite reverse",
        }} />
      </div>

      {/* card */}
      <div style={{
        position:"relative", zIndex:1,
        background:"linear-gradient(160deg, #13111f 0%, #0f0d1c 100%)",
        border:"1px solid #2a2645",
        borderRadius:28, padding:"36px 32px",
        maxWidth:420, width:"100%",
        boxShadow:"0 32px 80px #000000cc, 0 0 0 1px #ffffff08",
        animation:"bk-popIn 0.35s cubic-bezier(.17,.67,.35,1.15)",
        textAlign:"center",
        fontFamily:"'DM Sans',sans-serif",
      }}>
        {/* lock badge */}
        <div style={{
          width:72, height:72, borderRadius:20,
          background:"linear-gradient(135deg, #4d96ff22, #c77dff22)",
          border:"1.5px solid #4d96ff44",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:34, margin:"0 auto 20px",
          animation:"bk-float 3s ease-in-out infinite",
        }}>
          {info.icon}
        </div>

        <div style={{
          display:"inline-flex", alignItems:"center", gap:6,
          background:"#4d96ff18", border:"1px solid #4d96ff33",
          borderRadius:20, padding:"4px 12px", marginBottom:14,
        }}>
          <span style={{ fontSize:11, color:"#4d96ff", fontWeight:800, letterSpacing:0.8, textTransform:"uppercase" }}>
            🔒 Sign in required
          </span>
        </div>

        <h2 style={{
          fontFamily:"'Boogaloo',cursive", fontSize:30,
          color:"#f0eeff", marginBottom:8, lineHeight:1.1,
        }}>
          Unlock {info.name}
        </h2>
        <p style={{ fontSize:14, color:"#8884aa", fontWeight:500, marginBottom:28, lineHeight:1.5 }}>
          {info.desc}. Create a free account to access everything Betcha Know! has to offer.
        </p>

        {/* feature bullets */}
        <div style={{
          background:"#100e1c", border:"1px solid #1e1b35",
          borderRadius:16, padding:"14px 18px", marginBottom:28, textAlign:"left",
        }}>
          {[
            ["🏆","Track your rank & stats globally"],
            ["💰","Earn coins, battle pass rewards & XP"],
            ["👥","Add friends & join clubs"],
            ["🎮","Complete daily quests for bonus rewards"],
          ].map(([icon, text]) => (
            <div key={text} style={{ display:"flex", alignItems:"center", gap:10, padding:"5px 0",
              fontSize:13, color:"#b8b4d0", fontWeight:500 }}>
              <span style={{ fontSize:16 }}>{icon}</span>{text}
            </div>
          ))}
        </div>

        {/* buttons */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <button
            onClick={onLogin}
            style={{
              padding:"14px", borderRadius:14, border:"none", cursor:"pointer",
              background:"linear-gradient(135deg, #4d96ff, #6e56cf)",
              color:"#fff", fontFamily:"'DM Sans',sans-serif",
              fontSize:15, fontWeight:800,
              boxShadow:"0 6px 24px #4d96ff44",
              transition:"transform 0.12s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}
          >
            Create Free Account
          </button>
          <button
            onClick={onLogin}
            style={{
              padding:"13px", borderRadius:14, cursor:"pointer",
              background:"transparent", border:"1.5px solid #2a2645",
              color:"#8884aa", fontFamily:"'DM Sans',sans-serif",
              fontSize:14, fontWeight:700,
              transition:"all 0.12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="#4d96ff66"; e.currentTarget.style.color="#f0eeff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="#2a2645"; e.currentTarget.style.color="#8884aa"; }}
          >
            Already have an account? Sign in
          </button>
          <button
            onClick={onClose}
            style={{
              background:"none", border:"none", cursor:"pointer",
              color:"#4a4870", fontSize:12, fontWeight:600,
              fontFamily:"'DM Sans',sans-serif", padding:"4px",
            }}
          >
            Continue as guest →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen,   setScreen]   = useState("main");   // auth | main | game
  const [section,  setSection]  = useState("lobby");
  const [gateFor,  setGateFor]  = useState(null);     // section id being gated

  const loggedIn = isLoggedIn();

  // Handle OAuth redirect callback (Google / Discord)
  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session && !isLoggedIn()) {
        try {
          const provider = session.user.app_metadata?.provider || "google";
          const result = await api.oauth({ provider, access_token: session.access_token });
          saveSession({ token: result.token, refreshToken: result.refreshToken, username: result.profile?.username });
          setGateFor(null);
          setScreen("main");
        } catch (e) {
          console.error("OAuth exchange failed:", e.message);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleNavClick = (id) => {
    if (id !== "lobby" && !loggedIn) {
      setGateFor(id);
      setSection(id);   // render the blurred page behind
    } else {
      setGateFor(null);
      setSection(id);
    }
  };

  const handleAuthenticated = () => {
    setGateFor(null);
    setScreen("main");
  };

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
        <AuthFlow onAuthenticated={handleAuthenticated} />
      </div>
    );
  }

  if (screen === "game") {
    return <GameFlow onExit={() => setScreen("main")} />;
  }

  return (
    <div style={{ minHeight:"100vh", background:"#08070f", paddingTop:58 }}>
      <style>{css}</style>

      {section !== "lobby" && (
        <button
          onClick={() => handleNavClick("lobby")}
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

      {/* auth gate overlay */}
      {gateFor && (
        <AuthGate
          section={gateFor}
          onLogin={() => { setGateFor(null); setScreen("auth"); }}
          onClose={() => { setGateFor(null); setSection("lobby"); }}
        />
      )}

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
            onClick={() => handleNavClick(tab.id)}
          >
            <span className="bk-icon">{tab.icon}</span>
            <span className="bk-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

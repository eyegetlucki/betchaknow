import { useState, useEffect, useRef } from 'react';
import AuthFlow       from './Auth';
import LobbyFlow      from './Lobby';
import GameFlow       from './Game';
import ProfilePage    from './Profile';
import LeaderboardPage from './Leaderboard';
import ShopPage       from './Shop';
import FriendsFlow    from './Friends';
import ChallengesPage from './Challenges';
import BattlePassPage from './BattlePass';
import { isLoggedIn, api, saveSession, clearSession } from './api';
import { supabase } from './supabaseClient';

const TRACKS = [
  encodeURI("/music/ES_intuition (Instrumental Version) - dasloe.mp3"),
  encodeURI("/music/ES_Kids World - Lukas Got Lucky.mp3"),
];

function useMusicPlayer(enabled, volume) {
  const audioRef    = useRef(null);
  const trackRef    = useRef(0);
  const unlockedRef = useRef(false);

  // Create audio element once
  useEffect(() => {
    const audio = new Audio(TRACKS[0]);
    audio.volume  = (volume / 100) * 0.45;
    audio.preload = "auto";

    const onEnded = () => {
      trackRef.current = (trackRef.current + 1) % TRACKS.length;
      audio.src = TRACKS[trackRef.current];
      if (unlockedRef.current) audio.play().catch(() => {});
    };
    audio.addEventListener("ended", onEnded);
    audioRef.current = audio;

    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.src = "";
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Play / pause when enabled changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (enabled) {
      if (unlockedRef.current) {
        audio.play().catch(() => {});
      } else {
        const unlock = () => {
          unlockedRef.current = true;
          audioRef.current?.play().catch(() => {});
        };
        document.addEventListener("click",      unlock, { once: true });
        document.addEventListener("keydown",    unlock, { once: true });
        document.addEventListener("touchstart", unlock, { once: true });
        return () => {
          document.removeEventListener("click",      unlock);
          document.removeEventListener("keydown",    unlock);
          document.removeEventListener("touchstart", unlock);
        };
      }
    } else {
      audio.pause();
    }
  }, [enabled]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = (volume / 100) * 0.45;
  }, [volume]);
}

function useSfxPlayer(enabled, volume) {
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio("/sfx/button-press.mp3");
    audio.preload = "auto";
    audioRef.current = audio;
    return () => { audio.src = ""; };
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (!enabled) return;
      if (!e.target.closest('button, a, [role="button"], label, input[type="range"]')) return;
      const clone = audioRef.current?.cloneNode();
      if (!clone) return;
      clone.volume = Math.max(0, Math.min(1, volume / 100));
      clone.play().catch(() => {});
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [enabled, volume]);
}

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

  @keyframes bk-fadeUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes bk-popIn    { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
  @keyframes bk-slideUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes bk-float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes bk-orb      { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-20px) scale(1.1)} }
  @keyframes bk-spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

  .bk-range { -webkit-appearance:none; width:100%; height:4px; border-radius:2px; background:#2e2b4a; outline:none; cursor:pointer; }
  .bk-range::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:16px; border-radius:50%; background:#4d96ff; cursor:pointer; box-shadow:0 0 8px #4d96ff66; transition:transform 0.12s; }
  .bk-range::-webkit-slider-thumb:hover { transform:scale(1.2); }
  .bk-range:disabled { opacity:0.3; cursor:not-allowed; }
  .bk-range:disabled::-webkit-slider-thumb { cursor:not-allowed; }

  .bk-profile-menu-btn { display:flex; align-items:center; gap:8px; width:100%; padding:8px 12px; background:none; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.12s; }
  .bk-profile-menu-btn:hover { background:#ffffff0d; }
`;

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={onChange}
      style={{
        width:42, height:24, borderRadius:12, flexShrink:0,
        background: enabled ? "#4d96ff" : "#2e2b4a",
        border:"none", cursor:"pointer", position:"relative",
        transition:"background 0.2s", padding:0,
      }}
    >
      <div style={{
        position:"absolute", top:4, left: enabled ? 22 : 4,
        width:16, height:16, borderRadius:"50%", background:"#fff",
        transition:"left 0.2s", boxShadow:"0 1px 4px #0006",
      }} />
    </button>
  );
}

function SettingsPanel({ settings, onUpdate, onClose }) {
  const S = {
    overlay: {
      position:"fixed", inset:0, zIndex:500,
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"24px 20px",
      background:"#08070fcc",
      backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
    },
    card: {
      background:"linear-gradient(160deg,#13111f 0%,#0f0d1c 100%)",
      border:"1px solid #2a2645",
      borderRadius:28, padding:"28px 28px 32px",
      width:"100%", maxWidth:420,
      boxShadow:"0 32px 80px #000000cc",
      animation:"bk-popIn 0.25s cubic-bezier(.17,.67,.35,1.15)",
      fontFamily:"'DM Sans',sans-serif",
    },
    sectionLabel: {
      fontSize:10, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase",
      color:"#4a4870", marginBottom:14, marginTop:24,
    },
    row: {
      display:"flex", alignItems:"center", justifyContent:"space-between",
      gap:16, marginBottom:10,
    },
    label: { color:"#f0eeff", fontSize:14, fontWeight:700 },
    sub:   { color:"#6b6890", fontSize:12, fontWeight:500, marginTop:1 },
  };

  const sections = [
    {
      id:"audio", label:"🎵 Audio",
      rows:[
        { key:"musicEnabled",   label:"Music",          sub:"Background music during menus & lobby", type:"toggle" },
        { key:"musicVolume",    label:"Music Volume",   sub:null, type:"slider", enabledBy:"musicEnabled" },
        { key:"sfxEnabled",     label:"Sound Effects",  sub:"In-game sounds & feedback",             type:"toggle" },
        { key:"sfxVolume",      label:"SFX Volume",     sub:null, type:"slider", enabledBy:"sfxEnabled" },
      ],
    },
    {
      id:"display", label:"🎨 Display",
      rows:[
        { key:"animationsEnabled", label:"Animations", sub:"Screen transitions and particle effects", type:"toggle" },
        { key:"showPointsDelta",   label:"Point Popups", sub:"Show +/- point changes during reveals", type:"toggle" },
      ],
    },
  ];

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
          <h2 style={{ margin:0, fontFamily:"'Boogaloo',cursive", fontSize:26, color:"#f0eeff" }}>
            ⚙️ Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              background:"#ffffff0d", border:"1px solid #2a2645",
              borderRadius:10, width:32, height:32, cursor:"pointer",
              color:"#8884aa", fontSize:16, display:"flex",
              alignItems:"center", justifyContent:"center",
            }}
          >✕</button>
        </div>

        {sections.map(sec => (
          <div key={sec.id}>
            <div style={S.sectionLabel}>{sec.label}</div>
            <div style={{ background:"#100e1c", borderRadius:16, overflow:"hidden", border:"1px solid #1e1b35" }}>
              {sec.rows.map((row, i) => {
                const disabled = row.enabledBy && !settings[row.enabledBy];
                return (
                  <div
                    key={row.key}
                    style={{
                      padding:"13px 16px",
                      borderTop: i > 0 ? "1px solid #1a1830" : "none",
                      opacity: disabled ? 0.45 : 1,
                      transition:"opacity 0.2s",
                    }}
                  >
                    {row.type === "toggle" && (
                      <div style={S.row}>
                        <div>
                          <div style={S.label}>{row.label}</div>
                          {row.sub && <div style={S.sub}>{row.sub}</div>}
                        </div>
                        <Toggle
                          enabled={settings[row.key]}
                          onChange={() => onUpdate(row.key, !settings[row.key])}
                        />
                      </div>
                    )}
                    {row.type === "slider" && (
                      <div>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                          <span style={S.label}>{row.label}</span>
                          <span style={{ color:"#4d96ff", fontWeight:800, fontSize:13 }}>{settings[row.key]}%</span>
                        </div>
                        <input
                          type="range" min={0} max={100}
                          value={settings[row.key]}
                          disabled={disabled}
                          onChange={e => onUpdate(row.key, Number(e.target.value))}
                          className="bk-range"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Username setup overlay (shown to new OAuth users) ────────────────────────
function UsernameSetup({ onDone }) {
  const [username, setUsername] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const valid = /^[a-zA-Z0-9_]{3,20}$/.test(username);

  const handleSave = async () => {
    if (!valid) { setError("3–20 characters, letters, numbers and underscores only"); return; }
    setLoading(true);
    try {
      await api.updateMe({ username });
      // update stored username
      localStorage.setItem("bk_username", username);
      onDone();
    } catch (err) {
      setError(err.message || "Username already taken, try another");
      setLoading(false);
    }
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:300,
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"24px 20px",
      background:"#08070fdd",
      backdropFilter:"blur(12px)",
      WebkitBackdropFilter:"blur(12px)",
    }}>
      <div style={{
        background:"linear-gradient(160deg, #13111f 0%, #0f0d1c 100%)",
        border:"1px solid #2a2645",
        borderRadius:28, padding:"40px 32px",
        maxWidth:400, width:"100%",
        boxShadow:"0 32px 80px #000000cc",
        animation:"bk-popIn 0.35s cubic-bezier(.17,.67,.35,1.15)",
        textAlign:"center",
        fontFamily:"'DM Sans',sans-serif",
      }}>
        <div style={{ fontSize:52, marginBottom:16, animation:"bk-float 3s ease-in-out infinite" }}>🎮</div>

        <h2 style={{ fontFamily:"'Boogaloo',cursive", fontSize:28, color:"#f0eeff", marginBottom:8 }}>
          Pick your username
        </h2>
        <p style={{ fontSize:14, color:"#8884aa", fontWeight:500, marginBottom:28, lineHeight:1.5 }}>
          This is how other players will see you. You can change it later in your profile.
        </p>

        <div style={{ textAlign:"left", marginBottom:20 }}>
          <div style={{ position:"relative" }}>
            <span style={{
              position:"absolute", left:14, top:"50%", transform:"translateY(-50%)",
              fontSize:16, pointerEvents:"none",
            }}>🎯</span>
            <input
              placeholder="CoolPlayer99"
              value={username}
              maxLength={20}
              onChange={e => { setUsername(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              style={{
                width:"100%", padding:"13px 16px 13px 44px",
                background:"#0d0b1a", border:`1.5px solid ${error ? "#ff6b6b" : username.length > 0 && valid ? "#6bcb77" : "#2e2b4a"}`,
                borderRadius:12, color:"#f0eeff",
                fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:600,
                outline:"none", boxSizing:"border-box",
                transition:"border-color 0.2s",
              }}
            />
          </div>
          {error
            ? <p style={{ fontSize:12, color:"#ff6b6b", fontWeight:600, marginTop:6 }}>⚠ {error}</p>
            : username.length > 0 && valid
              ? <p style={{ fontSize:12, color:"#6bcb77", fontWeight:600, marginTop:6 }}>✓ Looks good!</p>
              : username.length > 0
                ? <p style={{ fontSize:12, color:"#7b789a", fontWeight:500, marginTop:6 }}>3–20 chars, letters/numbers/underscores</p>
                : null
          }
        </div>

        <button
          disabled={loading || !valid}
          onClick={handleSave}
          style={{
            width:"100%", padding:"14px", borderRadius:14, border:"none", cursor: valid ? "pointer" : "not-allowed",
            background: valid ? "linear-gradient(135deg, #4d96ff, #6e56cf)" : "#1e1b35",
            color: valid ? "#fff" : "#4a4768",
            fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:800,
            boxShadow: valid ? "0 6px 24px #4d96ff44" : "none",
            transition:"all 0.2s",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          }}
        >
          {loading
            ? <><span style={{ width:16, height:16, border:"2px solid #fff4", borderTopColor:"#fff", borderRadius:"50%", display:"inline-block", animation:"bk-spin 0.7s linear infinite" }} /> Saving...</>
            : "Let's go! →"
          }
        </button>
      </div>
    </div>
  );
}

// ── Auth gate overlay (locks non-Play tabs for guests) ───────────────────────
function AuthGate({ section, onLogin, onClose }) {
  const info = SECTION_LABELS[section] || { icon:"🔒", name:"This section", desc:"" };
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:150,
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"24px 20px",
    }}>
      <div style={{
        position:"absolute", inset:0,
        backdropFilter:"blur(18px) brightness(0.45)",
        WebkitBackdropFilter:"blur(18px) brightness(0.45)",
        background:"#08070fbb",
      }} onClick={onClose} />

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

        <h2 style={{ fontFamily:"'Boogaloo',cursive", fontSize:30, color:"#f0eeff", marginBottom:8, lineHeight:1.1 }}>
          Unlock {info.name}
        </h2>
        <p style={{ fontSize:14, color:"#8884aa", fontWeight:500, marginBottom:28, lineHeight:1.5 }}>
          {info.desc}. Create a free account to access everything Betcha Know! has to offer.
        </p>

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

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <button onClick={onLogin} style={{
            padding:"14px", borderRadius:14, border:"none", cursor:"pointer",
            background:"linear-gradient(135deg, #4d96ff, #6e56cf)",
            color:"#fff", fontFamily:"'DM Sans',sans-serif",
            fontSize:15, fontWeight:800, boxShadow:"0 6px 24px #4d96ff44",
            transition:"transform 0.12s",
          }}
            onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}
          >
            Create Free Account
          </button>
          <button onClick={onLogin} style={{
            padding:"13px", borderRadius:14, cursor:"pointer",
            background:"transparent", border:"1.5px solid #2a2645",
            color:"#8884aa", fontFamily:"'DM Sans',sans-serif",
            fontSize:14, fontWeight:700, transition:"all 0.12s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="#4d96ff66"; e.currentTarget.style.color="#f0eeff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="#2a2645"; e.currentTarget.style.color="#8884aa"; }}
          >
            Already have an account? Sign in
          </button>
          <button onClick={onClose} style={{
            background:"none", border:"none", cursor:"pointer",
            color:"#4a4870", fontSize:12, fontWeight:600,
            fontFamily:"'DM Sans',sans-serif", padding:"4px",
          }}>
            Continue as guest →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,          setScreen]        = useState("main");
  const [initialRoundData, setInitialRoundData] = useState(null);
  const [section,         setSection]       = useState("lobby");
  const [gateFor,       setGateFor]       = useState(null);
  const [loggedIn,      setLoggedIn]      = useState(isLoggedIn());
  const [avatarUrl,     setAvatarUrl]     = useState(() => localStorage.getItem("bk_avatar") || "");
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);
  const [oauthError,    setOauthError]    = useState("");
  const [showSettings,  setShowSettings]  = useState(false);
  const [profileMenu,   setProfileMenu]   = useState(false);
  const menuTimer = useRef(null);
  const openProfileMenu  = () => { clearTimeout(menuTimer.current); setProfileMenu(true); };
  const closeProfileMenu = () => { menuTimer.current = setTimeout(() => setProfileMenu(false), 180); };
  const [settings, setSettings] = useState(() => ({
    musicEnabled:      localStorage.getItem("bk_music")       !== "0",
    musicVolume:       parseInt(localStorage.getItem("bk_music_vol")  || "70"),
    sfxEnabled:        localStorage.getItem("bk_sfx")         !== "0",
    sfxVolume:         parseInt(localStorage.getItem("bk_sfx_vol")    || "80"),
    animationsEnabled: localStorage.getItem("bk_animations")  !== "0",
    showPointsDelta:   localStorage.getItem("bk_pts_delta")   !== "0",
  }));

  useMusicPlayer(settings.musicEnabled, settings.musicVolume);
  useSfxPlayer(settings.sfxEnabled, settings.sfxVolume);

  const updateSetting = (key, value) => {
    setSettings(s => ({ ...s, [key]: value }));
    const keys = { musicEnabled:"bk_music", musicVolume:"bk_music_vol", sfxEnabled:"bk_sfx", sfxVolume:"bk_sfx_vol", animationsEnabled:"bk_animations", showPointsDelta:"bk_pts_delta" };
    if (keys[key]) localStorage.setItem(keys[key], typeof value === "boolean" ? (value ? "1" : "0") : String(value));
  };

  const handleLogout = async () => {
    clearSession();
    try { if (supabase) await supabase.auth.signOut(); } catch {}
    setLoggedIn(false);
    setAvatarUrl("");
    setSection("lobby");
    setProfileMenu(false);
  };

  // Handle OAuth redirect callback (Google / Discord)
  useEffect(() => {
    if (!supabase) return;

    const exchangeSession = async (session) => {
      if (!session || isLoggedIn()) return;
      try {
        const provider = session.user.app_metadata?.provider || "google";
        const oauthAvatar = session.user.user_metadata?.avatar_url || "";
        const result = await api.oauth({ provider, access_token: session.access_token });
        // Uploaded avatar (stored in DB) takes priority over the OAuth provider avatar
        const finalAvatar = result.profile?.avatar_icon || oauthAvatar;
        saveSession({ token: result.token, refreshToken: result.refreshToken, username: result.profile?.username, avatarUrl: finalAvatar });
        if (finalAvatar) setAvatarUrl(finalAvatar);
        setLoggedIn(true);
        setGateFor(null);
        setScreen("main");
        if (result.isNewUser) setShowUsernameSetup(true);
      } catch (e) {
        console.error("OAuth exchange failed:", e.message);
        setOauthError(e.message || "OAuth login failed");
      }
    };

    // On mount: check for an existing Supabase session (catches OAuth redirects
    // where SIGNED_IN fires before our listener is registered)
    supabase.auth.getSession().then(({ data: { session } }) => {
      exchangeSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        exchangeSession(session);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Clear expired token on mount so UI never shows a stale logged-in state
  useEffect(() => {
    if (localStorage.getItem("bk_token") && !isLoggedIn()) {
      clearSession();
      setLoggedIn(false);
      setAvatarUrl("");
    }
  }, []);

  // iOS bfcache fix: when Safari restores a frozen page (app switcher / back gesture),
  // the socket connection is dead but React state still thinks it's live. Force a clean
  // reload so the app starts fresh instead of showing a broken/error state.
  useEffect(() => {
    const onPageShow = (e) => { if (e.persisted) window.location.reload(); };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  // Handle Stripe redirect back to app — navigate to the right section
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("purchase")) setSection("shop");
    if (params.has("vip"))      setSection("battlepass");
  }, []);

  // Sync equipped cosmetics to localStorage so the socket handshake always
  // carries the correct character icon and theme, even if the user has never
  // visited the Shop page.
  useEffect(() => {
    if (!isLoggedIn()) return;
    const AVATAR_ICONS = {
      av_classic: "🎯", av_shark: "🦈", av_jester: "🃏",
      av_crown:   "👑", av_diamond: "💎", av_dragon: "🐉", av_phoenix: "🦅",
    };
    api.me().then(data => {
      const eq = data?.equipped || {};
      const theme  = eq.theme  || "th_neon";
      const avatar = eq.avatar || "av_classic";
      localStorage.setItem("bk_equipped_theme",     theme);
      localStorage.setItem("bk_equipped_character", AVATAR_ICONS[avatar] || "🎯");
    }).catch(() => {
      if (!localStorage.getItem("bk_equipped_theme"))     localStorage.setItem("bk_equipped_theme",     "th_neon");
      if (!localStorage.getItem("bk_equipped_character")) localStorage.setItem("bk_equipped_character", "🎯");
    });
  }, [loggedIn]);

  const handleNavClick = (id) => {
    if (id !== "lobby" && !loggedIn) {
      setGateFor(id);
      setSection(id);
    } else {
      setGateFor(null);
      setSection(id);
    }
  };

  const handleAuthenticated = () => {
    setLoggedIn(true);
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
    return <GameFlow onExit={() => { setInitialRoundData(null); setScreen("main"); }} initialRoundData={initialRoundData} />;
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

      {section === "lobby"       && <LobbyFlow onStartGame={(data) => { setInitialRoundData(data ?? null); setScreen("game"); }} onLogin={() => setScreen("auth")} loggedIn={loggedIn} />}
      {section === "leaderboard" && <LeaderboardPage />}
      {section === "challenges"  && <ChallengesPage />}
      {section === "shop"        && <ShopPage />}
      {section === "friends"     && <FriendsFlow />}
      {section === "battlepass"  && <BattlePassPage />}
      {section === "profile"     && <ProfilePage onAvatarChange={setAvatarUrl} />}

      {/* OAuth error banner */}
      {oauthError && (
        <div style={{
          position:"fixed", bottom:70, left:0, right:0, zIndex:200,
          background:"#ff6b6b22", border:"1px solid #ff6b6b88",
          padding:"10px 16px", textAlign:"center",
          fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#ff6b6b", fontWeight:600,
          display:"flex", alignItems:"center", justifyContent:"center", gap:10,
        }}>
          ⚠ Login error: {oauthError}
          <button onClick={() => setOauthError("")} style={{ background:"none", border:"none", color:"#ff6b6b", cursor:"pointer", fontSize:16, padding:0 }}>×</button>
        </div>
      )}

      {/* username setup for new OAuth users */}
      {showUsernameSetup && (
        <UsernameSetup onDone={() => setShowUsernameSetup(false)} />
      )}

      {/* auth gate overlay */}
      {gateFor && !loggedIn && !showUsernameSetup && (
        <AuthGate
          section={gateFor}
          onLogin={() => { setGateFor(null); setScreen("auth"); }}
          onClose={() => { setGateFor(null); setSection("lobby"); }}
        />
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onUpdate={updateSetting}
          onClose={() => setShowSettings(false)}
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
        {NAV_ITEMS.map(tab => {
          let icon;
          if (tab.id === "profile" && loggedIn) {
            if (avatarUrl) {
              icon = <img src={avatarUrl} alt="avatar" style={{ width:22, height:22, borderRadius:"50%", objectFit:"cover", display:"block" }} />;
            } else {
              const initial = (localStorage.getItem("bk_username") || "?")[0].toUpperCase();
              icon = (
                <span style={{ width:22, height:22, borderRadius:"50%", background:"linear-gradient(135deg,#4d96ff,#6e56cf)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#fff" }}>
                  {initial}
                </span>
              );
            }
          } else {
            icon = tab.icon;
          }

          if (tab.id === "profile") {
            return (
              <div
                key="profile"
                style={{ flex:1, position:"relative" }}
                onMouseEnter={openProfileMenu}
                onMouseLeave={closeProfileMenu}
              >
                {/* Tap-outside backdrop for mobile */}
                {profileMenu && (
                  <div
                    onClick={() => setProfileMenu(false)}
                    style={{ position:"fixed", inset:0, zIndex:190 }}
                  />
                )}

                <button
                  className={`bk-nav-btn ${section === "profile" ? "active" : ""}`}
                  onClick={() => setProfileMenu(m => !m)}
                  style={{ width:"100%" }}
                >
                  <span className="bk-icon">{icon}</span>
                  <span className="bk-label">Profile</span>
                </button>

                {profileMenu && (
                  <div
                    onMouseEnter={openProfileMenu}
                    onMouseLeave={closeProfileMenu}
                    style={{
                      position:"absolute", top:"100%", right:0,
                      paddingTop:6,
                      background:"transparent",
                      zIndex:200,
                    }}
                  >
                  <div style={{
                    background:"#13111f", border:"1px solid #2a2645",
                    borderRadius:14, padding:6, minWidth:148,
                    boxShadow:"0 8px 32px #000000aa",
                    animation:"bk-slideUp 0.15s ease",
                  }}>
                    <button
                      className="bk-profile-menu-btn"
                      style={{ color:"#f0eeff" }}
                      onClick={() => { setProfileMenu(false); handleNavClick("profile"); }}
                    >
                      👤 Profile
                    </button>
                    <button
                      className="bk-profile-menu-btn"
                      style={{ color:"#f0eeff" }}
                      onClick={() => { setProfileMenu(false); setShowSettings(true); }}
                    >
                      ⚙️ Settings
                    </button>
                    {loggedIn && (
                      <button
                        className="bk-profile-menu-btn"
                        style={{ color:"#ff6b6b" }}
                        onClick={handleLogout}
                      >
                        🚪 Log Out
                      </button>
                    )}
                    {!loggedIn && (
                      <button
                        className="bk-profile-menu-btn"
                        style={{ color:"#4d96ff" }}
                        onClick={() => { setProfileMenu(false); setScreen("auth"); }}
                      >
                        🔑 Sign In
                      </button>
                    )}
                  </div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={tab.id}
              className={`bk-nav-btn ${section === tab.id ? "active" : ""}`}
              onClick={() => handleNavClick(tab.id)}
            >
              <span className="bk-icon">{icon}</span>
              <span className="bk-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

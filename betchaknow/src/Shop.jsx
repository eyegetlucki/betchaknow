import { useState, useMemo, useEffect } from "react";
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

const RARITY = {
  common: { name: "Common",    color: "#9ca3af", glow: "#9ca3af44" },
  rare:   { name: "Rare",      color: C.a4,      glow: C.a4 + "44" },
  epic:   { name: "Epic",      color: C.a5,      glow: C.a5 + "44" },
  legend: { name: "Legendary", color: C.a2,      glow: C.a2 + "44" },
};

const CATEGORY_EFFECTS = {
  avatars: {
    label: "Character",
    effect: "Your character stands on the in-game scoreboard next to your name for every player to see. Choose one that matches your playstyle — intimidating, lucky, or just plain cool.",
    scenes: ["In-game scoreboard", "Lobby player list", "Post-game results"],
  },
  themes: {
    label: "Table Theme",
    effect: "Transforms the game table's visual style for all players when you host — background, accent colors, and atmosphere. Make your room instantly recognizable.",
    scenes: ["Game table background", "Room UI accents", "Host lobby"],
  },
  cards: {
    label: "Card Skin",
    effect: "Reskins your answer cards during gameplay. The card design is visible to every player each time answers are revealed at the end of a round.",
    scenes: ["Answer cards", "Round reveal", "Bet confirmation"],
  },
  fx: {
    label: "Victory Effect",
    effect: "A full-screen animation that plays for everyone in the room when you win a round. Turn your victories into a spectacle the whole table can't ignore.",
    scenes: ["Round win animation", "Final game win"],
  },
  packs: {
    label: "Question Pack",
    effect: "Adds an entire new trivia category to your games. Select it in host settings alongside or instead of base categories. Each pack includes 500+ curated questions.",
    scenes: ["Category vote wheel", "Host game settings"],
  },
};

const ITEM_PREVIEWS = {
  av_classic:   "Your starting point — a clean, recognizable look that never goes out of style.",
  av_shark:     "Instill fear before a question is even asked. The shark circles the leaderboard, waiting for the perfect moment to strike.",
  av_jester:    "Misdirection is your art. Perfect for the player who lives to bluff and never apologizes for it.",
  av_crown:     "Command the room. This regal icon signals experience, confidence, and a relentless appetite for first place.",
  av_diamond:   "Ice in your veins. Diamond Hands players never panic-bet — they hold their nerve and cash out at exactly the right moment.",
  av_dragon:    "Rare, powerful, and lucky. The dragon avatar is the mark of a true high-stakes legend.",
  av_phoenix:   "You've been down before and you always come back. Rise from a rough round and take the whole game.",
  th_neon:      "The classic Betcha Know experience — neon signs, felt tables, and electric Las Vegas energy.",
  th_space:     "Infinite black with star fields and nebula glow. Bet among the cosmos.",
  th_tropical:  "Palm trees, ocean breeze, and pastel sunsets. Makes even the toughest question feel breezy.",
  th_haunted:   "Candlelight, gothic arches, and flickering shadows. High stakes have never felt spookier.",
  th_cyberpunk: "Rain-slicked streets, holo-billboards, and electric neon. The future of trivia has arrived.",
  th_golden:    "Champagne, velvet, and gold leaf. The most prestigious table in the house — reserved for high rollers only.",
  card_default: "Clean, minimal, and timeless — lets your answers speak entirely for themselves.",
  card_holo:    "Every card shifts through the full rainbow as you reveal it. Light-catching and quietly intimidating.",
  card_gold:    "Heavy metallic sheen with embossed edges. Feels luxurious every time you play one.",
  card_neon:    "Electric glowing edges that pulse in the darkened game room. Impossible to miss at the moment of reveal.",
  card_diamond: "Crystalline facets that catch the light with every play. Sharp, precise, and undeniably stunning.",
  fx_confetti:  "A burst of colored paper explodes across the screen. Timeless, joyful, and universally satisfying.",
  fx_money:     "Dollar bills rain down when you win. Let the whole room know it was always about the money.",
  fx_fireworks: "A full pyrotechnic display launches overhead. Bright, explosive, and impossible to look away from.",
  fx_lightning: "A bolt cracks across the screen the instant you clinch a win. Fast, electric, devastating.",
  fx_galaxy:    "The entire universe implodes into a supernova. The most dramatic victory effect in the game — by far.",
  qp_classic:   "The seven pillars of Betcha Know: Sports, Science, History, Pop Culture, Geography, Music, and Movies.",
  qp_games:     "500+ questions spanning video game history — from Atari to modern releases, studios, speedruns, and lore.",
  qp_anime:     "Deep cuts from manga, anime series, studios, directors, and seasonal hits across every decade.",
  qp_food:      "Culinary trivia covering world cuisines, cooking techniques, famous chefs, and food history.",
  qp_crime:     "Famous cases, forensic science, cold files, documentary subjects, and criminal psychology.",
  qp_nostalgia: "A time capsule of the 2000s — TV shows, movies, music, slang, gadgets, and early internet culture.",
  qp_legends:   "Legendary athletes, record-breaking moments, championship history, and the stories behind the stats.",
};

const PLAYER_DATA = {
  bluffBucks: 1340,
  ownedIds: ["av_classic", "th_neon", "fx_confetti", "card_default", "qp_classic"],
  equipped: {
    avatar: "av_classic",
    theme:  "th_neon",
    cards:  "card_default",
    fx:     "fx_confetti",
    badge:  null,
  },
};

const ITEMS = [
  { id:"av_classic",   cat:"avatars", name:"Classic Target",    icon:"🎯", price:0,    rarity:"common", desc:"Default avatar" },
  { id:"av_shark",     cat:"avatars", name:"The Shark",         icon:"🦈", price:200,  rarity:"common", desc:"Hunt the leaderboard" },
  { id:"av_jester",    cat:"avatars", name:"Jester",            icon:"🃏", price:200,  rarity:"common", desc:"For the master bluffer" },
  { id:"av_crown",     cat:"avatars", name:"Royal Crown",       icon:"👑", price:350,  rarity:"rare",   desc:"Rule the table" },
  { id:"av_diamond",   cat:"avatars", name:"Diamond Hands",     icon:"💎", price:350,  rarity:"rare",   desc:"Never folds" },
  { id:"av_dragon",    cat:"avatars", name:"Lucky Dragon",      icon:"🐉", price:500,  rarity:"epic",   desc:"Fortune favors the bold" },
  { id:"av_phoenix",   cat:"avatars", name:"Rising Phoenix",    icon:"🦅", price:500,  rarity:"epic",   desc:"Rise from defeat" },
  { id:"th_neon",      cat:"themes",  name:"Neon Vegas",        icon:"🎰", price:0,    rarity:"common", desc:"Default theme" },
  { id:"th_space",     cat:"themes",  name:"Deep Space",        icon:"🌌", price:500,  rarity:"rare",   desc:"Bet among the stars" },
  { id:"th_tropical",  cat:"themes",  name:"Tropical Paradise", icon:"🌴", price:600,  rarity:"rare",   desc:"Take a beach break" },
  { id:"th_haunted",   cat:"themes",  name:"Haunted Manor",     icon:"🕯️", price:800,  rarity:"epic",   desc:"Spooky stakes" },
  { id:"th_cyberpunk", cat:"themes",  name:"Cyberpunk",         icon:"🌃", price:900,  rarity:"epic",   desc:"Neon-soaked future" },
  { id:"th_golden",    cat:"themes",  name:"Golden Hour",       icon:"☀️", price:1000, rarity:"legend", desc:"For the high rollers" },
  { id:"card_default", cat:"cards",   name:"Classic Cards",     icon:"🎴", price:0,    rarity:"common", desc:"Standard answer cards" },
  { id:"card_holo",    cat:"cards",   name:"Holographic",       icon:"✨", price:300,  rarity:"rare",   desc:"Shimmering rainbow cards" },
  { id:"card_gold",    cat:"cards",   name:"Gold Foil",         icon:"🏵️", price:400,  rarity:"rare",   desc:"Luxe metallic cards" },
  { id:"card_neon",    cat:"cards",   name:"Neon Glow",         icon:"💫", price:450,  rarity:"epic",   desc:"Glowing edge cards" },
  { id:"card_diamond", cat:"cards",   name:"Diamond Cut",       icon:"💠", price:500,  rarity:"epic",   desc:"Crystalline answer cards" },
  { id:"fx_confetti",  cat:"fx",      name:"Confetti Cannon",   icon:"🎉", price:0,    rarity:"common", desc:"Classic celebration" },
  { id:"fx_money",     cat:"fx",      name:"Money Rain",        icon:"💵", price:300,  rarity:"rare",   desc:"It rains $$$" },
  { id:"fx_fireworks", cat:"fx",      name:"Fireworks",         icon:"🎆", price:400,  rarity:"rare",   desc:"Light up the sky" },
  { id:"fx_lightning", cat:"fx",      name:"Lightning Strike",  icon:"⚡", price:500,  rarity:"epic",   desc:"Electric victory" },
  { id:"fx_galaxy",    cat:"fx",      name:"Galaxy Burst",      icon:"🌠", price:600,  rarity:"legend", desc:"Cosmic explosion" },
  { id:"qp_classic",   cat:"packs",   name:"Classic Pack",      icon:"📚", price:0,    rarity:"common", desc:"All 7 base categories" },
  { id:"qp_games",     cat:"packs",   name:"Video Games",       icon:"🎮", price:400,  rarity:"rare",   desc:"500+ gaming questions" },
  { id:"qp_anime",     cat:"packs",   name:"Anime & Manga",     icon:"🌸", price:500,  rarity:"rare",   desc:"For weebs and fans alike" },
  { id:"qp_food",      cat:"packs",   name:"Food & Cooking",    icon:"🍔", price:500,  rarity:"rare",   desc:"Culinary knowledge" },
  { id:"qp_crime",     cat:"packs",   name:"True Crime",        icon:"🔪", price:600,  rarity:"epic",   desc:"Famous cases & cold files" },
  { id:"qp_nostalgia", cat:"packs",   name:"2000s Nostalgia",   icon:"📼", price:700,  rarity:"epic",   desc:"Y2K trivia time capsule" },
  { id:"qp_legends",   cat:"packs",   name:"Sports Legends",    icon:"🏟️", price:800,  rarity:"legend", desc:"Deep sports history" },
];

const CATEGORIES = [
  { id:"featured", label:"⭐ Featured",        short:"Featured"  },
  { id:"avatars",  label:"🧑 Characters",      short:"Characters"},
  { id:"themes",   label:"🎨 Themes",          short:"Themes"    },
  { id:"cards",    label:"🃏 Card Skins",      short:"Cards"     },
  { id:"fx",       label:"✨ Victory Effects", short:"FX"        },
  { id:"packs",    label:"📚 Question Packs",  short:"Packs"     },
];

const COIN_PACKS = [
  { id:"starter", coins:200,  price:1.99, label:"Starter Pack",    icon:"💰", popular:false,            bonus:0   },
  { id:"popular", coins:600,  price:4.99, label:"Popular Pack",    icon:"💸", popular:true,             bonus:50  },
  { id:"best",    coins:1400, price:9.99, label:"Best Value Pack", icon:"💎", popular:false, best:true,  bonus:200 },
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Boogaloo&family=DM+Sans:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

  @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes popIn    { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
  @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes shimmer  { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes coinSpin { 0%{transform:rotateY(0deg)} 100%{transform:rotateY(360deg)} }
  @keyframes pulse    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }

  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-thumb { background:${C.border2}; border-radius:2px; }

  .nav-btn {
    padding:10px 16px; border-radius:12px; border:none;
    background:transparent; color:${C.muted}; cursor:pointer;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:700;
    transition:all 0.15s; white-space:nowrap;
    display:inline-flex; align-items:center; gap:6px;
  }
  .nav-btn.active { background:${C.border2}; color:${C.text}; }
  .nav-btn:not(.active):hover { color:${C.text}; background:${C.border}; }

  .item-card {
    background:${C.card2}; border:2px solid ${C.border};
    border-radius:18px; padding:18px;
    transition:all 0.2s; cursor:pointer;
    position:relative; overflow:hidden;
  }
  .item-card:hover { transform:translateY(-4px); }
  .item-card.owned { border-color:${C.a3}55; }
  .item-card.equipped { border-color:${C.a3}; box-shadow:0 0 20px ${C.a3}33; }

  .coin-btn {
    display:inline-flex; align-items:center; gap:6px;
    padding:8px 14px; border-radius:12px;
    background:linear-gradient(135deg, ${C.a2}, ${C.a6});
    color:#111; font-weight:900; font-family:'DM Sans',sans-serif;
    font-size:14px; border:none; cursor:pointer;
    box-shadow:0 4px 14px ${C.a2}44;
    transition:transform 0.12s;
  }
  .coin-btn:hover { transform:translateY(-1px); }
  .coin-btn:active { transform:scale(0.96); }

  .btn-primary {
    width:100%; padding:10px; border-radius:10px; border:none;
    font-family:'DM Sans',sans-serif; font-weight:800; font-size:13px;
    cursor:pointer; transition:transform 0.12s, opacity 0.15s;
    display:flex; align-items:center; justify-content:center; gap:6px;
  }
  .btn-primary:not(:disabled):hover { transform:translateY(-1px); }
  .btn-primary:not(:disabled):active { transform:scale(0.97); }
  .btn-primary:disabled { opacity:0.5; cursor:not-allowed; }

  .modal-backdrop {
    position:fixed; inset:0; background:#000a; backdrop-filter:blur(8px);
    display:flex; align-items:center; justify-content:center;
    z-index:50; padding:20px; animation:fadeUp 0.2s ease;
  }
  .modal {
    background:${C.card}; border:1px solid ${C.border2}; border-radius:24px;
    padding:28px; max-width:440px; width:100%;
    animation:popIn 0.3s cubic-bezier(.17,.67,.35,1.15);
    box-shadow:0 24px 80px #000c;
  }

  .preview-glow {
    position:absolute; inset:0; pointer-events:none;
    background:radial-gradient(circle at 50% 30%, var(--glow) 0%, transparent 60%);
    opacity:0.3;
  }

  .preview-btn {
    width:100%; padding:7px; border-radius:8px;
    border:1px solid ${C.border2}; background:transparent;
    color:${C.muted}; cursor:pointer;
    font-family:'DM Sans',sans-serif; font-weight:700; font-size:11px;
    display:flex; align-items:center; justify-content:center; gap:5px;
    margin-bottom:8px; transition:color 0.15s, background 0.15s;
  }
  .preview-btn:hover { color:${C.text}; background:${C.border}; }

  button:not(:disabled):active { transform:scale(0.97); }
`;

function RarityBadge({ rarity }) {
  const r = RARITY[rarity];
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:3,
      background: r.color + "22", color: r.color,
      border: `1px solid ${r.color}55`,
      borderRadius:20, padding:"2px 8px",
      fontSize:10, fontWeight:800, letterSpacing:0.5,
      fontFamily:"'DM Sans',sans-serif", textTransform:"uppercase",
    }}>{r.name}</span>
  );
}

function CoinIcon({ size = 14 }) {
  return (
    <span style={{
      display:"inline-flex", width:size, height:size,
      background:`linear-gradient(135deg,${C.a2},${C.a6})`,
      borderRadius:"50%", boxShadow:`0 0 6px ${C.a2}66, inset 0 0 4px #0004`,
      animation:"coinSpin 4s linear infinite",
      alignItems:"center", justifyContent:"center",
      fontSize:Math.round(size*0.55), color:"#111", fontWeight:900,
    }}>$</span>
  );
}

function ItemCard({ item, owned, equipped, balance, onClick, onPreview }) {
  const r = RARITY[item.rarity];
  const affordable = balance >= item.price;

  return (
    <div className={`item-card ${owned ? "owned" : ""} ${equipped ? "equipped" : ""}`}
      onClick={() => onClick(item)}
      style={{ "--glow": r.glow, animation:"fadeUp 0.4s ease" }}>
      <div className="preview-glow" style={{ "--glow": r.glow }} />

      <div style={{ position:"relative", zIndex:1 }}>
        {equipped && (
          <div style={{
            position:"absolute", top:-4, right:-4, zIndex:2,
            background:C.a3, color:"#0a1a0c", borderRadius:10,
            padding:"3px 8px", fontSize:10, fontWeight:900,
            fontFamily:"'DM Sans',sans-serif", letterSpacing:0.5,
            boxShadow:`0 2px 8px ${C.a3}66`,
          }}>✓ EQUIPPED</div>
        )}

        <div style={{ textAlign:"center", marginBottom:10 }}>
          <div style={{
            width:60, height:60, margin:"0 auto", borderRadius:14,
            background: `linear-gradient(135deg, ${r.color}22, ${r.color}08)`,
            border: `1.5px solid ${r.color}44`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:32, animation: equipped ? "float 3s ease-in-out infinite" : "none",
            filter:`drop-shadow(0 2px 6px ${r.color}66)`,
          }}>{item.icon}</div>
        </div>

        <RarityBadge rarity={item.rarity} />

        <h4 style={{ fontWeight:800, fontSize:14, color:C.text, marginTop:6, marginBottom:2 }}>{item.name}</h4>
        <p style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif", lineHeight:1.4, marginBottom:8, minHeight:30 }}>
          {item.desc}
        </p>

        <button className="preview-btn" onClick={(e) => { e.stopPropagation(); onPreview(item); }}>
          👁 Preview Details
        </button>

        {item.price === 0 ? (
          <div style={{ textAlign:"center", color:C.muted, fontSize:12, fontWeight:700, padding:"8px" }}>DEFAULT</div>
        ) : owned ? (
          equipped ? (
            <button className="btn-primary" disabled
              style={{ background:C.a3+"22", color:C.a3, border:`1px solid ${C.a3}55` }}>
              ✓ Equipped
            </button>
          ) : (
            <button className="btn-primary"
              style={{ background:C.a3+"22", color:C.a3, border:`1px solid ${C.a3}55` }}
              onClick={(e) => { e.stopPropagation(); onClick(item); }}>
              Equip
            </button>
          )
        ) : (
          <button className="btn-primary"
            disabled={!affordable}
            style={{
              background: affordable ? `linear-gradient(135deg, ${r.color}, ${r.color}cc)` : C.border,
              color: affordable ? "#fff" : C.muted,
            }}
            onClick={(e) => { e.stopPropagation(); onClick(item); }}>
            <CoinIcon size={12} /> {item.price.toLocaleString()}
          </button>
        )}
      </div>
    </div>
  );
}

function CoinPackCard({ pack, onBuy }) {
  return (
    <div style={{
      background: pack.best ? `linear-gradient(135deg, ${C.a5}22, ${C.a4}18)` : C.card2,
      border: pack.best ? `2px solid ${C.a5}66` : pack.popular ? `2px solid ${C.a2}66` : `2px solid ${C.border}`,
      borderRadius:18, padding:20, position:"relative",
      transition:"transform 0.15s", animation:"fadeUp 0.4s ease", cursor:"pointer",
    }}
    onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
    onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
    onClick={() => onBuy(pack)}>
      {pack.popular && (
        <div style={{
          position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)",
          background:C.a2, color:"#111", borderRadius:8, padding:"3px 12px",
          fontSize:10, fontWeight:900, letterSpacing:1, boxShadow:`0 4px 12px ${C.a2}44`,
        }}>🔥 POPULAR</div>
      )}
      {pack.best && (
        <div style={{
          position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)",
          background:`linear-gradient(90deg,${C.a5},${C.a2})`, color:"#111", borderRadius:8,
          padding:"3px 12px", fontSize:10, fontWeight:900, letterSpacing:1, boxShadow:`0 4px 12px ${C.a5}44`,
        }}>💎 BEST VALUE</div>
      )}

      <div style={{ textAlign:"center", marginBottom:14 }}>
        <div style={{ fontSize:42, marginBottom:6, animation:"float 3s ease-in-out infinite" }}>{pack.icon}</div>
        <div style={{ fontWeight:800, fontSize:14, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>{pack.label}</div>
      </div>

      <div style={{ textAlign:"center", marginBottom:14 }}>
        <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:36, color:C.a2, lineHeight:1, marginBottom:2 }}>
          {pack.coins.toLocaleString()}
        </div>
        <div style={{ fontSize:11, color:C.muted, fontWeight:700, fontFamily:"'DM Sans',sans-serif", letterSpacing:1, textTransform:"uppercase" }}>
          BK Bucks
        </div>
        {pack.bonus > 0 && (
          <div style={{ marginTop:6, color:C.a3, fontSize:11, fontWeight:800 }}>+{pack.bonus} bonus coins</div>
        )}
      </div>

      <div style={{ background:C.card, borderRadius:12, padding:"10px", textAlign:"center", border:`1px solid ${C.border}` }}>
        <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:24, color:C.text }}>${pack.price}</div>
        <div style={{ fontSize:10, color:C.muted, fontWeight:700 }}>${(pack.price/pack.coins*100).toFixed(2)}¢ per coin</div>
      </div>

      <button className="btn-primary" style={{
        marginTop:12,
        background: pack.best ? `linear-gradient(135deg,${C.a5},${C.a4})`
                  : pack.popular ? `linear-gradient(135deg,${C.a2},${C.a6})` : C.border2,
        color: pack.popular && !pack.best ? "#111" : "#fff",
        padding:"12px", fontSize:14,
      }}>Buy Now →</button>
    </div>
  );
}

function PurchaseModal({ item, balance, onConfirm, onCancel }) {
  if (!item) return null;
  const r = RARITY[item.rarity];
  const affordable = balance >= item.price;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{
            width:90, height:90, margin:"0 auto 14px", borderRadius:24,
            background: `linear-gradient(135deg, ${r.color}33, ${r.color}11)`,
            border: `2px solid ${r.color}66`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:48, animation:"float 3s ease-in-out infinite",
            boxShadow:`0 0 32px ${r.glow}`,
          }}>{item.icon}</div>
          <RarityBadge rarity={item.rarity} />
          <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:26, marginTop:10, color:C.text }}>{item.name}</h3>
          <p style={{ fontSize:13, color:C.muted, marginTop:6, fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>{item.desc}</p>
        </div>

        <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:14, padding:16, marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ color:C.muted, fontSize:13, fontWeight:600 }}>Your balance</span>
            <span style={{ color:C.a2, fontSize:14, fontWeight:800 }}><CoinIcon size={12} /> {balance.toLocaleString()}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ color:C.muted, fontSize:13, fontWeight:600 }}>Item price</span>
            <span style={{ color:C.a1, fontSize:14, fontWeight:800 }}>− <CoinIcon size={12} /> {item.price.toLocaleString()}</span>
          </div>
          <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:8, marginTop:8, display:"flex", justifyContent:"space-between" }}>
            <span style={{ color:C.text, fontSize:14, fontWeight:800 }}>After purchase</span>
            <span style={{ color: affordable ? C.a3 : C.a1, fontFamily:"'Boogaloo',cursive", fontSize:20 }}>
              <CoinIcon size={14} /> {(balance - item.price).toLocaleString()}
            </span>
          </div>
        </div>

        {!affordable && (
          <div style={{
            background:C.a1+"15", border:`1px solid ${C.a1}33`,
            borderRadius:12, padding:"10px 14px", marginBottom:12,
            color:C.a1, fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:8,
          }}>⚠️ Not enough BK Bucks. Visit the Coin Store to top up!</div>
        )}

        <div style={{ display:"flex", gap:10 }}>
          <button className="btn-primary" onClick={onCancel}
            style={{ background:"transparent", color:C.muted, border:`1.5px solid ${C.border2}`, padding:"12px" }}>
            Cancel
          </button>
          <button className="btn-primary" disabled={!affordable} onClick={() => onConfirm(item)}
            style={{
              background: affordable ? `linear-gradient(135deg, ${r.color}, ${r.color}cc)` : C.border,
              color: affordable ? "#fff" : C.muted, padding:"12px", fontSize:14,
            }}>
            {affordable ? "Confirm Purchase" : "Need More Coins"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CoinPackModal({ pack, onConfirm, onCancel }) {
  if (!pack) return null;
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{ textAlign:"center" }}>
        <div style={{ fontSize:64, marginBottom:10, animation:"float 3s ease-in-out infinite" }}>{pack.icon}</div>
        <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:28, color:C.text, marginBottom:6 }}>{pack.label}</h3>
        <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:42, color:C.a2, marginBottom:4 }}>
          {pack.coins.toLocaleString()} <span style={{ fontSize:18, color:C.muted }}>coins</span>
        </div>
        {pack.bonus > 0 && <p style={{ color:C.a3, fontSize:13, fontWeight:700, marginBottom:14 }}>Includes {pack.bonus} bonus coins!</p>}

        <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:14, padding:16, marginBottom:16, marginTop:14 }}>
          <div style={{ fontSize:13, color:C.muted, fontWeight:600, marginBottom:6 }}>Total</div>
          <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:36, color:C.text }}>${pack.price}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>Secure checkout via Stripe · No card stored</div>
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <button className="btn-primary" onClick={onCancel}
            style={{ background:"transparent", color:C.muted, border:`1.5px solid ${C.border2}`, padding:"12px" }}>
            Cancel
          </button>
          <button className="btn-primary" onClick={() => onConfirm(pack)}
            style={{
              background:`linear-gradient(135deg,${C.a3},${C.a4})`, color:"#fff",
              padding:"12px", fontSize:14, boxShadow:`0 4px 18px ${C.a3}44`,
            }}>🔒 Pay ${pack.price}</button>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ item, owned, equipped, balance, onAction, onClose }) {
  if (!item) return null;
  const r   = RARITY[item.rarity];
  const cat = CATEGORY_EFFECTS[item.cat];
  const flavor = ITEM_PREVIEWS[item.id];
  const affordable = balance >= item.price;

  const slotMap = { avatars:"avatar", themes:"theme", cards:"cards", fx:"fx" };
  const isEquipped = equipped && equipped[slotMap[item.cat]] === item.id;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.card,
        border: `2px solid ${r.color}55`,
        borderRadius: 24,
        padding: "32px 28px 24px",
        maxWidth: 480,
        width: "100%",
        animation: "popIn 0.3s cubic-bezier(.17,.67,.35,1.15)",
        boxShadow: `0 0 60px ${r.glow}, 0 24px 80px #000c`,
        position: "relative",
        overflow: "hidden",
        maxHeight: "90vh",
        overflowY: "auto",
      }}>
        {/* Radial background glow */}
        <div style={{ position:"absolute", inset:0, background:`radial-gradient(circle at 50% 0%, ${r.color}18, transparent 55%)`, pointerEvents:"none" }} />

        {/* Close button */}
        <button onClick={onClose} style={{
          position:"absolute", top:16, right:16,
          width:32, height:32, borderRadius:"50%",
          border:`1px solid ${C.border2}`,
          background:C.card2, color:C.muted, fontSize:16, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:"'DM Sans',sans-serif", fontWeight:900, zIndex:2,
        }}>✕</button>

        <div style={{ position:"relative", zIndex:1 }}>
          {/* Icon */}
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{
              width:100, height:100, margin:"0 auto 16px",
              borderRadius:24,
              background: `linear-gradient(135deg, ${r.color}33, ${r.color}11)`,
              border: `2px solid ${r.color}66`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:52,
              animation:"float 3s ease-in-out infinite",
              boxShadow:`0 0 40px ${r.glow}, inset 0 0 20px ${r.color}11`,
            }}>{item.icon}</div>

            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:10 }}>
              {cat && (
                <span style={{
                  background:C.border, color:C.muted,
                  borderRadius:20, padding:"3px 10px",
                  fontSize:10, fontWeight:800, letterSpacing:0.5, textTransform:"uppercase",
                }}>{cat.label}</span>
              )}
              <RarityBadge rarity={item.rarity} />
            </div>

            <h2 style={{ fontFamily:"'Boogaloo',cursive", fontSize:32, color:C.text, lineHeight:1 }}>{item.name}</h2>
          </div>

          {/* What this unlocks */}
          {cat && (
            <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
              <div style={{ fontSize:10, color:r.color, fontWeight:900, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
                ✦ What This Unlocks
              </div>
              <p style={{ fontSize:13, color:C.text, fontWeight:500, lineHeight:1.65, marginBottom:cat.scenes?.length ? 12 : 0 }}>
                {cat.effect}
              </p>
              {cat.scenes?.length > 0 && (
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {cat.scenes.map((s, i) => (
                    <span key={i} style={{
                      background: r.color + "18", color: r.color,
                      border: `1px solid ${r.color}33`,
                      borderRadius:20, padding:"3px 10px",
                      fontSize:10, fontWeight:700,
                    }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Flavor text */}
          {flavor && (
            <div style={{
              borderLeft:`3px solid ${r.color}66`,
              paddingLeft:14, marginBottom:16,
            }}>
              <p style={{ fontSize:13, color:C.muted, fontWeight:500, lineHeight:1.65, fontStyle:"italic" }}>
                "{flavor}"
              </p>
            </div>
          )}

          {/* Price / ownership */}
          <div style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            background:C.card2, border:`1px solid ${C.border}`,
            borderRadius:12, padding:"12px 16px", marginBottom:16,
          }}>
            {item.price === 0 ? (
              <span style={{ color:C.muted, fontSize:13, fontWeight:700 }}>Free — included by default</span>
            ) : owned ? (
              <span style={{ color:C.a3, fontSize:13, fontWeight:800 }}>✓ Owned</span>
            ) : (
              <>
                <span style={{ color:C.muted, fontSize:13, fontWeight:600 }}>Price</span>
                <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontFamily:"'Boogaloo',cursive", fontSize:22, color: affordable ? C.a2 : C.a1, display:"flex", alignItems:"center", gap:6 }}>
                    <CoinIcon size={16} /> {item.price.toLocaleString()}
                  </span>
                  {!affordable && (
                    <span style={{ fontSize:11, color:C.a1, fontWeight:700 }}>· not enough coins</span>
                  )}
                </span>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn-primary" onClick={onClose}
              style={{ background:"transparent", color:C.muted, border:`1.5px solid ${C.border2}`, padding:"12px", flex:1 }}>
              Close
            </button>

            {item.price > 0 && !owned ? (
              <button className="btn-primary" disabled={!affordable} onClick={() => onAction(item)}
                style={{
                  flex:2, padding:"12px", fontSize:14,
                  background: affordable ? `linear-gradient(135deg, ${r.color}, ${r.color}cc)` : C.border,
                  color: affordable ? "#fff" : C.muted,
                }}>
                {affordable ? `Buy — ${item.price.toLocaleString()} BK` : "Need More Coins"}
              </button>
            ) : owned && !isEquipped && item.cat !== "packs" ? (
              <button className="btn-primary" onClick={() => onAction(item)}
                style={{ flex:2, padding:"12px", fontSize:14, background:C.a3+"22", color:C.a3, border:`1px solid ${C.a3}55` }}>
                Equip Now
              </button>
            ) : isEquipped ? (
              <button className="btn-primary" disabled
                style={{ flex:2, padding:"12px", fontSize:14, background:C.a3+"22", color:C.a3, border:`1px solid ${C.a3}55` }}>
                ✓ Currently Equipped
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Toast({ msg, type="success" }) {
  if (!msg) return null;
  const colors = {
    success: { bg: C.a3+"22", border: C.a3, icon: "✓" },
    info:    { bg: C.a4+"22", border: C.a4, icon: "ℹ" },
    error:   { bg: C.a1+"22", border: C.a1, icon: "⚠" },
  };
  const c = colors[type];
  return (
    <div style={{
      position:"fixed", top:80, left:"50%", transform:"translateX(-50%)",
      background:C.card, border:`1.5px solid ${c.border}`,
      borderRadius:14, padding:"12px 22px",
      display:"flex", alignItems:"center", gap:10,
      color:c.border, fontWeight:700, fontFamily:"'DM Sans',sans-serif",
      fontSize:14, zIndex:100,
      boxShadow:`0 8px 32px ${c.border}33`,
      animation:"popIn 0.3s cubic-bezier(.17,.67,.35,1.3)",
    }}>
      <span style={{ fontSize:18 }}>{c.icon}</span>{msg}
    </div>
  );
}

const FREE_ITEM_IDS = PLAYER_DATA.ownedIds;

export default function ShopPage() {
  const [view,        setView]        = useState("shop");
  const [cat,         setCat]         = useState("featured");
  const [balance,     setBalance]     = useState(null);
  const [owned,       setOwned]       = useState(new Set(FREE_ITEM_IDS));
  const [equipped,    setEquipped]    = useState({});
  const [loading,     setLoading]     = useState(isLoggedIn());
  const [modalItem,   setModalItem]   = useState(null);
  const [modalPack,   setModalPack]   = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [toast,       setToast]       = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const purchaseResult = params.get("purchase");
    if (purchaseResult) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (!isLoggedIn()) { setLoading(false); return; }
    Promise.all([api.me(), api.inventory()]).then(([me, inv]) => {
      if (me?.profile) setBalance(me.profile.bluff_bucks ?? 0);
      setOwned(new Set([
        ...FREE_ITEM_IDS,
        ...(inv?.inventory?.map(i => i.item_id) || []),
      ]));
      if (me?.equipped) {
        const resolved = {
          avatar: me.equipped.avatar || "av_classic",
          theme:  me.equipped.theme  || "th_neon",
          cards:  me.equipped.cards  || "card_default",
          fx:     me.equipped.fx     || "fx_confetti",
          badge:  me.equipped.badge  || null,
        };
        setEquipped(resolved);
        localStorage.setItem("bk_equipped_theme", resolved.theme);
        localStorage.setItem("bk_equipped_fx",    resolved.fx);
        const avatarItem = ITEMS.find(i => i.id === resolved.avatar);
        if (avatarItem?.icon) localStorage.setItem("bk_equipped_character", avatarItem.icon);
      }
      if (purchaseResult === "success") {
        setView("coinstore");
        setTimeout(() => showToast("🎉 Coins added to your account!", "success"), 300);
      } else if (purchaseResult === "cancelled") {
        setTimeout(() => showToast("Purchase cancelled", "info"), 300);
      }
    }).catch(() => {
      setBalance(0);
    }).finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleItemClick = async (item) => {
    if (owned.has(item.id)) {
      const slotMap = { avatars:"avatar", themes:"theme", cards:"cards", fx:"fx", packs:"pack" };
      const slot = slotMap[item.cat];
      if (!slot) return;
      if (equipped[slot] === item.id) { showToast(`${item.name} is already equipped`, "info"); return; }
      setEquipped(prev => ({ ...prev, [slot]: item.id }));
      if (slot === "theme")  localStorage.setItem("bk_equipped_theme",     item.id);
      if (slot === "fx")     localStorage.setItem("bk_equipped_fx",        item.id);
      if (slot === "cards")  localStorage.setItem("bk_equipped_cards",     item.id);
      if (slot === "avatar") localStorage.setItem("bk_equipped_character", item.icon);
      if (isLoggedIn()) api.equip({ slot, itemId: item.id }).catch(() => {});
      showToast(`Equipped ${item.name}!`);
    } else {
      setModalItem(item);
    }
  };

  const handlePreviewAction = (item) => {
    setPreviewItem(null);
    handleItemClick(item);
  };

  const handleConfirmPurchase = async (item) => {
    if (!isLoggedIn()) {
      showToast("Sign in to purchase items", "error");
      setModalItem(null);
      return;
    }
    try {
      const res = await api.purchase({ itemId: item.id });
      setBalance(res.newBalance);
      setOwned(prev => new Set([...prev, item.id]));
      setModalItem(null);
      showToast(`Purchased ${item.name}!`);
    } catch (err) {
      showToast(err.message || "Purchase failed", "error");
    }
  };

  const handleConfirmCoins = async (pack) => {
    if (!isLoggedIn()) {
      showToast("Sign in to buy coins", "error");
      setModalPack(null);
      return;
    }
    try {
      const { url } = await api.checkoutCoins({ packId: pack.id });
      setModalPack(null);
      window.location.href = url;
    } catch (err) {
      showToast(err.message || "Could not start checkout", "error");
    }
  };

  const filtered = useMemo(() => {
    if (cat === "featured") {
      return ITEMS.filter(i => (i.rarity === "epic" || i.rarity === "legend") && !owned.has(i.id)).slice(0, 8);
    }
    return ITEMS.filter(i => i.cat === cat);
  }, [cat, owned]);

  const inventoryFiltered = useMemo(() => ITEMS.filter(i => owned.has(i.id)), [owned]);

  const isEquipped = (item) => {
    const slotMap = { avatars:"avatar", themes:"theme", cards:"cards", fx:"fx" };
    const slot = slotMap[item.cat];
    return slot && equipped[slot] === item.id;
  };

  return (
    <div style={{ minHeight:"100vh", background:"transparent", color:C.text, fontFamily:"'DM Sans',sans-serif", paddingBottom:60 }}>
      <style>{css}</style>
      <Toast msg={toast?.msg} type={toast?.type} />

      <div style={{
        background:`linear-gradient(180deg, ${C.a2}11 0%, transparent 100%)`,
        borderBottom:`1px solid ${C.border}`,
        padding:"20px 24px 16px", position:"sticky", top:0, zIndex:20,
        backdropFilter:"blur(12px)", backgroundColor:C.bg + "ee",
      }}>
        <div style={{ maxWidth:1000, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontFamily:"'Boogaloo',cursive", fontSize:30, lineHeight:1, marginBottom:2 }}>
              🛒 <span style={{ color:C.a2 }}>Shop</span>
            </h1>
            <p style={{ fontSize:12, color:C.muted, fontWeight:600 }}>Cosmetics & question packs · No pay-to-win</p>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              background:C.card2, border:`1px solid ${C.a2}44`,
              borderRadius:14, padding:"8px 16px",
              display:"flex", alignItems:"center", gap:10,
              boxShadow:`0 0 16px ${C.a2}15`,
            }}>
              <CoinIcon size={20} />
              <div>
                <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:22, color:C.a2, lineHeight:1 }}>
                  {loading ? "···" : (balance ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>BK Bucks</div>
              </div>
            </div>
            <button className="coin-btn" onClick={() => setView("coinstore")}>+ Add Coins</button>
          </div>
        </div>

        <div style={{ maxWidth:1000, margin:"16px auto 0", display:"flex", gap:6, borderBottom:`1px solid ${C.border}`, paddingBottom:0, overflowX:"auto" }}>
          {[
            { id:"shop",      label:"🛍️ Shop"       },
            { id:"inventory", label:"🎒 Inventory"  },
            { id:"coinstore", label:"💰 Coin Store" },
          ].map(v => (
            <button key={v.id} className={`nav-btn ${view===v.id ? "active" : ""}`}
              onClick={() => setView(v.id)}
              style={{ borderRadius:"10px 10px 0 0", borderBottom: view===v.id ? `2px solid ${C.a4}` : "2px solid transparent", paddingBottom:12 }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:1000, margin:"0 auto", padding:"24px 24px 0" }}>
        {view === "shop" && (
          <div style={{ animation:"fadeUp 0.4s ease" }}>
            <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
              {CATEGORIES.map(c => (
                <button key={c.id} className={`nav-btn ${cat===c.id ? "active" : ""}`} onClick={() => setCat(c.id)}>
                  {c.label}
                </button>
              ))}
            </div>

            {cat === "featured" && (
              <div style={{
                background: `linear-gradient(135deg, ${C.a5}18, ${C.a4}11)`,
                border: `1px solid ${C.a5}44`,
                borderRadius:18, padding:"18px 24px", marginBottom:24,
                display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12,
              }}>
                <div>
                  <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:22, color:C.a2 }}>⭐ Featured This Week</h3>
                  <p style={{ fontSize:13, color:C.muted, fontWeight:600 }}>Hand-picked Epic & Legendary items</p>
                </div>
                <div style={{ background:C.a1+"18", border:`1px solid ${C.a1}44`, borderRadius:10, padding:"6px 14px", color:C.a1, fontSize:12, fontWeight:800 }}>
                  🔥 Limited time
                </div>
              </div>
            )}

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:14 }}>
              {filtered.map(item => (
                <ItemCard key={item.id} item={item} owned={owned.has(item.id)} equipped={isEquipped(item)} balance={balance ?? 0} onClick={handleItemClick} onPreview={setPreviewItem} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign:"center", color:C.muted, padding:"40px 0" }}>
                <div style={{ fontSize:48, marginBottom:10 }}>📭</div>
                No items in this category yet
              </div>
            )}

            <div style={{ marginTop:32, marginBottom:8, background:C.card2, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 18px", display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:22 }}>🛡️</span>
              <div>
                <div style={{ fontWeight:800, fontSize:13 }}>Fair Play Guarantee</div>
                <div style={{ fontSize:12, color:C.muted, fontWeight:500 }}>All purchases are cosmetic or additive. Nothing gives a gameplay advantage.</div>
              </div>
            </div>
          </div>
        )}

        {view === "inventory" && (
          <div style={{ animation:"fadeUp 0.4s ease" }}>
            <div style={{ marginBottom:24 }}>
              <h2 style={{ fontFamily:"'Boogaloo',cursive", fontSize:26, marginBottom:4 }}>🎒 Your Inventory</h2>
              <p style={{ fontSize:13, color:C.muted, fontWeight:600 }}>
                {inventoryFiltered.length} item{inventoryFiltered.length !== 1 ? "s" : ""} owned · Tap to equip
              </p>
            </div>

            <div style={{
              background:`linear-gradient(135deg, ${C.a3}11, ${C.a4}08)`,
              border:`1px solid ${C.a3}33`, borderRadius:18, padding:20, marginBottom:24,
            }}>
              <h3 style={{ fontSize:12, color:C.a3, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>✓ Currently Equipped</h3>
              <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                {[
                  { slot:"avatar", label:"Character"},
                  { slot:"theme",  label:"Theme"   },
                  { slot:"cards",  label:"Cards"   },
                  { slot:"fx",     label:"Victory" },
                ].map(({ slot, label }) => {
                  const item = ITEMS.find(i => i.id === equipped[slot]);
                  if (!item) return null;
                  const r = RARITY[item.rarity];
                  return (
                    <div key={slot} style={{
                      background:C.card2, borderRadius:14, padding:"12px 16px",
                      border:`1px solid ${r.color}44`, flex:"1 1 140px",
                      display:"flex", alignItems:"center", gap:10,
                      boxShadow:`0 0 16px ${r.glow}33`,
                    }}>
                      <div style={{ fontSize:30, filter:`drop-shadow(0 2px 4px ${r.color}66)` }}>{item.icon}</div>
                      <div>
                        <div style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>{label}</div>
                        <div style={{ fontSize:13, fontWeight:800, color:r.color }}>{item.name}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {CATEGORIES.filter(c => c.id !== "featured").map(c => {
              const items = inventoryFiltered.filter(i => i.cat === c.id);
              if (items.length === 0) return null;
              return (
                <div key={c.id} style={{ marginBottom:24 }}>
                  <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:18, marginBottom:12 }}>
                    {c.label} <span style={{ fontSize:13, color:C.muted, fontWeight:600 }}>({items.length})</span>
                  </h3>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:12 }}>
                    {items.map(item => (
                      <ItemCard key={item.id} item={item} owned={true} equipped={isEquipped(item)} balance={balance ?? 0} onClick={handleItemClick} onPreview={setPreviewItem} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === "coinstore" && (
          <div style={{ animation:"fadeUp 0.4s ease" }}>
            <div style={{ marginBottom:24, textAlign:"center" }}>
              <div style={{ fontSize:52, marginBottom:8 }}>💰</div>
              <h2 style={{ fontFamily:"'Boogaloo',cursive", fontSize:30, marginBottom:6 }}>Buy BK Bucks</h2>
              <p style={{ fontSize:14, color:C.muted, fontWeight:500 }}>Top up your wallet to unlock cosmetics in the shop</p>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:18, maxWidth:760, margin:"0 auto" }}>
              {COIN_PACKS.map(p => (
                <CoinPackCard key={p.id} pack={p} onBuy={setModalPack} />
              ))}
            </div>

            <div style={{ marginTop:32, display:"flex", gap:16, flexWrap:"wrap", justifyContent:"center" }}>
              {[
                { icon:"🔒", title:"Secure Payment",   text:"Powered by Stripe — PCI compliant"          },
                { icon:"⚡", title:"Instant Delivery",  text:"Coins added to your account immediately"    },
                { icon:"💎", title:"No Subscription",   text:"One-time purchase, your coins forever"      },
                { icon:"🛡️", title:"No Card Stored",    text:"We never see or store payment details"      },
              ].map((b,i) => (
                <div key={i} style={{
                  background:C.card2, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 18px",
                  display:"flex", alignItems:"center", gap:10, flex:"1 1 200px", maxWidth:240,
                }}>
                  <span style={{ fontSize:20 }}>{b.icon}</span>
                  <div>
                    <div style={{ fontWeight:800, fontSize:12, color:C.text }}>{b.title}</div>
                    <div style={{ fontSize:11, color:C.muted, fontWeight:500 }}>{b.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <PreviewModal item={previewItem} owned={previewItem ? owned.has(previewItem.id) : false} equipped={equipped} balance={balance ?? 0} onAction={handlePreviewAction} onClose={() => setPreviewItem(null)} />
      <PurchaseModal item={modalItem} balance={balance ?? 0} onConfirm={handleConfirmPurchase} onCancel={() => setModalItem(null)} />
      <CoinPackModal pack={modalPack} onConfirm={handleConfirmCoins} onCancel={() => setModalPack(null)} />
    </div>
  );
}

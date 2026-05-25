import { useState, useRef, useEffect } from "react";
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

const SEASON = { name:"Season I: Origins", themeIcon:"🎰", endsIn:"23 days", totalTiers:40 };

function getFreeReward(tier) {
  if (tier % 10 === 0) return { type:"coins",  amount:50,  icon:"💰", name:`${50} BK Bucks`, rarity:"rare"   };
  if (tier % 5  === 0) return { type:"xp",     amount:500, icon:"⭐", name:"500 XP Boost",      rarity:"common" };
  if (tier === 40)     return { type:"avatar",              icon:"🎭", name:"Origins Avatar",     rarity:"epic"   };
  if (tier % 4 === 0)  return { type:"emote",               icon:"😎", name:"Emote",              rarity:"common" };
  if (tier % 3 === 0)  return { type:"xp",     amount:200, icon:"⭐", name:"200 XP",             rarity:"common" };
  return { type:"coins", amount:25, icon:"🪙", name:"25 BK Bucks", rarity:"common" };
}

function getPremiumReward(tier) {
  if (tier === 5)  return { type:"avatar",    icon:"🎭", name:"Season Avatar",         rarity:"epic"   };
  if (tier === 10) return { type:"fx",        icon:"🎆", name:"Origins Fireworks FX",  rarity:"epic"   };
  if (tier === 15) return { type:"coins",     icon:"💎", name:"200 BK Bucks",       rarity:"rare"   };
  if (tier === 20) return { type:"theme",     icon:"🌌", name:"Origins Table Theme",   rarity:"epic"   };
  if (tier === 25) return { type:"badge",     icon:"🏅", name:"Gold Username Badge",   rarity:"epic"   };
  if (tier === 30) return { type:"cards",     icon:"💠", name:"Holographic Cards",     rarity:"epic"   };
  if (tier === 35) return { type:"coins",     icon:"💰", name:"300 BK Bucks",       rarity:"rare"   };
  if (tier === 40) return { type:"legendary", icon:"👑", name:"Legendary Crown Avatar",rarity:"legend" };
  if (tier % 5 === 0)  return { type:"coins", icon:"🪙", amount:100, name:"100 BK Bucks", rarity:"rare"   };
  if (tier % 3 === 0)  return { type:"xp",    icon:"⭐", amount:500, name:"500 XP Bonus",     rarity:"common" };
  if (tier % 2 === 0)  return { type:"emote", icon:"💫", name:"Premium Emote",                rarity:"common" };
  return { type:"coins", icon:"🪙", amount:50, name:"50 BK Bucks", rarity:"common" };
}

const REWARDS = Array.from({ length: 40 }, (_, i) => ({ tier: i+1, free: getFreeReward(i+1), prem: getPremiumReward(i+1) }));

const RARITY = {
  common: { color:"#9ca3af", glow:"#9ca3af33", bg:"#9ca3af14" },
  rare:   { color: C.a4,     glow: C.a4+"55",  bg: C.a4+"15"  },
  epic:   { color: C.a5,     glow: C.a5+"55",  bg: C.a5+"15"  },
  legend: { color: C.a2,     glow: C.a2+"66",  bg: C.a2+"18"  },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Boogaloo&family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

  @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes popIn    { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
  @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes glow     { 0%,100%{box-shadow:0 0 14px var(--glow)} 50%{box-shadow:0 0 28px var(--glow)} }
  @keyframes shine    { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
  @keyframes pulse    { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.06);opacity:0.85} }
  @keyframes xpBar    { from{width:0} to{width:var(--bar-w)} }
  @keyframes confetti { to{transform:translateY(120px) rotate(720deg);opacity:0} }

  ::-webkit-scrollbar { width:6px; height:8px; }
  ::-webkit-scrollbar-thumb { background:${C.border2}; border-radius:3px; }
  ::-webkit-scrollbar-track { background:transparent; }

  .premium-card {
    background:linear-gradient(135deg, ${C.a2}18, ${C.a6}10, ${C.a5}10);
    border:1.5px solid ${C.a2}55;
    box-shadow:0 0 24px ${C.a2}18;
    position:relative; overflow:hidden;
  }
  .premium-card::before {
    content:""; position:absolute; top:0; left:0; width:100%; height:100%;
    background:linear-gradient(105deg, transparent 30%, ${C.a2}22 50%, transparent 70%);
    animation:shine 4s ease-in-out infinite;
  }

  .reward-tile {
    position:relative; padding:10px; border-radius:14px;
    transition:transform 0.18s, box-shadow 0.18s;
    cursor:pointer; min-width:88px;
    display:flex; flex-direction:column; align-items:center;
    text-align:center; gap:4px;
  }
  .reward-tile:hover { transform:translateY(-3px); }
  .reward-tile.locked { opacity:0.45; cursor:not-allowed; filter:grayscale(0.6); }
  .reward-tile.locked:hover { transform:none; }
  .reward-tile.claimable { animation:glow 2s ease-in-out infinite; }

  .scroll-shadow { position:absolute; top:0; bottom:0; width:60px; pointer-events:none; z-index:2; }
  .scroll-shadow.left  { left:0;  background:linear-gradient(90deg, ${C.bg}, transparent); }
  .scroll-shadow.right { right:0; background:linear-gradient(-90deg, ${C.bg}, transparent); }

  button:not(:disabled):active { transform:scale(0.97); }
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

function RewardTile({ reward, claimed, claimable, locked, isPremium, onClaim }) {
  const r = RARITY[reward.rarity] || RARITY.common;
  return (
    <div className={`reward-tile ${locked ? "locked" : ""} ${claimable && !claimed ? "claimable" : ""}`}
      onClick={() => { if (!locked && !claimed && claimable) onClaim(); }}
      style={{
        background: claimed ? "#0d0b1a" : r.bg,
        border: `2px solid ${claimed ? C.border : claimable ? r.color : r.color+"44"}`,
        "--glow": r.glow, opacity: claimed ? 0.55 : 1,
      }}>
      <div style={{
        width:46, height:46, borderRadius:12,
        background: `linear-gradient(135deg, ${r.color}22, ${r.color}08)`,
        border:`1.5px solid ${r.color}33`,
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:24,
        filter: claimed ? "grayscale(0.6)" : `drop-shadow(0 2px 4px ${r.color}66)`,
        animation: claimable && !claimed ? "float 2.5s ease-in-out infinite" : "none",
      }}>{reward.icon}</div>

      <div style={{ fontSize:10, fontWeight:700, color: claimed ? C.muted : r.color, lineHeight:1.2, fontFamily:"'DM Sans',sans-serif", maxWidth:80, overflow:"hidden" }}>{reward.name}</div>

      {claimed && (
        <div style={{ position:"absolute", top:6, right:6, width:18, height:18, borderRadius:"50%", background:C.a3, color:"#0a1a0c", fontSize:11, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 2px 6px ${C.a3}66` }}>✓</div>
      )}
      {locked && !claimed && <div style={{ position:"absolute", top:6, right:6, fontSize:11, opacity:0.6 }}>🔒</div>}
      {claimable && !claimed && (
        <div style={{ position:"absolute", bottom:-6, left:"50%", transform:"translateX(-50%)", background:r.color, color:"#0a0a1a", fontSize:9, fontWeight:900, letterSpacing:0.5, padding:"2px 8px", borderRadius:8, boxShadow:`0 2px 8px ${r.glow}`, animation:"pulse 1.4s ease-in-out infinite" }}>CLAIM</div>
      )}
      {isPremium && !claimable && !claimed && locked && (
        <div style={{ position:"absolute", top:6, left:6, fontSize:9, color:C.a2, fontWeight:800 }}>⭐</div>
      )}
    </div>
  );
}

function TierBlock({ data, current, claimedFree, claimedPrem, hasVIP, onClaim }) {
  const tier        = data.tier;
  const reachedTier = tier <= current;
  const isCurrent   = tier === current;
  const freeClaimed   = claimedFree.includes(tier);
  const premClaimed   = claimedPrem.includes(tier);
  const freeClaimable = reachedTier && !freeClaimed;
  const premClaimable = reachedTier && hasVIP && !premClaimed;
  const premLocked    = !reachedTier || !hasVIP;
  const freeLocked    = !reachedTier;

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, minWidth:108, position:"relative", animation:"fadeUp 0.4s ease" }}>
      <RewardTile reward={data.free} claimed={freeClaimed} claimable={freeClaimable} locked={freeLocked} isPremium={false} onClaim={() => onClaim(tier, "free")} />

      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", position:"relative", padding:"4px 0" }}>
        <div style={{
          width:36, height:36, borderRadius:"50%",
          background: isCurrent ? `linear-gradient(135deg, ${C.a4}, ${C.a5})` : reachedTier ? C.a3+"22" : C.card2,
          border: `2px solid ${isCurrent ? C.a4 : reachedTier ? C.a3+"66" : C.border2}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:"'Boogaloo',cursive", fontSize:15,
          color: isCurrent ? "#fff" : reachedTier ? C.a3 : C.muted2,
          boxShadow: isCurrent ? `0 0 20px ${C.a4}66` : "none",
          animation: isCurrent ? "pulse 2s ease-in-out infinite" : "none",
          zIndex:1,
        }}>{tier}</div>
        <div style={{ position:"absolute", top:36, left:"50%", width:2, height:14, marginLeft:-1, background: reachedTier ? C.a3+"55" : C.border2 }} />
      </div>

      <RewardTile reward={data.prem} claimed={premClaimed} claimable={premClaimable} locked={premLocked} isPremium={true} onClaim={() => onClaim(tier, "prem")} />
    </div>
  );
}

function RewardPopup({ reward, track, onClose }) {
  if (!reward) return null;
  const r = RARITY[reward.rarity] || RARITY.common;
  return (
    <div style={{ position:"fixed", inset:0, background:"#000a", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, animation:"fadeIn 0.2s ease", padding:20 }} onClick={onClose}>
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} style={{
          position:"absolute", top:"40%", left:`${Math.random()*100}%`, width:8, height:14, borderRadius:2,
          background:[C.a1,C.a2,C.a3,C.a4,C.a5][i%5],
          animation:`confetti ${1+Math.random()*1.5}s ease-out forwards`, animationDelay:`${Math.random()*0.4}s`,
        }} />
      ))}
      <div style={{ background:C.card, border:`2px solid ${r.color}`, borderRadius:24, padding:"32px 40px", textAlign:"center", maxWidth:340, animation:"popIn 0.4s cubic-bezier(.17,.67,.35,1.35)", boxShadow:`0 0 60px ${r.glow}`, position:"relative", zIndex:2 }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontSize:64, marginBottom:14, filter:`drop-shadow(0 4px 12px ${r.color}88)`, animation:"float 2.5s ease-in-out infinite" }}>{reward.icon}</div>
        <div style={{ fontSize:11, color:r.color, fontWeight:900, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>{track === "prem" ? "⭐ Premium Reward" : "Free Reward"} · {reward.rarity}</div>
        <h2 style={{ fontFamily:"'Boogaloo',cursive", fontSize:28, color:C.text, marginBottom:8 }}>{reward.name}</h2>
        <p style={{ fontSize:13, color:C.muted, fontWeight:500, marginBottom:20 }}>Added to your inventory!</p>
        <button onClick={onClose} style={{ padding:"12px 28px", borderRadius:12, border:"none", background:`linear-gradient(135deg, ${r.color}, ${r.color}cc)`, color:"#fff", fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:`0 4px 18px ${r.glow}` }}>Awesome!</button>
      </div>
    </div>
  );
}

function VIPModal({ open, onClose, onPurchase }) {
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"#000c", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, animation:"fadeIn 0.2s ease", padding:20 }} onClick={onClose}>
      <div style={{ background:C.card, border:`2px solid ${C.a2}`, borderRadius:24, padding:32, maxWidth:440, width:"100%", animation:"popIn 0.4s cubic-bezier(.17,.67,.35,1.3)", boxShadow:`0 0 60px ${C.a2}33`, position:"relative", overflow:"hidden" }} onClick={e => e.stopPropagation()}>
        <div style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", background:`radial-gradient(circle at 20% 20%, ${C.a2}15, transparent 50%)`, pointerEvents:"none" }} />
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <div style={{ fontSize:60, marginBottom:8, animation:"float 3s ease-in-out infinite" }}>👑</div>
            <h2 style={{ fontFamily:"'Boogaloo',cursive", fontSize:30, color:C.a2 }}>Unlock VIP Pass</h2>
            <p style={{ fontSize:13, color:C.muted, fontWeight:500, marginTop:4 }}>Season I: Origins · {SEASON.endsIn} remaining</p>
          </div>

          <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:16, padding:16, marginBottom:18 }}>
            {[
              { icon:"🎁", text:"Unlock 28 premium reward tiers" },
              { icon:"⚡", text:"+25% XP on every game"          },
              { icon:"💎", text:"Exclusive seasonal cosmetics"    },
              { icon:"🚀", text:"Early access to new question packs" },
              { icon:"⭐", text:"Animated VIP badge in lobbies"  },
            ].map((b, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"6px 0", animation:`fadeUp 0.3s ease ${i*0.07}s both` }}>
                <span style={{ fontSize:18 }}>{b.icon}</span>
                <span style={{ fontSize:13, color:C.text, fontWeight:600 }}>{b.text}</span>
              </div>
            ))}
          </div>

          <div style={{ background:`linear-gradient(135deg, ${C.a2}18, ${C.a6}10)`, border:`1px solid ${C.a2}44`, borderRadius:14, padding:"14px 16px", marginBottom:16, textAlign:"center" }}>
            <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:36, color:C.a2 }}>$4.99</div>
            <div style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase" }}>per month · cancel anytime</div>
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onClose} style={{ flex:1, padding:"13px", borderRadius:12, border:`1.5px solid ${C.border2}`, background:"transparent", color:C.muted, fontWeight:800, fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>Maybe Later</button>
            <button onClick={onPurchase} style={{ flex:2, padding:"13px", borderRadius:12, border:"none", background:`linear-gradient(135deg, ${C.a2}, ${C.a6})`, color:"#111", fontWeight:900, fontSize:14, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:`0 4px 18px ${C.a2}55` }}>🔒 Unlock VIP — $4.99</button>
          </div>

          <p style={{ fontSize:11, color:C.muted2, textAlign:"center", marginTop:12, fontWeight:500 }}>Secure checkout via Stripe · Auto-renews monthly · Cancel anytime in settings</p>
        </div>
      </div>
    </div>
  );
}

export default function BattlePassPage() {
  const [tier,        setTier]        = useState(0);
  const [xp,          setXp]          = useState(0);
  const xpPerTier = 1000;
  const [hasVIP,      setHasVIP]      = useState(false);
  const [claimedFree, setClaimedFree] = useState([]);
  const [claimedPrem, setClaimedPrem] = useState([]);
  const [popup,       setPopup]       = useState(null);
  const [vipModal,    setVipModal]    = useState(false);
  const [view,        setView]        = useState("track");
  const [loading,     setLoading]     = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn()) { setLoading(false); return; }
    Promise.all([api.battlePass(), api.me()])
      .then(([bpRes, meRes]) => {
        const bp = bpRes.battlePass;
        if (bp) {
          setTier(bp.current_tier || 0);
          setXp(bp.xp || 0);
          setClaimedFree(bp.claimed_free || []);
          setClaimedPrem(bp.claimed_premium || []);
        }
        if (meRes.profile?.is_vip) setHasVIP(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const target = (tier - 1) * 108 - 200;
      scrollRef.current.scrollTo({ left: Math.max(0, target), behavior:"smooth" });
    }
  }, [tier]);

  const handleClaim = (tierNum, track) => {
    const data = REWARDS.find(r => r.tier === tierNum);
    if (!data) return;
    if (track === "free") {
      if (claimedFree.includes(tierNum)) return;
      setClaimedFree(prev => [...prev, tierNum]);
      setPopup({ reward: data.free, track:"free" });
      if (isLoggedIn()) api.claimTier({ tier: tierNum, track: "free" }).catch(() => {});
    } else {
      if (!hasVIP) { setVipModal(true); return; }
      if (claimedPrem.includes(tierNum)) return;
      setClaimedPrem(prev => [...prev, tierNum]);
      setPopup({ reward: data.prem, track:"prem" });
      if (isLoggedIn()) api.claimTier({ tier: tierNum, track: "premium" }).catch(() => {});
    }
  };

  const unclaimedFree = REWARDS.filter(r => r.tier <= tier && !claimedFree.includes(r.tier)).length;
  const unclaimedPrem = hasVIP ? REWARDS.filter(r => r.tier <= tier && !claimedPrem.includes(r.tier)).length : 0;
  const xpPct = Math.round((xp / xpPerTier) * 100);

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'DM Sans',sans-serif", paddingBottom:60 }}>
      <style>{css}</style>

      <div style={{ background:`linear-gradient(180deg, ${C.a2}11 0%, ${C.a5}08 40%, transparent 100%)`, borderBottom:`1px solid ${C.border}`, padding:"28px 24px 0", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(${C.border}44 1px, transparent 1px), linear-gradient(90deg, ${C.border}44 1px, transparent 1px)`, backgroundSize:"32px 32px", opacity:0.35 }} />

        <div style={{ maxWidth:1100, margin:"0 auto", position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:16, marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ fontSize:48, animation:"float 4s ease-in-out infinite", filter:`drop-shadow(0 4px 12px ${C.a2}66)` }}>{SEASON.themeIcon}</div>
              <div>
                <div style={{ fontSize:11, color:C.a2, fontWeight:900, letterSpacing:1.5, textTransform:"uppercase", marginBottom:2 }}>Battle Pass</div>
                <h1 style={{ fontFamily:"'Boogaloo',cursive", fontSize:30, lineHeight:1 }}>{SEASON.name}</h1>
                <p style={{ fontSize:12, color:C.muted, fontWeight:600, marginTop:4 }}>⏰ Ends in {SEASON.endsIn} · {SEASON.totalTiers} tiers</p>
              </div>
            </div>

            {hasVIP ? (
              <div style={{ background:`linear-gradient(135deg, ${C.a2}18, ${C.a6}10)`, border:`1.5px solid ${C.a2}66`, borderRadius:14, padding:"10px 18px", display:"flex", alignItems:"center", gap:10, boxShadow:`0 0 20px ${C.a2}22` }}>
                <span style={{ fontSize:24 }}>👑</span>
                <div>
                  <div style={{ fontSize:13, color:C.a2, fontWeight:900, lineHeight:1 }}>VIP ACTIVE</div>
                  <div style={{ fontSize:10, color:C.muted, fontWeight:600 }}>+25% XP boost</div>
                </div>
              </div>
            ) : (
              <button onClick={() => setVipModal(true)} className="premium-card"
                style={{ border:"none", borderRadius:14, padding:"10px 18px", cursor:"pointer", display:"flex", alignItems:"center", gap:10, color:C.text, fontFamily:"'DM Sans',sans-serif" }}>
                <span style={{ fontSize:24 }}>⭐</span>
                <div style={{ textAlign:"left", position:"relative", zIndex:2 }}>
                  <div style={{ fontSize:13, color:C.a2, fontWeight:900, lineHeight:1 }}>Unlock VIP</div>
                  <div style={{ fontSize:11, color:C.muted, fontWeight:600 }}>$4.99/mo</div>
                </div>
              </button>
            )}
          </div>

          <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:18, padding:"18px 22px", marginBottom:20 }}>
            {loading ? (
              <div style={{ textAlign:"center", padding:"20px 0", color:C.muted, fontSize:13, fontWeight:600 }}>Loading...</div>
            ) : !isLoggedIn() ? (
              <div style={{ textAlign:"center", padding:"20px 0" }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🔒</div>
                <div style={{ fontSize:14, color:C.muted, fontWeight:600 }}>Sign in to track your Battle Pass progress</div>
              </div>
            ) : (
              <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, flexWrap:"wrap", gap:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                    <div style={{ width:54, height:54, borderRadius:"50%", background:`linear-gradient(135deg, ${C.a4}, ${C.a5})`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Boogaloo',cursive", fontSize:24, color:"#fff", boxShadow:`0 0 24px ${C.a4}55`, animation:"pulse 2.5s ease-in-out infinite" }}>{tier}</div>
                    <div>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>Current Tier</div>
                      <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:22, color:C.text }}>Tier {tier} → Tier {Math.min(tier+1, SEASON.totalTiers)}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:22, color: unclaimedFree > 0 ? C.a3 : C.muted }}>{unclaimedFree}</div>
                      <div style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase" }}>Free Rewards</div>
                    </div>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontFamily:"'Boogaloo',cursive", fontSize:22, color: unclaimedPrem > 0 ? C.a2 : hasVIP ? C.muted : C.muted2 }}>{hasVIP ? unclaimedPrem : "🔒"}</div>
                      <div style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase" }}>Premium {hasVIP ? "" : "Locked"}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:0.5, textTransform:"uppercase" }}>Tier Progress</span>
                    <span style={{ fontSize:12, fontWeight:700, color:C.a4 }}>{xp.toLocaleString()} / {xpPerTier.toLocaleString()} XP</span>
                  </div>
                  <div style={{ height:10, background:C.border2, borderRadius:5, overflow:"hidden" }}>
                    <div style={{ "--bar-w": `${xpPct}%`, height:"100%", borderRadius:5, background:`linear-gradient(90deg, ${C.a4}, ${C.a5})`, width:`${xpPct}%`, boxShadow:`0 0 14px ${C.a4}88`, animation:"xpBar 1.2s cubic-bezier(.4,0,.2,1) forwards" }} />
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ display:"flex", gap:2, borderBottom:`1px solid ${C.border}`, paddingBottom:0, overflowX:"auto" }}>
            {[
              { id:"track",       label:"🎯 Reward Track" },
              { id:"info",        label:"📜 Season Info"  },
              { id:"leaderboard", label:"🏆 Leaderboard"  },
            ].map(v => (
              <button key={v.id} onClick={() => setView(v.id)} style={{
                padding:"10px 16px", border:"none", background:"transparent",
                color: view===v.id ? C.text : C.muted,
                borderRadius:"10px 10px 0 0",
                borderBottom: view===v.id ? `2px solid ${C.a4}` : "2px solid transparent",
                fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap",
              }}>{v.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"24px 0 0" }}>
        {view === "track" && (
          <div style={{ animation:"fadeUp 0.4s ease" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:6, padding:"0 24px", marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ background: C.muted+"22", color:C.muted, border:`1px solid ${C.muted}44`, borderRadius:8, padding:"4px 12px", fontSize:11, fontWeight:800, letterSpacing:0.5, textTransform:"uppercase" }}>Free</div>
                <span style={{ color:C.muted, fontSize:12, fontWeight:600 }}>Available to everyone</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ background:`linear-gradient(135deg, ${C.a2}, ${C.a6})`, color:"#111", border:"none", borderRadius:8, padding:"4px 12px", fontSize:11, fontWeight:900, letterSpacing:0.5, textTransform:"uppercase", boxShadow:`0 2px 8px ${C.a2}44` }}>⭐ Premium</div>
                <span style={{ color:C.muted, fontSize:12, fontWeight:600 }}>{hasVIP ? "Unlocked" : "Requires VIP Pass"}</span>
              </div>
            </div>

            <div style={{ position:"relative" }}>
              <div className="scroll-shadow left"  />
              <div className="scroll-shadow right" />
              <div ref={scrollRef} style={{ overflowX:"auto", padding:"20px 24px 28px", scrollSnapType:"x mandatory", scrollPaddingLeft:24 }}>
                <div style={{ display:"flex", gap:0, alignItems:"center" }}>
                  {REWARDS.map((r) => (
                    <div key={r.tier} style={{ scrollSnapAlign:"start", flexShrink:0, position:"relative" }}>
                      <TierBlock data={r} current={tier} claimedFree={claimedFree} claimedPrem={claimedPrem} hasVIP={hasVIP} onClaim={handleClaim} />
                      {r.tier < REWARDS.length && (
                        <div style={{ position:"absolute", top:"50%", right:-2, width:14, height:2, background: r.tier < tier ? C.a3+"55" : C.border2, zIndex:0 }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {(unclaimedFree > 0 || unclaimedPrem > 0) && (
              <div style={{ padding:"0 24px", marginTop:8, textAlign:"center" }}>
                <button onClick={() => {
                  REWARDS.forEach(r => {
                    if (r.tier <= tier && !claimedFree.includes(r.tier)) setClaimedFree(prev => [...prev, r.tier]);
                    if (hasVIP && r.tier <= tier && !claimedPrem.includes(r.tier)) setClaimedPrem(prev => [...prev, r.tier]);
                  });
                }} style={{ padding:"12px 24px", borderRadius:12, border:"none", background:`linear-gradient(135deg, ${C.a3}, ${C.a4})`, color:"#fff", fontWeight:900, fontSize:14, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:`0 4px 18px ${C.a3}44` }}>
                  🎁 Claim All ({unclaimedFree + unclaimedPrem})
                </button>
              </div>
            )}
          </div>
        )}

        {view === "info" && (
          <div style={{ padding:"0 24px", animation:"fadeUp 0.4s ease", display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:16, padding:20 }}>
              <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:22, marginBottom:12 }}>📜 About Season I: Origins</h3>
              <p style={{ fontSize:13, color:C.text, lineHeight:1.6, fontWeight:500 }}>Welcome to the very first season of Betcha Know! Earn XP by playing games, winning rounds, and landing bluffs to unlock 40 tiers of exclusive rewards.</p>
            </div>

            <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:16, padding:20 }}>
              <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:20, marginBottom:14 }}>⚡ How to Earn XP</h3>
              {[
                { icon:"✅", action:"Correct answer",     xp:"+15 XP"    },
                { icon:"🔥", action:"3+ answer streak",   xp:"+25 XP/ans" },
                { icon:"🥇", action:"1st place finish",   xp:"+1000 XP"  },
                { icon:"🥈", action:"2nd place finish",   xp:"+450 XP"   },
                { icon:"🥉", action:"3rd place finish",   xp:"+250 XP"   },
                { icon:"👑", action:"VIP pass boost",     xp:"+25% all"  },
              ].map((r,i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom: i < 5 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:18 }}>{r.icon}</span>
                    <span style={{ fontSize:13, fontWeight:600 }}>{r.action}</span>
                  </div>
                  <span style={{ fontSize:13, color:C.a4, fontWeight:800 }}>{r.xp}</span>
                </div>
              ))}
            </div>

            <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:16, padding:20 }}>
              <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:20, marginBottom:14 }}>🎖️ Premium Highlights</h3>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
                {[
                  { tier:5,  icon:"🎭", name:"Season Avatar"     },
                  { tier:10, icon:"🎆", name:"Origins Fireworks" },
                  { tier:20, icon:"🌌", name:"Origins Theme"     },
                  { tier:25, icon:"🏅", name:"Gold Badge"        },
                  { tier:30, icon:"💠", name:"Holo Cards"        },
                  { tier:40, icon:"👑", name:"Crown Avatar"      },
                ].map((r,i) => (
                  <div key={i} style={{ background:C.a2+"10", border:`1px solid ${C.a2}33`, borderRadius:12, padding:"12px", textAlign:"center", animation:`fadeUp 0.4s ease ${i*0.05}s both` }}>
                    <div style={{ fontSize:32, marginBottom:6, filter:`drop-shadow(0 2px 6px ${C.a2}66)` }}>{r.icon}</div>
                    <div style={{ fontSize:12, fontWeight:800, color:C.a2 }}>{r.name}</div>
                    <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>Tier {r.tier}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:16, padding:20 }}>
              <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:20, marginBottom:10 }}>💡 FAQ</h3>
              {[
                { q:"Will I lose progress when the season ends?", a:"Your owned cosmetics are kept forever. Tier progress resets each season." },
                { q:"Can I buy VIP later and still get past rewards?", a:"Yes! When you purchase VIP, all premium rewards up to your current tier become claimable." },
                { q:"What happens to unspent BK Bucks?", a:"They never expire and carry over between seasons." },
              ].map((f, i) => (
                <div key={i} style={{ padding:"12px 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ fontSize:13, fontWeight:800, color:C.text, marginBottom:4 }}>{f.q}</div>
                  <div style={{ fontSize:12, color:C.muted, fontWeight:500, lineHeight:1.5 }}>{f.a}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "leaderboard" && (
          <div style={{ padding:"0 24px", animation:"fadeUp 0.4s ease" }}>
            <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:16, padding:40, textAlign:"center" }}>
              <div style={{ fontSize:52, marginBottom:14 }}>🏆</div>
              <h3 style={{ fontFamily:"'Boogaloo',cursive", fontSize:24, marginBottom:8 }}>Season Leaderboard</h3>
              <p style={{ fontSize:13, color:C.muted, fontWeight:500 }}>Coming soon — keep earning XP to climb the ranks!</p>
            </div>
          </div>
        )}
      </div>

      <RewardPopup reward={popup?.reward} track={popup?.track} onClose={() => setPopup(null)} />
      <VIPModal open={vipModal} onClose={() => setVipModal(false)} onPurchase={() => {
        if (isLoggedIn()) {
          api.checkoutVIP({}).then(d => { if (d.url) window.open(d.url, "_blank"); }).catch(() => {});
        }
        setVipModal(false);
      }} />
    </div>
  );
}

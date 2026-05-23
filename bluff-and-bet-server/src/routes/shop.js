// ─── src/routes/shop.js ───────────────────────────────────────────────────────
const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const { asyncHandler, createError } = require("../middleware/errorHandler");
const { supabaseAdmin } = require("../db/supabase");

// Full catalog (mirrors frontend)
const CATALOG = [
  { id:"av_classic",   cat:"avatars", price:0,    rarity:"common"  },
  { id:"av_shark",     cat:"avatars", price:200,  rarity:"common"  },
  { id:"av_jester",    cat:"avatars", price:200,  rarity:"common"  },
  { id:"av_crown",     cat:"avatars", price:350,  rarity:"rare"    },
  { id:"av_diamond",   cat:"avatars", price:350,  rarity:"rare"    },
  { id:"av_dragon",    cat:"avatars", price:500,  rarity:"epic"    },
  { id:"av_phoenix",   cat:"avatars", price:500,  rarity:"epic"    },
  { id:"th_neon",      cat:"themes",  price:0,    rarity:"common"  },
  { id:"th_space",     cat:"themes",  price:500,  rarity:"rare"    },
  { id:"th_tropical",  cat:"themes",  price:600,  rarity:"rare"    },
  { id:"th_haunted",   cat:"themes",  price:800,  rarity:"epic"    },
  { id:"th_cyberpunk", cat:"themes",  price:900,  rarity:"epic"    },
  { id:"th_golden",    cat:"themes",  price:1000, rarity:"legend"  },
  { id:"card_default", cat:"cards",   price:0,    rarity:"common"  },
  { id:"card_holo",    cat:"cards",   price:300,  rarity:"rare"    },
  { id:"card_gold",    cat:"cards",   price:400,  rarity:"rare"    },
  { id:"card_neon",    cat:"cards",   price:450,  rarity:"epic"    },
  { id:"card_diamond", cat:"cards",   price:500,  rarity:"epic"    },
  { id:"fx_confetti",  cat:"fx",      price:0,    rarity:"common"  },
  { id:"fx_money",     cat:"fx",      price:300,  rarity:"rare"    },
  { id:"fx_fireworks", cat:"fx",      price:400,  rarity:"rare"    },
  { id:"fx_lightning", cat:"fx",      price:500,  rarity:"epic"    },
  { id:"fx_galaxy",    cat:"fx",      price:600,  rarity:"legend"  },
  { id:"qp_classic",   cat:"packs",   price:0,    rarity:"common"  },
  { id:"qp_games",     cat:"packs",   price:400,  rarity:"rare"    },
  { id:"qp_anime",     cat:"packs",   price:500,  rarity:"rare"    },
  { id:"qp_food",      cat:"packs",   price:500,  rarity:"rare"    },
  { id:"qp_crime",     cat:"packs",   price:600,  rarity:"epic"    },
  { id:"qp_nostalgia", cat:"packs",   price:700,  rarity:"epic"    },
  { id:"qp_legends",   cat:"packs",   price:800,  rarity:"legend"  },
];

// GET /api/shop/catalog
router.get("/catalog", asyncHandler(async (req, res) => {
  res.json({ items: CATALOG });
}));

// GET /api/shop/inventory — player's owned items
router.get("/inventory", requireAuth, asyncHandler(async (req, res) => {
  const { data } = await supabaseAdmin
    .from("inventory")
    .select("item_id, item_type, obtained_at")
    .eq("user_id", req.user.id);
  res.json({ inventory: data || [] });
}));

// GET /api/shop/equipped
router.get("/equipped", requireAuth, asyncHandler(async (req, res) => {
  const { data } = await supabaseAdmin
    .from("equipped")
    .select("*")
    .eq("user_id", req.user.id)
    .single();
  res.json({ equipped: data });
}));

// POST /api/shop/purchase  { itemId }
router.post("/purchase", requireAuth, asyncHandler(async (req, res) => {
  const { itemId } = req.body;
  const item = CATALOG.find(i => i.id === itemId);
  if (!item) throw createError(404, "Item not found");
  if (item.price === 0) throw createError(400, "Item is free — claim via /shop/claim-free");

  const { data: profile } = await supabaseAdmin
    .from("profiles").select("bluff_bucks").eq("id", req.user.id).single();
  if (!profile) throw createError(404, "Profile not found");
  if (profile.bluff_bucks < item.price)
    throw createError(400, `Not enough Bluff Bucks. Need ${item.price}, have ${profile.bluff_bucks}`);

  // Check not already owned
  const { data: owned } = await supabaseAdmin
    .from("inventory").select("id").eq("user_id", req.user.id).eq("item_id", itemId).maybeSingle();
  if (owned) throw createError(409, "Item already owned");

  // Deduct coins + add to inventory (transactional)
  const { error: deductErr } = await supabaseAdmin
    .from("profiles")
    .update({ bluff_bucks: profile.bluff_bucks - item.price })
    .eq("id", req.user.id);
  if (deductErr) throw createError(500, "Failed to deduct coins");

  await supabaseAdmin.from("inventory").insert({
    user_id: req.user.id, item_id: itemId, item_type: item.cat,
  });

  // Log purchase
  await supabaseAdmin.from("purchases").insert({
    user_id: req.user.id, product_type: "cosmetic",
    product_id: itemId, coins_granted: 0, status: "completed",
  });

  res.json({ success: true, newBalance: profile.bluff_bucks - item.price });
}));

// POST /api/shop/claim-free  { itemId }
router.post("/claim-free", requireAuth, asyncHandler(async (req, res) => {
  const { itemId } = req.body;
  const item = CATALOG.find(i => i.id === itemId && i.price === 0);
  if (!item) throw createError(404, "Free item not found");

  await supabaseAdmin.from("inventory").upsert(
    { user_id: req.user.id, item_id: itemId, item_type: item.cat },
    { onConflict: "user_id,item_id", ignoreDuplicates: true }
  );
  res.json({ success: true });
}));

// POST /api/shop/equip  { slot, itemId }
router.post("/equip", requireAuth, asyncHandler(async (req, res) => {
  const { slot, itemId } = req.body;
  const validSlots = ["avatar","theme","cards","fx","badge1","badge2","badge3"];
  if (!validSlots.includes(slot)) throw createError(400, "Invalid slot");

  // Verify owned
  const { data: inv } = await supabaseAdmin
    .from("inventory").select("id").eq("user_id", req.user.id).eq("item_id", itemId).maybeSingle();
  if (!inv && !["badge1","badge2","badge3"].includes(slot))
    throw createError(403, "Item not owned");

  await supabaseAdmin.from("equipped")
    .upsert({ user_id: req.user.id, [slot]: itemId, updated_at: new Date() },
            { onConflict: "user_id" });

  res.json({ success: true });
}));

module.exports = router;

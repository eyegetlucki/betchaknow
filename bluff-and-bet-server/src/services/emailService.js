// Email service using Resend (swap for any provider)
async function sendVerification(email, username, code) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Email] Verification code for ${username} (${email}): ${code}`);
    return;
  }
  if (!process.env.RESEND_API_KEY) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method:"POST",
      headers:{ Authorization:`Bearer ${process.env.RESEND_API_KEY}`, "Content-Type":"application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "noreply@bluffandbet.com",
        to: email,
        subject: "Verify your Bluff & Bet account",
        html: `<h2>Hi ${username}!</h2><p>Your verification code is:</p><h1 style="letter-spacing:8px;">${code}</h1><p>Expires in 30 minutes.</p>`,
      }),
    });
  } catch (err) {
    console.error("[Email] Send failed:", err.message);
  }
}
module.exports = { sendVerification };

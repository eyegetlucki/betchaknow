async function sendVerification(email, username, code) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // No API key — print to terminal for local testing
    console.log(`\n[Email] ⚡ Verification code for ${username} (${email}): ${code}\n`);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        to: email,
        subject: "Your Betcha Know! verification code",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f0e17;color:#fffffe;border-radius:16px;">
            <h2 style="color:#ffd93d;font-size:28px;margin-bottom:8px;">🎯 Betcha Know!</h2>
            <p style="color:#a7a9be;margin-bottom:24px;">Hi <strong style="color:#fffffe;">${username}</strong>, here is your verification code:</p>
            <div style="background:#1a1828;border:2px solid #4d96ff44;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
              <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#4d96ff;">${code}</span>
            </div>
            <p style="color:#a7a9be;font-size:14px;">This code expires in <strong>30 minutes</strong>. If you didn't create an account, you can ignore this email.</p>
          </div>
        `,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) console.error("[Email] Resend error:", JSON.stringify(data));
  } catch (err) {
    console.error("[Email] Send failed:", err.message);
  }
}

module.exports = { sendVerification };

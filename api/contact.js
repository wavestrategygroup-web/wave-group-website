// Vercel serverless function — sends the contact form via Resend.
// Requires RESEND_API_KEY set as an environment variable in the Vercel project.
//
// Until wavegroup.capital is a verified sending domain in Resend, emails send
// from Resend's shared test address (onboarding@resend.dev) with the visitor's
// email set as reply-to — replying still reaches them fine. Once the domain is
// verified, change FROM_ADDRESS below to something like
// "Wave Group Website <inquiries@wavegroup.capital>".

const FROM_ADDRESS = "Wave Group Website <onboarding@resend.dev>";
const TO_ADDRESS = "inquiries@wavegroup.capital";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are all required." });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({ error: "That email address doesn't look valid." });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set in the environment.");
    return res.status(500).json({ error: "Email service isn't configured yet." });
  }

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [TO_ADDRESS],
        reply_to: email,
        subject: `Website inquiry from ${name}`,
        text: `${message}\n\n—\n${name}\n${email}`,
      }),
    });

    if (!resendResponse.ok) {
      const details = await resendResponse.text();
      console.error("Resend API error:", resendResponse.status, details);
      return res.status(502).json({ error: "The email failed to send. Please try again." });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}

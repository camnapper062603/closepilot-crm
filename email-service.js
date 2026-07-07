export async function sendInviteEmailWithResend({
  to,
  from,
  replyTo,
  workspaceName,
  appName = "Kira Home",
  role,
  productUrl,
  inviteLink,
  temporaryPassword,
  temporaryPasswordWorks = true,
  existingUser = false,
  authMessage = "",
}) {
  const apiKey = process.env.RESEND_API_KEY || "";
  const sender = from || process.env.INVITE_FROM_EMAIL || "";

  if (!apiKey) {
    return {
      sent: false,
      setupError: true,
      message: "Invite link generated. Add RESEND_API_KEY and INVITE_FROM_EMAIL to send email automatically.",
    };
  }

  if (!sender) {
    return {
      sent: false,
      setupError: true,
      message: "Invite link generated. Add INVITE_FROM_EMAIL to choose a verified Resend sender.",
    };
  }

  const safeWorkspaceName = workspaceName || appName;
  const safeRole = role || "member";
  const safeProductUrl = productUrl || inviteLink;
  const passwordLine = temporaryPasswordWorks
    ? `Temporary password: ${temporaryPassword}`
    : existingUser
      ? "Temporary password: use your existing Kira Home password for this email."
      : `Temporary password: ${temporaryPassword} (setup mode until Supabase Auth provisioning is configured)`;
  const passwordHtml = temporaryPasswordWorks
    ? `<code>${escapeHtml(temporaryPassword)}</code>`
    : existingUser
      ? "Use your existing Kira Home password for this email."
      : `<code>${escapeHtml(temporaryPassword)}</code> <span>(setup mode until Supabase Auth provisioning is configured)</span>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: `${appName} <${sender}>`,
      to: [to],
      reply_to: replyTo || sender,
      subject: `You're invited to ${safeWorkspaceName}`,
      text: [
        `You've been invited to ${safeWorkspaceName} in ${appName}.`,
        `Invite email: ${to}`,
        `Role: ${safeRole}`,
        `Product URL: ${safeProductUrl}`,
        passwordLine,
        "After signing in, change this temporary password. That starts your automated onboarding checklist in Kira Home.",
        authMessage ? `Auth note: ${authMessage}` : "",
        "",
        `Accept your invite: ${inviteLink}`,
      ]
        .filter(Boolean)
        .join("\n"),
      html: [
        `<p>You've been invited to <strong>${escapeHtml(safeWorkspaceName)}</strong> in ${escapeHtml(appName)}.</p>`,
        "<ul>",
        `<li><strong>Invite email:</strong> ${escapeHtml(to)}</li>`,
        `<li><strong>Role:</strong> ${escapeHtml(safeRole)}</li>`,
        `<li><strong>Product URL:</strong> <a href="${escapeAttribute(safeProductUrl)}">${escapeHtml(
          safeProductUrl,
        )}</a></li>`,
        `<li><strong>Temporary password:</strong> ${passwordHtml}</li>`,
        "</ul>",
        "<p>After signing in, change this temporary password. That starts your automated onboarding checklist in Kira Home.</p>",
        authMessage ? `<p><small>${escapeHtml(authMessage)}</small></p>` : "",
        `<p><a href="${escapeAttribute(inviteLink)}">Accept your invite</a></p>`,
      ].join(""),
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    let message = body || `Resend request failed with ${response.status}.`;
    try {
      message = JSON.parse(body).message || message;
    } catch {
      // Keep Resend's raw response when it is not JSON.
    }
    const error = new Error(message);
    error.statusCode = 502;
    throw error;
  }

  return { sent: true };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

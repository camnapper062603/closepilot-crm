export async function sendInviteEmailWithResend({
  to,
  from,
  replyTo,
  workspaceName,
  appName = "Kira Home",
  role,
  productUrl,
  inviteLink,
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
        "",
        `Accept your invite: ${inviteLink}`,
      ].join("\n"),
      html: [
        `<p>You've been invited to <strong>${escapeHtml(safeWorkspaceName)}</strong> in ${escapeHtml(appName)}.</p>`,
        "<ul>",
        `<li><strong>Invite email:</strong> ${escapeHtml(to)}</li>`,
        `<li><strong>Role:</strong> ${escapeHtml(safeRole)}</li>`,
        `<li><strong>Product URL:</strong> <a href="${escapeAttribute(safeProductUrl)}">${escapeHtml(
          safeProductUrl,
        )}</a></li>`,
        "</ul>",
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

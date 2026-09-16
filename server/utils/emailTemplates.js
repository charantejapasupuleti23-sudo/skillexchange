/**
 * Base email layout wrapper with modern, clean styling
 */
const baseLayout = ({ title, preheader, content, clientUrl }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { color: #e0e7ff; margin: 6px 0 0 0; font-size: 14px; }
    .body { padding: 32px 28px; }
    .body h2 { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
    .body p { font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 20px; }
    .card { background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
    .info-label { font-weight: 600; color: #64748b; }
    .info-value { font-weight: 600; color: #0f172a; text-align: right; }
    .meet-btn { display: inline-block; background-color: #00ac47; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 10px; text-align: center; margin: 10px 0; box-shadow: 0 2px 4px rgba(0,172,71,0.25); }
    .action-btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 10px; text-align: center; margin: 10px 0; }
    .footer { background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
    .footer a { color: #6366f1; text-decoration: none; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader || title}
  </div>
  <div class="container">
    <div class="header">
      <h1>SkillLoop</h1>
      <p>Peer-to-Peer Skill Exchange Platform</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>Sent with care by <a href="${clientUrl}">SkillLoop</a>. Connect, Learn, and Grow together.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Email template when a new exchange/connection request is sent
 */
const exchangeRequestEmail = ({ senderName, receiverName, teachSkill, learnSkill, message, clientUrl }) => {
  const content = `
    <h2>New Connection & Exchange Request 🤝</h2>
    <p>Hi <strong>${receiverName}</strong>,</p>
    <p><strong>${senderName}</strong> wants to connect with you on SkillLoop to exchange skills!</p>

    <div class="card">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Offered to teach you:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #4f46e5; text-align: right; font-size: 14px;">${teachSkill}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Wants to learn from you:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #0d9488; text-align: right; font-size: 14px;">${learnSkill}</td>
        </tr>
      </table>
    </div>

    ${message ? `<p style="font-style: italic; background: #fff; border-left: 3px solid #6366f1; padding: 10px 14px; margin: 15px 0;">"${message}"</p>` : ''}

    <div style="text-align: center; margin-top: 25px;">
      <a href="${clientUrl}/requests" class="action-btn">Review & Respond to Request</a>
    </div>
  `;

  return baseLayout({
    title: `New Skill Exchange Request from ${senderName}`,
    preheader: `${senderName} wants to exchange skills: Teach ${teachSkill} & Learn ${learnSkill}`,
    content,
    clientUrl,
  });
};

/**
 * Email template when an exchange/connection request is accepted
 */
const exchangeAcceptedEmail = ({ senderName, accepterName, teachSkill, learnSkill, clientUrl }) => {
  const content = `
    <h2>Exchange Request Accepted! 🎉</h2>
    <p>Hi <strong>${senderName}</strong>,</p>
    <p>Great news! <strong>${accepterName}</strong> accepted your skill exchange proposal for <strong>${teachSkill}</strong> and <strong>${learnSkill}</strong>. You are now connected!</p>

    <p>You can now chat, collaborate, and schedule your first Google Meet learning session directly on SkillLoop.</p>

    <div style="text-align: center; margin-top: 25px;">
      <a href="${clientUrl}/connections" class="action-btn">View Connection & Schedule Session</a>
    </div>
  `;

  return baseLayout({
    title: `${accepterName} accepted your Skill Exchange Request!`,
    preheader: `You are now connected with ${accepterName} on SkillLoop.`,
    content,
    clientUrl,
  });
};

/**
 * Email template when a learning session is scheduled with Google Meet
 */
const sessionScheduledEmail = ({
  recipientName,
  otherPartyName,
  skillName,
  teacherName,
  learnerName,
  date,
  startTime,
  endTime,
  meetingLink,
  notes,
  clientUrl,
}) => {
  const content = `
    <h2>Learning Session Scheduled 📅</h2>
    <p>Hi <strong>${recipientName}</strong>,</p>
    <p>A new learning session for <strong>${skillName}</strong> has been scheduled with <strong>${otherPartyName}</strong>.</p>

    <div class="card">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Skill:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #0f172a; text-align: right; font-size: 14px;">${skillName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Date:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #0f172a; text-align: right; font-size: 14px;">${date}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Time:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #0f172a; text-align: right; font-size: 14px;">${startTime} - ${endTime}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Teacher:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #0f172a; text-align: right; font-size: 14px;">${teacherName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Learner:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #0f172a; text-align: right; font-size: 14px;">${learnerName}</td>
        </tr>
      </table>
    </div>

    ${notes ? `<p style="font-size: 14px; background: #fff; border-left: 3px solid #4f46e5; padding: 10px 14px; margin: 15px 0;"><strong>Agenda:</strong> ${notes}</p>` : ''}

    <div style="text-align: center; margin: 25px 0;">
      <a href="${meetingLink}" target="_blank" class="meet-btn">
        📹 Join Google Meet Room
      </a>
      <p style="font-size: 12px; color: #64748b; margin-top: 6px;">
        Meeting URL: <a href="${meetingLink}" style="color: #4f46e5;">${meetingLink}</a>
      </p>
    </div>

    <div style="text-align: center; margin-top: 15px;">
      <a href="${clientUrl}/sessions" class="action-btn">View All Sessions on SkillLoop</a>
    </div>
  `;

  return baseLayout({
    title: `Session Scheduled: ${skillName} (${date})`,
    preheader: `Google Meet link for your ${skillName} session on ${date} at ${startTime}`,
    content,
    clientUrl,
  });
};

/**
 * Email template when a session is confirmed
 */
const sessionConfirmedEmail = ({
  recipientName,
  otherPartyName,
  skillName,
  date,
  startTime,
  endTime,
  meetingLink,
  clientUrl,
}) => {
  const content = `
    <h2>Session Confirmed! ✅</h2>
    <p>Hi <strong>${recipientName}</strong>,</p>
    <p>Your learning session with <strong>${otherPartyName}</strong> for <strong>${skillName}</strong> is now confirmed!</p>

    <div class="card">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Skill:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #0f172a; text-align: right; font-size: 14px;">${skillName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Date:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #0f172a; text-align: right; font-size: 14px;">${date}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Time:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #0f172a; text-align: right; font-size: 14px;">${startTime} - ${endTime}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 25px 0;">
      <a href="${meetingLink}" target="_blank" class="meet-btn">
        📹 Join Google Meet Room
      </a>
      <p style="font-size: 12px; color: #64748b; margin-top: 6px;">
        Meeting URL: <a href="${meetingLink}" style="color: #4f46e5;">${meetingLink}</a>
      </p>
    </div>

    <div style="text-align: center; margin-top: 15px;">
      <a href="${clientUrl}/sessions" class="action-btn">Manage Sessions</a>
    </div>
  `;

  return baseLayout({
    title: `Session Confirmed: ${skillName} with ${otherPartyName}`,
    preheader: `Your session for ${skillName} on ${date} is confirmed. Join with Google Meet.`,
    content,
    clientUrl,
  });
};

module.exports = {
  exchangeRequestEmail,
  exchangeAcceptedEmail,
  sessionScheduledEmail,
  sessionConfirmedEmail,
};

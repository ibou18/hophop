export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_PHONE_NUMBER?.trim(),
  );
}

/**
 * Active l’envoi réel des SMS (Twilio). Variable `SMS_SENDING_ENABLED`.
 * - Absent, vide, `true`, `1`, `yes`, `on` → activé (soumis à {@link isTwilioConfigured}).
 * - `false`, `0`, `no`, `off` → aucun SMS : le dispatch marque la notification comme traitée sans appeler Twilio.
 */
export function isSmsSendingEnabled(): boolean {
  const v = process.env.SMS_SENDING_ENABLED?.trim().toLowerCase();
  if (!v) return true;
  return !["false", "0", "no", "off"].includes(v);
}

export async function sendTwilioSms(
  to: string,
  body: string
): Promise<{ sid: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_PHONE_NUMBER?.trim();
  if (!accountSid || !token || !from) {
    throw new Error("Twilio non configuré");
  }
  const auth = Buffer.from(`${accountSid}:${token}`).toString("base64");
  const params = new URLSearchParams();
  params.set("To", to);
  params.set("From", from);
  params.set("Body", body);
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );
  const data = (await res.json()) as { sid?: string; message?: string };
  if (!res.ok) {
    throw new Error(data.message || `Twilio HTTP ${res.status}`);
  }
  if (!data.sid) throw new Error("Réponse Twilio sans SID");
  return { sid: data.sid };
}

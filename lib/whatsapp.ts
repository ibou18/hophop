type SendWhatsAppParams = {
  to: string; // format international: 2246xxxxxxx, 1514xxxxxxx
  message: string;
};

export async function sendWhatsAppMessage({ to, message }: SendWhatsAppParams) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;

  if (!phoneNumberId || !token) {
    throw new Error("WhatsApp config missing");
  }

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          body: message,
        },
      }),
    },
  );

  const data = await res.json();

  if (!res.ok) {
    console.error("WhatsApp error:", data);
    throw new Error("Failed to send WhatsApp message");
  }

  return data;
}

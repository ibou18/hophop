import Expo, { type ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
});

/**
 * Envoie une notification à une liste de jetons Expo.
 * @returns identifiants de tickets Expo (séparés par des virgules)
 */
export async function sendExpoPushToTokens(
  tokens: string[],
  message: Pick<ExpoPushMessage, "title" | "body" | "sound"> & {
    data?: Record<string, string>;
  }
): Promise<string> {
  const valid = tokens
    .map((t) => t.trim())
    .filter((t) => Expo.isExpoPushToken(t));
  if (valid.length === 0) {
    throw new Error("Aucun jeton push Expo valide");
  }
  const messages: ExpoPushMessage[] = valid.map((to) => ({
    to,
    sound: message.sound ?? "default",
    title: message.title,
    body: message.body,
    ...(message.data
      ? { data: message.data as Record<string, unknown> }
      : {}),
    priority: "high",
  }));
  const chunks = expo.chunkPushNotifications(messages);
  const ticketIds: string[] = [];
  for (const chunk of chunks) {
    const tickets = await expo.sendPushNotificationsAsync(chunk);
    for (const t of tickets) {
      if (t.status === "ok" && "id" in t && t.id) ticketIds.push(t.id);
      else if (t.status === "error")
        ticketIds.push(`err:${t.message ?? "error"}`);
    }
  }
  return ticketIds.join(",") || "expo-sent";
}

import { after } from "next/server";
import { dispatchNotificationIds } from "@/lib/notifications/dispatch";

/**
 * Envoie les notifications après la réponse HTTP (ne bloque pas le client).
 */
export function scheduleNotificationDispatch(ids: string[]): void {
  if (ids.length === 0) return;
  after(async () => {
    await dispatchNotificationIds(ids);
  });
}

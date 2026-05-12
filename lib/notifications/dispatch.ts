import { render } from "@react-email/render";
import * as React from "react";
import { prisma } from "@/lib/prisma";
import { HophopNotificationEmail } from "@/emails/hophop-notification";
import {
  buildHophopEmail,
  emailSubject,
  smsBody,
} from "@/lib/notifications/content";
import {
  getDefaultFromAddress,
  getResendClient,
  isEmailConfigured,
} from "@/lib/mail/resend";
import {
  isSmsSendingEnabled,
  isTwilioConfigured,
  sendTwilioSms,
} from "@/lib/sms/twilio";
import { NotificationStatus } from "@/app/generated/prisma/enums";
import { pushMessage } from "@/lib/notifications/push-payload";
import { sendExpoPushToTokens } from "@/lib/push/expo";

const notificationInclude = {
  parcel: {
    include: {
      forwarder: true,
      client: true,
      recipient: true,
      shipment: true,
    },
  },
  client: {
    include: {
      expoPushTokens: true,
    },
  },
  forwarder: {
    include: {
      expoPushTokens: true,
    },
  },
} as const;

async function markFailed(id: string, error: string) {
  await prisma.notification.update({
    where: { id },
    data: {
      status: NotificationStatus.FAILED,
      error: error.slice(0, 2000),
    },
  });
}

async function markSent(id: string, externalId: string) {
  await prisma.notification.update({
    where: { id },
    data: {
      status: NotificationStatus.SENT,
      externalId,
      sentAt: new Date(),
    },
  });
}

export async function dispatchNotificationById(id: string): Promise<void> {
  const n = await prisma.notification.findUnique({
    where: { id },
    include: notificationInclude,
  });
  if (!n || n.status !== NotificationStatus.PENDING) return;

  const parcel = n.parcel;
  const client = n.client;
  const forwarder = n.forwarder;

  const targetEmail =
    n.channel === "EMAIL"
      ? client?.email ?? forwarder?.email ?? null
      : null;
  const targetPhone =
    n.channel === "SMS"
      ? client?.phone ?? forwarder?.phone ?? null
      : null;

  if (n.channel === "EMAIL") {
    if (!targetEmail) {
      await markFailed(id, "Aucune adresse e-mail pour ce destinataire");
      return;
    }
    if (!isEmailConfigured()) {
      await markFailed(id, "RESEND_API_KEY non configurée");
      return;
    }
    const props = buildHophopEmail(n.type, parcel, {
      shipmentReference: parcel.shipment?.reference,
    });
    const subject = emailSubject(n.type, parcel.trackingCode);
    const html = await render(
      React.createElement(HophopNotificationEmail, props)
    );
    const resend = getResendClient();
    if (!resend) {
      await markFailed(id, "Client Resend indisponible");
      return;
    }
    try {
      const { data, error } = await resend.emails.send({
        from: getDefaultFromAddress(),
        to: targetEmail,
        subject,
        html,
      });
      if (error) {
        await markFailed(id, error.message);
        return;
      }
      const ext = data?.id;
      if (!ext) {
        await markFailed(id, "Réponse Resend sans identifiant");
        return;
      }
      await markSent(id, ext);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await markFailed(id, msg);
    }
    return;
  }

  if (n.channel === "SMS") {
    if (!targetPhone) {
      await markFailed(id, "Aucun numéro de téléphone pour ce destinataire");
      return;
    }
    if (!isSmsSendingEnabled()) {
      await markSent(id, "sms_disabled_by_config");
      return;
    }
    if (!isTwilioConfigured()) {
      await markFailed(
        id,
        "SMS : Twilio non configuré (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)"
      );
      return;
    }
    const body = smsBody(n.type, parcel);
    try {
      const { sid } = await sendTwilioSms(targetPhone, body);
      await markSent(id, sid);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await markFailed(id, msg);
    }
    return;
  }

  if (n.channel === "PUSH") {
    const tokenRows = n.forwarderId
      ? forwarder?.expoPushTokens
      : client?.expoPushTokens;
    const tokens = tokenRows?.map((r) => r.token) ?? [];
    if (tokens.length === 0) {
      await markFailed(
        id,
        "Aucun jeton push : ouvrez l'app mobile et activez les notifications"
      );
      return;
    }
    const role = n.forwarderId ? "forwarder" : "client";
    const { title, body, data } = pushMessage(n.type, parcel, role);
    try {
      const extId = await sendExpoPushToTokens(tokens, {
        title,
        body,
        data,
      });
      await markSent(id, extId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await markFailed(id, msg);
    }
  }
}

export async function dispatchNotificationIds(ids: string[]): Promise<void> {
  const unique = [...new Set(ids.filter(Boolean))];
  for (const id of unique) {
    await dispatchNotificationById(id);
  }
}

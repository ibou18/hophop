import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export type ForwarderInvitationEmailProps = {
  forwarderName: string;
  inviterName: string;
  role: "ADMIN" | "STAFF";
  inviteUrl: string;
  expiresInHours?: number;
};

const ROLE_LABEL: Record<"ADMIN" | "STAFF", string> = {
  ADMIN: "Administrateur",
  STAFF: "Collaborateur",
};

export function ForwarderInvitationEmail({
  forwarderName,
  inviterName,
  role,
  inviteUrl,
  expiresInHours = 48,
}: ForwarderInvitationEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>
        {inviterName} vous invite à rejoindre {forwarderName} sur Hophop
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo text */}
          <Text style={logoText}>
            <span style={{ color: "#4A1F08" }}>Hop</span>
            <span style={{ color: "#E8820C" }}>hop</span>
          </Text>

          <Heading style={h1}>
            Vous avez été invité à rejoindre {forwarderName}
          </Heading>

          <Text style={text}>
            <strong>{inviterName}</strong> vous invite à rejoindre l'espace
            transitaire de <strong>{forwarderName}</strong> sur Hophop en tant
            que <strong>{ROLE_LABEL[role]}</strong>.
          </Text>

          <Text style={text}>
            En acceptant cette invitation, vous aurez accès au tableau de bord
            de l'agence et pourrez gérer les colis et envois selon votre rôle.
          </Text>

          <Section style={btnSection}>
            <Button href={inviteUrl} style={button}>
              Accepter l'invitation →
            </Button>
          </Section>

          <Text style={hint}>
            Ce lien est valable {expiresInHours} heures. Si vous ne souhaitez
            pas rejoindre cette agence, ignorez simplement cet email.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Hophop — Plateforme de gestion d'envois groupés.
            <br />
            Si vous n'attendiez pas cette invitation, ignorez cet email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const main = {
  backgroundColor: "#F7F3ED",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "32px 20px 48px",
  maxWidth: "560px",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  marginTop: "32px",
  marginBottom: "32px",
};

const logoText = {
  fontSize: "22px",
  fontWeight: "600",
  letterSpacing: "-0.5px",
  margin: "0 0 24px",
};

const h1 = {
  color: "#4A1F08",
  fontSize: "22px",
  fontWeight: "600",
  lineHeight: "1.3",
  margin: "0 0 16px",
};

const text = {
  color: "#3f3f46",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 12px",
};

const hint = {
  color: "#71717a",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "16px 0 0",
};

const btnSection = { textAlign: "left" as const, margin: "24px 0" };

const button = {
  backgroundColor: "#E8820C",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
};

const hr = { borderColor: "#E8E0D4", margin: "28px 0" };

const footer = {
  color: "#a1a1aa",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0",
};

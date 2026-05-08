import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export type ClientInvitationEmailProps = {
  firstName: string;
  forwarderName: string;
  claimUrl: string;
};

export function ClientInvitationEmail({
  firstName,
  forwarderName,
  claimUrl,
}: ClientInvitationEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>
        {forwarderName} vous a créé un compte sur Hophop — activez-le en 1 clic
      </Preview>
      <Body style={main}>
        <Section style={headerBand}>
          <Text style={logoEmojis}>📦⛵</Text>
          <Text style={logoWordmark}>Hophop</Text>
          <Text style={logoTagline}>Envois entre diaspora</Text>
        </Section>

        <Container style={container}>
          <Section style={heroSection}>
            <Text style={h1}>Bienvenue, {firstName}&nbsp;👋</Text>
            <Text style={heroSub}>
              <strong>{forwarderName}</strong> vous a créé un compte sur Hophop
              pour gérer vos envois.
              <br />
              Il vous suffit de définir votre mot de passe pour activer votre
              accès.
            </Text>
          </Section>

          <Section style={btnSection}>
            <Button href={claimUrl} style={button}>
              Activer mon compte
            </Button>
          </Section>

          <Section style={infoBox}>
            <Text style={infoText}>
              Ce lien est valide <strong>7 jours</strong>. Après expiration,
              contactez votre transitaire pour qu&apos;il vous renvoie
              l&apos;invitation.
            </Text>
          </Section>

          <Section style={divider} />

          <Text style={footerText}>
            Si vous n&apos;attendiez pas ce message, vous pouvez l&apos;ignorer.
            <br />
            &copy; {new Date().getFullYear()} Hophop
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ClientInvitationEmail;

const main = {
  backgroundColor: "#F7F4EF",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const headerBand = {
  backgroundColor: "#ffffff",
  borderBottom: "1px solid #E8E0D4",
  textAlign: "center" as const,
  padding: "20px 0 16px",
};

const logoEmojis = {
  fontSize: "28px",
  margin: "0",
  lineHeight: "1",
};

const logoWordmark = {
  color: "#1c1917",
  fontSize: "22px",
  fontWeight: "800",
  letterSpacing: "-0.5px",
  margin: "2px 0 0",
};

const logoTagline = {
  color: "#7c7060",
  fontSize: "12px",
  margin: "2px 0 0",
};

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  margin: "24px auto",
  maxWidth: "560px",
  overflow: "hidden",
  border: "1px solid #E8E0D4",
};

const heroSection = {
  padding: "32px 32px 0",
};

const h1 = {
  color: "#1c1917",
  fontSize: "26px",
  fontWeight: "700",
  lineHeight: "1.2",
  margin: "0 0 12px",
};

const heroSub = {
  color: "#57534e",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0",
};

const btnSection = {
  textAlign: "center" as const,
  margin: "28px 32px",
};

const button = {
  backgroundColor: "#E8820C",
  borderRadius: "10px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "700",
  padding: "14px 32px",
  textDecoration: "none",
  letterSpacing: "0.2px",
};

const infoBox = {
  margin: "0 32px 24px",
  padding: "14px 16px",
  backgroundColor: "#FAFAF9",
  borderRadius: "10px",
  border: "1px solid #E8E0D4",
};

const infoText = {
  color: "#7c7060",
  fontSize: "13px",
  lineHeight: "1.55",
  margin: "0",
};

const divider = {
  borderTop: "1px solid #E8E0D4",
  margin: "0 32px",
};

const footerText = {
  color: "#a8a29e",
  fontSize: "12px",
  lineHeight: "1.6",
  textAlign: "center" as const,
  padding: "20px 32px 28px",
  margin: "0",
};

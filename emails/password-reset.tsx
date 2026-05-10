import * as React from "react";
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

export type PasswordResetEmailProps = {
  firstName: string;
  resetUrl: string;
};

export function PasswordResetEmail({ firstName, resetUrl }: PasswordResetEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>
        {firstName}, réinitialisez votre mot de passe Hophop — lien valable 1 heure.
      </Preview>
      <Body style={main}>
        <Section style={headerBand}>
          <Text style={logoEmojis}>📦&nbsp;&nbsp;⛵</Text>
          <Text style={logoWordmark}>Hophop</Text>
        </Section>

        <Container style={container}>
          <Section style={heroSection}>
            <Text style={emoji}>🔑</Text>
            <Text style={h1}>Réinitialisation du mot de passe</Text>
            <Text style={body}>
              Bonjour {firstName},{"\n\n"}
              Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur
              le bouton ci-dessous pour en choisir un nouveau.
            </Text>
          </Section>

          <Section style={btnSection}>
            <Button href={resetUrl} style={button}>
              Réinitialiser mon mot de passe →
            </Button>
          </Section>

          <Section style={infoBox}>
            <Text style={infoText}>
              ⏱ Ce lien est valable pendant <strong>1 heure</strong>.
            </Text>
            <Text style={infoText}>
              Si vous n'avez pas demandé cette réinitialisation, ignorez cet
              email — votre mot de passe reste inchangé.
            </Text>
          </Section>

          <Section style={divider} />

          <Text style={footer}>
            Hophop — la plateforme pour gérer vos envois groupés.
            <br />
            Si vous avez des questions, contactez votre transitaire.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#F7F3ED",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",sans-serif',
};

const headerBand = {
  backgroundColor: "#ffffff",
  padding: "24px 32px 22px",
  borderBottom: "1px solid #E8E0D4",
};

const logoEmojis = {
  margin: "0 0 6px",
  fontSize: "22px",
  lineHeight: "1.2",
  textAlign: "center" as const,
};

const logoWordmark = {
  color: "#2b2218",
  fontSize: "22px",
  fontWeight: "800",
  letterSpacing: "-0.04em",
  margin: "0",
  textAlign: "center" as const,
};

const container = {
  margin: "0 auto",
  padding: "0 0 40px",
  maxWidth: "560px",
  backgroundColor: "#ffffff",
  borderRadius: "0 0 16px 16px",
  marginBottom: "32px",
};

const heroSection = {
  padding: "40px 40px 24px",
  textAlign: "center" as const,
};

const emoji = {
  fontSize: "48px",
  margin: "0 0 12px",
  lineHeight: "1",
};

const h1 = {
  color: "#1c1917",
  fontSize: "26px",
  fontWeight: "700",
  lineHeight: "1.2",
  margin: "0 0 16px",
};

const body = {
  color: "#7c7060",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0",
  textAlign: "left" as const,
  whiteSpace: "pre-line" as const,
};

const btnSection = {
  textAlign: "center" as const,
  margin: "24px 32px",
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
  margin: "0 32px",
  padding: "16px 20px",
  backgroundColor: "#FEF9F0",
  borderRadius: "10px",
  border: "1px solid #F5E0BC",
};

const infoText = {
  color: "#7c5c2a",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0 0 8px",
};

const divider = {
  borderTop: "1px solid #E8E0D4",
  margin: "32px 32px 24px",
};

const footer = {
  textAlign: "center" as const,
  color: "#a1a1aa",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0 32px",
};

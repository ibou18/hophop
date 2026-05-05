import * as React from "react";

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

export type ForwarderWelcomeEmailProps = {
  /** Prénom ou premier mot du nom affiché (ex. propriétaire) */
  firstName: string;
  forwarderName: string;
  code5: string;
  loginUrl: string;
  dashboardUrl: string;
  newShipmentUrl: string;
  publicProfileUrl: string;
};

export function ForwarderWelcomeEmail({
  firstName,
  forwarderName,
  code5,
  loginUrl,
  dashboardUrl,
  newShipmentUrl,
  publicProfileUrl,
}: ForwarderWelcomeEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>
        Bienvenue sur Hophop — crée ton premier envoi, des clients peuvent
        attendre
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logoText}>
            <span style={{ color: "#4A1F08" }}>Hop</span>
            <span style={{ color: "#E8820C" }}>hop</span>
          </Text>

          <Heading style={h1}>Bienvenue, {firstName}</Heading>

          <Text style={text}>
            Ton espace <strong>{forwarderName}</strong> est ouvert sur Hophop.
            Code agence : <strong>{code5}</strong> — les clients peuvent le
            saisir à l’inscription pour se lier à toi.
          </Text>

          <Text style={text}>
            Des clients peuvent déjà avoir des colis ou demandes en attente de
            rattachement à un envoi. Prochaine étape utile :{" "}
            <strong>créer ton premier envoi</strong> depuis le tableau de bord,
            puis y associer les colis concernés.
          </Text>

          <Section style={btnSection}>
            <Button href={newShipmentUrl} style={button}>
              Créer un envoi →
            </Button>
          </Section>

          <Text style={subheading}>Partager tes envois par lien</Text>
          <Text style={text}>
            Page publique de ton agence (envois visibles côté vitrine) : tu peux
            copier ce lien dans tes messages ou réseaux pour que les clients
            voient tes trajets et rejoignent ton espace.
          </Text>
          <Text style={monoLink}>{publicProfileUrl}</Text>
          <Section style={btnSection}>
            <Button href={publicProfileUrl} style={buttonSecondary}>
              Voir la page publique
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={hint}>
            Connexion :{" "}
            <a href={loginUrl} style={link}>
              {loginUrl}
            </a>
            <br />
            Tableau de bord :{" "}
            <a href={dashboardUrl} style={link}>
              {dashboardUrl}
            </a>
          </Text>

          <Text style={footer}>
            Hophop — gestion d’envois groupés pour transitaires.
            <br />
            Si tu n’as pas créé ce compte, contacte le support.
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

const subheading = {
  color: "#4A1F08",
  fontSize: "16px",
  fontWeight: "600",
  margin: "24px 0 8px",
};

const text = {
  color: "#3f3f46",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 12px",
};

const monoLink = {
  color: "#52525b",
  fontSize: "13px",
  lineHeight: "1.5",
  wordBreak: "break-all" as const,
  margin: "0 0 16px",
  fontFamily: "ui-monospace, monospace",
};

const hint = {
  color: "#71717a",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const link = { color: "#B45309" };

const btnSection = { textAlign: "left" as const, margin: "20px 0" };

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

const buttonSecondary = {
  ...button,
  backgroundColor: "#4A1F08",
};

const hr = { borderColor: "#E8E0D4", margin: "28px 0" };

const footer = {
  color: "#a1a1aa",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0",
};

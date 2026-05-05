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

export type ClientWelcomeEmailProps = {
  firstName: string;
  dashboardUrl: string;
  declareParcelUrl: string;
  loginUrl: string;
  linkedForwarderName?: string | null;
  linkedForwarderCode5?: string | null;
  linkedForwarderPublicUrl?: string | null;
};

export function ClientWelcomeEmail({
  firstName,
  dashboardUrl,
  declareParcelUrl,
  loginUrl,
  linkedForwarderName,
  linkedForwarderCode5,
  linkedForwarderPublicUrl,
}: ClientWelcomeEmailProps) {
  const hasLinkedForwarder =
    Boolean(linkedForwarderName) && Boolean(linkedForwarderCode5);

  return (
    <Html lang="fr">
      <Head />
      <Preview>
        Bienvenue sur Hophop — déclare ton premier colis pour lancer ton envoi
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logoText}>
            <span style={{ color: "#4A1F08" }}>Hop</span>
            <span style={{ color: "#E8820C" }}>hop</span>
          </Text>

          <Heading style={h1}>Bienvenue, {firstName}</Heading>

          <Text style={text}>
            Ton compte expéditeur est actif. Meilleure prochaine étape :
            <strong> déclarer ton premier colis</strong> pour accélérer la mise
            en envoi.
          </Text>

          <Section style={btnSection}>
            <Button href={declareParcelUrl} style={button}>
              Déclarer un colis →
            </Button>
          </Section>

          {hasLinkedForwarder ? (
            <>
              <Text style={subheading}>Transitaire déjà lié</Text>
              <Text style={text}>
                Ton compte est lié à <strong>{linkedForwarderName}</strong>{" "}
                (code {linkedForwarderCode5}). Tu peux suivre ses envois
                publiés et rattacher tes colis plus vite.
              </Text>
              {linkedForwarderPublicUrl ? (
                <>
                  <Text style={monoLink}>{linkedForwarderPublicUrl}</Text>
                  <Section style={btnSection}>
                    <Button href={linkedForwarderPublicUrl} style={buttonSecondary}>
                      Voir ses envois
                    </Button>
                  </Section>
                </>
              ) : null}
            </>
          ) : (
            <>
              <Text style={subheading}>Pas encore de transitaire ?</Text>
              <Text style={text}>
                Depuis ton tableau de bord, ajoute un transitaire avec son code
                à 5 chiffres pour voir ses envois et centraliser tes demandes.
              </Text>
            </>
          )}

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
            Hophop — gestion simple de colis et envois.
            <br />
            Si tu n'as pas créé ce compte, contacte le support.
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

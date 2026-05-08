import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Html,
  Preview,
  Row,
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
        {firstName}, ton colis est à un clic du départ ✈️ — déclare-le
        maintenant sur Hophop
      </Preview>
      <Body style={main}>
        {/* Header band */}
        <Section style={headerBand}>
          <Text style={logoText}>✦ Hophop</Text>
        </Section>

        <Container style={container}>
          {/* Hero */}
          <Section style={heroSection}>
            <Text style={emoji}>🎉</Text>
            <Text style={h1}>
              Bienvenue, {firstName} !
            </Text>
            <Text style={heroSub}>
              Ton compte expéditeur est prêt. Ton colis n'attend plus que toi.
            </Text>
          </Section>

          {/* Step 1 */}
          <Section style={stepCard}>
            <Row>
              <Column style={stepNum}>
                <Text style={stepNumText}>1</Text>
              </Column>
              <Column style={stepBody}>
                <Text style={stepTitle}>Déclare ton colis</Text>
                <Text style={stepDesc}>
                  Indique ce que tu veux envoyer — poids, destination, contenu.
                  Ça prend 2 minutes et ton transitaire peut le rattacher à son
                  prochain envoi groupé.
                </Text>
              </Column>
            </Row>
          </Section>

          <Section style={btnSection}>
            <Button href={declareParcelUrl} style={button}>
              Déclarer un colis →
            </Button>
          </Section>

          {/* Step 2 */}
          <Section style={stepCard}>
            <Row>
              <Column style={stepNum}>
                <Text style={stepNumText}>2</Text>
              </Column>
              <Column style={stepBody}>
                <Text style={stepTitle}>Suis ton envoi en temps réel</Text>
                <Text style={stepDesc}>
                  Dès que ton transitaire crée un envoi, tu reçois une
                  notification. Depuis ton tableau de bord, tu vois l'état de
                  chaque colis à tout moment.
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Linked forwarder block */}
          {hasLinkedForwarder ? (
            <Section style={infoBox}>
              <Text style={infoBoxIcon}>🔗</Text>
              <Text style={infoBoxTitle}>
                Tu es lié à {linkedForwarderName}
              </Text>
              <Text style={infoBoxText}>
                Code {linkedForwarderCode5} · Tu peux voir ses envois publiés
                et rattacher tes colis directement depuis ta page.
              </Text>
              {linkedForwarderPublicUrl ? (
                <Button href={linkedForwarderPublicUrl} style={buttonOutline}>
                  Voir ses prochains envois
                </Button>
              ) : null}
            </Section>
          ) : (
            <Section style={infoBox}>
              <Text style={infoBoxIcon}>🔍</Text>
              <Text style={infoBoxTitle}>
                Tu as déjà un transitaire ?
              </Text>
              <Text style={infoBoxText}>
                Ajoute son code à 5 chiffres depuis ton tableau de bord pour
                voir ses envois et centraliser tes demandes de colis.
              </Text>
              <Button href={dashboardUrl} style={buttonOutline}>
                Aller au tableau de bord
              </Button>
            </Section>
          )}

          {/* Divider */}
          <Section style={divider} />

          {/* Footer links */}
          <Text style={footerLinks}>
            <a href={loginUrl} style={footerLink}>
              Se connecter
            </a>
            {"  ·  "}
            <a href={dashboardUrl} style={footerLink}>
              Mon espace
            </a>
          </Text>

          <Text style={footer}>
            Hophop — envois groupés entre la diaspora africaine et l'Afrique.
            <br />
            Si tu n'as pas créé ce compte, ignore cet email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */

const main = {
  backgroundColor: "#F7F3ED",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",sans-serif',
};

const headerBand = {
  backgroundColor: "#1c1917",
  padding: "18px 32px",
};

const logoText = {
  color: "#E8820C",
  fontSize: "20px",
  fontWeight: "700",
  letterSpacing: "-0.5px",
  margin: "0",
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
  fontSize: "28px",
  fontWeight: "700",
  lineHeight: "1.2",
  margin: "0 0 10px",
};

const heroSub = {
  color: "#7c7060",
  fontSize: "16px",
  lineHeight: "1.5",
  margin: "0",
};

const stepCard = {
  margin: "0 32px 4px",
  padding: "16px 20px",
  backgroundColor: "#FAFAF9",
  borderRadius: "12px",
  border: "1px solid #E8E0D4",
};

const stepNum = {
  width: "40px",
  verticalAlign: "top" as const,
};

const stepNumText = {
  width: "32px",
  height: "32px",
  lineHeight: "32px",
  borderRadius: "50%",
  backgroundColor: "#E8820C",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "700",
  textAlign: "center" as const,
  margin: "0",
  display: "block",
};

const stepBody = {
  verticalAlign: "top" as const,
  paddingLeft: "14px",
};

const stepTitle = {
  color: "#1c1917",
  fontSize: "15px",
  fontWeight: "700",
  margin: "0 0 4px",
};

const stepDesc = {
  color: "#7c7060",
  fontSize: "14px",
  lineHeight: "1.55",
  margin: "0",
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
  margin: "0 32px 0",
  padding: "20px 24px",
  backgroundColor: "#FFF7ED",
  borderRadius: "12px",
  border: "1px solid #FED7AA",
  textAlign: "left" as const,
};

const infoBoxIcon = {
  fontSize: "24px",
  margin: "0 0 6px",
  lineHeight: "1",
};

const infoBoxTitle = {
  color: "#7a3f04",
  fontSize: "15px",
  fontWeight: "700",
  margin: "0 0 6px",
};

const infoBoxText = {
  color: "#92400e",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 14px",
};

const buttonOutline = {
  backgroundColor: "transparent",
  borderRadius: "8px",
  border: "2px solid #E8820C",
  color: "#E8820C",
  display: "inline-block",
  fontSize: "13px",
  fontWeight: "700",
  padding: "9px 20px",
  textDecoration: "none",
};

const divider = {
  borderTop: "1px solid #E8E0D4",
  margin: "32px 32px 24px",
};

const footerLinks = {
  textAlign: "center" as const,
  fontSize: "13px",
  color: "#7c7060",
  margin: "0 0 16px",
};

const footerLink = {
  color: "#E8820C",
  textDecoration: "none",
};

const footer = {
  textAlign: "center" as const,
  color: "#a1a1aa",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0 32px",
};

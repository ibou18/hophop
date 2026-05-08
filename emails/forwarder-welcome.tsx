import * as React from "react";

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
        {firstName}, des clients cherchent un envoi — crée le tien maintenant et
        commence à recevoir des colis 📦
      </Preview>
      <Body style={main}>
        {/* Header band — clair, pas de bandeau noir */}
        <Section style={headerBand}>
          <Text style={logoEmojis}>📦&nbsp;&nbsp;⛵</Text>
          <Text style={logoWordmark}>Hophop</Text>
          <Text style={logoTagline}>
            Colis, mer, route — ton activité transitaire sur un seul écran.
          </Text>
        </Section>

        <Container style={container}>
          {/* Hero */}
          <Section style={heroSection}>
            <Text style={emoji}>🚀</Text>
            <Text style={h1}>{forwarderName} est en ligne !</Text>
            <Text style={heroSub}>
              Ton espace transitaire est actif. Des clients attendent — une
              seule action te sépare du premier envoi.
            </Text>
          </Section>

          {/* Urgency block */}
          {/* <Section style={urgencyBox}>
            <Row>
              <Column style={{ width: "32px", verticalAlign: "middle" }}>
                <Text style={urgencyIcon}>⏳</Text>
              </Column>
              <Column style={{ verticalAlign: "middle", paddingLeft: "12px" }}>
                <Text style={urgencyText}>
                  Des expéditeurs déclarent des colis chaque jour sur Hophop.
                  Sans envoi actif, ils partent chez un autre transitaire.
                </Text>
              </Column>
            </Row>
          </Section> */}

          {/* Primary CTA */}
          <Section style={btnSection}>
            <Button href={newShipmentUrl} style={button}>
              Créer mon premier envoi →
            </Button>
          </Section>

          {/* Steps */}
          <Text style={stepsTitle}>Ça prend 3 minutes :</Text>

          <Section style={stepCard}>
            <Row>
              <Column style={stepNum}>
                <Text style={stepNumText}>1</Text>
              </Column>
              <Column style={stepBody}>
                <Text style={stepTitle}>Renseigne la route</Text>
                <Text style={stepDesc}>
                  Pays &apos;origine, pays de destination, ville de livraison et
                  mode de transport (avion, bateau, route…).
                </Text>
              </Column>
            </Row>
          </Section>

          <Section style={stepCard}>
            <Row>
              <Column style={stepNum}>
                <Text style={stepNumText}>2</Text>
              </Column>
              <Column style={stepBody}>
                <Text style={stepTitle}>Fixe tes tarifs et la date</Text>
                <Text style={stepDesc}>
                  Tarif au kg, au carton ou à &apos;unité. Date de départ
                  estimée. Tu peux modifier à tout moment.
                </Text>
              </Column>
            </Row>
          </Section>

          <Section style={stepCard}>
            <Row>
              <Column style={stepNum}>
                <Text style={stepNumText}>3</Text>
              </Column>
              <Column style={stepBody}>
                <Text style={stepTitle}>Partage et collecte les colis</Text>
                <Text style={stepDesc}>
                  Ton envoi apparaît sur ta page publique. Partage le lien sur
                  WhatsApp, Facebook ou Instagram — les clients déclarent leurs
                  colis directement.
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Public profile promo */}
          <Section style={promoBox}>
            <Text style={promoTitle}>🔗 Ta page vitrine est déjà en ligne</Text>
            <Text style={promoText}>
              Tes clients peuvent déjà te trouver via ce lien. Partage-le pour
              booster ta visibilité avant même ton premier envoi.
            </Text>
            <Text style={monoLink}>{publicProfileUrl}</Text>
            <Button href={publicProfileUrl} style={buttonOutline}>
              Voir ma page publique
            </Button>
          </Section>

          {/* Code highlight */}
          <Section style={codeBox}>
            <Text style={codeLabel}>Ton code agence</Text>
            <Text style={codeValue}>{code5}</Text>
            <Text style={codeHint}>
              Communique ce code à tes clients à &apos;inscription. Ils se
              lieront automatiquement à &apos;espace.
            </Text>
          </Section>

          {/* Divider */}
          <Section style={divider} />

          {/* Footer links */}
          <Text style={footerLinks}>
            <a href={loginUrl} style={footerLink}>
              Se connecter
            </a>
            {"  ·  "}
            <a href={dashboardUrl} style={footerLink}>
              Tableau de bord
            </a>
            {"  ·  "}
            <a href={newShipmentUrl} style={footerLink}>
              Créer un envoi
            </a>
          </Text>

          <Text style={footer}>
            Hophop — la plateforme pour gérer tes envois groupés.
            <br />
            Si tu &apos;as pas créé ce compte, ignore cet email.
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

const logoTagline = {
  color: "#6b5f52",
  fontSize: "13px",
  fontWeight: "500",
  lineHeight: "1.45",
  letterSpacing: "0.01em",
  margin: "10px 0 0",
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
  margin: "0 0 10px",
};

const heroSub = {
  color: "#7c7060",
  fontSize: "15px",
  lineHeight: "1.55",
  margin: "0",
};

const urgencyBox = {
  margin: "0 32px 8px",
  padding: "14px 18px",
  backgroundColor: "#FEF3C7",
  borderRadius: "10px",
  border: "1px solid #FDE68A",
};

const urgencyIcon = {
  fontSize: "20px",
  margin: "0",
  lineHeight: "1.4",
};

const urgencyText = {
  color: "#92400E",
  fontSize: "14px",
  fontWeight: "500",
  lineHeight: "1.5",
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

const stepsTitle = {
  color: "#7c7060",
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  margin: "0 32px 10px",
};

const stepCard = {
  margin: "0 32px 6px",
  padding: "14px 18px",
  backgroundColor: "#FAFAF9",
  borderRadius: "10px",
  border: "1px solid #E8E0D4",
};

const stepNum = {
  width: "40px",
  verticalAlign: "top" as const,
};

const stepNumText = {
  width: "28px",
  height: "28px",
  lineHeight: "28px",
  borderRadius: "50%",
  backgroundColor: "#1c1917",
  color: "#E8820C",
  fontSize: "13px",
  fontWeight: "700",
  textAlign: "center" as const,
  margin: "0",
  display: "block",
};

const stepBody = {
  verticalAlign: "top" as const,
  paddingLeft: "12px",
};

const stepTitle = {
  color: "#1c1917",
  fontSize: "14px",
  fontWeight: "700",
  margin: "0 0 3px",
};

const stepDesc = {
  color: "#7c7060",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0",
};

const promoBox = {
  margin: "20px 32px 0",
  padding: "20px 24px",
  backgroundColor: "#F0FDF4",
  borderRadius: "12px",
  border: "1px solid #BBF7D0",
  textAlign: "left" as const,
};

const promoTitle = {
  color: "#14532d",
  fontSize: "15px",
  fontWeight: "700",
  margin: "0 0 6px",
};

const promoText = {
  color: "#166534",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 10px",
};

const monoLink = {
  color: "#166534",
  fontSize: "13px",
  lineHeight: "1.5",
  wordBreak: "break-all" as const,
  margin: "0 0 14px",
  fontFamily: "ui-monospace, monospace",
  backgroundColor: "#DCFCE7",
  padding: "6px 10px",
  borderRadius: "6px",
  display: "block" as const,
};

const buttonOutline = {
  backgroundColor: "transparent",
  borderRadius: "8px",
  border: "2px solid #16a34a",
  color: "#16a34a",
  display: "inline-block",
  fontSize: "13px",
  fontWeight: "700",
  padding: "9px 20px",
  textDecoration: "none",
};

const codeBox = {
  margin: "16px 32px 0",
  padding: "20px 24px",
  backgroundColor: "#1c1917",
  borderRadius: "12px",
  textAlign: "center" as const,
};

const codeLabel = {
  color: "#E8820C",
  fontSize: "11px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "1.5px",
  margin: "0 0 8px",
};

const codeValue = {
  color: "#ffffff",
  fontSize: "36px",
  fontWeight: "700",
  letterSpacing: "6px",
  fontFamily: "ui-monospace, monospace",
  margin: "0 0 10px",
};

const codeHint = {
  color: "#a8a29e",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0",
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

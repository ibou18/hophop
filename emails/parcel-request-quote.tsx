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

export type ParcelRequestQuoteEmailProps = {
  clientFirstName: string;
  forwarderName: string;
  /** Ex: "Montréal → Conakry" */
  route: string;
  /** Ex: "15 mai 2026" */
  departureDate: string;
  price: string; // ex: "CA$ 85"
  quoteNote?: string;
  acceptUrl: string;
  rejectUrl: string;
};

export function ParcelRequestQuoteEmail({
  clientFirstName,
  forwarderName,
  route,
  departureDate,
  price,
  quoteNote,
  acceptUrl,
  rejectUrl,
}: ParcelRequestQuoteEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>
        {forwarderName} propose {price} pour votre colis — acceptez ou refusez en un clic.
      </Preview>
      <Body style={main}>
        <Section style={headerBand}>
          <Text style={logoEmojis}>📦&nbsp;&nbsp;⛵</Text>
          <Text style={logoWordmark}>Hophop</Text>
        </Section>

        <Container style={container}>
          <Section style={heroSection}>
            <Text style={emoji}>💬</Text>
            <Text style={h1}>Offre de prise en charge</Text>
            <Text style={body}>
              Bonjour {clientFirstName},{"\n\n"}
              Le transitaire <strong>{forwarderName}</strong>{" "}
              propose de prendre en charge votre colis sur la route&nbsp;:
            </Text>
          </Section>

          {/* Route + date — sans flex (Outlook / Gmail) */}
          <Section style={infoBox}>
            <Text style={stackLabel}>Route</Text>
            <Text style={stackValueRoute}>{route}</Text>
            <Text style={stackLabelDepart}>Départ estimé</Text>
            <Text style={stackValueLast}>{departureDate}</Text>
          </Section>

          {/* Price highlight */}
          <Section style={priceBox}>
            <Text style={priceLabel}>Prix proposé</Text>
            <Text style={priceValue}>{price}</Text>
          </Section>

          {/* Optional forwarder note */}
          {quoteNote ? (
            <Section style={noteBox}>
              <Text style={noteLabel}>Message du transitaire</Text>
              <Text style={noteText}>{quoteNote}</Text>
            </Section>
          ) : null}

          {/* CTA buttons */}
          <Section style={btnRow}>
            <Button href={acceptUrl} style={btnAccept}>
              ✓ Accepter l'offre
            </Button>
          </Section>
          <Section style={btnRow}>
            <Button href={rejectUrl} style={btnReject}>
              ✗ Refuser
            </Button>
          </Section>

          <Section style={warningBox}>
            <Text style={warningText}>
              ⏱ Cette offre est valable <strong>48 heures</strong>. Passé ce
              délai, elle sera automatiquement annulée et d'autres transitaires
              pourront faire une offre.
            </Text>
          </Section>

          <Section style={divider} />

          <Text style={footer}>
            Hophop — la plateforme pour gérer vos envois groupés.
            <br />
            Si vous n'avez pas fait de demande de colis, ignorez cet email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#F7F3ED",
  margin: "0",
  padding: "12px 10px 28px",
  width: "100%",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",sans-serif',
};

const headerBand = {
  backgroundColor: "#ffffff",
  padding: "22px 16px 20px",
  borderBottom: "1px solid #E8E0D4",
  maxWidth: "560px",
  width: "100%",
  margin: "0 auto",
  boxSizing: "border-box" as const,
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
  padding: "0 16px 36px",
  maxWidth: "560px",
  width: "100%",
  backgroundColor: "#ffffff",
  borderRadius: "0 0 16px 16px",
  marginBottom: "24px",
  boxSizing: "border-box" as const,
};

const heroSection = {
  padding: "28px 8px 20px",
  textAlign: "center" as const,
};

const emoji = {
  fontSize: "48px",
  margin: "0 0 12px",
  lineHeight: "1",
};

const h1 = {
  color: "#1c1917",
  fontSize: "24px",
  fontWeight: "700",
  lineHeight: "1.25",
  margin: "0 0 16px",
  wordBreak: "break-word" as const,
};

const body = {
  color: "#7c7060",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0",
  textAlign: "left" as const,
  whiteSpace: "pre-line" as const,
};

const infoBox = {
  margin: "0 0 16px",
  padding: "16px 16px",
  backgroundColor: "#FAFAF9",
  borderRadius: "10px",
  border: "1px solid #E8E0D4",
  maxWidth: "100%",
  boxSizing: "border-box" as const,
};

const stackLabel = {
  margin: "0 0 4px",
  fontSize: "12px",
  color: "#7c7060",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
};

const stackValueBase = {
  fontSize: "15px",
  color: "#1c1917",
  fontWeight: "600",
  lineHeight: "1.45",
  wordBreak: "break-word" as const,
};

const stackValueRoute = {
  ...stackValueBase,
  margin: "0 0 4px",
};

const stackLabelDepart = {
  ...stackLabel,
  margin: "0 0 4px",
  paddingTop: "14px",
  borderTop: "1px solid #E8E0D4",
};

const stackValueLast = {
  ...stackValueBase,
  margin: "0",
};

const priceBox = {
  margin: "0 0 16px",
  padding: "18px 16px",
  backgroundColor: "#1c1917",
  borderRadius: "12px",
  textAlign: "center" as const,
  maxWidth: "100%",
  boxSizing: "border-box" as const,
};

const priceLabel = {
  color: "#E8820C",
  fontSize: "11px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "1.5px",
  margin: "0 0 8px",
};

const priceValue = {
  color: "#ffffff",
  fontSize: "32px",
  fontWeight: "700",
  letterSpacing: "-0.5px",
  margin: "0",
  wordBreak: "break-word" as const,
};

const noteBox = {
  margin: "0 0 16px",
  padding: "14px 16px",
  backgroundColor: "#F0F9FF",
  borderRadius: "10px",
  border: "1px solid #BAE6FD",
  maxWidth: "100%",
  boxSizing: "border-box" as const,
};

const noteLabel = {
  color: "#0369a1",
  fontSize: "11px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  margin: "0 0 6px",
};

const noteText = {
  color: "#0c4a6e",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0",
};

const btnRow = {
  textAlign: "center" as const,
  margin: "0 0 10px",
  padding: "0",
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box" as const,
};

const btnAccept = {
  backgroundColor: "#16a34a",
  borderRadius: "10px",
  color: "#ffffff",
  display: "block",
  fontSize: "15px",
  fontWeight: "700",
  padding: "14px 16px",
  textDecoration: "none",
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box" as const,
  textAlign: "center" as const,
  lineHeight: "1.35",
};

const btnReject = {
  backgroundColor: "#ffffff",
  borderRadius: "10px",
  border: "2px solid #d1d5db",
  color: "#6b7280",
  display: "block",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 16px",
  textDecoration: "none",
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box" as const,
  textAlign: "center" as const,
  lineHeight: "1.35",
};

const warningBox = {
  margin: "16px 0 0",
  padding: "14px 16px",
  backgroundColor: "#FEF9F0",
  borderRadius: "10px",
  border: "1px solid #F5E0BC",
  maxWidth: "100%",
  boxSizing: "border-box" as const,
};

const warningText = {
  color: "#7c5c2a",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0",
  wordBreak: "break-word" as const,
};

const divider = {
  borderTop: "1px solid #E8E0D4",
  margin: "28px 0 20px",
};

const footer = {
  textAlign: "center" as const,
  color: "#a1a1aa",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0",
  padding: "0 4px",
  wordBreak: "break-word" as const,
};

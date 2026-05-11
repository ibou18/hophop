import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export type HophopEmailProps = {
  preview: string;
  title: string;
  lines: string[];
  ctaText?: string;
  ctaUrl?: string;
  /** Bouton secondaire (ex. étiquette PDF) */
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  forwarderName: string;
  logoUrl?: string | null;
  trackingCode: string;
};

export function HophopNotificationEmail({
  preview,
  title,
  lines,
  ctaText,
  ctaUrl,
  secondaryCtaText,
  secondaryCtaUrl,
  forwarderName,
  logoUrl,
  trackingCode,
}: HophopEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {logoUrl ? (
            <Section style={logoRow}>
              <Img alt={forwarderName} height={40} src={logoUrl} style={logo} />
            </Section>
          ) : null}
          <Text style={badge}>Colis {trackingCode}</Text>
          <Heading style={h1}>{title}</Heading>
          {lines.map((line, i) => (
            <Text key={i} style={text}>
              {line}
            </Text>
          ))}
          {ctaText && ctaUrl ? (
            <Section style={btnSection}>
              <Button href={ctaUrl} style={button}>
                {ctaText}
              </Button>
            </Section>
          ) : null}
          {secondaryCtaText && secondaryCtaUrl ? (
            <Section style={btnSectionSecondary}>
              <Button href={secondaryCtaUrl} style={buttonOutline}>
                {secondaryCtaText}
              </Button>
            </Section>
          ) : null}
          <Hr style={hr} />
          <Text style={footer}>
            Message envoyé par {forwarderName} via Hophop. Ne répondez pas directement à
            cet e-mail.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "32px 20px 48px",
  maxWidth: "560px",
};

const logoRow = { marginBottom: "12px" };
const logo = { maxHeight: "40px", width: "auto" };

const badge = {
  fontSize: "12px",
  color: "#71717a",
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
  margin: "0 0 8px",
};

const h1 = {
  color: "#18181b",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.3",
  margin: "0 0 16px",
};

const text = {
  color: "#3f3f46",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 12px",
};

const btnSection = { textAlign: "left" as const, margin: "24px 0 0" };

const btnSectionSecondary = {
  textAlign: "left" as const,
  margin: "12px 0 0",
};

const button = {
  backgroundColor: "#18181b",
  borderRadius: "8px",
  color: "#fafafa",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px 20px",
  textDecoration: "none",
};

const buttonOutline = {
  backgroundColor: "#ffffff",
  border: "2px solid #18181b",
  borderRadius: "8px",
  color: "#18181b",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "600",
  padding: "10px 18px",
  textDecoration: "none",
};

const hr = { borderColor: "#e4e4e7", margin: "28px 0" };

const footer = {
  color: "#a1a1aa",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0",
};

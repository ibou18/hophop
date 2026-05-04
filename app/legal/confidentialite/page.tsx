import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalPageShell,
  LegalSection,
} from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité et traitement des données personnelles sur Hophop.",
};

const UPDATED = "4 mai 2026";

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalPageShell title="Politique de confidentialité" updatedAt={UPDATED}>
      <LegalSection title="1. Introduction">
        <p>
          La présente politique décrit comment Hophop traite les données personnelles lorsque vous
          utilisez notre site et nos services. Pour le détail des engagements contractuels, voir
          également nos{" "}
          <Link href="/legal/conditions">conditions d&apos;utilisation</Link>.
        </p>
      </LegalSection>

      <LegalSection title="2. Responsable du traitement">
        <p>
          Le responsable du traitement est l&apos;entité juridique exploitant la plateforme Hophop,
          identifiable depuis les mentions légales du site ou votre correspondant désigné.
        </p>
      </LegalSection>

      <LegalSection title="3. Données collectées">
        <p>Selon les cas, nous pouvons traiter notamment :</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            données de compte et d&apos;identification (nom, e-mail, téléphone, rôle client /
            transitaire) ;
          </li>
          <li>
            données relatives aux colis et aux destinataires dans la mesure nécessaire au service ;
          </li>
          <li>
            données techniques (logs, adresse IP, type d&apos;appareil) pour la sécurité et
            l&apos;amélioration du service ;
          </li>
          <li>
            données de paiement lorsque des transactions sont proposées (traitées conformément aux
            exigences du prestataire de paiement).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Finalités et bases légales">
        <p>
          Les traitements ont pour finalités la fourniture du service, la gestion des comptes, le
          suivi des envois, la facturation le cas échéant, la sécurité, le support utilisateur, la
          prospection dans le respect du cadre légal, et le respect d&apos;obligations légales. Les
          bases légales peuvent être l&apos;exécution du contrat, l&apos;intérêt légitime, le
          consentement lorsque requis, ou une obligation légale.
        </p>
      </LegalSection>

      <LegalSection title="5. Durée de conservation">
        <p>
          Les données sont conservées pendant la durée nécessaire aux finalités poursuivies, puis
          archivées ou supprimées selon nos règles de gestion et les obligations légales (ex.
          comptabilité).
        </p>
      </LegalSection>

      <LegalSection title="6. Destinataires et sous-traitants">
        <p>
          Les données peuvent être accessibles à notre personnel habilité et à des prestataires
          techniques strictement nécessaires (hébergement, e-mail, paiement, cartographie, etc.),
          dans le cadre de contrats conformes au RGPD lorsque applicable.
        </p>
      </LegalSection>

      <LegalSection title="7. Transferts hors Union européenne">
        <p>
          Si des données sont transférées hors UE/EEE, nous mettons en œuvre des garanties
          appropriées (clauses contractuelles types, décisions d&apos;adéquation, etc.) conformément
          à la réglementation.
        </p>
      </LegalSection>

      <LegalSection title="8. Vos droits">
        <p>
          Conformément au RGPD et aux lois locales applicables, vous pouvez exercer vos droits
          d&apos;accès, de rectification, d&apos;effacement, de limitation, d&apos;opposition, de
          portabilité, et définir des directives relatives au sort de vos données après décès. Vous
          pouvez introduire une réclamation auprès de l&apos;autorité de protection des données
          compétente.
        </p>
      </LegalSection>

      <LegalSection title="9. Cookies et traceurs">
        <p>
          Nous utilisons des cookies ou technologies similaires pour le fonctionnement du site,
          l&apos;authentification et, avec votre consentement lorsque requis, la mesure
          d&apos;audience ou la personnalisation. Vous pouvez paramétrer votre navigateur ou un
          bandeau de consentement lorsqu&apos;il est proposé.
        </p>
      </LegalSection>

      <LegalSection title="10. Sécurité">
        <p>
          Nous appliquons des mesures techniques et organisationnelles appropriées pour protéger les
          données contre l&apos;accès non autorisé, la perte ou l&apos;altération. Aucun système
          n&apos;étant infaillible, nous vous invitons à sécuriser vos identifiants.
        </p>
      </LegalSection>

      <LegalSection title="11. Modifications">
        <p>
          Cette politique peut être mise à jour ; la date en tête de page indique la dernière
          révision.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact">
        <p>
          Pour toute demande relative à vos données personnelles ou à cette politique, contactez-nous
          via les coordonnées publiées sur le site ou votre interface utilisateur.
        </p>
      </LegalSection>

      <p className="rounded-[var(--hh-radius-md)] border border-hh-sand-dk/25 bg-white/60 px-4 py-3 text-[13px] text-hh-muted">
        Modèle à adapter : identité complète du responsable du traitement, pays, DPO le cas
        échéant, registre des traitements et analyse d&apos;impact si nécessaire.
      </p>
    </LegalPageShell>
  );
}

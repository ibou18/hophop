import type { Metadata } from "next";
import {
  LegalPageShell,
  LegalSection,
} from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description:
    "Conditions générales d'utilisation de la plateforme Hophop — suivi de colis et services transitaires.",
};

const UPDATED = "4 mai 2026";

export default function ConditionsUtilisationPage() {
  return (
    <LegalPageShell title="Conditions d'utilisation" updatedAt={UPDATED}>
      <LegalSection title="1. Objet">
        <p>
          Les présentes conditions générales d&apos;utilisation (« CGU ») encadrent l&apos;accès
          et l&apos;usage de la plateforme Hophop (site, applications et services associés),
          éditée par son exploitant (« nous », « Hophop »). En créant un compte ou en utilisant le
          service, vous acceptez sans réserve les présentes CGU.
        </p>
      </LegalSection>

      <LegalSection title="2. Description du service">
        <p>
          Hophop permet notamment la déclaration et le suivi de colis, la mise en relation entre
          expéditeurs et transitaires, ainsi que des fonctionnalités connexes (notifications,
          paiements lorsque activés, etc.). Les fonctionnalités peuvent évoluer ; une description à
          jour est disponible sur le site.
        </p>
      </LegalSection>

      <LegalSection title="3. Comptes et accès">
        <p>
          Certaines fonctions nécessitent un compte utilisateur. Vous vous engagez à fournir des
          informations exactes, à maintenir la confidentialité de vos identifiants et à notifier
          tout usage non autorisé. Nous pouvons suspendre ou clôturer un compte en cas de violation
          des présentes CGU ou de la loi.
        </p>
      </LegalSection>

      <LegalSection title="4. Obligations des utilisateurs">
        <p>Vous vous engagez notamment à :</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            utiliser Hophop conformément aux lois applicables et aux droits des tiers ;
          </li>
          <li>
            ne pas tenter d&apos;accéder de manière non autorisée aux systèmes, données ou comptes
            d&apos;autres utilisateurs ;
          </li>
          <li>
            ne pas diffuser de contenu illicite, trompeur ou portant atteinte aux personnes ou aux
            biens ;
          </li>
          <li>
            fournir des informations sincères sur les envois lorsque la réglementation ou la
            sécurité l&apos;exigent.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Propriété intellectuelle">
        <p>
          Les éléments de la plateforme (marques, textes, graphismes, logiciels) sont protégés.
          Toute reproduction ou exploitation non autorisée est interdite sauf autorisation écrite.
        </p>
      </LegalSection>

      <LegalSection title="6. Responsabilité">
        <p>
          Hophop est fourni « en l&apos;état ». Dans les limites permises par la loi, notre
          responsabilité ne saurait être engagée pour des dommages indirects, perte de données
          (sous réserve des obligations légales), ou interruptions de service. Les prestations de
          transport et de douane relèvent des contrats et obligations propres aux transitaires et
          transporteurs concernés.
        </p>
      </LegalSection>

      <LegalSection title="7. Modification des CGU">
        <p>
          Nous pouvons modifier les présentes CGU. La date de mise à jour figure en tête de page ;
          la poursuite de l&apos;utilisation du service vaut acceptation des CGU en vigueur.
        </p>
      </LegalSection>

      <LegalSection title="8. Droit applicable et litiges">
        <p>
          Les présentes CGU sont soumises au droit applicable désigné par l&apos;éditeur du service,
          sans préjudice des dispositions d&apos;ordre public protectrices du consommateur le cas
          échéant. Les litiges privilégient une résolution amiable avant toute voie contentieuse.
        </p>
      </LegalSection>

      <LegalSection title="9. Contact">
        <p>
          Pour toute question relative aux présentes CGU : utilisez les coordonnées de contact
          indiquées sur le site ou dans votre espace utilisateur lorsque disponibles.
        </p>
      </LegalSection>

      <p className="rounded-[var(--hh-radius-md)] border border-hh-sand-dk/25 bg-white/60 px-4 py-3 text-[13px] text-hh-muted">
        Ce document est fourni à titre informatif et doit être complété ou validé par un
        professionnel du droit selon votre statut (entreprise, association, pays d&apos;exploitation,
        etc.).
      </p>
    </LegalPageShell>
  );
}

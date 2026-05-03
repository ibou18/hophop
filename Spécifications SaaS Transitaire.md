# SaaS Transitaire — Spécification complète v1

Ce document est le prompt de référence pour le développement de l'application. Il décrit le concept, les cas d'usage, la stack technique, l'architecture, les modèles de données et les règles métier à respecter.

---

## 1\. Concept

Application SaaS multi-tenant permettant à des **transitaires** (professionnels du transport de colis) de gérer leurs clients et leurs envois, et à leurs **clients** de déclarer des colis, suivre leur acheminement et notifier leurs proches destinataires.

Le système est bidirectionnel : il couvre les envois **Canada/France → Afrique** (Guinée, Sénégal, Côte d'Ivoire, Cameroun) et le sens inverse **Afrique → Canada/France**.

Chaque transitaire dispose d'un **espace isolé** (multi-tenancy par `forwarderId`) et d'un **code à 5 chiffres unique** pour être retrouvé facilement depuis l'application mobile par ses clients.

---

## 2\. Acteurs

### Transitaire (Pro / Forwarder)

- S'inscrit sur la plateforme web  
- Dispose d'un dashboard de gestion  
- Crée et gère des **lots d'envoi** (Shipments)  
- Scanne les colis à chaque étape avec l'application mobile  
- Peut activer ou non le paiement en ligne (Stripe Connect)  
- Identifié par un **code à 5 chiffres unique** (ex: `74823`)

### Client (Expéditeur)

- S'inscrit via l'app mobile en entrant le code à 5 chiffres de son transitaire  
- Déclare ses colis avec le minimum de saisie clavier  
- Gère sa liste de **proches destinataires**  
- Suit l'état de ses colis en temps réel  
- Reçoit des notifications email/SMS aux étapes clés  
- Peut payer en ligne si le transitaire a activé cette option  
- Peut imprimer/afficher une étiquette pour coller sur son colis

### Destinataire (Recipient)

- N'a pas de compte sur la plateforme  
- Est un proche enregistré par le client expéditeur  
- Présente un **QR code ou code humain** lors du retrait du colis  
- Le transitaire scanne ce code pour afficher les informations de remise

---

## 3\. Stack technique

### Web (Dashboard pro \+ Interface client)

- **Framework** : Next.js 15 avec App Router  
- **Language** : TypeScript strict  
- **UI** : shadcn/ui \+ Tailwind CSS  
- **Auth** : NextAuth.js v5 (email/password \+ OTP téléphone)  
- **ORM** : Prisma 7  
- **Base de données** : PostgreSQL  
- **API** : Route Handlers Next.js (`app/api/...`)  
- **Paiement** : Stripe (Stripe Connect pour les transitaires)  
- **Email** : Resend  
- **SMS** : Twilio ou Vonage  
- **Upload** : Uploadthing ou Cloudinary (logo transitaire, étiquettes)  
- **QR Code** : `qrcode` (génération côté serveur), `react-qr-code` (affichage)  
- **Déploiement** : Vercel

### Mobile (App client \+ App pro scan)

- **Framework** : Expo (SDK 52+) avec Expo Router  
- **Language** : TypeScript strict  
- **UI** : React Native \+ NativeWind (Tailwind) \+ composants custom  
- **Auth** : Expo SecureStore \+ JWT (tokens émis par l'API Next.js)  
- **Scanner QR** : `expo-camera` \+ `expo-barcode-scanner`  
- **Notifications push** : Expo Notifications \+ Firebase FCM  
- **State** : Zustand  
- **Data fetching** : TanStack Query (React Query)  
- **Déploiement** : EAS Build (Expo Application Services)

### Infrastructure partagée

- **Variables d'environnement** : `.env.local` (Next.js), `app.config.ts` (Expo)  
- **Validation** : Zod (schémas partagés entre web et mobile via un package commun si monorepo)  
- **Logging** : Pino ou console structuré

---

## 4\. Architecture des projets

### Structure Next.js recommandée

apps/web/

├── app/

│   ├── (auth)/

│   │   ├── login/

│   │   └── register/

│   ├── (forwarder)/              \# Dashboard transitaire (auth requise)

│   │   ├── dashboard/

│   │   ├── shipments/

│   │   │   ├── page.tsx          \# Liste des envois

│   │   │   ├── \[id\]/page.tsx     \# Détail d'un envoi

│   │   │   └── new/page.tsx      \# Créer un envoi

│   │   ├── clients/

│   │   │   ├── page.tsx

│   │   │   └── \[id\]/page.tsx

│   │   ├── parcels/

│   │   │   ├── page.tsx

│   │   │   └── \[id\]/page.tsx

│   │   └── settings/

│   ├── (client)/                 \# Espace client web (optionnel, le client utilise surtout le mobile)

│   │   └── track/\[trackingCode\]/ \# Page de suivi publique

│   └── api/

│       ├── auth/\[...nextauth\]/

│       ├── forwarders/

│       │   ├── route.ts          \# POST /api/forwarders (inscription pro)

│       │   └── \[id\]/route.ts

│       ├── clients/

│       │   ├── route.ts          \# POST /api/clients (inscription client)

│       │   └── \[id\]/route.ts

│       ├── parcels/

│       │   ├── route.ts          \# GET (liste) / POST (déclaration)

│       │   ├── \[id\]/route.ts     \# GET / PATCH / DELETE

│       │   └── \[id\]/label/route.ts  \# GET (génération étiquette PDF/HTML)

│       ├── shipments/

│       │   ├── route.ts

│       │   ├── \[id\]/route.ts

│       │   ├── \[id\]/parcels/route.ts    \# Affecter/retirer des colis d'un envoi

│       │   └── \[id\]/dispatch/route.ts  \# Marquer comme parti → notif en masse

│       ├── recipients/

│       │   └── route.ts

│       ├── scan/

│       │   └── route.ts          \# POST /api/scan — scan QR par le pro

│       ├── tracking/

│       │   └── \[trackingCode\]/route.ts  \# GET public — suivi colis

│       └── webhooks/

│           └── stripe/route.ts

├── components/

│   ├── ui/                       \# shadcn/ui components

│   ├── parcels/

│   ├── shipments/

│   └── shared/

├── lib/

│   ├── prisma.ts                 \# Instance Prisma singleton

│   ├── auth.ts                   \# Config NextAuth

│   ├── stripe.ts

│   ├── resend.ts

│   ├── twilio.ts

│   ├── utils.ts                  \# generateCode5, generateTrackingCode, etc.

│   └── validations/              \# Schémas Zod

│       ├── parcel.ts

│       ├── shipment.ts

│       └── client.ts

└── prisma/

    └── schema.prisma

### Structure Expo recommandée

apps/mobile/

├── app/

│   ├── (auth)/

│   │   ├── index.tsx             \# Entrée : saisie code 5 chiffres transitaire

│   │   ├── login.tsx

│   │   └── register.tsx

│   ├── (client)/                 \# Tabs client

│   │   ├── \_layout.tsx           \# Tab navigator

│   │   ├── home.tsx              \# Dashboard client

│   │   ├── declare.tsx           \# Déclarer un colis (wizard)

│   │   ├── parcels/

│   │   │   ├── index.tsx         \# Liste colis

│   │   │   └── \[id\].tsx          \# Détail \+ QR code

│   │   └── recipients/

│   │       ├── index.tsx

│   │       └── new.tsx

│   └── (pro)/                    \# Tabs pro (scan)

│       ├── \_layout.tsx

│       ├── dashboard.tsx

│       ├── scan.tsx              \# Scanner QR colis

│       └── shipments/

│           └── index.tsx

├── components/

│   ├── ParcelCard.tsx

│   ├── QRCodeDisplay.tsx

│   ├── StatusBadge.tsx

│   └── RecipientSelector.tsx

├── store/

│   ├── authStore.ts              \# Zustand — session \+ forwarder context

│   └── parcelStore.ts

├── lib/

│   ├── api.ts                    \# Axios/fetch instance avec base URL \+ auth token

│   └── utils.ts

└── app.config.ts

---

## 5\. Modèle de données (Prisma / PostgreSQL)

generator client {

  provider \= "prisma-client-js"

}

datasource db {

  provider \= "postgresql"

  url      \= env("DATABASE\_URL")

}

enum AuthMethod {

  EMAIL

  PHONE

}

enum Country {

  CA // Canada

  FR // France

  GN // Guinée

  SN // Sénégal

  CI // Côte d'Ivoire

  CM // Cameroun

}

enum ShipmentStatus {

  DRAFT

  CONFIRMED

  IN\_TRANSIT

  ARRIVED

  CLOSED

}

enum ParcelStatus {

  DECLARED

  COLLECTED

  IN\_TRANSIT

  ARRIVED

  READY

  DELIVERED

  ISSUE

}

enum PaymentStatus {

  PENDING

  PAID

  FAILED

  REFUNDED

}

enum PaymentMethod {

  ONLINE

  CASH

  TRANSFER

  OTHER

}

enum NotificationChannel {

  EMAIL

  SMS

}

enum NotificationType {

  PARCEL\_REGISTERED

  SHIPMENT\_DEPARTURE

  SHIPMENT\_ARRIVED

  PARCEL\_READY

  PARCEL\_DELIVERED

  PAYMENT\_CONFIRMED

}

enum NotificationStatus {

  PENDING

  SENT

  FAILED

}

enum TrackingEventType {

  PARCEL\_DECLARED / PARCEL\_LABEL\_PRINTED

  PARCEL\_COLLECTED / PARCEL\_CHECKED / PARCEL\_ASSIGNED / PARCEL\_UNASSIGNED

  SHIPMENT\_DEPARTED / CUSTOMS\_ORIGIN / CUSTOMS\_DESTINATION / IN\_TRANSIT / SHIPMENT\_ARRIVED

  PARCEL\_RECEIVED / PARCEL\_READY / PARCEL\_DELIVERED

  PARCEL\_ISSUE / PARCEL\_ISSUE\_RESOLVED / PARCEL\_RETURNED

  PAYMENT\_RECEIVED

}

enum TrackingActor { CLIENT | FORWARDER | SYSTEM }

enum ItemCategory {

  CLOTHING

  ELECTRONICS

  FOOD

  COSMETICS

  DOCUMENTS

  OTHER

}

model Forwarder {

  id              String   @id @default(uuid())

  code5           String   @unique @db.Char(5)       // Code 5 chiffres unique

  name            String

  email           String   @unique

  phone           String?

  country         Country

  city            String

  address         String?

  logoUrl         String?

  description     String?

  paymentEnabled  Boolean  @default(false)

  stripeAccountId String?

  passwordHash    String

  isActive        Boolean  @default(true)

  createdAt       DateTime @default(now())

  updatedAt       DateTime @updatedAt

  clients   Client\[\]

  shipments Shipment\[\]

  @@map("forwarders")

}

model Client {

  id           String     @id @default(uuid())

  forwarderId  String

  firstName    String

  lastName     String

  email        String?

  phone        String?

  address      String?

  city         String?

  country      Country

  authMethod   AuthMethod @default(EMAIL)

  passwordHash String?

  otpSecret    String?

  isActive     Boolean    @default(true)

  createdAt    DateTime   @default(now())

  updatedAt    DateTime   @updatedAt

  forwarder     Forwarder      @relation(fields: \[forwarderId\], references: \[id\])

  recipients    Recipient\[\]

  parcels       Parcel\[\]

  payments      Payment\[\]

  notifications Notification\[\]

  @@unique(\[forwarderId, email\])

  @@unique(\[forwarderId, phone\])

  @@map("clients")

}

model Recipient {

  id        String   @id @default(uuid())

  clientId  String

  firstName String

  lastName  String

  phone     String

  address   String?

  city      String

  country   Country

  isDefault Boolean  @default(false)

  createdAt DateTime @default(now())

  updatedAt DateTime @updatedAt

  client  Client   @relation(fields: \[clientId\], references: \[id\])

  parcels Parcel\[\]

  @@map("recipients")

}

model Shipment {

  id                 String         @id @default(uuid())

  forwarderId        String

  reference          String         // ex: "ENV-2024-001"

  status             ShipmentStatus @default(DRAFT)

  originCountry      Country

  destinationCountry Country

  destinationCity    String?

  departureDate      DateTime?

  arrivalDate        DateTime?

  notes              String?

  isNotified         Boolean        @default(false)

  createdAt          DateTime       @default(now())

  updatedAt          DateTime       @updatedAt

  forwarder Forwarder @relation(fields: \[forwarderId\], references: \[id\])

  parcels   Parcel\[\]

  @@map("shipments")

}

model Parcel {

  id            String        @id @default(uuid())

  clientId      String

  recipientId   String

  shipmentId    String?

  trackingCode  String        @unique  // ex: "TRS-A3F9K2" → encodé en QR code

  status        ParcelStatus  @default(DECLARED)

  weightKg      Float?

  lengthCm      Float?

  widthCm       Float?

  heightCm      Float?

  description   String?

  notes         String?

  isPaid        Boolean       @default(false)

  paymentMethod PaymentMethod?

  declaredValue Float?

  price         Float?

  createdAt     DateTime      @default(now())

  updatedAt     DateTime      @updatedAt

  client         Client          @relation(fields: \[clientId\], references: \[id\])

  recipient      Recipient       @relation(fields: \[recipientId\], references: \[id\])

  shipment       Shipment?       @relation(fields: \[shipmentId\], references: \[id\])

  items          ParcelItem\[\]

  payment        Payment?

  trackingEvents TrackingEvent\[\]

  notifications  Notification\[\]

  @@map("parcels")

}

model ParcelItem {

  id        String       @id @default(uuid())

  parcelId  String

  name      String

  quantity  Int          @default(1)

  category  ItemCategory @default(OTHER)

  weightKg  Float?

  notes     String?

  createdAt DateTime     @default(now())

  parcel Parcel @relation(fields: \[parcelId\], references: \[id\], onDelete: Cascade)

  @@map("parcel\_items")

}

model Payment {

  id                    String        @id @default(uuid())

  parcelId              String        @unique

  clientId              String

  stripePaymentIntentId String?       @unique

  amount                Float

  currency              String        @default("CAD") // CAD | EUR | GNF | XOF | XAF

  status                PaymentStatus @default(PENDING)

  paidAt                DateTime?

  createdAt             DateTime      @default(now())

  updatedAt             DateTime      @updatedAt

  parcel Parcel @relation(fields: \[parcelId\], references: \[id\])

  client Client @relation(fields: \[clientId\], references: \[id\])

  @@map("payments")

}

model TrackingEvent {

  id           String            @id @default(uuid())

  parcelId     String

  type         TrackingEventType            // Source de vérité du statut

  actor        TrackingActor     @default(SYSTEM)

  actorId      String?                      // forwarderId ou clientId

  location     String?                      // "Montréal", "Aéroport CDG"...

  country      Country?

  note         String?                      // Visible par le client

  internalNote String?                      // Visible uniquement par le pro

  shipmentId   String?

  scannedCode  String?

  createdAt    DateTime          @default(now())

  parcel   Parcel    @relation(fields: \[parcelId\], references: \[id\], onDelete: Cascade)

  shipment Shipment? @relation(fields: \[shipmentId\], references: \[id\])

  @@map("tracking\_events")

}

model Notification {

  id         String              @id @default(uuid())

  parcelId   String

  clientId   String

  channel    NotificationChannel

  type       NotificationType

  status     NotificationStatus  @default(PENDING)

  externalId String?

  error      String?

  sentAt     DateTime?

  createdAt  DateTime            @default(now())

  parcel Parcel @relation(fields: \[parcelId\], references: \[id\], onDelete: Cascade)

  client Client @relation(fields: \[clientId\], references: \[id\])

  @@map("notifications")

}

---

## 6\. Règles métier

### Multi-tenancy

- Chaque `Client`, `Shipment` et `Parcel` appartient à un `Forwarder` via `forwarderId`.  
- Toutes les API routes protégées doivent vérifier que la ressource demandée appartient bien au `forwarderId` de la session courante.  
- Un client ne peut pas voir les données d'un autre transitaire.

### Code 5 chiffres (Forwarder.code5)

- Généré automatiquement à l'inscription, format `XXXXX` (chiffres uniquement).  
- Doit être unique en base — retry en cas de collision.  
- C'est la **première saisie** dans l'app mobile client : le client entre ce code pour s'associer à son transitaire avant de s'inscrire.

// lib/utils.ts

export function generateCode5(): string {

  return Math.floor(10000 \+ Math.random() \* 90000).toString();

}

### Tracking code (Parcel.trackingCode)

- Format : `TRS-XXXXXX` (3 lettres aléatoires \+ 6 alphanumériques).  
- Généré à la création du colis, doit être unique.  
- Encodé en QR code pour le scan par le pro et pour la remise au destinataire.

export function generateTrackingCode(): string {

  const chars \= 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  const part \= Array.from({ length: 6 }, () \=\>

    chars\[Math.floor(Math.random() \* chars.length)\]

  ).join('');

  return \`TRS-${part}\`;

}

### Cycle de vie d'un colis (ParcelStatus)

DECLARED → COLLECTED → IN\_TRANSIT → ARRIVED → READY → DELIVERED

                                                    ↘ ISSUE

- `DECLARED` : déclaré par le client depuis l'app mobile.  
- `COLLECTED` : récupéré physiquement par le transitaire (scan ou action manuelle).  
- `IN_TRANSIT` : automatiquement mis à jour quand le `Shipment` parent passe en `IN_TRANSIT`.  
- `ARRIVED` : automatiquement mis à jour quand le `Shipment` parent passe en `ARRIVED`.  
- `READY` : le transitaire marque le colis comme prêt à retirer.  
- `DELIVERED` : le transitaire scanne le QR code présenté par le destinataire.  
- `ISSUE` : problème signalé par le transitaire.

Chaque changement de statut crée un `TrackingEvent`.

### Cycle de vie d'un envoi (ShipmentStatus)

DRAFT → CONFIRMED → IN\_TRANSIT → ARRIVED → CLOSED

- Le passage en `IN_TRANSIT` déclenche une **notification en masse** à tous les clients dont les colis sont dans cet envoi (`SHIPMENT_DEPARTURE`).  
- Le passage en `ARRIVED` déclenche une **notification en masse** (`SHIPMENT_ARRIVED`).  
- Ces transitions mettent automatiquement à jour le statut des `Parcel` liés.

### Scan QR (remise au destinataire)

- Le destinataire présente le QR code (ou code humain) de son colis.  
- Le pro scanne via `POST /api/scan` avec `{ trackingCode, forwarderId }`.  
- L'API retourne : nom \+ prénom du destinataire, description du colis, statut actuel.  
- Le pro confirme la remise → statut passe en `DELIVERED` \+ `TrackingEvent` créé \+ notification `PARCEL_DELIVERED` envoyée au client expéditeur.

### Étiquette colis

- Accessible via `GET /api/parcels/[id]/label`  
- Format HTML imprimable (ou PDF généré côté serveur) contenant :  
  - Nom et prénom de l'expéditeur  
  - Nom et prénom du destinataire \+ ville \+ pays \+ téléphone  
  - QR code du `trackingCode`  
  - Code humain lisible (ex: `TRS-A3F9K2`)  
  - Nom du transitaire \+ code 5 chiffres  
  - Description du colis  
- Le client peut afficher cette page depuis l'app mobile et imprimer depuis son téléphone ou par email.

### Paiement (optionnel par transitaire)

- Si `Forwarder.paymentEnabled = false` : le champ paiement n'est pas affiché côté client. Le pro gère les paiements hors ligne (cash, virement). `Parcel.isPaid` peut être mis à jour manuellement par le pro.  
- Si `Forwarder.paymentEnabled = true` : le client peut payer en ligne via Stripe Checkout. Le `Forwarder.stripeAccountId` est utilisé pour les Destination Charges (Stripe Connect).

### Authentification

- **Transitaire (Pro)** : email \+ mot de passe. Session gérée par NextAuth.js côté web. Token JWT pour l'app mobile.  
- **Client** : email \+ mot de passe **ou** numéro de téléphone \+ OTP (code envoyé par SMS).  
- Le client s'inscrit toujours **en rattachant son compte à un transitaire** via le code 5 chiffres.

---

## 7\. Flux principaux

### Flux 1 — Inscription client (mobile)

1. L'utilisateur ouvre l'app → écran "Trouver mon transitaire".  
2. Saisit le code à 5 chiffres → `GET /api/forwarders?code5=XXXXX` → affiche le nom \+ logo du transitaire.  
3. Confirme et remplit son profil (prénom, nom, email ou téléphone, pays).  
4. `POST /api/clients` → compte créé, rattaché au `forwarderId`.  
5. Redirigé vers le dashboard client.

### Flux 2 — Déclaration d'un colis (mobile, minimum de saisie)

1. Client appuie sur "Déclarer un colis".  
2. **Étape 1 — Destinataire** : sélection depuis la liste de proches (ou ajout rapide). Champ texte \+ pays \+ ville. Pré-rempli si `isDefault = true`.  
3. **Étape 2 — Contenu** : sélection de catégories par icônes (vêtements, électronique, alimentaire...) \+ quantités. Description libre optionnelle.  
4. **Étape 3 — Dimensions** (optionnel) : poids, dimensions.  
5. **Étape 4 — Récapitulatif** : affiche un résumé \+ prix si le transitaire a défini une grille tarifaire.  
6. **Étape 5 — Paiement** (si `paymentEnabled`) : Stripe Checkout ou sélection "Je paierai en main propre".  
7. `POST /api/parcels` → colis créé avec `trackingCode` généré.  
8. Affichage de l'étiquette à imprimer \+ confirmation par email.

### Flux 3 — Gestion d'un envoi (web dashboard pro)

1. Pro crée un `Shipment` : pays origine, pays destination, ville de destination, date de départ estimée.  
2. Affecte des colis au lot : liste des colis en statut `COLLECTED` → sélection multiple → `PATCH /api/shipments/[id]/parcels`.  
3. Confirme le départ (`POST /api/shipments/[id]/dispatch`) :  
   - Tous les `Parcel` liés passent en `IN_TRANSIT`.  
   - Un `TrackingEvent` est créé pour chaque colis.  
   - Notifications `SHIPMENT_DEPARTURE` envoyées en masse (email \+ SMS) à tous les clients concernés.  
4. À l'arrivée, le pro marque l'envoi comme `ARRIVED` → même logique de mise à jour en masse.

### Flux 4 — Remise d'un colis (mobile pro)

1. Pro ouvre l'app mobile → onglet "Scanner".  
2. Scanne le QR code présenté par le destinataire.  
3. L'app appelle `POST /api/scan` → retourne nom du destinataire \+ détail colis.  
4. Le pro confirme la remise → `PATCH /api/parcels/[id]` avec `status: DELIVERED`.  
5. Notification `PARCEL_DELIVERED` envoyée au client expéditeur.

### Flux 5 — Suivi public

- URL publique : `/track/[trackingCode]` (page Next.js sans auth).  
- Affiche la timeline des `TrackingEvent` du colis.  
- Accessible aussi depuis l'app mobile client dans le détail du colis.

---

## 8\. API Routes — Résumé

| Méthode | Route | Auth | Description |
| :---- | :---- | :---- | :---- |
| `GET` | `/api/forwarders?code5=XXXXX` | Public | Trouver un transitaire par code |
| `POST` | `/api/forwarders` | Public | Inscription transitaire |
| `GET` | `/api/forwarders/[id]` | Pro | Profil transitaire |
| `PATCH` | `/api/forwarders/[id]` | Pro | Mise à jour profil |
| `POST` | `/api/clients` | Public | Inscription client |
| `GET` | `/api/clients` | Pro | Liste clients du transitaire |
| `GET` | `/api/clients/[id]` | Pro \+ Client owner | Profil client |
| `POST` | `/api/recipients` | Client | Ajouter un proche |
| `GET` | `/api/recipients` | Client | Liste des proches |
| `DELETE` | `/api/recipients/[id]` | Client | Supprimer un proche |
| `POST` | `/api/parcels` | Client | Déclarer un colis |
| `GET` | `/api/parcels` | Pro \+ Client | Liste des colis |
| `GET` | `/api/parcels/[id]` | Pro \+ Client owner | Détail colis |
| `PATCH` | `/api/parcels/[id]` | Pro | Mettre à jour statut/infos |
| `GET` | `/api/parcels/[id]/label` | Client owner | Étiquette imprimable |
| `POST` | `/api/shipments` | Pro | Créer un envoi |
| `GET` | `/api/shipments` | Pro | Liste des envois |
| `GET` | `/api/shipments/[id]` | Pro | Détail envoi \+ colis |
| `PATCH` | `/api/shipments/[id]` | Pro | Mettre à jour un envoi |
| `POST` | `/api/shipments/[id]/dispatch` | Pro | Marquer comme parti (notif masse) |
| `POST` | `/api/shipments/[id]/arrive` | Pro | Marquer comme arrivé (notif masse) |
| `POST` | `/api/scan` | Pro | Scanner un QR code colis |
| `GET` | `/api/tracking/[trackingCode]` | Public | Suivi public d'un colis |
| `POST` | `/api/webhooks/stripe` | Stripe | Webhook paiement |

---

## 9\. Notifications

Les notifications sont envoyées via :

- **Email** : Resend (templates HTML personnalisés par transitaire si logo disponible)  
- **SMS** : Twilio ou Vonage

### Déclencheurs

| Événement | Canal | Destinataire |
| :---- | :---- | :---- |
| Colis déclaré | Email | Client expéditeur |
| Envoi parti (`IN_TRANSIT`) | Email \+ SMS | Tous les clients de l'envoi |
| Envoi arrivé (`ARRIVED`) | Email \+ SMS | Tous les clients de l'envoi |
| Colis prêt à retirer (`READY`) | Email \+ SMS | Client expéditeur |
| Colis remis (`DELIVERED`) | Email | Client expéditeur |
| Paiement confirmé | Email | Client expéditeur |

Chaque notification envoyée crée un enregistrement dans la table `notifications` avec le statut (`SENT` ou `FAILED`) et l'ID externe du provider.

---

## 10\. Étiquette colis — Contenu

L'étiquette est une page HTML imprimable (`/api/parcels/[id]/label`) avec les informations suivantes :

┌─────────────────────────────────────────────┐

│  \[LOGO TRANSITAIRE\]    Code: 74823           │

│  Diallo Express                              │

├─────────────────────────────────────────────┤

│  DE : Mamadou Diallo                         │

│       Montréal, Canada                       │

├─────────────────────────────────────────────┤

│  À  : Fatoumata Bah                          │

│       Conakry, Guinée                        │

│       \+224 6XX XXX XXX                       │

├─────────────────────────────────────────────┤

│  Contenu : Vêtements, Cosmétiques            │

│  Poids   : 4.5 kg                            │

├─────────────────────────────────────────────┤

│  \[QR CODE\]             TRS-A3F9K2            │

└─────────────────────────────────────────────┘

---

## 11\. Contraintes et bonnes pratiques

- **Isolation des données** : toujours filtrer par `forwarderId` dans les requêtes Prisma des routes protégées pro. Ne jamais exposer de données cross-tenant.  
- **Minimum de saisie** : le formulaire de déclaration de colis utilise des sélecteurs visuels (icônes de catégories, sélection du destinataire depuis une liste) pour réduire la saisie clavier au maximum.  
- **Génération des codes** : `code5` et `trackingCode` sont générés côté serveur à la création. Prévoir un mécanisme de retry en cas de collision (probabilité faible mais possible).  
- **Notifications en masse** : lors du dispatch d'un envoi, utiliser une queue (Bull/BullMQ \+ Redis) ou des promesses en parallèle avec gestion d'erreurs pour ne pas bloquer la réponse HTTP.  
- **QR code** : le `trackingCode` est la source de vérité. Le QR code l'encode simplement. Pour la remise, le pro scanne → API retourne les infos → pro confirme. Pas de logique côté QR code lui-même.  
- **Paiement optionnel** : la logique de paiement Stripe est entièrement conditionnée par `Forwarder.paymentEnabled`. Si désactivé, aucun appel Stripe ne doit être effectué.  
- **Bidirectionnel** : le système ne fait aucune hypothèse sur les pays d'origine et de destination. Les deux champs `originCountry` et `destinationCountry` utilisent le même enum `Country`.

---

## 12\. Variables d'environnement

### Next.js (.env.local)

\# Base de données

DATABASE\_URL=postgresql://user:password@localhost:5432/transitaire

\# Auth

NEXTAUTH\_SECRET=

NEXTAUTH\_URL=http://localhost:3000

\# Stripe

STRIPE\_SECRET\_KEY=

STRIPE\_WEBHOOK\_SECRET=

NEXT\_PUBLIC\_STRIPE\_PUBLISHABLE\_KEY=

\# Email (Resend)

RESEND\_API\_KEY=

\# SMS (Twilio)

TWILIO\_ACCOUNT\_SID=

TWILIO\_AUTH\_TOKEN=

TWILIO\_PHONE\_NUMBER=

\# Upload

UPLOADTHING\_SECRET=

UPLOADTHING\_APP\_ID=

### Expo (app.config.ts)

export default {

  expo: {

    extra: {

      apiUrl: process.env.EXPO\_PUBLIC\_API\_URL || 'http://localhost:3000',

    },

  },

};

---

## 13\. Priorités V1

Les fonctionnalités à implémenter en priorité pour la première version :

1. Inscription et auth transitaire (web)  
2. Inscription client via code 5 chiffres (mobile)  
3. Déclaration de colis avec sélection destinataire (mobile)  
4. Génération et affichage de l'étiquette QR code (mobile \+ web)  
5. Création et gestion des lots d'envoi (web dashboard)  
6. Scan QR pour remise de colis (mobile pro)  
7. Suivi de colis — timeline publique (web \+ mobile)  
8. Notifications email au départ et à l'arrivée d'un envoi  
9. Paiement en ligne Stripe (optionnel, activable par transitaire)  
10. SMS notifications


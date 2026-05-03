# Hophop — Design System v1.0

Référence visuelle et technique pour le développement web (Next.js \+ shadcn/ui \+ Tailwind) et mobile (Expo React Native \+ NativeWind).

---

## 1\. Identité

**Nom** : Hophop **Positionnement** : Chaleureux, africain, fiable. Évoque le mouvement, la rapidité, la proximité familiale. **Logotype** : `Hop` en `--hh-earth-dk` \+ `hop` en `--hh-saffron`. Police sans-serif, weight 500, letter-spacing \-0.5px.

Hophop   →   \<span style="color:\#7A3F04"\>Hop\</span\>\<span style="color:\#E8820C"\>hop\</span\>

---

## 2\. Palette de couleurs

### Couleurs principales

| Nom | Token | Hex | Usage |
| :---- | :---- | :---- | :---- |
| Saffron | `--hh-saffron` | `#E8820C` | Couleur principale, CTA, accents |
| Earth | `--hh-earth` | `#8B4513` | Titres, texte fort, logotype |
| Kola | `--hh-kola` | `#C13B1B` | Danger, erreur, problème |
| Savane | `--hh-savane` | `#4A7C59` | Succès, livré, confirmé |
| Nuit | `--hh-nuit` | `#1C1917` | Texte principal dark mode, fonds sombres |

### Surfaces et nuances

| Nom | Token | Hex | Usage |
| :---- | :---- | :---- | :---- |
| Saffron 50 | `--hh-saffron-lt` | `#FDF0E0` | Fond badge saffron, hover léger |
| Saffron dark | `--hh-saffron-dk` | `#7A3F04` | Texte sur fond saffron clair |
| Earth 50 | `--hh-earth-lt` | `#F5EBE0` | Surface secondaire chaude |
| Earth dark | `--hh-earth-dk` | `#4A1F08` | Texte fort, logotype |
| Kola 50 | `--hh-kola-lt` | `#FAEAE5` | Fond badge erreur |
| Kola dark | `--hh-kola-dk` | `#6B1A0A` | Texte sur fond kola clair |
| Savane 50 | `--hh-savane-lt` | `#E8F2EC` | Fond badge succès |
| Savane dark | `--hh-savane-dk` | `#1E3D28` | Texte sur fond savane clair |
| Sand | `--hh-sand` | `#F7F3ED` | Fond page, fond carte métrique |
| Sand dark | `--hh-sand-dk` | `#E8E0D4` | Séparateurs, fond hover |
| Muted | `--hh-muted` | `#7C7060` | Labels secondaires, metadata |

### Tailwind — Extension `tailwind.config.ts`

import type { Config } from 'tailwindcss'

const config: Config \= {

  theme: {

    extend: {

      colors: {

        hh: {

          saffron:    '\#E8820C',

          'saffron-lt': '\#FDF0E0',

          'saffron-dk': '\#7A3F04',

          earth:      '\#8B4513',

          'earth-lt': '\#F5EBE0',

          'earth-dk': '\#4A1F08',

          kola:       '\#C13B1B',

          'kola-lt':  '\#FAEAE5',

          'kola-dk':  '\#6B1A0A',

          savane:     '\#4A7C59',

          'savane-lt':'\#E8F2EC',

          'savane-dk':'\#1E3D28',

          nuit:       '\#1C1917',

          sand:       '\#F7F3ED',

          'sand-dk':  '\#E8E0D4',

          muted:      '\#7C7060',

        },

      },

    },

  },

}

export default config

### CSS Variables globales — `globals.css`

:root {

  \--hh-saffron:    \#E8820C;

  \--hh-saffron-lt: \#FDF0E0;

  \--hh-saffron-dk: \#7A3F04;

  \--hh-earth:      \#8B4513;

  \--hh-earth-lt:   \#F5EBE0;

  \--hh-earth-dk:   \#4A1F08;

  \--hh-kola:       \#C13B1B;

  \--hh-kola-lt:    \#FAEAE5;

  \--hh-kola-dk:    \#6B1A0A;

  \--hh-savane:     \#4A7C59;

  \--hh-savane-lt:  \#E8F2EC;

  \--hh-savane-dk:  \#1E3D28;

  \--hh-nuit:       \#1C1917;

  \--hh-sand:       \#F7F3ED;

  \--hh-sand-dk:    \#E8E0D4;

  \--hh-muted:      \#7C7060;

}

---

## 3\. Typographie

**Police principale** : Inter (web) / System font (mobile) **Fallback** : `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

| Rôle | Taille | Poids | Couleur token | Usage |
| :---- | :---- | :---- | :---- | :---- |
| Titre page | 32px | 500 | `--hh-earth-dk` | H1, titre dashboard |
| Titre section | 22px | 500 | `color-text-primary` | H2, titres de section |
| Titre carte | 17px | 500 | `color-text-primary` | H3, entêtes de carte |
| Corps principal | 15px | 400 | `color-text-primary` | Texte standard |
| Texte secondaire | 13px | 400 | `color-text-secondary` | Labels, descriptions |
| Caption / méta | 11px | 400 | `--hh-muted` | Timestamps, hints |
| Code / tracking | 13px | 500 | `--hh-saffron-dk` | Codes colis, références mono |

**Règle** : deux poids uniquement — 400 (regular) et 500 (medium). Jamais 600 ou 700\.

---

## 4\. Espacements

Échelle de base 4px :

| Token | Valeur | Usage typique |
| :---- | :---- | :---- |
| `sp-1` | 4px | Gap icône/texte, micro-espacement |
| `sp-2` | 8px | Gap interne composant, padding petit |
| `sp-3` | 12px | Gap entre éléments d'une liste |
| `sp-4` | 16px | Padding carte standard |
| `sp-6` | 24px | Padding section, gap entre cartes |
| `sp-8` | 32px | Marge section importante |
| `sp-12` | 48px | Espacement entre blocs majeurs |
| `sp-16` | 64px | Padding page, marges extrêmes |

---

## 5\. Border radius

| Token | Valeur | Usage |
| :---- | :---- | :---- |
| `--hh-radius-sm` | 6px | Badges, tags, petits boutons |
| `--hh-radius-md` | 10px | Inputs, boutons standard, tuiles |
| `--hh-radius-lg` | 16px | Cartes, modales, panneaux |
| `--hh-radius-xl` | 24px | Conteneurs mobiles, bottom sheets |
| pill | 999px | Badges de statut, chips |

---

## 6\. Boutons

### Variantes

// Primaire — action principale

\<button className="bg-hh-saffron text-white h-10 px-5 rounded-\[10px\] text-sm font-medium"\>

  Déclarer un colis

\</button\>

// Secondaire — action alternative

\<button className="bg-hh-saffron-lt text-hh-saffron-dk border border-hh-saffron h-10 px-5 rounded-\[10px\] text-sm font-medium"\>

  Voir les détails

\</button\>

// Ghost — action tertiaire

\<button className="bg-transparent text-hh-saffron border border-hh-saffron h-10 px-5 rounded-\[10px\] text-sm font-medium"\>

  Annuler

\</button\>

// Danger

\<button className="bg-hh-kola text-white h-10 px-5 rounded-\[10px\] text-sm font-medium"\>

  Signaler un problème

\</button\>

// Succès

\<button className="bg-hh-savane text-white h-10 px-5 rounded-\[10px\] text-sm font-medium"\>

  Confirmer la livraison

\</button\>

### Tailles

| Taille | Hauteur | Padding H | Font | Radius |
| :---- | :---- | :---- | :---- | :---- |
| sm | 30px | 12px | 12px | 6px |
| md | 38px | 18px | 14px | 10px |
| lg | 48px | 28px | 16px | 16px |

---

## 7\. Badges de statut colis

Un badge \= fond coloré \+ point coloré \+ label. Toujours en pill (`border-radius: 999px`).

| Statut | Fond | Texte | Point |
| :---- | :---- | :---- | :---- |
| `DECLARED` | `#EAF3DE` | `#27500A` | `#639922` |
| `COLLECTED` | `#FDF0E0` | `#7A3F04` | `#E8820C` |
| `IN_TRANSIT` | `#E6F1FB` | `#0C447C` | `#378ADD` |
| `ARRIVED` | `#E8F2EC` | `#1E3D28` | `#4A7C59` |
| `READY` | `#FAEEDA` | `#633806` | `#EF9F27` |
| `DELIVERED` | `#E8F2EC` | `#1E3D28` | `#4A7C59` |
| `ISSUE` | `#FAEAE5` | `#6B1A0A` | `#C13B1B` |

// Composant Badge statut

const statusConfig \= {

  DECLARED:   { bg: '\#EAF3DE', text: '\#27500A', dot: '\#639922',  label: 'Déclaré'    },

  COLLECTED:  { bg: '\#FDF0E0', text: '\#7A3F04',  dot: '\#E8820C', label: 'Collecté'   },

  IN\_TRANSIT: { bg: '\#E6F1FB', text: '\#0C447C',  dot: '\#378ADD', label: 'En transit' },

  ARRIVED:    { bg: '\#E8F2EC', text: '\#1E3D28',  dot: '\#4A7C59', label: 'Arrivé'     },

  READY:      { bg: '\#FAEEDA', text: '\#633806',  dot: '\#EF9F27', label: 'Prêt'       },

  DELIVERED:  { bg: '\#E8F2EC', text: '\#1E3D28',  dot: '\#4A7C59', label: 'Livré'      },

  ISSUE:      { bg: '\#FAEAE5', text: '\#6B1A0A',  dot: '\#C13B1B', label: 'Problème'   },

} as const

export function ParcelStatusBadge({ status }: { status: keyof typeof statusConfig }) {

  const cfg \= statusConfig\[status\]

  return (

    \<span style={{ background: cfg.bg, color: cfg.text }}

      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"\>

      \<span style={{ background: cfg.dot }} className="w-1.5 h-1.5 rounded-full" /\>

      {cfg.label}

    \</span\>

  )

}

---

## 8\. Cartes

### Carte standard

\<div className="bg-white border border-gray-100 rounded-2xl p-4"\>

  {/\* contenu \*/}

\</div\>

### Carte métrique (dashboard)

\<div className="bg-hh-sand rounded-xl p-4"\>

  \<p className="text-xs text-hh-muted mb-1"\>Colis en transit\</p\>

  \<p className="text-2xl font-medium text-hh-saffron-dk"\>142\</p\>

  \<p className="text-xs text-hh-savane mt-1"\>+12 ce mois\</p\>

\</div\>

### Carte colis

\<div className="bg-white border border-gray-100 rounded-2xl p-4"\>

  \<div className="flex justify-between items-start mb-2"\>

    \<div\>

      \<p className="font-mono text-xs font-medium text-hh-saffron-dk"\>TRS-A3F9K2\</p\>

      \<p className="text-sm font-medium"\>Mamadou Diallo\</p\>

    \</div\>

    \<ParcelStatusBadge status="IN\_TRANSIT" /\>

  \</div\>

  \<div className="flex items-center gap-2 text-sm text-gray-500 mb-1"\>

    \<span\>Montréal, CA\</span\>

    \<span className="text-hh-saffron"\>→\</span\>

    \<span\>Conakry, GN\</span\>

  \</div\>

  \<p className="text-xs text-gray-400"\>Dest. : Fatoumata Bah · \+224 6XX XXX XXX\</p\>

\</div\>

---

## 9\. Timeline de suivi

Principe : liste verticale de `TrackingEvent` avec 3 états visuels pour les points.

| État du point | Couleur | Usage |
| :---- | :---- | :---- |
| `done` | `--hh-savane` | Étape passée, validée |
| `current` | `--hh-saffron` \+ ring `--hh-saffron-lt` | Étape en cours |
| `pending` | `--color-border-secondary` | Étape future |

type TLState \= 'done' | 'current' | 'pending'

const dotStyle: Record\<TLState, string\> \= {

  done:    'bg-hh-savane',

  current: 'bg-hh-saffron ring-4 ring-hh-saffron-lt',

  pending: 'bg-gray-300',

}

function TimelineItem({ event, state, isLast }: {

  event: TrackingEvent, state: TLState, isLast: boolean

}) {

  return (

    \<div className="flex gap-3 pb-5"\>

      \<div className="flex flex-col items-center w-5 shrink-0"\>

        \<div className={\`w-2.5 h-2.5 rounded-full mt-0.5 ${dotStyle\[state\]}\`} /\>

        {\!isLast && \<div className="flex-1 w-px bg-gray-200 mt-1" /\>}

      \</div\>

      \<div className="flex-1 pb-1"\>

        \<p className={\`text-sm font-medium ${state \=== 'current' ? 'text-hh-saffron-dk' : state \=== 'pending' ? 'text-gray-400' : ''}\`}\>

          {eventTypeLabel\[event.type\]}

        \</p\>

        {event.location && \<p className="text-xs text-gray-500"\>{event.location}\</p\>}

        \<p className="text-xs text-hh-muted mt-0.5"\>

          {state \=== 'pending' ? \`Estimé ${formatDate(event.createdAt)}\` : formatDate(event.createdAt)}

        \</p\>

      \</div\>

    \</div\>

  )

}

### Labels des événements (`eventTypeLabel`)

export const eventTypeLabel: Record\<TrackingEventType, string\> \= {

  PARCEL\_DECLARED:      'Colis déclaré',

  PARCEL\_LABEL\_PRINTED: 'Étiquette générée',

  PARCEL\_COLLECTED:     'Collecté par le transitaire',

  PARCEL\_CHECKED:       'Vérifié et pesé',

  PARCEL\_ASSIGNED:      'Affecté à un envoi',

  PARCEL\_UNASSIGNED:    'Retiré de l\\'envoi',

  SHIPMENT\_DEPARTED:    'Envoi parti',

  CUSTOMS\_ORIGIN:       'En dédouanement (origine)',

  CUSTOMS\_DESTINATION:  'En dédouanement (destination)',

  IN\_TRANSIT:           'En transit',

  SHIPMENT\_ARRIVED:     'Envoi arrivé à destination',

  PARCEL\_RECEIVED:      'Réceptionné à destination',

  PARCEL\_READY:         'Prêt à être retiré',

  PARCEL\_DELIVERED:     'Remis au destinataire',

  PARCEL\_ISSUE:         'Problème signalé',

  PARCEL\_ISSUE\_RESOLVED:'Problème résolu',

  PARCEL\_RETURNED:      'Retourné à l\\'expéditeur',

  PAYMENT\_RECEIVED:     'Paiement enregistré',

}

---

## 10\. Formulaire de déclaration — sélecteur de catégories

Le formulaire privilégie les sélecteurs visuels sur la saisie clavier.

const categories \= \[

  { value: 'CLOTHING',     icon: '👕', label: 'Vêtements'   },

  { value: 'ELECTRONICS',  icon: '📱', label: 'Électronique' },

  { value: 'COSMETICS',    icon: '🧴', label: 'Cosmétiques'  },

  { value: 'FOOD',         icon: '🍱', label: 'Alimentaire'  },

  { value: 'DOCUMENTS',    icon: '📄', label: 'Documents'    },

  { value: 'OTHER',        icon: '📦', label: 'Autre'        },

\]

function CategorySelector({ selected, onChange }) {

  return (

    \<div className="grid grid-cols-3 gap-2"\>

      {categories.map(cat \=\> (

        \<button

          key={cat.value}

          onClick={() \=\> onChange(cat.value)}

          className={\`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-colors ${

            selected \=== cat.value

              ? 'border-hh-saffron bg-hh-saffron-lt'

              : 'border-transparent bg-hh-sand'

          }\`}

        \>

          \<span style={{ fontSize: 22 }}\>{cat.icon}\</span\>

          \<span className={\`text-xs ${selected \=== cat.value ? 'text-hh-saffron-dk font-medium' : 'text-gray-500'}\`}\>

            {cat.label}

          \</span\>

        \</button\>

      ))}

    \</div\>

  )

}

---

## 11\. Navigation mobile (Expo)

### Bottom Tab Bar

// app/(client)/\_layout.tsx

import { Tabs } from 'expo-router'

export default function ClientLayout() {

  return (

    \<Tabs screenOptions={{

      tabBarActiveTintColor: '\#E8820C',

      tabBarInactiveTintColor: '\#7C7060',

      tabBarStyle: {

        backgroundColor: '\#FFFFFF',

        borderTopColor: '\#E8E0D4',

        borderTopWidth: 0.5,

        height: 60,

        paddingBottom: 8,

      },

      tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },

      headerStyle: { backgroundColor: '\#F7F3ED' },

      headerTintColor: '\#4A1F08',

    }}\>

      \<Tabs.Screen name="parcels"    options={{ title: 'Colis',    tabBarIcon: ... }} /\>

      \<Tabs.Screen name="declare"    options={{ title: 'Déclarer', tabBarIcon: ... }} /\>

      \<Tabs.Screen name="track"      options={{ title: 'Suivi',    tabBarIcon: ... }} /\>

      \<Tabs.Screen name="recipients" options={{ title: 'Proches',  tabBarIcon: ... }} /\>

    \</Tabs\>

  )

}

### Header page

// Fond sable, titre earth-dk, icône d'action saffron

headerStyle: { backgroundColor: '\#F7F3ED' }

headerTintColor: '\#4A1F08'

headerTitleStyle: { fontWeight: '500', fontSize: 17 }

---

## 12\. Ombres (usage limité)

Hophop utilise des ombres très légères, uniquement pour les cartes flottantes et les modales.

// React Native

export const shadows \= {

  card: {

    shadowColor: '\#1C1917',

    shadowOffset: { width: 0, height: 1 },

    shadowOpacity: 0.06,

    shadowRadius: 8,

    elevation: 2,

  },

  modal: {

    shadowColor: '\#1C1917',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.12,

    shadowRadius: 24,

    elevation: 8,

  },

}

// CSS (web)

// card  : box-shadow: 0 1px 8px rgba(28, 25, 23, 0.06)

// modal : box-shadow: 0 4px 24px rgba(28, 25, 23, 0.12)

---

## 13\. Règles générales

- **Fond de page** : `--hh-sand` (`#F7F3ED`) — jamais blanc pur, trop froid.  
- **Fond de carte** : blanc (`#FFFFFF`) sur fond sand — contraste chaleureux.  
- **Jamais de gradient** sauf cas exceptionnel (splash screen, onboarding).  
- **Bordures** : `0.5px solid` en priorité — éviter les bordures épaisses.  
- **Texte sur fond coloré** : toujours utiliser le `dk` correspondant (ex: texte sur `saffron-lt` → `saffron-dk`).  
- **Icônes** : Lucide Icons (web), `@expo/vector-icons` Feather ou Lucide (mobile). Taille standard 20px, stroke 1.5.  
- **Langue** : tout le contenu visible est en français. Labels, placeholders, messages d'erreur.  
- **Code de tracking** : toujours en monospace, couleur `--hh-saffron-dk`.


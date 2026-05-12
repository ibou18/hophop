import Anthropic from "@anthropic-ai/sdk";
import type { ItemCategory } from "@/app/generated/prisma/enums";

const client = new Anthropic();

const VALID_CATEGORIES: ItemCategory[] = [
  "CLOTHING", "ELECTRONICS", "COSMETICS", "FOOD", "DOCUMENTS", "OTHER",
];

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.imageBase64 || !body?.mimeType) {
    return Response.json({ error: "Données image manquantes." }, { status: 400 });
  }

  const { imageBase64, mimeType } = body as { imageBase64: string; mimeType: string };

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mimeType as "image/jpeg" | "image/png" | "image/webp", data: imageBase64 },
          },
          {
            type: "text",
            text: `Tu analyses des photos de colis pour un transitaire (fret diaspora africaine).
Réponds UNIQUEMENT avec un objet JSON valide, sans markdown ni explication :
{
  "description": "description courte du contenu visible en français (max 80 caractères)",
  "estimatedWeightKg": <nombre ou null>,
  "categories": ["CLOTHING", "ELECTRONICS"]  // 0 ou plusieurs codes parmi CLOTHING, ELECTRONICS, COSMETICS, FOOD, DOCUMENTS, OTHER — sans doublon
  "customsAlert": <null ou "raison courte si article potentiellement bloqué en douane">
}`,
          },
        ],
      },
    ],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text ?? "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    return Response.json({ error: "Réponse IA invalide." }, { status: 500 });
  }

  const json = JSON.parse(match[0]) as {
    description?: string;
    estimatedWeightKg?: number | null;
    categories?: unknown;
    customsAlert?: string | null;
  };

  if (json.categories != null) {
    const normalized: string[] = [];
    const arr = Array.isArray(json.categories) ? json.categories : [];
    for (const c of arr) {
      const code =
        typeof c === "string"
          ? c
          : c && typeof c === "object" && "category" in c
            ? String((c as { category: string }).category)
            : "";
      if (code && VALID_CATEGORIES.includes(code as ItemCategory)) {
        normalized.push(code);
      }
    }
    json.categories = [...new Set(normalized)];
  }

  return Response.json(json);
}

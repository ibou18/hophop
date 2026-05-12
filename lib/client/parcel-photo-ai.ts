export type ParcelPhotoAiResult = {
  description?: string;
  estimatedWeightKg?: number | null;
  categories?: unknown;
  customsAlert?: string | null;
};

/**
 * Analyse IA d'une photo de colis (endpoint unique partagé par les formulaires client).
 */
export async function analyzeParcelPhotoWithAi(
  file: File,
): Promise<ParcelPhotoAiResult | null> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = (reader.result as string).split(",")[1];
      if (result) resolve(result);
      else reject(new Error("empty"));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await fetch("/api/ai/analyze-parcel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      imageBase64: base64,
      mimeType: file.type || "image/jpeg",
    }),
  });
  if (!res.ok) return null;
  return (await res.json()) as ParcelPhotoAiResult;
}

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const searchSchema = z.object({
  query: z.string().trim().min(2).max(120),
  city: z.string().trim().max(80).optional(),
  regionCode: z.string().trim().length(2).optional(),
  language: z.enum(["fr", "en", "es", "ko"]).default("fr"),
});

export type MapsSearchResult = {
  googlePlaceId: string;
  name: string;
  address: string | null;
  category: string | null;
  lat: number | null;
  lng: number | null;
};

/**
 * Searches real places through the Google Maps connector gateway.
 * Authenticated on purpose: Maps usage is metered, so this must never be an open proxy.
 */
export const searchPlaces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => searchSchema.parse(data))
  .handler(async ({ data }): Promise<MapsSearchResult[]> => {
    const lovableApiKey = process.env["LOVABLE_API_KEY"];
    const connectionKey = process.env["GOOGLE_MAPS_API_KEY"];
    if (!lovableApiKey || !connectionKey) {
      throw new Error("Google Maps connector is not configured");
    }

    const textQuery = data.city ? `${data.query} ${data.city}` : data.query;

    const response = await fetch(
      "https://connector-gateway.lovable.dev/google_maps/places/v1/places:searchText",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "X-Connection-Api-Key": connectionKey,
          "Content-Type": "application/json",
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.primaryTypeDisplayName",
        },
        body: JSON.stringify({
          textQuery,
          languageCode: data.language,
          maxResultCount: 12,
          ...(data.regionCode ? { regionCode: data.regionCode } : {}),
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(`Google Maps search failed [${response.status}]: ${body}`);
      throw new Error(`Google Maps search failed [${response.status}]: ${body}`);
    }

    const payload = (await response.json()) as {
      places?: Array<{
        id?: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        primaryTypeDisplayName?: { text?: string };
        location?: { latitude?: number; longitude?: number };
      }>;
    };

    return (payload.places ?? [])
      .filter((place) => place.id && place.displayName?.text)
      .map((place) => ({
        googlePlaceId: place.id as string,
        name: place.displayName?.text as string,
        address: place.formattedAddress ?? null,
        category: place.primaryTypeDisplayName?.text ?? null,
        lat: place.location?.latitude ?? null,
        lng: place.location?.longitude ?? null,
      }));
  });

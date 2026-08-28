import { supabase } from "@/integrations/supabase/client";

export type Visibility = "private" | "friends" | "public";

export type Trip = {
  id: string;
  owner_id: string;
  title: string;
  destination: string | null;
  cover_url: string | null;
  cover_path: string | null;
  visibility: Visibility;
  share_slug: string;
  created_at: string;
};

export type Place = {
  id: string;
  trip_id: string;
  name: string;
  area: string | null;
  category: string | null;
  note: string | null;
  visited: boolean;
  position: number;
  photo_path: string | null;
  created_at: string;
  lat: number | null;
  lng: number | null;
  favorite: boolean;
  google_place_id: string | null;
  catalog_place_id: string | null;
};

export type CatalogPlace = {
  id: string;
  city: string;
  country: string | null;
  name: string;
  name_ko: string | null;
  category: string | null;
  area: string | null;
  description: string | null;
  lat: number | null;
  lng: number | null;
  google_place_id: string | null;
  source: string;
  sheet_key: string | null;
  best_time: string[] | null;
  price_info: string | null;
  website?: string | null;
  activity_group?: string | null;
};

/**
 * Splits a catalogue title into its Latin name and its Korean name. Some seeded
 * park names already embed the Korean form as "Namsan Park — 남산공원", so we
 * strip it to avoid showing it twice next to `name_ko`.
 */
export function placeTitle(place: { name: string; name_ko?: string | null }) {
  const [latin, embedded] = place.name.split(" — ");
  const ko = place.name_ko?.trim() || embedded?.trim() || null;
  return { name: (latin ?? place.name).trim(), ko };
}

export const VISIBILITY_LABEL: Record<Visibility, string> = {
  private: "Privé",
  friends: "Amis invités",
  public: "Public",
};

export const CATEGORIES = ["Vue", "Resto", "Culture", "Balade", "Bar", "Plage"];

/** Resolves storage paths of the private "voyages" bucket into displayable URLs. */
export async function signPaths(paths: (string | null)[]): Promise<Record<string, string>> {
  const clean = paths.filter((p): p is string => Boolean(p));
  if (clean.length === 0) return {};
  const { data } = await supabase.storage.from("voyages").createSignedUrls(clean, 60 * 60 * 24 * 7);
  const map: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}

/** Resolves an avatar storage path into a displayable URL. */
export async function signAvatar(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? null;
}

export async function signAvatars(paths: (string | null)[]): Promise<Record<string, string>> {
  const clean = paths.filter((p): p is string => Boolean(p));
  if (clean.length === 0) return {};
  const { data } = await supabase.storage.from("avatars").createSignedUrls(clean, 60 * 60 * 24 * 7);
  const map: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}

/**
 * Decodes any browser-readable image (including iPhone photos) and re-encodes it
 * as a square-friendly JPEG so every browser can display the avatar.
 * Throws Error("avatar-format") when the file cannot be decoded (e.g. HEIC on Chrome).
 */
async function toDisplayableJpeg(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("avatar-format");
  }
  const size = 512;
  const scale = Math.min(size / bitmap.width, size / bitmap.height, 1);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("avatar-format");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9),
  );
  if (!blob) throw new Error("avatar-format");
  return blob;
}

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const jpeg = await toDisplayableJpeg(file);
  const path = `${userId}/avatar-${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, jpeg, { upsert: true, contentType: "image/jpeg" });
  if (error) throw error;
  return path;
}

export async function uploadPhoto(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("voyages").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

export function progress(places: Place[]): number {
  if (places.length === 0) return 0;
  return Math.round((places.filter((p) => p.visited).length / places.length) * 100);
}

export function shareUrl(slug: string): string {
  if (typeof window === "undefined") return `/partage/${slug}`;
  return `${window.location.origin}/partage/${slug}`;
}

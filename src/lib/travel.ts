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
};

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

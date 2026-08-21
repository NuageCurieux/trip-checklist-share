import { createServerFn } from "@tanstack/react-start";

export const checkGate = createServerFn({ method: "GET" }).handler(async () => {
  const { gateSession } = await import("./gate.server");
  const session = await gateSession();
  return { unlocked: session.data.unlocked === true };
});

export const unlockSite = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    const { gateSession, passwordMatches } = await import("./gate.server");
    const expected = process.env["SITE_PASSWORD"];
    if (!expected) {
      throw new Error("SITE_PASSWORD is not set");
    }

    if (!passwordMatches(data.password, expected)) {
      return { ok: false as const };
    }

    const session = await gateSession();
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const lockSite = createServerFn({ method: "POST" }).handler(async () => {
  const { gateSession } = await import("./gate.server");
  const session = await gateSession();
  await session.clear();
  return { ok: true as const };
});

type GatePreviewProfile = {
  id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  instagram: string | null;
  avatar_path: string | null;
  is_public: boolean;
};

type GatePreviewTrip = {
  id: string;
  title: string;
  destination: string | null;
  cover_path: string | null;
  cover_url: string | null;
  share_slug: string;
  place_count: number;
  owner_handle: string;
  owner_name: string;
};

export const getGatePreview = createServerFn({ method: "GET" }).handler(async () => {
  const { supabase } = await import("@/integrations/supabase/client");

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, handle, display_name, bio, instagram, avatar_path, is_public")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(1);
  if (profileError) throw profileError;

  const featured: GatePreviewProfile | null = (profiles?.[0] as GatePreviewProfile | undefined) ?? null;

  const { data: trips, error: tripError } = await supabase
    .from("trips")
    .select("id, title, destination, cover_path, cover_url, share_slug, owner_id")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(3);
  if (tripError) throw tripError;

  const ownerIds = [...new Set((trips ?? []).map((t) => t.owner_id).filter(Boolean))];
  const { data: owners } = await supabase
    .from("profiles")
    .select("id, handle, display_name")
    .in("id", ownerIds.length ? ownerIds : ["00000000-0000-0000-0000-000000000000"]);
  const ownerMap = new Map(
    (owners ?? []).map((o) => [o.id, { handle: o.handle, display_name: o.display_name }]),
  );

  const previews: GatePreviewTrip[] = [];
  for (const trip of trips ?? []) {
    const owner = ownerMap.get(trip.owner_id) ?? { handle: "", display_name: "" };
    const { count } = await supabase
      .from("places")
      .select("*", { count: "exact", head: true })
      .eq("trip_id", trip.id);
    previews.push({
      id: trip.id,
      title: trip.title,
      destination: trip.destination,
      cover_path: trip.cover_path,
      cover_url: trip.cover_url,
      share_slug: trip.share_slug,
      place_count: count ?? 0,
      owner_handle: owner.handle,
      owner_name: owner.display_name,
    });
  }

  return { featured, previews };
});

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell } from "@/components/AppShell";
import { PlacesMap } from "@/components/travel/PlacesMap";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/localisation")({
  head: () => ({
    meta: [
      { title: "Partage de localisation entre amis — Carnets" },
      {
        name: "description",
        content:
          "Votre position n'apparaît jamais sur la carte publique. Partagez-la ponctuellement, uniquement avec un ami de confiance et pour une durée limitée.",
      },
      { property: "og:title", content: "Partage de localisation entre amis — Carnets" },
      {
        property: "og:description",
        content:
          "Partage de position privé, opt-in et temporaire : chaque envoi demande votre validation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LocationPage,
});

const emailSchema = z.string().trim().email().max(255);

type Share = {
  id: string;
  owner_id: string;
  recipient_email: string;
  status: string;
  expires_at: string;
  created_at: string;
};

type Ping = { id: string; share_id: string; lat: number; lng: number; created_at: string };

const DURATIONS = [15, 60, 240] as const;

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("no-geolocation"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
    });
  });
}

function LocationPage() {
  const { t } = useI18n();
  const { user, loading } = useSession();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [minutes, setMinutes] = useState<number>(60);
  const [trust, setTrust] = useState(false);

  const { data } = useQuery({
    queryKey: ["location-shares"],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data: shares, error } = await supabase
        .from("location_shares")
        .select("id, owner_id, recipient_email, status, expires_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = (shares ?? []).map((s) => s.id);
      let pings: Ping[] = [];
      if (ids.length) {
        const { data: rows } = await supabase
          .from("location_pings")
          .select("id, share_id, lat, lng, created_at")
          .in("share_id", ids)
          .order("created_at", { ascending: false });
        pings = (rows ?? []) as Ping[];
      }
      return { shares: (shares ?? []) as Share[], pings };
    },
  });

  const shares = data?.shares ?? [];
  const pings = data?.pings ?? [];
  const mine = shares.filter((s) => s.owner_id === user?.id);
  const received = shares.filter((s) => s.owner_id !== user?.id);

  const receivedPoints = received
    .map((s) => {
      const ping = pings.find((p) => p.share_id === s.id);
      if (!ping) return null;
      return { id: s.id, name: s.recipient_email, lat: ping.lat, lng: ping.lng };
    })
    .filter((p): p is { id: string; name: string; lat: number; lng: number } => Boolean(p));

  const createShare = useMutation({
    mutationFn: async () => {
      const parsed = emailSchema.safeParse(email);
      if (!parsed.success) throw new Error("invalid-email");
      const expires = new Date(Date.now() + minutes * 60_000).toISOString();
      const { error } = await supabase.from("location_shares").insert({
        recipient_email: parsed.data.toLowerCase(),
        trust_ack: true,
        expires_at: expires,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setEmail("");
      setTrust(false);
      toast.success(t("loc.created"));
      void queryClient.invalidateQueries({ queryKey: ["location-shares"] });
    },
    onError: (e: Error) =>
      toast.error(e.message === "invalid-email" ? t("loc.invalidEmail") : t("common.error")),
  });

  const sendPosition = useMutation({
    mutationFn: async (share: Share) => {
      const position = await getPosition();
      const { error } = await supabase.from("location_pings").insert({
        share_id: share.id,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("loc.sent"));
      void queryClient.invalidateQueries({ queryKey: ["location-shares"] });
    },
    onError: () => toast.error(t("loc.geoError")),
  });

  const revoke = useMutation({
    mutationFn: async (share: Share) => {
      const { error } = await supabase
        .from("location_shares")
        .update({ status: "revoked" })
        .eq("id", share.id);
      if (error) throw error;
      await supabase.from("location_pings").delete().eq("share_id", share.id);
    },
    onSuccess: () => {
      toast.success(t("loc.revoked"));
      void queryClient.invalidateQueries({ queryKey: ["location-shares"] });
    },
    onError: () => toast.error(t("common.error")),
  });

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center px-8 text-center">
        <div>
          <p className="text-sm text-muted-foreground">{t("loc.signInHint")}</p>
          <Link to="/auth" className="mt-4 inline-block text-sm font-semibold text-primary">
            {t("auth.signIn")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AppShell kicker={t("loc.kicker")} title={t("loc.title")}>
      <section className="space-y-5 px-6">
        <div className="flex gap-3 rounded-2xl border border-border bg-secondary/40 p-4">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-muted-foreground">{t("loc.privacyNote")}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-serif text-lg italic">{t("loc.newShare")}</h2>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("loc.emailPlaceholder")}
            maxLength={255}
            className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
          />

          <div className="mt-3 flex gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setMinutes(d)}
                aria-pressed={minutes === d}
                className={`flex-1 rounded-xl border py-2 text-xs font-semibold ${
                  minutes === d
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {d < 60 ? `${d} min` : `${d / 60} h`}
              </button>
            ))}
          </div>

          <label className="mt-4 flex items-start gap-3 text-xs leading-relaxed">
            <input
              type="checkbox"
              checked={trust}
              onChange={(e) => setTrust(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-[hsl(var(--primary))]"
            />
            <span>{t("loc.trustQuestion")}</span>
          </label>

          <button
            type="button"
            disabled={!trust || !email || createShare.isPending}
            onClick={() => createShare.mutate()}
            className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {t("loc.authorize")}
          </button>
        </div>

        <div className="space-y-3">
          <h2 className="kicker">{t("loc.mine")}</h2>
          {mine.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("loc.mineEmpty")}</p>
          ) : (
            mine.map((share) => {
              const expired =
                share.status !== "active" || new Date(share.expires_at).getTime() < Date.now();
              return (
                <div
                  key={share.id}
                  className="rounded-2xl border border-border bg-card p-4 shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{share.recipient_email}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {expired
                          ? t("loc.expired")
                          : `${t("loc.until")} ${new Date(share.expires_at).toLocaleTimeString()}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={t("loc.revoke")}
                      onClick={() => revoke.mutate(share)}
                      className="rounded-full border border-border p-2 text-muted-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {!expired ? (
                    <button
                      type="button"
                      disabled={sendPosition.isPending}
                      onClick={() => {
                        if (!window.confirm(t("loc.sendConfirm"))) return;
                        sendPosition.mutate(share);
                      }}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-primary py-2.5 text-xs font-semibold text-primary disabled:opacity-50"
                    >
                      <MapPin className="size-4" />
                      {t("loc.sendNow")}
                    </button>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-3">
          <h2 className="kicker">{t("loc.received")}</h2>
          {receivedPoints.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("loc.receivedEmpty")}</p>
          ) : (
            <PlacesMap points={receivedPoints} />
          )}
        </div>
      </section>
    </AppShell>
  );
}

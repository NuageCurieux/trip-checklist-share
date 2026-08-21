import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

type Profile = {
  id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  instagram: string | null;
};

const HANDLE_RE = /^[a-z0-9_]{3,30}$/;

/** Lets the traveller set up the single public link used in an Instagram bio. */
export function PublicPageEditor({ userId }: { userId: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["my-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, handle, display_name, bio, instagram")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return (data as Profile | null) ?? null;
    },
  });

  useEffect(() => {
    if (!profile) return;
    setHandle(profile.handle);
    setDisplayName(profile.display_name);
    setBio(profile.bio ?? "");
    setInstagram(profile.instagram ?? "");
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const cleanHandle = handle.trim().toLowerCase();
      if (!HANDLE_RE.test(cleanHandle)) throw new Error("invalid");
      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        handle: cleanHandle,
        display_name: displayName.trim() || cleanHandle,
        bio: bio.trim() || null,
        instagram: instagram.trim().replace(/^@/, "") || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("common.saved"));
      queryClient.invalidateQueries({ queryKey: ["my-profile", userId] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "";
      if (message === "invalid") toast.error(t("profile.handleInvalid"));
      else if (message.includes("duplicate")) toast.error(t("profile.handleTaken"));
      else toast.error(t("common.error"));
    },
  });

  const publicUrl =
    typeof window !== "undefined" && profile?.handle
      ? `${window.location.origin}/voyageur/${profile.handle}`
      : "";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
      className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-card"
    >
      <div>
        <p className="kicker">{t("profile.kicker")}</p>
        <h2 className="mt-1 font-serif text-xl italic">{t("profile.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("profile.lead")}</p>
      </div>

      <input
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        placeholder={t("profile.handle")}
        maxLength={30}
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
      />
      <input
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder={t("profile.displayName")}
        maxLength={80}
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
      />
      <input
        value={instagram}
        onChange={(e) => setInstagram(e.target.value)}
        placeholder={t("profile.instagram")}
        maxLength={40}
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
      />
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder={t("profile.bio")}
        maxLength={300}
        rows={2}
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
      />

      <button
        type="submit"
        disabled={save.isPending}
        className="w-full rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {t("profile.save")}
      </button>

      {publicUrl ? (
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(publicUrl);
            toast.success(t("profile.copied"));
          }}
          className="w-full rounded-xl border border-border py-2.5 text-sm font-semibold"
        >
          {t("profile.copyLink")}
        </button>
      ) : null}
    </form>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useI18n } from "@/lib/i18n";

type RequestRow = {
  id: string;
  status: "pending" | "approved" | "rejected";
};

/** Lets a signed-in visitor ask a traveller for access to their shared notebooks. */
export function AccessRequest({ ownerId }: { ownerId: string }) {
  const { t } = useI18n();
  const { user, loading } = useSession();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [message, setMessage] = useState("");

  const isOwner = user?.id === ownerId;

  const { data: request, isLoading } = useQuery({
    queryKey: ["access-request", ownerId, user?.id],
    enabled: Boolean(user) && !isOwner,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("access_requests")
        .select("id, status")
        .eq("owner_id", ownerId)
        .eq("viewer_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as RequestRow | null) ?? null;
    },
  });

  const send = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("access_requests").insert({
        owner_id: ownerId,
        viewer_name: name.trim() || null,
        instagram: instagram.trim().replace(/^@/, "") || null,
        message: message.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("access.sent"));
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["access-request", ownerId, user?.id] });
    },
    onError: () => toast.error(t("common.error")),
  });

  if (loading || isOwner) return null;

  if (!user) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <p className="text-sm text-muted-foreground">{t("access.signInHint")}</p>
        <Link
          to="/auth"
          className="mt-3 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
        >
          {t("auth.signIn")}
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;
  }

  if (request) {
    const label =
      request.status === "approved"
        ? t("access.approved")
        : request.status === "rejected"
          ? t("access.rejected")
          : t("access.pending");
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <p className="text-sm font-semibold">{label}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        send.mutate();
      }}
      className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-card"
    >
      <div>
        <h2 className="font-serif text-xl italic">{t("access.requestTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("access.requestLead")}</p>
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("access.yourName")}
        maxLength={60}
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
      />
      <input
        value={instagram}
        onChange={(e) => setInstagram(e.target.value)}
        placeholder={t("access.yourInstagram")}
        maxLength={40}
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t("access.message")}
        maxLength={300}
        rows={2}
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
      />
      <button
        type="submit"
        disabled={send.isPending}
        className="w-full rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {t("access.send")}
      </button>
    </form>
  );
}

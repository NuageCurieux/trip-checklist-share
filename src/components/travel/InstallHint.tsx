import { useEffect, useState } from "react";
import { Share, MoreVertical, Smartphone } from "lucide-react";

import { useI18n } from "@/lib/i18n";

/** Explains how to add the web app to the phone home screen, tailored to the visitor's device. */
export function InstallHint() {
  const { t } = useI18n();
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) setPlatform("ios");
    else if (/Android/.test(ua)) setPlatform("android");
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  if (installed) return null;

  const steps =
    platform === "ios"
      ? [t("install.ios1"), t("install.ios2"), t("install.ios3")]
      : platform === "android"
        ? [t("install.android1"), t("install.android2"), t("install.android3")]
        : [t("install.desktop1"), t("install.desktop2")];

  const Icon = platform === "ios" ? Share : platform === "android" ? MoreVertical : Smartphone;

  return (
    <section className="mt-6 rounded-2xl border border-border/60 bg-white/80 p-5 shadow-card backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
          <Icon className="size-4" />
        </span>
        <h2 className="font-serif text-lg italic">{t("install.title")}</h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{t("install.lead")}</p>
      <ol className="mt-3 space-y-2 text-sm">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-2">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              {index + 1}
            </span>
            <span className="leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-muted-foreground">{t("install.note")}</p>
    </section>
  );
}

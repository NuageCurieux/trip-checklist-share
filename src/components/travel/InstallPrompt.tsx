import { useEffect, useState } from "react";
import { Download, X, Share, MoreVertical } from "lucide-react";

import { useI18n } from "@/lib/i18n";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "carnets.install.dismissed";

/**
 * Floating banner offering a one-tap install (Android/desktop) or the exact
 * home-screen steps (iOS, which has no install event).
 */
export function InstallPrompt() {
  const { t } = useI18n();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const [visible, setVisible] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari flag
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const ua = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/.test(ua);
    if (isIos) setPlatform("ios");
    else if (/Android/.test(ua)) setPlatform("android");

    setVisible(true);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const onInstalled = () => setVisible(false);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  async function install() {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setVisible(false);
      setDeferred(null);
      return;
    }
    setShowSteps((value) => !value);
  }

  const steps =
    platform === "ios"
      ? [t("install.ios1"), t("install.ios2"), t("install.ios3")]
      : platform === "android"
        ? [t("install.android1"), t("install.android2"), t("install.android3")]
        : [t("install.desktop1"), t("install.desktop2")];

  const StepIcon = platform === "ios" ? Share : platform === "android" ? MoreVertical : Download;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-border/60 bg-white/95 p-4 shadow-card backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <Download className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-serif text-base italic leading-tight">{t("install.title")}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t("install.lead")}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t("install.later")}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={install}
          className="mt-3 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {deferred ? t("install.now") : t("install.how")}
        </button>

        {!deferred && showSteps ? (
          <ol className="mt-3 space-y-2 text-xs">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-2">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        ) : null}

        {!deferred && showSteps ? (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <StepIcon className="size-3" />
            {t("install.note")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

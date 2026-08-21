import { useEffect, useRef, useState } from "react";

import { externalMapUrl, providerForCountry, providerLabel } from "@/lib/mapProviders";

export type MapPoint = {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  visited?: boolean;
  favorite?: boolean;
};

const BROWSER_KEY = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"] as
  | string
  | undefined;
const CHANNEL = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] as
  | string
  | undefined;

let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise<void>((resolve, reject) => {
    const w = window as unknown as Record<string, unknown>;
    if (w["google"]) {
      resolve();
      return;
    }
    if (!BROWSER_KEY) {
      reject(new Error("Missing Google Maps browser key"));
      return;
    }
    w["__initCarnetsMap"] = () => resolve();
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: BROWSER_KEY,
      loading: "async",
      callback: "__initCarnetsMap",
    });
    if (CHANNEL) params.set("channel", CHANNEL);
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

export function PlacesMap({
  points,
  country,
  city,
  onSelect,
}: {
  points: MapPoint[];
  country?: string | null;
  city?: string | null;
  onSelect?: (id: string) => void;
}) {
  const provider = providerForCountry(country);
  const ref = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);
  const located = points.filter((p) => p.lat != null && p.lng != null);

  useEffect(() => {
    if (provider !== "google" || !ref.current || located.length === 0) return;
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !ref.current) return;
        const maps = (window as unknown as { google: any }).google.maps;
        const map = new maps.Map(ref.current, {
          zoom: 12,
          center: { lat: located[0]!.lat as number, lng: located[0]!.lng as number },
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        const bounds = new maps.LatLngBounds();
        for (const point of located) {
          const position = { lat: point.lat as number, lng: point.lng as number };
          bounds.extend(position);
          const marker = new maps.Marker({
            map,
            position,
            title: point.name,
            label: point.favorite ? { text: "★", color: "#ffffff" } : undefined,
            opacity: point.visited ? 0.6 : 1,
          });
          if (onSelect) marker.addListener("click", () => onSelect(point.id));
        }
        if (located.length > 1) map.fitBounds(bounds, 48);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, located.length]);

  if (located.length === 0) {
    return (
      <div className="grid aspect-4/3 w-full place-items-center rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
        <p className="px-6">Ajoutez des lieux localisés pour voir la carte.</p>
      </div>
    );
  }

  if (provider !== "google" || failed) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <p className="kicker mb-2">{providerLabel(provider)}</p>
        <p className="text-xs text-muted-foreground">
          {provider === "google"
            ? "La carte n'a pas pu se charger. Ouvrez les lieux dans Google Maps."
            : `Google Maps est très limité ici : ouvrez les lieux dans ${providerLabel(provider)}.`}
        </p>
        <ul className="mt-3 space-y-2">
          {located.map((point) => (
            <li key={point.id}>
              <a
                href={externalMapUrl(provider, point)}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium underline"
              >
                {point.name}
                {city ? <span className="text-muted-foreground"> · {city}</span> : null}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role="application"
      aria-label="Carte des lieux du carnet"
      className="aspect-4/3 w-full overflow-hidden rounded-2xl border border-border shadow-card"
    />
  );
}

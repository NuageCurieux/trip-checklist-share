/**
 * Some countries restrict Google Maps coverage (South Korea has no driving/base
 * detail, China uses shifted coordinates). For those we fall back to the local
 * provider — Naver / Kakao in Korea, Amap in China — via deep links, so the
 * traveller always lands on a usable map.
 */
export type MapProvider = "google" | "naver" | "amap";

const KOREA = ["corée du sud", "coree du sud", "south korea", "korea", "corea del sur", "kr", "kor"];
const CHINA = ["chine", "china", "cn", "chn"];

export function providerForCountry(country?: string | null): MapProvider {
  const value = (country ?? "").trim().toLowerCase();
  if (!value) return "google";
  if (KOREA.some((c) => value === c || value.includes(c))) return "naver";
  if (CHINA.some((c) => value === c || value.includes(c))) return "amap";
  return "google";
}

export function providerLabel(provider: MapProvider): string {
  if (provider === "naver") return "Naver Map";
  if (provider === "amap") return "Amap (高德地图)";
  return "Google Maps";
}

export function externalMapUrl(
  provider: MapProvider,
  place: { name: string; lat?: number | null; lng?: number | null },
): string {
  const query = encodeURIComponent(place.name);
  if (provider === "naver") return `https://map.naver.com/p/search/${query}`;
  if (provider === "amap") return `https://www.amap.com/search?query=${query}`;
  if (place.lat != null && place.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Embeddable preview. Naver/Amap have no key-free embed, so we show a neutral
 * OpenStreetMap frame centred on the point and link out to the local provider.
 */
export function embedMapUrl(lat: number, lng: number): string {
  const d = 0.006;
  const bbox = [lng - d, lat - d, lng + d, lat + d].join("%2C");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  country?: string;
};

type NominatimResponse = {
  address?: NominatimAddress;
  display_name?: string;
};

const COORDINATE_PATTERN = /^-?\d+(?:\.\d+)?,\s*-?\d+(?:\.\d+)?$/;

export function parseCoordinateLabel(label: string) {
  if (!COORDINATE_PATTERN.test(label)) return null;
  const [latRaw, lonRaw] = label.split(",").map((value) => value.trim());
  const latitude = Number(latRaw);
  const longitude = Number(lonRaw);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

function formatAddressLabel(address?: NominatimAddress) {
  if (!address) return "";
  const primary =
    address.city ||
    address.town ||
    address.village ||
    address.county ||
    address.state ||
    "";
  const state = address.state && address.state !== primary ? address.state : "";
  const country = address.country || "";
  return [primary, state, country].filter(Boolean).join(", ");
}

export async function resolveLocationName(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", latitude.toString());
  url.searchParams.set("lon", longitude.toString());
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as NominatimResponse;
  const label = formatAddressLabel(payload.address);
  return label || payload.display_name || null;
}

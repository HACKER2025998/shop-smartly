// Detect user country via free IP geolocation, fallback to TG (Togo)
export type CountryInfo = { code: string; dialCode: string; name: string };

const FALLBACK: CountryInfo = { code: "TG", dialCode: "228", name: "Togo" };

let cached: CountryInfo | null = null;

export async function detectCountry(): Promise<CountryInfo> {
  if (cached) return cached;
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) throw new Error("geo failed");
    const data = await res.json();
    cached = {
      code: data.country_code || FALLBACK.code,
      dialCode: (data.country_calling_code || "+228").replace("+", ""),
      name: data.country_name || FALLBACK.name,
    };
    return cached;
  } catch {
    cached = FALLBACK;
    return cached;
  }
}

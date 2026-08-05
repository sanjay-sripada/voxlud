export function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  return url;
}

export function getSupabaseAnonKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return key;
}

const PLACEHOLDER_PATTERNS = [
  "your-project",
  "your-anon-key",
  "your_supabase",
  "example.com",
];

function isPlaceholder(value: string | undefined) {
  if (!value) return true;
  const lower = value.toLowerCase();
  return PLACEHOLDER_PATTERNS.some((pattern) => lower.includes(pattern));
}

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key && !isPlaceholder(url) && !isPlaceholder(key));
}

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

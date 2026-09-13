export const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://aebzivitlbhyzjuksnlu.supabase.co";

// This is Supabase's browser-safe publishable key. Authorization remains
// enforced by Postgres Row Level Security; the service-role key is never used
// by this application.
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_GRvYPCmQePzETrZ505YoIw_HjKSUQtk";

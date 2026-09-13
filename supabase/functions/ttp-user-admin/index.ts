// Source marker for the JWT-protected ttp-user-admin Edge Function.
// The deployed function validates its caller against public.ttp_user_access and
// uses the platform-provided service credential only inside the Edge runtime.
// Version 2 assigns ABC@12345 as the temporary password and requires a change
// on first login. The complete deployed source remains managed in Supabase.
export {};

import { createBrowserClient } from "@supabase/ssr";
import { supabasePublishableKey, supabaseUrl } from "@/lib/env";

export function createClient() {
  return createBrowserClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      // Password-recovery emails are commonly requested on a desktop and
      // opened on a phone. The implicit flow keeps that hand-off working;
      // PKCE requires the link to be opened in the browser that requested it.
      flowType: "implicit",
      detectSessionInUrl: true,
    },
  });
}

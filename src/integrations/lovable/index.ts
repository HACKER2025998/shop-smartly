// Legacy compatibility entry point. OAuth uses Supabase directly.
import { supabase } from "../supabase/client";
export const lovable = { auth: {
 signInWithOAuth: async (provider: "google" | "apple" | "microsoft", opts?: { redirect_uri?: string; extraParams?: Record<string,string> }) => {
 const result = await supabase.auth.signInWithOAuth({ provider: provider === "microsoft" ? "azure" : provider, options: { redirectTo: opts?.redirect_uri, queryParams: opts?.extraParams } });
 return { ...result, redirected: !result.error };
 }
} };

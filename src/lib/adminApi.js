import { supabase } from './supabaseClient';

// Admin-only: provisions a brand-new ExamsLock user via the admin-create-user Edge Function,
// which uses the service-role key server-side and re-checks (never trusts the client) that the
// caller actually holds the institutional/superadmin role. There is no public sign-up in this app.
export async function adminCreateUser(payload) {
  const { data, error } = await supabase.functions.invoke('admin-create-user', { body: payload });
  if (error) throw new Error(error.context?.body?.error || error.message);
  return data;
}

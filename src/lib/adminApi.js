// NOTE: this file is unchanged — the real fix for Observations 2/3 has to happen in the
// admin-create-user Edge Function itself (see the proposed patch below), since this file
// only forwards whatever role the form sends. Restricting ROLE_OPTIONS in UsersPage.jsx is
// a UI nicety, not enforcement.
import { supabase } from './supabaseClient';

// Admin-only: provisions a brand-new ExamsLock user via the admin-create-user Edge Function,
// which uses the service-role key server-side and re-checks (never trusts the client) that the
// caller actually holds the institutional/superadmin role. There is no public sign-up in this app.
export async function adminCreateUser(payload) {
  const { data, error } = await supabase.functions.invoke('admin-create-user', { body: payload });
  if (error) throw new Error(error.context?.body?.error || error.message);
  return data;
}

// Observation 1 fix: activates/deactivates an existing user via the admin-set-user-status
// Edge Function. This has to go through a service-role Edge Function rather than a direct
// supabase.from('profiles').update(...) call, because there is no RLS policy allowing one
// user to write another user's profile row — only the user themself can (profiles_self_update).
export async function adminSetUserStatus(userId, active) {
  const { data, error } = await supabase.functions.invoke('admin-set-user-status', { body: { user_id: userId, active } });
  if (error) throw new Error(error.context?.body?.error || error.message);
  return data;
}

// Resets a user's password via the admin-reset-password Edge Function and returns a new
// temporary password to share with them out of band. Goes through a service-role Edge Function
// for the same reason adminSetUserStatus does — no RLS policy lets one user touch another's
// account, and password changes need the service-role auth admin API regardless.
export async function adminResetPassword(userId) {
  const { data, error } = await supabase.functions.invoke('admin-reset-password', { body: { user_id: userId } });
  if (error) throw new Error(error.context?.body?.error || error.message);
  return data;
}
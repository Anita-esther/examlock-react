import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PRIVILEGED_ROLES = ['superadmin', 'financials-admin'];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
}

function generatePassword() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 14) + 'Aa1!';
}

// Identical pattern to admin-create-user / admin-set-user-status: verify the caller's identity
// and role using their own JWT against the anon client (never trust a role sent by the client),
// then use the service-role client only after that check passes.
async function authenticateCaller(req: Request, url: string, anonKey: string) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userErr } = await callerClient.auth.getUser();
  if (userErr || !userData?.user) throw { status: 401, message: 'Not authenticated' };

  const { data: callerRoles, error: rolesErr } = await callerClient.from('profile_roles').select('role').eq('profile_id', userData.user.id);
  if (rolesErr) throw { status: 500, message: rolesErr.message };
  const roleNames = (callerRoles ?? []).map((r: { role: string }) => r.role);
  const isSuperadmin = roleNames.includes('superadmin');
  const isInstitutional = roleNames.includes('institutional');
  if (!isSuperadmin && !isInstitutional) throw { status: 403, message: 'Only institutional or superadmin accounts may reset a user\'s password.' };

  const { data: callerProfile } = await callerClient.from('profiles').select('tenant_id').eq('id', userData.user.id).single();
  return { id: userData.user.id, isSuperadmin, tenantId: callerProfile?.tenant_id ?? null };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    const caller = await authenticateCaller(req, url, anonKey);
    const admin = createClient(url, serviceRoleKey);
    const { user_id } = await req.json().catch(() => ({}));

    if (!user_id) throw { status: 400, message: 'user_id is required.' };
    if (user_id === caller.id) {
      throw { status: 400, message: 'You cannot reset your own password from here.' };
    }

    const { data: target, error: targetErr } = await admin
      .from('profiles')
      .select('id, tenant_id')
      .eq('id', user_id)
      .single();
    if (targetErr || !target) throw { status: 404, message: 'User not found.' };

    const { data: targetRoleRows } = await admin.from('profile_roles').select('role').eq('profile_id', user_id);
    const targetRoles = (targetRoleRows ?? []).map((r: { role: string }) => r.role);

    // Same boundary as admin-set-user-status: superadmin only manages institutional admins;
    // institutional admins only manage their own tenant's staff/students, and can never touch
    // another institutional, superadmin, or financials-admin account.
    if (caller.isSuperadmin) {
      if (!targetRoles.includes('institutional')) {
        throw { status: 403, message: 'Superadmin accounts can only reset institutional admin passwords.' };
      }
    } else {
      if (target.tenant_id !== caller.tenantId) {
        throw { status: 403, message: 'You can only manage users within your own institution.' };
      }
      if (targetRoles.some((r: string) => PRIVILEGED_ROLES.includes(r) || r === 'institutional')) {
        throw { status: 403, message: 'Institutional admins cannot reset the password of institutional, superadmin, or financials-admin accounts.' };
      }
    }

    const newPassword = generatePassword();
    const { error: authErr } = await admin.auth.admin.updateUserById(user_id, { password: newPassword });
    if (authErr) throw { status: 400, message: authErr.message };

    // force_password_reset lives on profiles (not auth metadata) once a user already exists,
    // so it has to be written directly here rather than via the handle_new_user trigger path.
    const { error: updateErr } = await admin.from('profiles').update({ force_password_reset: true }).eq('id', user_id);
    if (updateErr) throw { status: 400, message: updateErr.message };

    await admin.from('audit_log').insert({
      tenant_id: target.tenant_id,
      actor_id: caller.id,
      action: 'RESET_PASSWORD',
      entity: 'profiles',
      entity_id: user_id,
      metadata: {}
    });

    return json({ user_id, temporary_password: newPassword });
  } catch (e) {
    const err = e as { status?: number; message?: string };
    return json({ error: err.message ?? String(e) }, err.status ?? 500);
  }
});
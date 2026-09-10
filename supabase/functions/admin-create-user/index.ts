import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ALLOWED_ROLES = ['student','lecturer','invigilator','hod','qa','printer','central','committee','institutional','superadmin','financials-admin'];
const PRIVILEGED_ROLES = ['superadmin','financials-admin'];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
}

function generatePassword() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 14) + 'Aa1!';
}

// Core creation routine shared by the single-user endpoint and the bulk importer.
export async function createOneUser(admin: ReturnType<typeof createClient>, caller: { id: string; isSuperadmin: boolean; tenantId: string | null }, payload: Record<string, unknown>) {
  const { email, name, role, roles, tenant_id, staff_id, matric_no, department, faculty,
    department_id, faculty_id, level, phone, photo_url, academic_rank, office_position,
    programme, admission_session, assigned_course_ids, temporary_password } = payload as any;

  if (!email || !name || !role) throw { status: 400, message: 'email, name and role are required.' };
  if (!ALLOWED_ROLES.includes(role)) throw { status: 400, message: `Unknown role: ${role}` };

  // Observation 2/3 fix: superadmin exists only to onboard paying tenants, so it may only ever
  // create the one institutional admin account per school. Institutional admins manage their
  // own school's staff/students, but can never create another institutional, a superadmin, or
  // a financials-admin account — that would let a school self-escalate into platform-level access.
  if (caller.isSuperadmin) {
    if (role !== 'institutional') {
      throw { status: 403, message: 'Superadmin accounts may only create institutional admin accounts.' };
    }
  } else if (PRIVILEGED_ROLES.includes(role) || role === 'institutional') {
    throw { status: 403, message: 'Institutional admins cannot create institutional admin, superadmin, or financials-admin accounts.' };
  }

  const effectiveTenantId = caller.isSuperadmin ? (tenant_id ?? caller.tenantId) : caller.tenantId;
  const password = temporary_password || generatePassword();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: {
      name, role, roles: roles ?? [role], tenant_id: effectiveTenantId,
      staff_id, matric_no, department, faculty, department_id, faculty_id, level,
      phone, photo_url, academic_rank, office_position, programme, admission_session,
      assigned_course_ids,
      // Observation 1 fix: users are provisioned with a working temporary password and are
      // expected to change it on first login (force_password_reset handles that requirement) —
      // there's no separate email-confirmation/activation step in this app, so leaving status
      // as 'pending_activation' just locked every new account out with no way back in short of
      // a manual SQL update. Start active; force_password_reset still requires a password change.
      status: 'active', force_password_reset: true,
      created_by: caller.id
    }
  });
  if (createErr) throw { status: 400, message: createErr.message };

  await admin.from('audit_log').insert({
    tenant_id: effectiveTenantId, actor_id: caller.id, action: 'CREATE_USER',
    entity: 'profiles', entity_id: created.user.id, metadata: { email, role }
  });

  return { user_id: created.user.id, email, temporary_password: password };
}

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
  if (!isSuperadmin && !isInstitutional) throw { status: 403, message: 'Only institutional or superadmin accounts may create users.' };

  const { data: callerProfile } = await callerClient.from('profiles').select('tenant_id').eq('id', userData.user.id).single();
  return { id: userData.user.id, isSuperadmin, tenantId: callerProfile?.tenant_id ?? null };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    const caller = await authenticateCaller(req, url, anonKey);
    const admin = createClient(url, serviceRoleKey);
    const body = await req.json().catch(() => ({}));
    const result = await createOneUser(admin, caller, body);
    return json(result);
  } catch (e) {
    const err = e as { status?: number; message?: string };
    return json({ error: err.message ?? String(e) }, err.status ?? 500);
  }
});

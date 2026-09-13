export const KNOWN_ROLES = ['student','lecturer','invigilator','hod','qa','printer','central','committee','institutional','superadmin','financials-admin'];

export function normalizeClaims({ user, profile, roles } = {}) {
  const roleList = (roles || []).filter(r => KNOWN_ROLES.includes(r));
  const primary = profile?.primary_role && roleList.includes(profile.primary_role) ? profile.primary_role : (roleList[0] || 'student');
  return {
    sub: String(user?.id || ''),
    name: String(profile?.name || user?.email || ''),
    email: String(user?.email || profile?.email || ''),
    tenantId: String(profile?.tenant_id || ''),
    department: String(profile?.department || ''),
    roles: roleList,
    primaryRole: primary,
    active: profile?.active !== false
  };
}

export function canSwitchRole(claims, targetRole) {
  const roles = claims?.roles || [];
  if (roles.includes('superadmin')) return KNOWN_ROLES.includes(targetRole);
  if (roles.includes('institutional')) return !['superadmin', 'financials-admin'].includes(targetRole) && KNOWN_ROLES.includes(targetRole);
  return roles.includes(targetRole);
}
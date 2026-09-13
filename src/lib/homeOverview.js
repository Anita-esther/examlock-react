import { supabase } from './supabaseClient';

async function count(table, applyFilters) {
  let query = supabase.from(table).select('id', { count: 'exact', head: true });
  query = applyFilters(query);
  const { count: n, error } = await query;
  if (error) throw error;
  return n ?? 0;
}

// Returns { title, stats: [{ label, value }] } scoped to what the active role should actually
// see — replaces the old one-size-fits-all "Tenant overview" that showed every role the same
// tenant-wide courses/venues/users numbers regardless of whether that was appropriate for them.
export async function loadRoleOverview(activeRole, claims) {
  const uid = claims.sub;
  const tenantId = claims.tenantId || null;
  const department = claims.department || null;

  switch (activeRole) {
    case 'superadmin': {
      const [tenants, institutionalAdmins] = await Promise.all([
        count('tenants', q => q),
        count('profiles', q => q.eq('primary_role', 'institutional'))
      ]);
      return { title: 'Platform overview', stats: [
        { label: 'Tenants', value: tenants },
        { label: 'Institutional admins', value: institutionalAdmins }
      ] };
    }

    case 'institutional': {
      const [courses, venues, users] = await Promise.all([
        count('courses', q => q.eq('tenant_id', tenantId)),
        count('venues', q => q.eq('tenant_id', tenantId)),
        count('profiles', q => q.eq('tenant_id', tenantId))
      ]);
      return { title: 'Institution overview', stats: [
        { label: 'Courses', value: courses },
        { label: 'Venues', value: venues },
        { label: 'Users', value: users }
      ] };
    }

    case 'hod': {
      const [courses, venues, students] = await Promise.all([
        count('courses', q => q.eq('tenant_id', tenantId).eq('department', department)),
        count('venues', q => q.eq('tenant_id', tenantId).eq('department', department)),
        count('profiles', q => q.eq('tenant_id', tenantId).eq('department', department).eq('primary_role', 'student'))
      ]);
      return { title: 'Department overview', stats: [
        { label: 'Courses', value: courses },
        { label: 'Venues', value: venues },
        { label: 'Students', value: students }
      ] };
    }

    case 'student': {
      const [registrations, examEvents, cases] = await Promise.all([
        count('course_registrations', q => q.eq('student_id', uid)),
        count('exam_lifecycle', q => q.eq('student_id', uid)),
        count('malpractice_cases', q => q.eq('student_id', uid))
      ]);
      return { title: 'Your overview', stats: [
        { label: 'Registered courses', value: registrations },
        { label: 'Exams tracked', value: examEvents },
        { label: 'Reported cases', value: cases }
      ] };
    }

    case 'lecturer': {
      const [courses, assignments] = await Promise.all([
        count('course_lecturers', q => q.eq('profile_id', uid)),
        count('invigilator_assignments', q => q.eq('profile_id', uid))
      ]);
      return { title: 'Your overview', stats: [
        { label: 'Courses assigned', value: courses },
        { label: 'Invigilation assignments', value: assignments }
      ] };
    }

    case 'invigilator': {
      const assignments = await count('invigilator_assignments', q => q.eq('profile_id', uid));
      return { title: 'Your overview', stats: [
        { label: 'Invigilation assignments', value: assignments }
      ] };
    }

    case 'qa': {
      const [alerts, cases] = await Promise.all([
        count('integrity_alerts', q => q.eq('tenant_id', tenantId)),
        count('malpractice_cases', q => q.eq('tenant_id', tenantId))
      ]);
      return { title: 'Integrity overview', stats: [
        { label: 'Integrity alerts', value: alerts },
        { label: 'Malpractice cases', value: cases }
      ] };
    }

    case 'printer': {
      const booklets = await count('booklets', q => q.eq('tenant_id', tenantId));
      return { title: 'Production overview', stats: [
        { label: 'Booklets', value: booklets }
      ] };
    }

    case 'central': {
      const [examSlots, courses] = await Promise.all([
        count('exam_slots', q => q.eq('tenant_id', tenantId)),
        count('courses', q => q.eq('tenant_id', tenantId))
      ]);
      return { title: 'Exams overview', stats: [
        { label: 'Exam slots', value: examSlots },
        { label: 'Courses', value: courses }
      ] };
    }

    case 'committee': {
      const cases = await count('malpractice_cases', q => q.eq('tenant_id', tenantId));
      return { title: 'Cases overview', stats: [
        { label: 'Malpractice cases', value: cases }
      ] };
    }

    default:
      return { title: 'Overview', stats: [] };
  }
}
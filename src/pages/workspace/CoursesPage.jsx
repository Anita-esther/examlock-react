import { useAuth } from '../../auth/AuthContext';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { supabase } from '../../lib/supabaseClient';
import DataTable from '../../components/DataTable';

export default function CoursesPage() {
  const { claims, activeRole } = useAuth();

  const { data: rows, loading, error } = useSupabaseQuery(async () => {
    if (activeRole === 'student') {
      const { data, error: err } = await supabase.from('course_registrations')
        .select('id, clearance, status, courses(code, title, units, department)')
        .eq('student_id', claims.sub);
      if (err) throw err;
      return (data || []).map(r => ({ id: r.id, code: r.courses?.code, title: r.courses?.title, units: r.courses?.units, department: r.courses?.department, clearance: r.clearance, status: r.status }));
    }
    if (activeRole === 'lecturer') {
      const { data, error: err } = await supabase.from('course_lecturers')
        .select('role_in_course, courses(id, code, title, units, department)')
        .eq('profile_id', claims.sub);
      if (err) throw err;
      return (data || []).map((r, i) => ({ id: i, code: r.courses?.code, title: r.courses?.title, units: r.courses?.units, department: r.courses?.department, role: r.role_in_course }));
    }
    const { data, error: err } = await supabase.from('courses').select('*').eq('tenant_id', claims.tenantId);
    if (err) throw err;
    return (data || []).map(c => ({ id: c.id, code: c.code, title: c.title, units: c.units, department: c.department, faculty: c.faculty, semester: c.semester }));
  }, [claims.sub, activeRole]);

  const columns = activeRole === 'student'
    ? [{ key: 'code', label: 'Code' }, { key: 'title', label: 'Title' }, { key: 'units', label: 'Units' }, { key: 'clearance', label: 'Clearance' }, { key: 'status', label: 'Status' }]
    : activeRole === 'lecturer'
    ? [{ key: 'code', label: 'Code' }, { key: 'title', label: 'Title' }, { key: 'units', label: 'Units' }, { key: 'role', label: 'Role' }]
    : [{ key: 'code', label: 'Code' }, { key: 'title', label: 'Title' }, { key: 'department', label: 'Department' }, { key: 'faculty', label: 'Faculty' }, { key: 'semester', label: 'Semester' }];

  return (
    <>
      <div className="page-title"><h2>Courses</h2></div>
      {loading ? <div className="loading">Loading courses…</div> :
        error ? <div className="alert warning"><b>Could not load courses</b><span>{error}</span></div> :
        <div className="card pad"><DataTable columns={columns} rows={rows} emptyLabel="No courses found for your tenant yet." /></div>}
    </>
  );
}

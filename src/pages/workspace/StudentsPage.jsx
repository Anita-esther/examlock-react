import { useAuth } from '../../auth/AuthContext';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { supabase } from '../../lib/supabaseClient';
import DataTable, { StatusChip } from '../../components/DataTable';

export default function StudentsPage() {
  const { claims } = useAuth();

  const { data: rows, loading, error } = useSupabaseQuery(async () => {
    const { data: myCourses, error: cErr } = await supabase.from('course_lecturers').select('course_id').eq('profile_id', claims.sub);
    if (cErr) throw cErr;
    const courseIds = (myCourses || []).map(c => c.course_id);
    if (!courseIds.length) return [];
    const { data: regs, error: rErr } = await supabase.from('course_registrations')
      .select('id, status, clearance, profiles(id, name, matric_no)')
      .in('course_id', courseIds);
    if (rErr) throw rErr;
    const studentIds = (regs || []).map(r => r.profiles?.id).filter(Boolean);
    const { data: lifecycle } = studentIds.length
      ? await supabase.from('exam_lifecycle').select('*').in('student_id', studentIds)
      : { data: [] };
    const byStudent = new Map((lifecycle || []).map(l => [l.student_id, l]));
    return (regs || []).map(r => {
      const l = byStudent.get(r.profiles?.id) || {};
      return {
        id: r.id, name: r.profiles?.name, matric: r.profiles?.matric_no, status: r.status,
        identity: l.identity_verified ? 'Verified' : 'Pending',
        attendance: l.attendance_confirmed ? 'Confirmed' : 'Pending',
        booklet: l.booklet_returned ? 'Returned' : (l.booklet_paired ? 'Paired' : 'Not issued')
      };
    });
  }, [claims.sub]);

  const columns = [
    { key: 'name', label: 'Student' }, { key: 'matric', label: 'Matric No.' },
    { key: 'status', label: 'Registration', render: v => <StatusChip value={v} /> },
    { key: 'identity', label: 'Identity', render: v => <StatusChip value={v} /> },
    { key: 'attendance', label: 'Attendance', render: v => <StatusChip value={v} /> },
    { key: 'booklet', label: 'Booklet', render: v => <StatusChip value={v} /> }
  ];

  return (
    <>
      <div className="page-title"><h2>Students</h2></div>
      {loading ? <div className="loading">Loading students…</div> :
        error ? <div className="alert warning"><b>Could not load students</b><span>{error}</span></div> :
        <div className="card pad"><DataTable columns={columns} rows={rows} emptyLabel="No students registered to your courses yet." /></div>}
    </>
  );
}

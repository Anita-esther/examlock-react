import { useAuth } from '../../auth/AuthContext';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { supabase } from '../../lib/supabaseClient';
import DataTable, { StatusChip } from '../../components/DataTable';

const STAGES = [
  { key: 'identity_verified', label: 'Verify identity' },
  { key: 'attendance_confirmed', label: 'Confirm attendance' },
  { key: 'booklet_paired', label: 'Pair booklet' },
  { key: 'booklet_returned', label: 'Return booklet' },
  { key: 'pre_mark_verified', label: 'Pre-marking verify' }
];

export default function OperationsPage() {
  const { claims } = useAuth();
  const { data: rows, loading, error, refetch } = useSupabaseQuery(async () => {
    const { data: myCourses } = await supabase.from('course_lecturers').select('course_id').eq('profile_id', claims.sub);
    const courseIds = (myCourses || []).map(c => c.course_id);
    let assignedSlots = [];
    if (courseIds.length) {
      const { data: slots } = await supabase.from('exam_slots').select('id').in('course_id', courseIds);
      assignedSlots = (slots || []).map(s => s.id);
    }
    const { data: invig } = await supabase.from('invigilator_assignments').select('exam_slot_id').eq('profile_id', claims.sub);
    const invigSlots = (invig || []).map(i => i.exam_slot_id);
    const slotIds = [...new Set([...assignedSlots, ...invigSlots])];
    if (!slotIds.length) return [];
    const { data, error: err } = await supabase.from('exam_lifecycle')
      .select('*, profiles(name, matric_no)')
      .in('exam_slot_id', slotIds);
    if (err) throw err;
    return data || [];
  }, [claims.sub]);

  const advance = async (row) => {
    const nextField = STAGES.find(s => !row[s.key])?.key;
    if (!nextField) return;
    const { error: err } = await supabase.from('exam_lifecycle').update({ [nextField]: true, updated_at: new Date().toISOString() }).eq('id', row.id);
    if (!err) refetch();
  };

  const columns = [
    { key: 'student', label: 'Student', render: (_, r) => r.profiles?.name || '—' },
    { key: 'matric', label: 'Matric No.', render: (_, r) => r.profiles?.matric_no || '—' },
    { key: 'identity_verified', label: 'Identity', render: v => <StatusChip value={v ? 'Verified' : 'Pending'} /> },
    { key: 'attendance_confirmed', label: 'Attendance', render: v => <StatusChip value={v ? 'Confirmed' : 'Pending'} /> },
    { key: 'booklet_paired', label: 'Booklet', render: v => <StatusChip value={v ? 'Paired' : 'Pending'} /> },
    { key: 'booklet_returned', label: 'Returned', render: v => <StatusChip value={v ? 'Returned' : 'Pending'} /> },
    { key: 'pre_mark_verified', label: 'Pre-mark', render: v => <StatusChip value={v ? 'Verified' : 'Pending'} /> },
    { key: 'action', label: '', render: (_, r) => (
      <button className="btn ghost" onClick={() => advance(r)} disabled={r.pre_mark_verified}>
        {r.pre_mark_verified ? 'Complete' : 'Advance stage'}
      </button>
    ) }
  ];

  return (
    <>
      <div className="page-title"><h2>Operations</h2></div>
      {loading ? <div className="loading">Loading operations queue…</div> :
        error ? <div className="alert warning"><b>Could not load operations</b><span>{error}</span></div> :
        <div className="card pad">
          <DataTable columns={columns} rows={rows} emptyLabel="No exam-day lifecycle records for your assigned exams yet." />
        </div>}
    </>
  );
}

export const roleNavigation = {
  student: [
    { label: 'Home', route: '/home', icon: '⌂' },
    { label: 'Courses', route: '/courses', icon: '▤' },
    { label: 'Exams', route: '/exams', icon: '▣' },
    { label: 'My Role', route: '/my-role', icon: '◈' },
    { label: 'Reports', route: '/reports', icon: '▥' }
  ],
  lecturer: [
    { label: 'Home', route: '/home', icon: '⌂' },
    { label: 'Operations', route: '/operations', icon: '◎' },
    { label: 'Courses', route: '/courses', icon: '▤' },
    { label: 'Exams', route: '/exams', icon: '▣' },
    { label: 'My Role', route: '/my-role', icon: '◈' },
    { label: 'Reports', route: '/reports', icon: '▥' }
  ],
  invigilator: [
    { label: 'Home', route: '/home', icon: '⌂' },
    { label: 'Operations', route: '/operations', icon: '◎' },
    { label: 'Exams', route: '/exams', icon: '▣' },
    { label: 'My Role', route: '/my-role', icon: '◈' },
    { label: 'Reports', route: '/reports', icon: '▥' }
  ],
  hod: [
    { label: 'Home', route: '/home', icon: '⌂' },
    { label: 'Courses', route: '/courses', icon: '▤' },
    { label: 'Students', route: '/students', icon: '♙' },
    { label: 'Exams', route: '/exams', icon: '▣' },
    { label: 'My Role', route: '/my-role', icon: '◈' },
    { label: 'Reports', route: '/reports', icon: '▥' }
  ],
  qa: [
    { label: 'Home', route: '/home', icon: '⌂' },
    { label: 'Live', route: '/live', icon: '◉' },
    { label: 'Integrity', route: '/integrity', icon: '◇' },
    { label: 'My Role', route: '/my-role', icon: '◈' },
    { label: 'Reports', route: '/reports', icon: '▥' }
  ],
  printer: [
    { label: 'Home', route: '/home', icon: '⌂' },
    { label: 'Production', route: '/production', icon: '▣' },
    { label: 'Booklets', route: '/booklets', icon: '▤' },
    { label: 'My Role', route: '/my-role', icon: '◈' },
    { label: 'Reports', route: '/reports', icon: '▥' }
  ],
  central: [
    { label: 'Home', route: '/home', icon: '⌂' },
    { label: 'Exams', route: '/exams', icon: '▣' },
    { label: 'Courses', route: '/courses', icon: '▤' },
    { label: 'Approvals', route: '/approvals', icon: '✓' },
    { label: 'My Role', route: '/my-role', icon: '◈' },
    { label: 'Reports', route: '/reports', icon: '▥' }
  ],
  committee: [
    { label: 'Home', route: '/home', icon: '⌂' },
    { label: 'Cases', route: '/cases', icon: '▤' },
    { label: 'Hearings', route: '/hearings', icon: '⚖' },
    { label: 'My Role', route: '/my-role', icon: '◈' },
    { label: 'Reports', route: '/reports', icon: '▥' }
  ],
  institutional: [
    { label: 'Home', route: '/home', icon: '⌂' },
    { label: 'Users', route: '/users', icon: '♙' },
    { label: 'Exams', route: '/exams', icon: '▣' },
    { label: 'My Role', route: '/my-role', icon: '◈' },
    { label: 'Reports', route: '/reports', icon: '▥' }
  ],
  superadmin: [
    { label: 'Home', route: '/home', icon: '⌂' },
    { label: 'Tenants', route: '/tenants', icon: '▤' },
    { label: 'Admins', route: '/admins', icon: '♙' },
    { label: 'Financials', route: '/financials', icon: '¤' },
    { label: 'My Role', route: '/my-role', icon: '◈' },
    { label: 'Reports', route: '/reports', icon: '▥' }
  ]
};

export const roleRoutes = {
  student: ['/home','/courses','/courses/registration','/courses/history','/courses/detail','/exams','/exams/detail','/exams/cycle','/exams/misconduct','/my-role','/reports'],
  lecturer: ['/home','/operations','/operations/identity-attendance','/operations/pair-booklet','/operations/return-booklet','/operations/pre-marking','/courses','/courses/detail','/courses/registered-students','/exams','/exams/detail','/exams/students-lifecycle','/my-role','/reports'],
  invigilator: ['/home','/operations','/operations/identity-attendance','/operations/pair-booklet','/operations/return-booklet','/operations/pre-marking','/exams','/exams/detail','/exams/students-lifecycle','/my-role','/reports'],
  hod: ['/home','/courses','/courses/manage','/courses/assign-lecturers','/courses/venues','/students','/students/manage','/students/import','/exams','/exams/prepare','/exams/activate','/exams/assign-invigilators','/exams/venue-change','/exams/students-lifecycle','/my-role','/reports'],
  qa: ['/home','/live','/live/venues','/live/exams','/live/map','/integrity','/integrity/anomalies','/integrity/investigations','/integrity/risks','/integrity/alerts','/my-role','/reports'],
  printer: ['/home','/production','/production/queue','/production/batches','/production/quality','/production/encoding','/booklets','/booklets/inventory','/booklets/dispatch','/booklets/returns','/my-role','/reports'],
  central: ['/home','/exams','/exams/timetable','/exams/calendar','/exams/live','/exams/readiness','/exams/venues','/courses','/courses/readiness','/approvals','/approvals/venue-change','/approvals/activation','/my-role','/reports'],
  committee: ['/home','/cases','/cases/detail','/cases/evidence','/cases/timeline','/cases/appeals','/hearings','/hearings/session','/hearings/decision','/my-role','/reports'],
  institutional: ['/home','/users','/exams','/exams/timetable','/exams/venues','/exams/live','/my-role','/reports','/settings','/policies','/integrations','/audit'],
  superadmin: ['/home','/tenants','/tenants/detail','/admins','/admins/financials','/financials','/financials/revenue','/financials/subscriptions','/financials/pricing','/financials/billing','/financials/payments','/financials/metering','/financials/commercialization','/financials/partners','/financials/settlements','/financials/contracts','/financials/taxes','/financials/audit','/my-role','/reports','/system-health','/security','/audit']
};

export const roleLabels = {
  student: 'STUDENT', lecturer: 'LECTURER', invigilator: 'INVIGILATOR', hod: 'HEAD OF DEPARTMENT',
  qa: 'QUALITY ASSURANCE', printer: 'ANSWER BOOKLET PRINTER', central: 'CENTRAL EXAMS ADMIN',
  committee: 'MALPRACTICE COMMITTEE', institutional: 'INSTITUTIONAL ADMIN', superadmin: 'SUPER ADMIN'
};

export function roleLabel(role) { return roleLabels[role] ?? String(role || '').toUpperCase(); }
export function navigationForRole(role) { return roleNavigation[role] ?? roleNavigation.student; }
export function canAccessRoute(role, route) {
  const routes = roleRoutes[role] ?? [];
  return routes.some(r => route === r || (r !== '/home' && route.startsWith(r + '/')));
}

export const lecturerLifecycleStages = [
  { key: 'registered', label: 'Course Registered' },
  { key: 'identity', label: 'Identity & Attendance' },
  { key: 'paired', label: 'Booklet Paired' },
  { key: 'returned', label: 'Booklet Returned' },
  { key: 'preMark', label: 'Pre-Marking Verification' },
  { key: 'handoff', label: 'Handoff Ready' }
];

export function deriveLecturerHandoffState({ preMarkVerified }) {
  return preMarkVerified ? 'HANDOFF_READY' : 'PRE_MARKING_PENDING';
}

export function statusTone(status='') {
  const s = status.toLowerCase();
  if (/verified|cleared|completed|present|paired|returned|ready|registered|confirmed|published|approved|active|healthy|paid|encoded/.test(s)) return 'success';
  if (/pending|scheduled|upcoming|processing|current|open|review|live|queued|printing/.test(s)) return 'info';
  if (/warning|attention|action|required|anomaly|partial|medium|awaiting/.test(s)) return 'warning';
  if (/failed|absent|rejected|blocked|critical|high risk|suspended|overdue/.test(s)) return 'danger';
  return 'muted';
}

export function canCommenceExam({ scheduledAt, now, hodActivated }) {
  if (!hodActivated) return false;
  const scheduled = new Date(scheduledAt).getTime();
  const current = new Date(now).getTime();
  return Number.isFinite(scheduled) && Number.isFinite(current) && current >= scheduled;
}

export function effectiveInvigilators({ courseLecturers = [], additionalInvigilators = [], overrides = [] }) {
  const excluded = new Set(overrides.filter(o => o?.action === 'remove').map(o => o.id));
  return [...new Set([...courseLecturers, ...additionalInvigilators])].filter(id => !excluded.has(id));
}

export function resolveVenueChange({ currentVenue, requestedVenue, centralStatus }) {
  if (String(centralStatus).toLowerCase() === 'approved') return { venue: requestedVenue, status: 'APPROVED' };
  if (String(centralStatus).toLowerCase() === 'rejected') return { venue: currentVenue, status: 'REJECTED' };
  return { venue: currentVenue, status: 'PENDING_APPROVAL' };
}

function toRad(v) { return v * Math.PI / 180; }
export function distanceMeters(a, b) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat/2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function venueCompliance({ approved, observed }) {
  const distanceM = Math.round(distanceMeters(approved, observed));
  const compliant = distanceM <= (approved.radiusM ?? 100);
  return { compliant, distanceM, notify: compliant ? [] : ['qa','hod','central'] };
}

export function centralVisibilityFilter(events = []) {
  return events.filter(event => !['institutional','superadmin'].includes(event.role));
}

function affinity(course, venue) {
  if (course.department && venue.department === course.department) return 0;
  if (course.faculty && venue.faculty === course.faculty) return 1;
  return 2;
}
function cohortConflict(course, assignedCourse, slotId, candidate) {
  if (candidate.slotId !== slotId) return false;
  const a = new Set(course.cohorts || []);
  return (assignedCourse.cohorts || []).some(c => a.has(c));
}
export function generateExamTimetable(courses = [], venues = [], options = {}) {
  const slots = options.slots || [];
  const eligibleVenues = venues.filter(v => v.approved && Number.isFinite(v.lat) && Number.isFinite(v.lon));
  const sortedCourses = [...courses].sort((a,b) => (b.candidates||0) - (a.candidates||0) || String(a.code).localeCompare(String(b.code)));
  const assignments = [];
  const unassigned = [];
  const courseByCode = new Map(courses.map(c => [c.code, c]));
  for (const course of sortedCourses) {
    const candidates = [];
    for (const slot of slots) {
      if ((slot.durationMin ?? Infinity) < (course.durationMin ?? 0)) continue;
      const cohortBusy = assignments.some(a => cohortConflict(course, courseByCode.get(a.courseCode), slot.id, a));
      if (cohortBusy) continue;
      for (const venue of eligibleVenues) {
        if ((venue.capacity ?? 0) < (course.candidates ?? 0)) continue;
        if (assignments.some(a => a.slotId === slot.id && a.venueId === venue.id)) continue;
        const score = affinity(course, venue) * 1_000_000 + ((venue.capacity ?? 0) - (course.candidates ?? 0)) * 10 + String(venue.name||venue.id).localeCompare('');
        candidates.push({ slot, venue, score });
      }
    }
    candidates.sort((a,b) => a.score - b.score || String(a.slot.id).localeCompare(String(b.slot.id)) || String(a.venue.id).localeCompare(String(b.venue.id)));
    const best = candidates[0];
    if (!best) { unassigned.push({ courseCode: course.code, reason: 'NO_COMPATIBLE_SLOT_OR_VENUE' }); continue; }
    assignments.push({ courseCode: course.code, slotId: best.slot.id, start: best.slot.start, durationMin: course.durationMin, venueId: best.venue.id, venueName: best.venue.name, candidates: course.candidates, department: course.department, proximity: affinity(course,best.venue) });
  }
  return { assignments, unassigned };
}

const financialPermissions = {
  'financials-admin': new Set(['issue-invoice','reconcile-payment','manage-subscription','process-approved-refund','prepare-settlement','financial-report']),
  superadmin: new Set(['*'])
};
export function canPerformFinancialAction(role, action) {
  const allowed = financialPermissions[role];
  return !!allowed && (allowed.has('*') || allowed.has(action));
}

const commercialSteps = {
  request:{step:1,label:'Request',terminal:false},
  review:{step:2,label:'Review',terminal:false},
  approve:{step:3,label:'Approve',terminal:false},
  schedule:{step:4,label:'Schedule',terminal:false},
  activate:{step:5,label:'Activate',terminal:false},
  audit:{step:6,label:'Audit',terminal:true}
};
export function commercialApprovalState(state) {
  return commercialSteps[state] ?? { step:0, label:'Unknown', terminal:false };
}
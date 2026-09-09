import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { navigationForRole, roleLabel } from '../lib/domain';
import { canSwitchRole } from '../lib/roles';

export default function AppShell({ children }) {
  const { claims, activeRole, setActiveRole, signOut } = useAuth();
  const navigate = useNavigate();
  const nav = navigationForRole(activeRole);

  const handleRoleChange = (e) => {
    const next = e.target.value;
    setActiveRole(next);
    navigate(`/${next}/home`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className={`app role-${activeRole}`}>
      <aside className="sidebar">
        <div className="brand">
          <img src="/icon.svg" alt="ExamsLock" />
          <div>EXAMSLOCK<small>EXAMINATION INTEGRITY PLATFORM</small></div>
        </div>
        {claims.roles.length > 1 && (
          <div className="role-select-wrap">
            <label>Active role</label>
            <select id="role-select" value={activeRole} onChange={handleRoleChange}>
              {claims.roles.filter(r => canSwitchRole(claims, r)).map(r => (
                <option key={r} value={r}>{roleLabel(r)}</option>
              ))}
            </select>
          </div>
        )}
        <nav className="side-nav">
          {nav.map(item => (
            <NavLink key={item.route} to={`/${activeRole}${item.route}`} className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="ico">{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          {claims.name}<br />{roleLabel(activeRole)}<br />
          <button className="btn ghost full" style={{ marginTop: 12 }} onClick={handleLogout}>Sign out</button>
        </div>
      </aside>
      <div className="main">
        <div className="topbar">
          <h1>{roleLabel(activeRole)} Workspace</h1>
          <div className="top-actions">
            <span className="secure">🔒 Row-Level Security enforced</span>
            <div className="avatar">{(claims.name || '?').slice(0,1).toUpperCase()}</div>
          </div>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RoleBadge from "./RoleBadge";

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" />
          Employee&nbsp;Management
        </div>

        <nav className="nav-group">
          <span className="nav-label">Workspace</span>

          {(user.role === "admin" || user.role === "super_admin") && (
            <NavLink
              to="/employees"
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              Employees
            </NavLink>
          )}

          {user.role === "user" && (
            <NavLink
              to="/my-record"
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              My record
            </NavLink>
          )}

          {user.role === "super_admin" && (
            <NavLink
              to="/users"
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              Users &amp; roles
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="identity">
            <span className="identity-name">{user.name}</span>
            <span className="identity-email">{user.email}</span>
            <RoleBadge role={user.role} />
          </div>
          <button className="logout-btn" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

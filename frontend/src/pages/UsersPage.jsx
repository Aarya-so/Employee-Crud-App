import { useEffect, useState } from "react";
import client, { extractErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import RoleBadge from "../components/RoleBadge";

const ROLES = ["user", "admin", "super_admin"];

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const { data } = await client.get("/users");
      setUsers(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleRoleChange(user, role) {
    if (role === user.role) return;
    setError("");
    try {
      await client.patch(`/users/${user.id}/role`, { role });
      setNotice(`${user.name} is now ${role.replace("_", " ")}.`);
      loadUsers();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Remove ${user.name}'s account? This cannot be undone.`)) return;
    setError("");
    try {
      await client.delete(`/users/${user.id}`);
      setNotice(`${user.name}'s account was removed.`);
      loadUsers();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Users &amp; roles</h1>
          <p>Only super admins can see this page and change permissions.</p>
        </div>
      </div>

      {notice && <div className="banner banner-success">{notice}</div>}
      {error && <div className="banner banner-error">{error}</div>}

      <div className="card">
        {loading ? (
          <p>Loading…</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Change role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td className="mono">{u.email}</td>
                  <td>
                    <RoleBadge role={u.role} />
                  </td>
                  <td>
                    <select
                      value={u.role}
                      disabled={u.id === currentUser.id}
                      onChange={(e) => handleRoleChange(u, e.target.value)}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {u.id !== currentUser.id && (
                      <button className="btn-danger-text" onClick={() => handleDelete(u)}>
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

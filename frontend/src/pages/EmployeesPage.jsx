import { useEffect, useState } from "react";
import client, { extractErrorMessage, extractFieldErrors } from "../api/client";
import EmployeeForm from "../components/EmployeeForm";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [mode, setMode] = useState(null); // null | "create" | employee.id being edited
  const [notice, setNotice] = useState("");

  async function loadEmployees() {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await client.get("/employees");
      setEmployees(data);
    } catch (error) {
      setLoadError(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  async function handleCreate(payload) {
    try {
      await client.post("/employees", payload);
      setNotice("Employee added.");
      setMode(null);
      loadEmployees();
      return { ok: true };
    } catch (error) {
      const fieldErrors = extractFieldErrors(error);
      return fieldErrors ? { fieldErrors } : { message: extractErrorMessage(error) };
    }
  }

  async function handleUpdate(id, payload) {
    try {
      await client.put(`/employees/${id}`, payload);
      setNotice("Employee updated.");
      setMode(null);
      loadEmployees();
      return { ok: true };
    } catch (error) {
      const fieldErrors = extractFieldErrors(error);
      return fieldErrors ? { fieldErrors } : { message: extractErrorMessage(error) };
    }
  }

  async function handleDelete(employee) {
    if (!window.confirm(`Delete ${employee.name}? This cannot be undone.`)) return;
    try {
      await client.delete(`/employees/${employee.id}`);
      setNotice("Employee deleted.");
      loadEmployees();
    } catch (error) {
      setLoadError(extractErrorMessage(error));
    }
  }

  const editingEmployee = typeof mode === "number" ? employees.find((e) => e.id === mode) : null;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Employees</h1>
          <p>Full records for everyone in the system.</p>
        </div>
        {mode === null && (
          <button className="btn btn-primary" onClick={() => setMode("create")}>
            + Add employee
          </button>
        )}
      </div>

      {notice && <div className="banner banner-success">{notice}</div>}
      {loadError && <div className="banner banner-error">{loadError}</div>}

      {mode === "create" && (
        <div className="card">
          <div className="panel-title">
            <h2>New employee</h2>
          </div>
          <EmployeeForm onSubmit={handleCreate} onCancel={() => setMode(null)} submitLabel="Add employee" />
        </div>
      )}

      {editingEmployee && (
        <div className="card">
          <div className="panel-title">
            <h2>Edit {editingEmployee.name}</h2>
          </div>
          <EmployeeForm
            initial={{
              name: editingEmployee.name,
              email: editingEmployee.email,
              department: editingEmployee.department,
              salary: editingEmployee.salary,
              user_email: "",
            }}
            onSubmit={(payload) => handleUpdate(editingEmployee.id, payload)}
            onCancel={() => setMode(null)}
            submitLabel="Save changes"
          />
        </div>
      )}

      <div className="card">
        {loading ? (
          <p>Loading employees…</p>
        ) : employees.length === 0 ? (
          <div className="empty-state">No employees yet. Add the first one above.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Salary</th>
                <th>Linked account</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.name}</td>
                  <td className="mono">{emp.email}</td>
                  <td>{emp.department}</td>
                  <td className="mono">{currency.format(emp.salary)}</td>
                  <td className="mono">{emp.user_id ? `user #${emp.user_id}` : "—"}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => setMode(emp.id)}>
                        Edit
                      </button>
                      <button className="btn-danger-text" onClick={() => handleDelete(emp)}>
                        Delete
                      </button>
                    </div>
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

import { useState } from "react";

const BLANK = { name: "", email: "", department: "", salary: "", user_email: "" };

export default function EmployeeForm({ initial, onSubmit, onCancel, submitLabel = "Save" }) {
  const [values, setValues] = useState(initial ? { ...BLANK, ...initial } : BLANK);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function update(field, value) {
    setValues((v) => ({ ...v, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});
    setSubmitting(true);

    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      department: values.department.trim(),
      salary: Number(values.salary),
      user_email: values.user_email.trim() || null,
    };

    const result = await onSubmit(payload);
    setSubmitting(false);

    if (result?.ok) return;

    if (result?.fieldErrors) {
      setFieldErrors(result.fieldErrors);
    } else if (result?.message) {
      setFormError(result.message);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {formError && <div className="banner banner-error">{formError}</div>}

      <div className="form-row">
        <div className="field">
          <label htmlFor="emp-name">Full name</label>
          <input
            id="emp-name"
            className={fieldErrors.name ? "has-error" : ""}
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />
          {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
        </div>

        <div className="field">
          <label htmlFor="emp-email">Work email</label>
          <input
            id="emp-email"
            type="email"
            className={fieldErrors.email ? "has-error" : ""}
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            required
          />
          {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="emp-department">Department</label>
          <input
            id="emp-department"
            className={fieldErrors.department ? "has-error" : ""}
            value={values.department}
            onChange={(e) => update("department", e.target.value)}
            required
          />
          {fieldErrors.department && <span className="field-error">{fieldErrors.department}</span>}
        </div>

        <div className="field">
          <label htmlFor="emp-salary">Annual salary</label>
          <input
            id="emp-salary"
            type="number"
            min="1"
            step="0.01"
            className={fieldErrors.salary ? "has-error" : ""}
            value={values.salary}
            onChange={(e) => update("salary", e.target.value)}
            required
          />
          {fieldErrors.salary && <span className="field-error">{fieldErrors.salary}</span>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="emp-user-email">Link to a login account (optional)</label>
        <input
          id="emp-user-email"
          type="email"
          placeholder="account-email@example.com"
          className={fieldErrors.user_email ? "has-error" : ""}
          value={values.user_email}
          onChange={(e) => update("user_email", e.target.value)}
        />
        {fieldErrors.user_email && <span className="field-error">{fieldErrors.user_email}</span>}
        <span style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>
          Lets that person view this record under &ldquo;My record&rdquo;. Leave blank to unlink.
        </span>
      </div>

      <div className="row-actions">
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button className="btn btn-ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

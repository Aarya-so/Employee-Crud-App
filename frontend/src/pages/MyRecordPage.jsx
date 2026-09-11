import { useEffect, useState } from "react";
import client, { extractErrorMessage } from "../api/client";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function MyRecordPage() {
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get("/employees/me")
      .then(({ data }) => setEmployee(data))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My record</h1>
          <p>This is the only employee data your account can see.</p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading…</p>
        ) : error ? (
          <div className="banner banner-error">{error}</div>
        ) : (
          <dl className="definition-list">
            <div>
              <dt>Name</dt>
              <dd>{employee.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{employee.email}</dd>
            </div>
            <div>
              <dt>Department</dt>
              <dd>{employee.department}</dd>
            </div>
            <div>
              <dt>Salary</dt>
              <dd>{currency.format(employee.salary)}</dd>
            </div>
          </dl>
        )}
      </div>
    </>
  );
}

import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="empty-state" style={{ paddingTop: "4rem" }}>
      <h2 style={{ marginBottom: "0.5rem" }}>Page not found</h2>
      <Link to="/">Back to your dashboard</Link>
    </div>
  );
}

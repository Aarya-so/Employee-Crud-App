import { Link } from "react-router-dom";

export default function Forbidden() {
  return (
    <div className="empty-state" style={{ paddingTop: "4rem" }}>
      <h2 style={{ marginBottom: "0.5rem" }}>You don&rsquo;t have access to this page</h2>
      <p>Your account role doesn&rsquo;t include this section.</p>
      <Link to="/">Back to your dashboard</Link>
    </div>
  );
}

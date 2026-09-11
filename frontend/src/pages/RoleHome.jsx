import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleHome() {
  const { user } = useAuth();

  if (user.role === "super_admin" || user.role === "admin") {
    return <Navigate to="/employees" replace />;
  }
  return <Navigate to="/my-record" replace />;
}

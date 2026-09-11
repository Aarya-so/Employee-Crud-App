import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import RoleHome from "./pages/RoleHome";
import EmployeesPage from "./pages/EmployeesPage";
import MyRecordPage from "./pages/MyRecordPage";
import UsersPage from "./pages/UsersPage";
import Forbidden from "./pages/Forbidden";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<RoleHome />} />

            <Route
              path="/employees"
              element={
                <ProtectedRoute roles={["admin", "super_admin"]}>
                  <EmployeesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-record"
              element={
                <ProtectedRoute roles={["user"]}>
                  <MyRecordPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute roles={["super_admin"]}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            <Route path="/forbidden" element={<Forbidden />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

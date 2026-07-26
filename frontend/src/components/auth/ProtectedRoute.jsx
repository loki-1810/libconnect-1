import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../constants/routes";
import LoadingScreen from "../common/LoadingScreen";

function ProtectedRoute({ roles }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === "admin" ? ROUTES.ADMIN : user.role === "librarian" ? ROUTES.LIBRARIAN : ROUTES.STUDENT} replace />;
  return <Outlet />;
}

export default ProtectedRoute;

import { Routes, Route } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import Home from "../pages/public/Home/Home";
import About from "../pages/public/About/About";
import Books from "../pages/public/Books/Books";
import Contact from "../pages/public/Contact/Contact";
import Libraries from "../pages/public/Libraries";
import LibraryApplication from "../pages/public/LibraryApplication";
import FAQ from "../pages/public/FAQ";
import BookDetails from "../pages/public/Books/BookDetails";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import DashboardHome from "../pages/dashboard/DashboardHome";
import StudentBorrows from "../pages/dashboard/StudentBorrows";
import StudentReservations from "../pages/dashboard/StudentReservations";
import ManageBooks from "../pages/dashboard/ManageBooks";
import BorrowRequests from "../pages/dashboard/BorrowRequests";
import ManageReservations from "../pages/dashboard/ManageReservations";
import LibrarianBorrows from "../pages/dashboard/LibrarianBorrows";
import AdminLibraries from "../pages/dashboard/AdminLibraries";
import AdminUsers from "../pages/dashboard/AdminUsers";
import Profile from "../pages/dashboard/Profile";
import Notifications from "../pages/dashboard/Notifications";
import NotFound from "../pages/common/NotFound";

import { ROUTES } from "../constants/routes";

function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.BOOKS} element={<Books />} />
        <Route path="/books/:bookId" element={<BookDetails />} />
        <Route path={ROUTES.LIBRARIES} element={<Libraries />} />
        <Route path={ROUTES.LIBRARY_REGISTER} element={<LibraryApplication />} />
        <Route path={ROUTES.FAQ} element={<FAQ />} />
        <Route path={ROUTES.ABOUT} element={<About />} />
        <Route path={ROUTES.CONTACT} element={<Contact />} />
      </Route>

      {/* Auth Pages */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route
          path={ROUTES.FORGOT_PASSWORD}
          element={<ForgotPassword />}
        />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route element={<ProtectedRoute roles={["student"]} />}>
            <Route path={ROUTES.STUDENT} element={<DashboardHome />} />
            <Route path={ROUTES.STUDENT_BORROWS} element={<StudentBorrows />} />
            <Route path={ROUTES.STUDENT_RESERVATIONS} element={<StudentReservations />} />
            <Route path={ROUTES.STUDENT_NOTIFICATIONS} element={<Notifications />} />
          </Route>
          <Route element={<ProtectedRoute roles={["librarian"]} />}>
            <Route path={ROUTES.LIBRARIAN} element={<DashboardHome />} />
            <Route path={ROUTES.LIBRARIAN_BOOKS} element={<ManageBooks />} />
            <Route path={ROUTES.LIBRARIAN_REQUESTS} element={<BorrowRequests />} />
            <Route path={ROUTES.LIBRARIAN_BORROWED} element={<LibrarianBorrows />} />
            <Route path={ROUTES.LIBRARIAN_RESERVATIONS} element={<ManageReservations />} />
            <Route path={ROUTES.LIBRARIAN_NOTIFICATIONS} element={<Notifications />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path={ROUTES.ADMIN} element={<DashboardHome />} />
            <Route path={ROUTES.ADMIN_LIBRARIES} element={<AdminLibraries />} />
            <Route path={ROUTES.ADMIN_USERS} element={<AdminUsers />} />
            <Route path={ROUTES.ADMIN_NOTIFICATIONS} element={<Notifications />} />
          </Route>
          <Route path={ROUTES.PROFILE} element={<Profile />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;

import { Link, NavLink, Outlet } from "react-router-dom";
import { FiBookOpen, FiHome, FiLogOut, FiUsers, FiBookmark, FiUser, FiBell } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { ROUTES } from "../constants/routes";

const navigation = {
  student: [[ROUTES.STUDENT, "Overview", FiHome], [ROUTES.BOOKS, "Browse books", FiBookOpen], [ROUTES.STUDENT_BORROWS, "My borrowing", FiBookmark], [ROUTES.STUDENT_RESERVATIONS, "Reservations", FiBell], [ROUTES.PROFILE, "Profile", FiUser]],
  librarian: [[ROUTES.LIBRARIAN, "Overview", FiHome], [ROUTES.LIBRARIAN_BOOKS, "Manage books", FiBookOpen], [ROUTES.LIBRARIAN_REQUESTS, "Borrow requests", FiBookmark], [ROUTES.LIBRARIAN_RESERVATIONS, "Reservations", FiBell], [ROUTES.PROFILE, "Profile", FiUser]],
  admin: [[ROUTES.ADMIN, "Overview", FiHome], [ROUTES.ADMIN_LIBRARIES, "Libraries", FiBookOpen], [ROUTES.ADMIN_USERS, "Users", FiUsers], [ROUTES.PROFILE, "Profile", FiUser]],
};

function DashboardLayout() {
  const { user, logout } = useAuth();
  const items = navigation[user?.role] || [];
  return <div className="min-h-screen bg-slate-50 lg:flex"><aside className="flex shrink-0 flex-col bg-slate-950 px-4 py-6 text-slate-300 lg:w-64"><Link to="/" className="mb-10 px-3 text-xl font-bold text-white">Lib<span className="text-blue-400">Connect</span></Link><nav className="flex gap-1 overflow-x-auto lg:flex-col">{items.map(([to, label, Icon]) => <NavLink key={to} end={to === ROUTES.STUDENT || to === ROUTES.LIBRARIAN || to === ROUTES.ADMIN} to={to} className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}><Icon />{label}</NavLink>)}</nav><button type="button" onClick={logout} className="mt-auto hidden items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-slate-800 hover:text-white lg:flex"><FiLogOut />Log out</button></aside><main className="min-w-0 flex-1"><header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 md:px-8"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{user?.role} portal</p><h1 className="font-semibold text-slate-900">Welcome, {user?.name?.split(" ")[0]}</h1></div><Link to={ROUTES.PROFILE} className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 font-bold text-blue-700">{user?.name?.charAt(0)}</Link></header><div className="mx-auto max-w-7xl p-5 md:p-8"><Outlet /></div></main></div>;
}

export default DashboardLayout;

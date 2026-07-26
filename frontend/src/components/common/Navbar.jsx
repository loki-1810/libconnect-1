import { Link, NavLink } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { useState } from "react";
import Logo from "./Logo";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";

function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const dashboard = user?.role === "admin" ? ROUTES.ADMIN : user?.role === "librarian" ? ROUTES.LIBRARIAN : ROUTES.STUDENT;
  const links = [[ROUTES.HOME, "Home"], [ROUTES.BOOKS, "Books"], [ROUTES.LIBRARIES, "Libraries"], [ROUTES.ABOUT, "About"], [ROUTES.CONTACT, "Contact"]];
  const linkClass = ({ isActive }) => `text-sm font-medium transition hover:text-blue-600 ${isActive ? "text-blue-600" : "text-slate-600"}`;
  return <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><Logo /><nav className="hidden items-center gap-6 md:flex">{links.map(([to, label]) => <NavLink key={to} to={to} className={linkClass}>{label}</NavLink>)}</nav><div className="hidden items-center gap-2 md:flex">{user ? <><Link to={dashboard} className="rounded-lg px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">Dashboard</Link><button type="button" onClick={logout} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Log out</button></> : <><Link to={ROUTES.LOGIN} className="rounded-lg px-4 py-2 text-sm font-semibold hover:bg-slate-100">Login</Link><Link to={ROUTES.REGISTER} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Register</Link></>}</div><button type="button" className="rounded-lg p-2 md:hidden" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <FiX size={22} /> : <FiMenu size={22} />}</button></div>{open && <div className="border-t border-slate-100 bg-white px-6 py-4 md:hidden"><nav className="flex flex-col gap-3">{links.map(([to, label]) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={linkClass}>{label}</NavLink>)}{user ? <><Link to={dashboard} onClick={() => setOpen(false)} className="font-semibold text-blue-700">Dashboard</Link><button type="button" className="text-left font-semibold text-slate-600" onClick={logout}>Log out</button></> : <Link to={ROUTES.LOGIN} onClick={() => setOpen(false)} className="font-semibold text-blue-700">Login or register</Link>}</nav></div>}</header>;
}

export default Navbar;

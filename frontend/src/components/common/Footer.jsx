import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/routes";

function Footer() { return <footer className="mt-16 border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-7 text-sm text-slate-500"><p>© {new Date().getFullYear()} LibConnect. Better access to knowledge.</p><div className="flex gap-5"><Link to={ROUTES.FAQ} className="hover:text-blue-600">FAQ</Link><Link to={ROUTES.CONTACT} className="hover:text-blue-600">Contact</Link><Link to={ROUTES.ABOUT} className="hover:text-blue-600">About</Link></div></div></footer>; }

export default Footer;

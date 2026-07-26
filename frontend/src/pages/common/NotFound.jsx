import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
function NotFound() { return <section className="grid min-h-[65vh] place-items-center px-6 text-center"><div><p className="text-6xl font-black text-blue-600">404</p><h1 className="mt-3 text-2xl font-bold">Page not found</h1><p className="mt-2 text-slate-600">The page you’re looking for doesn’t exist or has moved.</p><Link to={ROUTES.HOME} className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Return home</Link></div></section>; }
export default NotFound;

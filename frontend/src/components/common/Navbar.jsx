import { Link } from "react-router-dom";
import Logo from "./Logo";
import { ROUTES } from "../../constants/routes";

function Navbar() {
  return (
    <header className="border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        <Logo />

        <nav className="hidden md:flex items-center gap-8">

          <Link to="/">Home</Link>

          <Link to={ROUTES.BOOKS}>Books</Link>

          <Link to="/about">About</Link>

          <Link to="/contact">Contact</Link>

        </nav>

        <div className="hidden md:flex items-center gap-3">

          <Link
            to="/login"
            className="rounded-lg px-4 py-2 hover:bg-slate-100"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Register
          </Link>

        </div>

      </div>
    </header>
  );
}

export default Navbar;
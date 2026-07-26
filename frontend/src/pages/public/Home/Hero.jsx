import { Link } from "react-router-dom";
import Button from "../../../components/ui/Button";
import { ROUTES } from "../../../constants/routes";

function Hero() {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto flex min-h-[80vh] max-w-7xl flex-col items-center justify-center px-6 text-center">
        <h1 className="mb-6 text-5xl font-extrabold text-slate-900 md:text-6xl">
          Welcome to <span className="text-blue-600">LibConnect</span>
        </h1>

        <p className="max-w-2xl text-lg text-slate-600">
          A modern library management system that simplifies book borrowing,
          reservations, QR-based library cards, and library operations.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to={ROUTES.BOOKS}>
            <Button>Browse Books</Button>
          </Link>
          <Link to={ROUTES.REGISTER}>
            <Button variant="secondary">Get Started</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Hero;

import Button from "../../../components/ui/Button";
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
        <Button>Browse Books</Button>

        <Button variant="secondary">
            Get Started
        </Button>
        </div>
      </div>
    </section>
  );
}

export default Hero;
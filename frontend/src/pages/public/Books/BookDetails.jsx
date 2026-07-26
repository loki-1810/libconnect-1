import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiBookOpen, FiMapPin } from "react-icons/fi";
import toast from "react-hot-toast";
import Button from "../../../components/ui/Button";
import LoadingScreen from "../../../components/common/LoadingScreen";
import { bookService } from "../../../services/bookService";
import { libraryService } from "../../../services/libraryService";
import { circulationService } from "../../../services/circulationService";
import { apiError } from "../../../services/api";
import { useAuth } from "../../../hooks/useAuth";
import { ROUTES } from "../../../constants/routes";

function BookDetails() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [libraryName, setLibraryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    bookService
      .get(bookId)
      .then((data) => {
        setBook(data);
        if (data.library_id) {
          libraryService
            .get(data.library_id)
            .then((lib) => setLibraryName(lib.name))
            .catch(() => setLibraryName(""));
        }
      })
      .catch((error) => toast.error(apiError(error)))
      .finally(() => setLoading(false));
  }, [bookId]);

  async function action(type) {
    if (!user) {
      navigate(ROUTES.LOGIN, { state: { from: `/books/${bookId}` } });
      return;
    }
    if (user.role !== "student") {
      toast.error("Only student accounts can borrow or reserve books.");
      return;
    }
    setSubmitting(true);
    try {
      if (type === "borrow") {
        await circulationService.requestBorrow(book.id);
        toast.success("Borrow request submitted");
      } else {
        await circulationService.reserve(book.id);
        toast.success("Reservation placed");
      }
    } catch (error) {
      toast.error(apiError(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingScreen />;

  if (!book)
    return (
      <section className="mx-auto max-w-4xl px-6 py-20">
        <h1 className="text-2xl font-bold">Book not found</h1>
        <Link to={ROUTES.BOOKS} className="mt-4 inline-block text-blue-600">
          Back to catalogue
        </Link>
      </section>
    );

  const details = [
    ["ISBN", book.isbn],
    ["Publisher", book.publisher || "Not listed"],
    ["Edition", book.edition || "Not listed"],
    ["Language", book.language],
    ["Published", book.published_year || "Not listed"],
    ["Shelf", book.shelf_number || "Ask the librarian"],
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <Link
        to={ROUTES.BOOKS}
        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
      >
        <FiArrowLeft />
        Back to books
      </Link>

      <div className="mt-7 grid gap-10 rounded-3xl bg-white p-6 shadow-sm md:grid-cols-[260px_1fr] md:p-10">
        <div className="grid min-h-80 place-items-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-200">
          <FiBookOpen className="text-8xl text-blue-500" />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {book.category}
            </span>
            <span
              className={`text-sm font-semibold ${
                book.available_copies
                  ? "text-emerald-600"
                  : "text-amber-600"
              }`}
            >
              {book.available_copies
                ? `${book.available_copies} copies available`
                : "Currently on loan"}
            </span>
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight">
            {book.title}
          </h1>
          <p className="mt-2 text-xl text-slate-600">by {book.author}</p>

          <p className="mt-6 leading-7 text-slate-600">
            {book.description ||
              "No description has been added for this title yet."}
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {label}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
            <FiMapPin />
            {libraryName
              ? `Available at ${libraryName}`
              : "Available at this library"}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            {book.available_copies > 0 ? (
              <Button
                disabled={submitting}
                onClick={() => action("borrow")}
              >
                {submitting ? "Submitting\u2026" : "Request to borrow"}
              </Button>
            ) : (
              <Button
                disabled={submitting}
                onClick={() => action("reserve")}
              >
                {submitting ? "Submitting\u2026" : "Reserve this book"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default BookDetails;

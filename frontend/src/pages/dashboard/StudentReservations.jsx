import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import { circulationService } from "../../services/circulationService";
import { apiError } from "../../services/api";

function StudentReservations() {
  const [result, setResult] = useState({ items: [], page: 1, pages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    circulationService
      .myReservations({ page, page_size: 10 })
      .then(setResult)
      .catch((error) => toast.error(apiError(error)))
      .finally(() => setLoading(false));
  }

  useEffect(load, [page]);

  async function cancel(id) {
    try {
      await circulationService.cancelReservation(id);
      toast.success("Reservation cancelled");
      load();
    } catch (error) {
      toast.error(apiError(error));
    }
  }

  return (
    <section>
      <h2 className="text-2xl font-bold">My reservations</h2>
      <p className="mt-1 text-slate-600">
        Your place in the queue for currently borrowed books.
      </p>

      <div className="mt-7 grid gap-4">
        {loading ? (
          Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          ))
        ) : result.items.length ? (
          result.items.map((reservation) => (
            <article
              key={reservation.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
            >
              <div>
                <h3 className="font-bold">
                  {reservation.book_title || "Book"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Queue position: {reservation.queue_position} &middot; Created{" "}
                  {new Date(reservation.created_at).toLocaleDateString()}
                </p>
                {reservation.available_until && (
                  <p className="mt-2 text-sm font-semibold text-emerald-700">
                    Ready to collect until{" "}
                    {new Date(reservation.available_until).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold capitalize text-blue-700">
                  {reservation.status}
                </span>
                {["queued", "available"].includes(reservation.status) && (
                  <Button
                    variant="secondary"
                    className="px-3 py-2 text-sm"
                    onClick={() => cancel(reservation.id)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            title="No active reservations"
            description="When a book is on loan, reserve it from its details page."
          />
        )}
      </div>

      <Pagination page={result.page} pages={result.pages} onPageChange={setPage} />
    </section>
  );
}

export default StudentReservations;

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { circulationService } from "../../services/circulationService";
import { apiError } from "../../services/api";

function PickupModal({ borrow, loading, onConfirm, onCancel }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const today = new Date().toISOString().split("T")[0];

  function submit(event) {
    event.preventDefault();
    if (!date || !time) {
      toast.error("Please select both date and time");
      return;
    }
    onConfirm(date, time);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Schedule pickup"
    >
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 className="text-lg font-bold text-slate-900">Schedule Pickup</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose when you&apos;d like to collect{" "}
          <span className="font-semibold">{borrow.book_title}</span>.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Pickup date
            </label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Pickup time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-600"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Scheduling..." : "Confirm pickup"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function StudentBorrows() {
  const [result, setResult] = useState({ items: [], page: 1, pages: 0 });
  const [fine, setFine] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pickupBorrow, setPickupBorrow] = useState(null);
  const [scheduling, setScheduling] = useState(false);
  const [cancelling, setCancelling] = useState(null);

  function load() {
    setLoading(true);
    Promise.all([
      circulationService.myBorrows({ page }),
      circulationService.fineStatus(),
    ])
      .then(([borrows, fineStatus]) => {
        setResult(borrows);
        setFine(fineStatus);
      })
      .catch((error) => toast.error(apiError(error)))
      .finally(() => setLoading(false));
  }

  useEffect(load, [page]);

  async function handleSchedulePickup(date, time) {
    if (!pickupBorrow) return;
    setScheduling(true);
    try {
      await circulationService.schedulePickup(pickupBorrow.id, date, time);
      toast.success(`Pickup scheduled for ${date} at ${time}`);
      setPickupBorrow(null);
      load();
    } catch (error) {
      toast.error(apiError(error));
    } finally {
      setScheduling(false);
    }
  }

  async function handleCancel() {
    if (!cancelling) return;
    const { id, status } = cancelling;
    try {
      if (status === "requested") {
        await circulationService.cancelRequest(id);
        toast.success("Request cancelled");
      } else {
        await circulationService.cancelPickup(id);
        toast.success("Pickup cancelled");
      }
      setCancelling(null);
      load();
    } catch (error) {
      toast.error(apiError(error));
    }
  }

  function statusColor(status) {
    switch (status) {
      case "requested":
        return "bg-amber-100 text-amber-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "borrowed":
        return "bg-emerald-100 text-emerald-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "returned":
        return "bg-slate-100 text-slate-600";
      case "cancelled":
        return "bg-slate-100 text-slate-500";
      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">My borrowing</h2>
          <p className="mt-1 text-slate-600">
            Track requests, due dates, and returns.
          </p>
        </div>
        {fine && (
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Fine status:{" "}
            <strong>
              {fine.currency} {fine.fine_amount.toFixed(2)}
            </strong>
          </div>
        )}
      </div>

      <div className="mt-7 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        {loading ? (
          <div className="p-8 text-slate-500">Loading borrowing history...</div>
        ) : result.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3">Book</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Pickup</th>
                  <th className="px-5 py-3">Due date</th>
                  <th className="px-5 py-3">Fine</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {result.items.map((borrow) => (
                  <tr key={borrow.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-semibold">
                      {borrow.book_title || "Book"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusColor(borrow.status)}`}
                      >
                        {borrow.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {borrow.pickup_date
                        ? `${borrow.pickup_date} ${borrow.pickup_time}`
                        : "\u2014"}
                    </td>
                    <td className="px-5 py-4">
                      {borrow.due_date
                        ? new Date(borrow.due_date).toLocaleDateString()
                        : "\u2014"}
                    </td>
                    <td className="px-5 py-4">
                      {borrow.fine_amount
                        ? `\u20B9${borrow.fine_amount.toFixed(2)}`
                        : "\u2014"}
                    </td>
                    <td className="px-5 py-4">
                      {borrow.status === "requested" && (
                        <div className="flex gap-2">
                          <span className="text-xs text-slate-400">
                            Awaiting approval
                          </span>
                          <Button
                            variant="danger"
                            className="px-3 py-1.5 text-xs"
                            onClick={() => setCancelling(borrow)}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                      {borrow.status === "approved" && !borrow.pickup_date && (
                        <div className="flex gap-2">
                          <Button
                            className="px-3 py-2 text-sm"
                            onClick={() => setPickupBorrow(borrow)}
                          >
                            Schedule pickup
                          </Button>
                          <Button
                            variant="danger"
                            className="px-3 py-1.5 text-xs"
                            onClick={() => setCancelling(borrow)}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                      {borrow.status === "approved" && borrow.pickup_date && (
                        <div className="flex gap-2">
                          <span className="text-xs text-blue-600 font-medium">
                            Pickup scheduled
                          </span>
                          <Button
                            variant="danger"
                            className="px-3 py-1.5 text-xs"
                            onClick={() => setCancelling(borrow)}
                          >
                            Cancel pickup
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              title="No borrowing activity"
              description="Browse the catalogue to submit your first borrow request."
            />
          </div>
        )}
      </div>

      <Pagination
        page={result.page}
        pages={result.pages}
        onPageChange={setPage}
      />

      {pickupBorrow && (
        <PickupModal
          borrow={pickupBorrow}
          loading={scheduling}
          onConfirm={handleSchedulePickup}
          onCancel={() => setPickupBorrow(null)}
        />
      )}

      {cancelling && (
        <ConfirmDialog
          title={
            cancelling.status === "requested"
              ? "Cancel this request?"
              : "Cancel pickup?"
          }
          message={
            cancelling.status === "requested"
              ? `This will cancel your borrow request for "${cancelling.book_title}".`
              : `This will cancel the scheduled pickup for "${cancelling.book_title}" and free the held copy.`
          }
          confirmLabel={
            cancelling.status === "requested" ? "Cancel request" : "Cancel pickup"
          }
          onConfirm={handleCancel}
          onCancel={() => setCancelling(null)}
        />
      )}
    </section>
  );
}

export default StudentBorrows;

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/common/EmptyState";
import QRScanner from "../../components/ui/QRScanner";
import { circulationService } from "../../services/circulationService";
import { apiError } from "../../services/api";

function NotePrompt({ title, onConfirm, onCancel }) {
  const [note, setNote] = useState("");

  function submit(event) {
    event.preventDefault();
    onConfirm(note || undefined);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note..."
          rows="3"
          className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-600"
        />
        <div className="mt-4 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Confirm</Button>
        </div>
      </form>
    </div>
  );
}

function BorrowRequests() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("requested");
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState(null);
  const [notePrompt, setNotePrompt] = useState(null);
  const [collecting, setCollecting] = useState(null);

  const needsClientFilter = status === "awaiting_scheduling" || status === "ready_pickup";

  function load() {
    setLoading(true);
    const apiStatus = needsClientFilter ? "approved" : status;
    circulationService
      .libraryBorrows({ status: apiStatus, page_size: 100 })
      .then((data) => {
        let filtered = data.items;
        if (status === "awaiting_scheduling") {
          filtered = data.items.filter((i) => !i.pickup_date);
        } else if (status === "ready_pickup") {
          filtered = data.items.filter((i) => i.pickup_date);
        }
        setItems(filtered);
      })
      .catch((error) => toast.error(apiError(error)))
      .finally(() => setLoading(false));
  }

  useEffect(load, [status, needsClientFilter]);

  async function confirmReturn(scannedStudent) {
    if (!returning) return;
    const borrow = items.find((b) => b.id === returning);
    if (borrow && scannedStudent.id !== borrow.student_id) {
      toast.error(
        `QR mismatch: expected "${borrow.student_name}" but scanned "${scannedStudent.name}"`
      );
      setReturning(null);
      return;
    }
    try {
      await circulationService.returnBook(returning);
      toast.success("Book returned successfully");
      setReturning(null);
      load();
    } catch (error) {
      toast.error(apiError(error));
    }
  }

  function decide(id, decision) {
    setNotePrompt({ id, decision });
  }

  async function handleNoteConfirm(note) {
    if (!notePrompt) return;
    const { id, decision } = notePrompt;
    setNotePrompt(null);

    if (decision === "reject") {
      try {
        await circulationService.reject(id, note);
        toast.success("Request rejected");
        load();
      } catch (error) {
        toast.error(apiError(error));
      }
      return;
    }

    try {
      await circulationService.approve(id, note);
      toast.success("Request approved — student can now schedule pickup");
      load();
    } catch (error) {
      toast.error(apiError(error));
    }
  }

  async function handleCollectScan(scannedStudent) {
    if (!collecting) return;
    const { id } = collecting;
    const borrow = items.find((b) => b.id === id);

    if (borrow && scannedStudent.id !== borrow.student_id) {
      toast.error(
        `QR mismatch: expected "${borrow.student_name}" but scanned "${scannedStudent.name}"`
      );
      setCollecting(null);
      return;
    }

    try {
      await circulationService.collect(id);
      toast.success(`Book issued to ${scannedStudent.name}`);
      setCollecting(null);
      load();
    } catch (error) {
      toast.error(apiError(error));
    }
  }

  function statusColor(s) {
    switch (s) {
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
      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Borrow requests</h2>
          <p className="mt-1 text-slate-600">
            Approve requests, issue books, and receive returns.
          </p>
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
        >
          <option value="requested">Pending requests</option>
          <option value="awaiting_scheduling">Awaiting pickup scheduling</option>
          <option value="ready_pickup">Ready for pickup</option>
          <option value="returned">Returned history</option>
          <option value="cancelled">Cancelled history</option>
          <option value="rejected">Rejected history</option>
        </select>
      </div>

      <div className="mt-7 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        {loading ? (
          <div className="p-8 text-slate-500">Loading requests...</div>
        ) : items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Book</th>
                  <th className="px-5 py-3">Requested</th>
                  <th className="px-5 py-3">Pickup</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-semibold">
                      {item.student_name || "Student"}
                    </td>
                    <td className="px-5 py-4">{item.book_title || "Book"}</td>
                    <td className="px-5 py-4">
                      {new Date(item.requested_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      {item.pickup_date
                        ? `${item.pickup_date} ${item.pickup_time}`
                        : "\u2014"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusColor(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {item.status === "requested" && (
                        <div className="flex gap-2">
                          <Button
                            className="px-3 py-2 text-xs"
                            onClick={() => decide(item.id, "approve")}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="secondary"
                            className="px-3 py-2 text-xs"
                            onClick={() => decide(item.id, "reject")}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {item.status === "approved" && item.pickup_date && (
                        <Button
                          className="px-3 py-2 text-xs"
                          onClick={() => setCollecting({ id: item.id })}
                        >
                          Scan QR &amp; collect
                        </Button>
                      )}
                      {item.status === "approved" && !item.pickup_date && (
                        <span className="text-xs text-slate-400">
                          Waiting for student
                        </span>
                      )}
                      {["borrowed", "overdue"].includes(item.status) && (
                        <Button
                          className="px-3 py-2 text-xs"
                          onClick={() => setReturning(item.id)}
                        >
                          Scan QR &amp; receive return
                        </Button>
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
              title="No requests found"
              description="Borrow requests will appear here as students submit them."
            />
          </div>
        )}
      </div>

      {returning && (
        <QRScanner
          onScan={confirmReturn}
          onClose={() => setReturning(null)}
        />
      )}

      {collecting && (
        <QRScanner
          onScan={handleCollectScan}
          onClose={() => setCollecting(null)}
        />
      )}

      {notePrompt && (
        <NotePrompt
          title={`Add a note for ${notePrompt.decision}`}
          onConfirm={handleNoteConfirm}
          onCancel={() => setNotePrompt(null)}
        />
      )}
    </section>
  );
}

export default BorrowRequests;

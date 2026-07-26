import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/common/EmptyState";
import QRScanner from "../../components/ui/QRScanner";
import { circulationService } from "../../services/circulationService";
import { apiError } from "../../services/api";

function ManageReservations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(null);

  function load() {
    setLoading(true);
    circulationService
      .libraryReservations({ page_size: 50 })
      .then((data) => setItems(data.items))
      .catch((error) => toast.error(apiError(error)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleScanComplete(scannedStudent) {
    if (!scanning) return;
    const reservation = items.find((r) => r.id === scanning);

    if (reservation && scannedStudent.id !== reservation.student_id) {
      toast.error(
        `QR mismatch: expected student "${reservation.student_id}" but scanned "${scannedStudent.name}"`
      );
      setScanning(null);
      return;
    }

    try {
      await circulationService.fulfillReservation(scanning);
      toast.success(`Book collected by ${scannedStudent.name}`);
      setScanning(null);
      load();
    } catch (error) {
      toast.error(apiError(error));
    }
  }

  return (
    <section>
      <h2 className="text-2xl font-bold">Reservation queue</h2>
      <p className="mt-1 text-slate-600">
        Monitor reservations. Scan the student's QR code to confirm collection.
      </p>

      <div className="mt-7 grid gap-4">
        {loading ? (
          <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
        ) : items.length ? (
          items.map((reservation) => (
            <article
              key={reservation.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
            >
              <div>
                <h3 className="font-bold">
                  {reservation.book_title || "Book"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Queue position {reservation.queue_position} &middot; Student{" "}
                  {reservation.student_id}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Created {new Date(reservation.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold capitalize text-blue-700">
                  {reservation.status}
                </span>
                {reservation.status === "available" && (
                  <Button
                    className="px-3 py-2 text-sm"
                    onClick={() => setScanning(reservation.id)}
                  >
                    Scan QR & collect
                  </Button>
                )}
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            title="No reservations"
            description="Reservations will appear here when books are unavailable."
          />
        )}
      </div>

      {scanning && (
        <QRScanner onScan={handleScanComplete} onClose={() => setScanning(null)} />
      )}
    </section>
  );
}

export default ManageReservations;

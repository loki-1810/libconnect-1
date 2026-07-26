import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import QRScanner from "../../components/ui/QRScanner";
import { circulationService } from "../../services/circulationService";
import { apiError } from "../../services/api";

function LibrarianBorrows() {
  const [result, setResult] = useState({ items: [], page: 1, pages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState(null);

  function load() {
    setLoading(true);
    Promise.all([
      circulationService.libraryBorrows({ status: "borrowed", page, page_size: 20 }),
      circulationService.libraryBorrows({ status: "overdue", page, page_size: 20 }),
    ])
      .then(([borrowed, overdue]) => {
        const merged = [...borrowed.items, ...overdue.items].sort(
          (a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0)
        );
        setResult({ items: merged, page: 1, pages: Math.max(borrowed.pages, overdue.pages) });
      })
      .catch((error) => toast.error(apiError(error)))
      .finally(() => setLoading(false));
  }

  useEffect(load, [page]);

  async function handleReturnScan(scannedStudent) {
    if (!returning) return;
    const borrow = result.items.find((b) => b.id === returning);
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

  function dueDateStatus(dueDate) {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { label: `${Math.abs(daysLeft)}d overdue`, color: "text-red-600 bg-red-50" };
    if (daysLeft <= 3) return { label: `${daysLeft}d left`, color: "text-amber-600 bg-amber-50" };
    return { label: `${daysLeft}d left`, color: "text-emerald-600 bg-emerald-50" };
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Borrowed books</h2>
          <p className="mt-1 text-slate-600">
            All books currently issued to students. Fines accrue daily for overdue books.
          </p>
        </div>
      </div>

      <div className="mt-7 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        {loading ? (
          <div className="p-8 text-slate-500">Loading borrowed books...</div>
        ) : result.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Book</th>
                  <th className="px-5 py-3">Issued</th>
                  <th className="px-5 py-3">Due date</th>
                  <th className="px-5 py-3">Fine</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((item) => {
                  const due = dueDateStatus(item.due_date);
                  return (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-5 py-4 font-semibold">
                        {item.student_name || "Student"}
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {item.student_email || "\u2014"}
                      </td>
                      <td className="px-5 py-4">{item.book_title || "Book"}</td>
                      <td className="px-5 py-4">
                        {item.issued_at
                          ? new Date(item.issued_at).toLocaleDateString()
                          : "\u2014"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <span>
                            {item.due_date
                              ? new Date(item.due_date).toLocaleDateString()
                              : "\u2014"}
                          </span>
                          {due && (
                            <span className={`inline-block w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${due.color}`}>
                              {due.label}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {item.live_fine != null && item.live_fine > 0 ? (
                          <span className="font-semibold text-red-600">
                            {"\u20B9"}{item.live_fine.toFixed(2)}
                          </span>
                        ) : (
                          "\u2014"
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Button
                          className="px-3 py-2 text-xs"
                          onClick={() => setReturning(item.id)}
                        >
                          Scan QR &amp; receive return
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              title="No borrowed books"
              description="Books currently issued to students will appear here."
            />
          </div>
        )}
      </div>

      <Pagination
        page={result.page}
        pages={result.pages}
        onPageChange={setPage}
      />

      {returning && (
        <QRScanner
          onScan={handleReturnScan}
          onClose={() => setReturning(null)}
        />
      )}
    </section>
  );
}

export default LibrarianBorrows;

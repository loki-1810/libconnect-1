import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import { circulationService } from "../../services/circulationService";
import { apiError } from "../../services/api";

function StudentBorrows() {
  const [result, setResult] = useState({ items: [], page: 1, pages: 0 }); const [fine, setFine] = useState(null); const [page, setPage] = useState(1); const [loading, setLoading] = useState(true);
  function load() { setLoading(true); Promise.all([circulationService.myBorrows({ page }), circulationService.fineStatus()]).then(([borrows, fineStatus]) => { setResult(borrows); setFine(fineStatus); }).catch((error) => toast.error(apiError(error))).finally(() => setLoading(false)); }
  useEffect(load, [page]);
  async function returnBook(id) { try { await circulationService.returnBook(id); toast.success("Book marked as returned"); load(); } catch (error) { toast.error(apiError(error)); } }
  return <section><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-bold">My borrowing</h2><p className="mt-1 text-slate-600">Track requests, due dates, and returns.</p></div>{fine && <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Fine status: <strong>{fine.currency} {fine.fine_amount.toFixed(2)}</strong></div>}</div><div className="mt-7 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">{loading ? <div className="p-8 text-slate-500">Loading borrowing history…</div> : result.items.length ? <div className="overflow-x-auto"><table className="w-full min-w-180 text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-5 py-3">Book</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Due date</th><th className="px-5 py-3">Fine</th><th className="px-5 py-3" /></tr></thead><tbody>{result.items.map((borrow) => <tr key={borrow.id} className="border-t border-slate-100"><td className="px-5 py-4 font-semibold">{borrow.book_title || "Book"}</td><td className="px-5 py-4 capitalize"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{borrow.status}</span></td><td className="px-5 py-4">{borrow.due_date ? new Date(borrow.due_date).toLocaleDateString() : "—"}</td><td className="px-5 py-4">{borrow.fine_amount ? `$${borrow.fine_amount.toFixed(2)}` : "—"}</td><td className="px-5 py-4">{["borrowed", "overdue"].includes(borrow.status) && <Button className="px-3 py-2 text-sm" onClick={() => returnBook(borrow.id)}>Return</Button>}</td></tr>)}</tbody></table></div> : <div className="p-6"><EmptyState title="No borrowing activity" description="Browse the catalogue to submit your first borrow request." /></div>}</div><Pagination page={result.page} pages={result.pages} onPageChange={setPage} /></section>;
}

export default StudentBorrows;

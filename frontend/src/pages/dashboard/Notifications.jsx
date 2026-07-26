import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiBell, FiCheck, FiCheckCircle } from "react-icons/fi";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import { dashboardService } from "../../services/dashboardService";
import { apiError } from "../../services/api";

function Notifications() {
  const [result, setResult] = useState({ items: [], page: 1, pages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    dashboardService
      .notifications({ page, page_size: 20 })
      .then(setResult)
      .catch((error) => toast.error(apiError(error)))
      .finally(() => setLoading(false));
  }

  useEffect(load, [page]);

  async function markRead(id) {
    try {
      await dashboardService.markRead(id);
      load();
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (error) {
      toast.error(apiError(error));
    }
  }

  async function markAllRead() {
    try {
      await dashboardService.markAllRead();
      toast.success("All notifications marked as read");
      load();
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (error) {
      toast.error(apiError(error));
    }
  }

  const unreadCount = result.items.filter((n) => !n.is_read).length;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Notifications</h2>
          <p className="mt-1 text-slate-600">
            Stay updated on borrow requests, reservations, and account activity.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={markAllRead}>
            <FiCheckCircle className="mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="mt-7 space-y-3">
        {loading ? (
          Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />
          ))
        ) : result.items.length ? (
          result.items.map((notification) => (
            <article
              key={notification.id}
              className={`flex items-start gap-4 rounded-2xl p-5 shadow-sm ring-1 ring-slate-100 ${
                notification.is_read ? "bg-white" : "bg-blue-50/50"
              }`}
            >
              <span
                className={`mt-1 rounded-xl p-2 ${
                  notification.is_read
                    ? "bg-slate-100 text-slate-400"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                <FiBell />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm leading-6 ${
                    notification.is_read ? "text-slate-600" : "font-semibold text-slate-900"
                  }`}
                >
                  {notification.message}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
              {!notification.is_read && (
                <button
                  type="button"
                  onClick={() => markRead(notification.id)}
                  className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Mark as read"
                >
                  <FiCheck />
                </button>
              )}
            </article>
          ))
        ) : (
          <EmptyState
            title="No notifications yet"
            description="You'll see updates about borrows, reservations, and account activity here."
          />
        )}
      </div>

      <Pagination page={result.page} pages={result.pages} onPageChange={setPage} />
    </section>
  );
}

export default Notifications;

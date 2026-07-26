import { useEffect, useState } from "react";
import {
  FiBookOpen,
  FiClock,
  FiUsers,
  FiLayers,
  FiAlertCircle,
} from "react-icons/fi";
import { dashboardService } from "../../services/dashboardService";
import { useAuth } from "../../hooks/useAuth";
import { apiError } from "../../services/api";
import EmptyState from "../../components/common/EmptyState";
import LibraryCard from "../../components/dashboard/LibraryCard";

const labels = {
  active_borrows: "Active loans",
  pending_requests: "Pending requests",
  active_reservations: "Reservations",
  total_books: "Books in catalogue",
  available_books: "Available books",
  issued_books: "Issued books",
  total_users: "Total users",
  total_libraries: "Libraries",
  pending_libraries: "Pending libraries",
};
const icons = [FiBookOpen, FiClock, FiUsers, FiLayers];

function DashboardHome() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardService
      .get()
      .then(setData)
      .catch((requestError) => setError(apiError(requestError)));
  }, []);

  if (error)
    return (
      <div className="rounded-xl bg-rose-50 p-4 text-rose-700">{error}</div>
    );

  if (!data)
    return (
      <div className="grid gap-5 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl bg-slate-200"
          />
        ))}
      </div>
    );

  const cards = Object.entries(data.cards || {});
  const activities =
    data.recent_activity || data.recent_users || data.popular_books || [];

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="mt-1 text-slate-600">
          A live view of your library activity.
        </p>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([key, value], index) => {
          const Icon = icons[index % icons.length];
          return (
            <article
              key={key}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  {labels[key] || key.replaceAll("_", " ")}
                </p>
                <span className="rounded-xl bg-blue-50 p-2 text-blue-600">
                  <Icon />
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold">{value}</p>
            </article>
          );
        })}
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h3 className="font-bold">Recent activity</h3>
          {activities.length ? (
            <div className="mt-4 space-y-3">
              {activities.map((item, index) => (
                <div
                  key={item.id || item.book_id || index}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold capitalize">
                      {item.name || item.status || "Borrow activity"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.email ||
                        item.role ||
                        item.book_id ||
                        "Updated recently"}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {item.borrow_count
                      ? `${item.borrow_count} borrows`
                      : item.at
                        ? new Date(item.at).toLocaleDateString()
                        : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="No activity yet"
                description="Activity will appear here as your library starts using LibConnect."
              />
            </div>
          )}
        </section>

        {user?.role === "student" ? (
          <LibraryCard />
        ) : (
          <section className="rounded-2xl bg-slate-950 p-6 text-white">
            <FiAlertCircle className="text-2xl text-blue-400" />
            <h3 className="mt-4 font-bold">Need a hand?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Use the sidebar to manage books, requests, reservations, and your
              account. Keep your profile current so your library can reach you.
            </p>
          </section>
        )}
      </div>
    </>
  );
}

export default DashboardHome;

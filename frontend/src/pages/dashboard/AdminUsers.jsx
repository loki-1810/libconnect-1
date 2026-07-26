import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiPlus } from "react-icons/fi";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import Modal from "../../components/ui/Modal";
import { dashboardService } from "../../services/dashboardService";
import { libraryService } from "../../services/libraryService";
import { apiError } from "../../services/api";

function CreateLibrarianForm({ done }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await dashboardService.createLibrarian({ name, email, password });
      toast.success("Librarian created successfully");
      done();
    } catch (error) {
      toast.error(apiError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium">
        Name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5"
        />
      </label>
      <label className="block text-sm font-medium">
        Email
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5"
        />
      </label>
      <label className="block text-sm font-medium">
        Password
        <input
          required
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5"
        />
      </label>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Creating..." : "Create librarian"}
      </Button>
    </form>
  );
}

function AssignLibraryModal({ user, libraries, onConfirm, onCancel }) {
  const [selected, setSelected] = useState(user.library_id || "");

  async function submit(event) {
    event.preventDefault();
    onConfirm(user.id, selected || null);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 className="text-lg font-bold text-slate-900">
          Assign library to {user.name}
        </h2>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
        >
          <option value="">No library assigned</option>
          {libraries.map((lib) => (
            <option key={lib.id} value={lib.id}>
              {lib.name}
            </option>
          ))}
        </select>
        <div className="mt-4 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </div>
  );
}

function AdminUsers() {
  const [result, setResult] = useState({ items: [], page: 1, pages: 0 });
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState(null);
  const [libraries, setLibraries] = useState([]);

  function load() {
    dashboardService
      .users({ page, role: role || undefined, q: search || undefined })
      .then(setResult)
      .catch((error) => toast.error(apiError(error)));
  }

  useEffect(load, [page, role, search]);

  useEffect(() => {
    libraryService
      .list({ page_size: 100 })
      .then((data) => setLibraries(data.items))
      .catch(() => {});
  }, []);

  async function toggle(user) {
    if (user.role === "admin") {
      toast.error("Admin accounts cannot be deactivated");
      return;
    }
    try {
      await dashboardService.toggleActive(user.id);
      toast.success(`Account ${user.is_active ? "deactivated" : "activated"}`);
      load();
    } catch (error) {
      toast.error(apiError(error));
    }
  }

  async function handleAssign(userId, libraryId) {
    try {
      await dashboardService.assignLibrary(userId, libraryId);
      toast.success("Library assigned");
      setAssigning(null);
      load();
    } catch (error) {
      toast.error(apiError(error));
    }
  }

  function getLibraryName(libraryId) {
    if (!libraryId) return "None";
    const lib = libraries.find((l) => l.id === libraryId);
    return lib ? lib.name : libraryId;
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Users and librarians</h2>
          <p className="mt-1 text-slate-600">
            Search accounts, create librarians, and manage access.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            placeholder="Search name or email"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
          <select
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All roles</option>
            <option value="student">Students</option>
            <option value="librarian">Librarians</option>
          </select>
          <Button onClick={() => setCreating(true)}>
            <FiPlus className="mr-2" />
            Create librarian
          </Button>
        </div>
      </div>

      <div className="mt-7 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        {result.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Library</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100">
                    <td className="px-5 py-4">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-5 py-4 capitalize">{user.role}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {user.role === "librarian" ? (
                        <button
                          type="button"
                          onClick={() => setAssigning(user)}
                          className="text-blue-600 hover:underline"
                        >
                          {getLibraryName(user.library_id)}
                        </button>
                      ) : (
                        "\u2014"
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          user.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {user.role !== "admin" && (
                        <Button
                          variant="secondary"
                          className="px-3 py-2 text-xs"
                          onClick={() => toggle(user)}
                        >
                          {user.is_active ? "Deactivate" : "Activate"}
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
            <EmptyState title="No users found" />
          </div>
        )}
      </div>

      <Pagination
        page={result.page}
        pages={result.pages}
        onPageChange={setPage}
      />

      {creating && (
        <Modal title="Create librarian" onClose={() => setCreating(false)}>
          <CreateLibrarianForm done={() => { setCreating(false); load(); }} />
        </Modal>
      )}

      {assigning && (
        <AssignLibraryModal
          user={assigning}
          libraries={libraries}
          onConfirm={handleAssign}
          onCancel={() => setAssigning(null)}
        />
      )}
    </section>
  );
}

export default AdminUsers;

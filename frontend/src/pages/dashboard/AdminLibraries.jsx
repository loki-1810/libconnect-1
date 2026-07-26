import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FiPlus } from "react-icons/fi";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { libraryService } from "../../services/libraryService";
import { dashboardService } from "../../services/dashboardService";
import { apiError } from "../../services/api";

function LibraryForm({ library, done }) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({ defaultValues: library || {} });

  async function submit(values) {
    try {
      if (library) await libraryService.update(library.id, values);
      else await libraryService.create(values);
      toast.success(library ? "Library updated" : "Library created");
      done();
    } catch (error) {
      toast.error(apiError(error));
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
      {[
        ["name", "Library name"],
        ["city", "City"],
        ["address", "Address"],
        ["contact_email", "Contact email"],
        ["contact_phone", "Contact phone"],
      ].map(([name, label]) => (
        <label key={name} className="text-sm font-medium">
          {label}
          <input
            required={["name", "city", "address"].includes(name)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5"
            {...register(name)}
          />
        </label>
      ))}
      <label className="sm:col-span-2 text-sm font-medium">
        Description
        <textarea
          className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5"
          rows="3"
          {...register("description")}
        />
      </label>
      {library && (
        <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
          <input type="checkbox" {...register("is_approved")} />
          Approved and visible publicly
        </label>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving\u2026" : "Save library"}
        </Button>
      </div>
    </form>
  );
}

function AssignLibrarianModal({ library, librarians, onConfirm, onCancel }) {
  const [selected, setSelected] = useState(library.librarian_id || "");

  async function submit(event) {
    event.preventDefault();
    onConfirm(library.id, selected || null);
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
          Assign librarian to {library.name}
        </h2>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
        >
          <option value="">No librarian assigned</option>
          {librarians.map((lib) => (
            <option key={lib.id} value={lib.id}>
              {lib.name} ({lib.email})
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

function AdminLibraries() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [librarians, setLibrarians] = useState([]);

  function load() {
    libraryService
      .list({ approved_only: false, page_size: 100 })
      .then((data) => setItems(data.items))
      .catch((error) => toast.error(apiError(error)));
  }

  function loadLibrarians() {
    dashboardService
      .users({ role: "librarian", page_size: 100 })
      .then((data) => setLibrarians(data.items))
      .catch(() => {});
  }

  useEffect(() => {
    load();
    loadLibrarians();
  }, []);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await libraryService.remove(deleting.id);
      toast.success("Library deleted");
      setDeleting(null);
      load();
    } catch (error) {
      toast.error(apiError(error));
    }
  }

  async function handleAssignLibrarian(libraryId, userId) {
    try {
      if (userId) {
        await dashboardService.assignLibrary(userId, libraryId);
        toast.success("Librarian assigned");
      } else {
        const lib = librarians.find(
          (u) => u.library_id === libraryId
        );
        if (lib) {
          await dashboardService.assignLibrary(lib.id, null);
        }
        toast.success("Librarian unassigned");
      }
      setAssigning(null);
      loadLibrarians();
      load();
    } catch (error) {
      toast.error(apiError(error));
    }
  }

  function getLibrarianForLibrary(libraryId) {
    const lib = librarians.find((u) => u.library_id === libraryId);
    return lib ? `${lib.name} (${lib.email})` : null;
  }

  function done() {
    setEditing(undefined);
    load();
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Libraries</h2>
          <p className="mt-1 text-slate-600">
            Review, approve, and maintain participating libraries.
          </p>
        </div>
        <Button onClick={() => setEditing(null)}>
          <FiPlus className="mr-2" />
          Add library
        </Button>
      </div>

      <div className="mt-7 grid gap-4">
        {items.length ? (
          items.map((item) => {
            const librarian = getLibrarianForLibrary(item.id);
            return (
              <article
                key={item.id}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.city} &middot; {item.contact_email || "No email"}
                    </p>
                    <p className="mt-1 text-sm">
                      <span className="text-slate-400">Librarian: </span>
                      {librarian ? (
                        <span className="font-medium text-slate-700">
                          {librarian}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAssigning(item)}
                          className="text-blue-600 hover:underline"
                        >
                          Assign librarian
                        </button>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        item.is_approved
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {item.is_approved ? "Approved" : "Pending"}
                    </span>
                    {librarian && (
                      <Button
                        variant="secondary"
                        className="px-3 py-2 text-xs"
                        onClick={() => setAssigning(item)}
                      >
                        Change librarian
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      className="px-3 py-2 text-sm"
                      onClick={() => setEditing(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      className="px-3 py-2 text-sm"
                      onClick={() => setDeleting(item)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <EmptyState title="No libraries found" />
        )}
      </div>

      {editing !== undefined && (
        <Modal
          title={editing ? "Edit library" : "Add library"}
          onClose={() => setEditing(undefined)}
        >
          <LibraryForm library={editing} done={done} />
        </Modal>
      )}

      {assigning && (
        <AssignLibrarianModal
          library={assigning}
          librarians={librarians}
          onConfirm={handleAssignLibrarian}
          onCancel={() => setAssigning(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete "${deleting.name}"?`}
          message="This action cannot be undone. The library will be permanently removed."
          confirmLabel="Delete library"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </section>
  );
}

export default AdminLibraries;

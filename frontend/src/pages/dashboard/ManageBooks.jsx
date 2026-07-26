import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FiPlus } from "react-icons/fi";
import BookCard from "../../components/books/BookCard";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import { bookService } from "../../services/bookService";
import { apiError } from "../../services/api";

const fields = [
  ["isbn", "ISBN", "text"],
  ["title", "Title", "text"],
  ["author", "Author", "text"],
  ["category", "Category", "text"],
  ["publisher", "Publisher", "text"],
  ["language", "Language", "text"],
  ["published_year", "Published year", "number"],
  ["shelf_number", "Shelf number", "text"],
  ["total_copies", "Total copies", "number"],
];

function BookForm({ book, onDone }) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({ defaultValues: book || { language: "English", total_copies: 1 } });

  async function submit(values) {
    const payload = {
      ...values,
      published_year: values.published_year ? Number(values.published_year) : null,
      total_copies: values.total_copies ? Number(values.total_copies) : undefined,
    };
    try {
      if (book) await bookService.update(book.id, payload);
      else await bookService.create(payload);
      toast.success(book ? "Book updated" : "Book added");
      onDone();
    } catch (error) {
      toast.error(apiError(error));
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(([name, label, type]) => (
          <label key={name} className="text-sm font-medium">
            {label}
            <input
              type={type}
              required={["isbn", "title", "author", "category", "total_copies"].includes(name)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600"
              {...register(name)}
            />
          </label>
        ))}
        <label className="sm:col-span-2 text-sm font-medium">
          Description
          <textarea
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600"
            rows="3"
            {...register("description")}
          />
        </label>
        <label className="sm:col-span-2 text-sm font-medium">
          Cover image URL
          <input
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600"
            {...register("cover_image")}
          />
        </label>
      </div>
      <Button type="submit" className="mt-6" disabled={isSubmitting}>
        {isSubmitting ? "Saving\u2026" : book ? "Save changes" : "Add book"}
      </Button>
    </form>
  );
}

function ManageBooks() {
  const [result, setResult] = useState({ items: [], page: 1, pages: 0 });
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    bookService
      .list({ page, page_size: 16 })
      .then(setResult)
      .catch((error) => toast.error(apiError(error)))
      .finally(() => setLoading(false));
  }

  useEffect(load, [page]);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await bookService.remove(deleting.id);
      toast.success("Book deleted");
      setDeleting(null);
      load();
    } catch (error) {
      toast.error(apiError(error));
    }
  }

  function completed() {
    setEditing(undefined);
    load();
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Manage books</h2>
          <p className="mt-1 text-slate-600">
            Add, edit, and remove titles in your catalogue.
          </p>
        </div>
        <Button onClick={() => setEditing(null)}>
          <FiPlus className="mr-2" />
          Add book
        </Button>
      </div>

      {loading ? (
        <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-80 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : result.items.length ? (
        <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {result.items.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              management
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          ))}
        </div>
      ) : (
        <div className="mt-7">
          <EmptyState
            title="No books in this catalogue"
            description="Add your first title to make it available to students."
          />
        </div>
      )}

      <Pagination page={result.page} pages={result.pages} onPageChange={setPage} />

      {editing !== undefined && (
        <Modal
          title={editing ? "Edit book" : "Add a book"}
          onClose={() => setEditing(undefined)}
        >
          <BookForm book={editing} onDone={completed} />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete "${deleting.title}"?`}
          message="This action cannot be undone. The book will be permanently removed from the catalogue."
          confirmLabel="Delete book"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </section>
  );
}

export default ManageBooks;

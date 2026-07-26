import Button from "../ui/Button";

function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;
  return <div className="mt-8 flex items-center justify-center gap-3"><Button variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button><span className="text-sm text-slate-600">Page {page} of {pages}</span><Button variant="secondary" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>Next</Button></div>;
}

export default Pagination;

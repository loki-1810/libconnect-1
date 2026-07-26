import { Link } from "react-router-dom";
import { FiBookOpen } from "react-icons/fi";
import Card from "../ui/Card";
import Button from "../ui/Button";

function BookCard({ book, management, onEdit, onDelete }) {
  const available = book.available_copies ?? 0;
  return <Card className="flex h-full flex-col overflow-hidden"><div className="mb-5 grid h-40 place-items-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100"><FiBookOpen className="text-5xl text-blue-400" /></div><div className="flex flex-1 flex-col"><div className="mb-2 flex items-start justify-between gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{book.category}</span><span className={`text-xs font-semibold ${available > 0 ? "text-emerald-600" : "text-amber-600"}`}>{available > 0 ? `${available} available` : "On loan"}</span></div><h3 className="line-clamp-2 text-lg font-bold text-slate-900">{book.title}</h3><p className="mt-1 text-sm text-slate-600">{book.author}</p><p className="mt-3 text-xs text-slate-500">{book.published_year || "Year unknown"} · {book.language || "English"}</p><div className="mt-auto pt-5">{management ? <div className="flex gap-2"><Button variant="secondary" className="flex-1 px-3" onClick={() => onEdit(book)}>Edit</Button><Button variant="danger" className="flex-1 px-3" onClick={() => onDelete(book)}>Delete</Button></div> : <Link to={`/books/${book.id}`}><Button className="w-full">View details</Button></Link>}</div></div></Card>;
}

export default BookCard;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiMapPin, FiSearch } from "react-icons/fi";
import { libraryService } from "../../services/libraryService";
import { apiError } from "../../services/api";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import { ROUTES } from "../../constants/routes";

function Libraries() {
  const [result, setResult] = useState({ items: [], page: 1, pages: 0 }); const [q, setQ] = useState(""); const [page, setPage] = useState(1); const [error, setError] = useState("");
  useEffect(() => { let active = true; libraryService.list({ q: q || undefined, page }).then((data) => active && setResult(data)).catch((requestError) => active && setError(apiError(requestError))); return () => { active = false; }; }, [q, page]);
  return <section className="mx-auto max-w-7xl px-6 py-14"><div className="flex flex-wrap items-end justify-between gap-6"><div><p className="text-sm font-bold uppercase tracking-widest text-blue-600">Our network</p><h1 className="mt-2 text-4xl font-bold">Find a participating library</h1><p className="mt-3 max-w-xl text-slate-600">Browse approved LibConnect libraries and discover their catalogues. <Link to={ROUTES.LIBRARY_REGISTER} className="font-semibold text-blue-600">Register your library</Link>.</p></div><label className="flex min-w-72 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm"><FiSearch className="text-slate-400" /><input className="w-full py-3 outline-none" placeholder="Search by library or city" value={q} onChange={(event) => { setQ(event.target.value); setPage(1); }} /></label></div>{error ? <p className="mt-8 rounded-lg bg-rose-50 p-4 text-rose-700">{error}</p> : result.items.length ? <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{result.items.map((library) => <article key={library.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">{library.name}</h2><p className="mt-3 flex items-start gap-2 text-sm text-slate-600"><FiMapPin className="mt-0.5 shrink-0" />{library.address}, {library.city}</p>{library.description && <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{library.description}</p>}<a href={`mailto:${library.contact_email}`} className="mt-5 inline-block text-sm font-semibold text-blue-600">Contact library</a></article>)}</div> : <div className="mt-8"><EmptyState title="No libraries found" description="Try another name or city." /></div>}<Pagination page={result.page} pages={result.pages} onPageChange={setPage} /></section>;
}

export default Libraries;

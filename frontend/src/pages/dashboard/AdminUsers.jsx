import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import { dashboardService } from "../../services/dashboardService";
import { apiError } from "../../services/api";

function AdminUsers() {
  const [result, setResult] = useState({ items: [], page: 1, pages: 0 }); const [role, setRole] = useState(""); const [page, setPage] = useState(1); const [search, setSearch] = useState("");
  function load() { dashboardService.users({ page, role: role || undefined, q: search || undefined }).then(setResult).catch((error) => toast.error(apiError(error))); }
  useEffect(load, [page, role, search]);
  async function toggle(user) { try { await dashboardService.updateUser(user.id, { is_active: !user.is_active }); toast.success(`Account ${user.is_active ? "deactivated" : "activated"}`); load(); } catch (error) { toast.error(apiError(error)); } }
  return <section><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-bold">Users and librarians</h2><p className="mt-1 text-slate-600">Search accounts and manage access across LibConnect.</p></div><div className="flex gap-2"><input className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm" placeholder="Search name or email" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /><select className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm" value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }}><option value="">All roles</option><option value="student">Students</option><option value="librarian">Librarians</option><option value="admin">Admins</option></select></div></div><div className="mt-7 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">{result.items.length ? <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Created</th><th className="px-5 py-3">Status</th><th className="px-5 py-3" /></tr></thead><tbody>{result.items.map((user) => <tr key={user.id} className="border-t border-slate-100"><td className="px-5 py-4"><p className="font-semibold">{user.name}</p><p className="text-xs text-slate-500">{user.email}</p></td><td className="px-5 py-4 capitalize">{user.role}</td><td className="px-5 py-4">{new Date(user.created_at).toLocaleDateString()}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.is_active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{user.is_active ? "Active" : "Inactive"}</span></td><td className="px-5 py-4"><Button variant="secondary" className="px-3 py-2 text-xs" onClick={() => toggle(user)}>{user.is_active ? "Deactivate" : "Activate"}</Button></td></tr>)}</tbody></table></div> : <div className="p-6"><EmptyState title="No users found" /></div>}</div><Pagination page={result.page} pages={result.pages} onPageChange={setPage} /></section>;
}

export default AdminUsers;

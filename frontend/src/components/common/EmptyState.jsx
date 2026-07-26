import { FiInbox } from "react-icons/fi";

function EmptyState({ title = "Nothing here yet", description = "Try changing your filters or check back soon.", action }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><FiInbox className="mx-auto mb-3 text-3xl text-slate-400" /><h3 className="font-semibold text-slate-800">{title}</h3><p className="mt-1 text-sm text-slate-500">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

export default EmptyState;

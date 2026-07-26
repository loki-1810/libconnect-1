function AuthInput({ label, error, id, ...props }) {
  return <div className="mb-5"><label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-700">{label}</label><input id={id} className={`w-full rounded-lg border px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ${error ? "border-rose-400" : "border-slate-300"}`} {...props} />{error && <p className="mt-1 text-xs text-rose-600">{error}</p>}</div>;
}

export default AuthInput;

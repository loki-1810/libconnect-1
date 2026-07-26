function AuthCard({ title, subtitle, children }) {
  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>

        {subtitle && (
          <p className="mt-2 text-slate-600">{subtitle}</p>
        )}
      </div>

      {children}
    </div>
  );
}

export default AuthCard;
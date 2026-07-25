function Card({ children }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-lg">
      {children}
    </div>
  );
}

export default Card;
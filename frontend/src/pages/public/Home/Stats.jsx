function Stats() {
  const stats = [
    { number: "10K+", label: "Books" },
    { number: "2K+", label: "Readers" },
    { number: "50+", label: "Libraries" },
    { number: "99%", label: "Satisfaction" },
  ];

  return (
    <section className="bg-white py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="text-center">
            <h2 className="text-4xl font-bold text-blue-600">
              {item.number}
            </h2>
            <p className="mt-2 text-slate-600">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Stats;
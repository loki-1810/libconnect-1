import { useEffect, useState } from "react";
import api from "../../../services/api";

function Stats() {
  const [stats, setStats] = useState([
    { number: "...", label: "Books" },
    { number: "...", label: "Readers" },
    { number: "...", label: "Libraries" },
    { number: "...", label: "Borrows" },
  ]);

  useEffect(() => {
    api
      .get("/stats")
      .then((response) => {
        const d = response.data;
        setStats([
          { number: d.total_books.toLocaleString(), label: "Books" },
          { number: d.total_readers.toLocaleString(), label: "Readers" },
          { number: d.total_libraries.toLocaleString(), label: "Libraries" },
          { number: d.total_borrows.toLocaleString(), label: "Borrows" },
        ]);
      })
      .catch(() => {});
  }, []);

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

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Container from "../../../components/ui/Container";
import SectionHeading from "../../../components/ui/SectionHeading";
import BookCard from "../../../components/books/BookCard";
import { bookService } from "../../../services/bookService";
import { ROUTES } from "../../../constants/routes";

function PopularBooks() {
  const [books, setBooks] = useState([]);
  useEffect(() => { bookService.list({ page_size: 4 }).then((data) => setBooks(data.items)).catch(() => setBooks([])); }, []);
  return <section className="py-20"><Container><SectionHeading title="Explore the catalogue" subtitle="A few recently added titles from the LibConnect community." />{books.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">{books.map((book) => <BookCard key={book.id} book={book} />)}</div> : <div className="rounded-2xl bg-slate-100 px-6 py-10 text-center text-slate-600">The catalogue is ready for your library’s first titles. <Link className="font-semibold text-blue-600" to={ROUTES.BOOKS}>Browse books</Link>.</div>}</Container></section>;
}

export default PopularBooks;

import books from "../../../data/books";

import Container from "../../../components/ui/Container";
import SectionHeading from "../../../components/ui/SectionHeading";
import BookCard from "../../../components/books/BookCard";

function PopularBooks() {
  return (
    <section className="py-20">
      <Container>

        <SectionHeading
          title="Popular Books"
          subtitle="Explore some of our most borrowed books."
        />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
            />
          ))}
        </div>

      </Container>
    </section>
  );
}

export default PopularBooks;
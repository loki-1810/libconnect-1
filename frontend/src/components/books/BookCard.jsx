import Card from "../ui/Card";
import Button from "../ui/Button";

function BookCard({ book }) {
  return (
    <Card>
      <div className="space-y-3">
        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
          {book.category}
        </span>

        <h3 className="text-xl font-bold">
          {book.title}
        </h3>

        <p className="text-slate-600">
          {book.author}
        </p>

        <Button className="w-full">
          View Details
        </Button>
      </div>
    </Card>
  );
}

export default BookCard;
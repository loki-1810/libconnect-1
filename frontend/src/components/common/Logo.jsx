import { Link } from "react-router-dom";
import { FaBookOpen } from "react-icons/fa";

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <FaBookOpen className="text-3xl text-blue-600" />
      <span className="text-2xl font-bold text-slate-800">
        LibConnect
      </span>
    </Link>
  );
}

export default Logo;
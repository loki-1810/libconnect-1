import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<h1 className="p-10 text-4xl">Home</h1>} />
        <Route path="/books" element={<h1 className="p-10 text-4xl">Books</h1>} />
        <Route path="/about" element={<h1 className="p-10 text-4xl">About</h1>} />
        <Route path="/contact" element={<h1 className="p-10 text-4xl">Contact</h1>} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
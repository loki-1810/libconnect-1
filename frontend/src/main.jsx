import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/common/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary><BrowserRouter><AuthProvider><App /><Toaster position="top-right" toastOptions={{ duration: 4000 }} /></AuthProvider></BrowserRouter></ErrorBoundary>
);

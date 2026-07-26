import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? <div className="grid min-h-screen place-items-center p-6 text-center"><div><h1 className="text-2xl font-bold">Something went wrong</h1><p className="mt-2 text-slate-600">Please refresh the page and try again.</p></div></div> : this.props.children; }
}

export default ErrorBoundary;

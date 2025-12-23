import { Link } from "react-router-dom";

export const NotFound = () => (
  <div className="page-center">
    <h1>404</h1>
    <p className="muted">We could not find that page.</p>
    <Link to="/" className="btn btn-primary">
      Back to home
    </Link>
  </div>
);

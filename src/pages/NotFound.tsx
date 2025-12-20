import { Link } from "react-router-dom";

export const NotFound = () => (
  <div className="page center">
    <h1>404</h1>
    <p>Nie znalezlismy tej strony.</p>
    <Link to="/" className="btn btn-primary">
      Wroc na start
    </Link>
  </div>
);

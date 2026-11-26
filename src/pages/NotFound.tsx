import { Link } from "react-router-dom";
import { useT } from "../i18n";

export const NotFound = () => {
  const { t } = useT();
  return (
  <div className="page-center">
    <h1>404</h1>
    <p className="muted">{t("notFound.text")}</p>
    <Link to="/" className="btn btn-primary">
      {t("notFound.back")}
    </Link>
  </div>
  );
};

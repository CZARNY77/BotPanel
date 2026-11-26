import { Navigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { EmptyState, LoadingScreen } from "../components/ui/basics";
import { lastServer, useServers } from "../hooks/useServers";
import { openInvite } from "../api/endpoints/servers";
import { sectionPath } from "./sections";
import { useT } from "../i18n";

/** /dashboard: go to the last used server, else the first one with the bot. */
export const DashboardIndex = () => {
  const { t } = useT();
  const { servers, loading, error, reload } = useServers();
  if (loading) return <LoadingScreen label={t("servers.loading")} />;
  if (error) {
    return (
      <div className="content">
        <EmptyState icon="warning" title={t("servers.error")} action={<Button icon="refresh" onClick={() => void reload()}>{t("action.retry")}</Button>}>
          {error}
        </EmptyState>
      </div>
    );
  }
  const remembered = lastServer();
  const target =
    servers.find((s) => s.id === remembered && s.botPresent) ?? servers.find((s) => s.botPresent) ?? servers[0];
  if (target) return <Navigate to={sectionPath(target.id, "overview")} replace />;
  return (
    <div className="content">
      <EmptyState
        center
        icon="bot"
        title={t("servers.none")}
        action={<Button variant="primary" icon="plus" onClick={() => void openInvite()}>{t("action.addConqBot")}</Button>}
      >
        {t("servers.noneHint")}
      </EmptyState>
    </div>
  );
};

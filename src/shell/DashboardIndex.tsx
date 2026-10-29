import { Navigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { EmptyState, LoadingScreen } from "../components/ui/basics";
import { lastServer, useServers } from "../hooks/useServers";
import { openInvite } from "./ServerSwitcher";
import { sectionPath } from "./sections";

/** /dashboard: go to the last used server, else the first one with the bot. */
export const DashboardIndex = () => {
  const { servers, loading, error, reload } = useServers();
  if (loading) return <LoadingScreen label="Loading your servers…" />;
  if (error) {
    return (
      <div className="content">
        <EmptyState icon="warning" title="Could not load your servers." action={<Button icon="refresh" onClick={() => void reload()}>Retry</Button>}>
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
        title="No servers to manage"
        action={<Button variant="primary" icon="plus" onClick={() => void openInvite()}>Add ConqBot to a server</Button>}
      >
        You need Administrator or Manage Server permission on a Discord server.
      </EmptyState>
    </div>
  );
};

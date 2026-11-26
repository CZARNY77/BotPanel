import type { Server } from "../api/types";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/basics";
import { useT } from "../i18n";

export const NoBotPage = ({ server, onInvite }: { server: Server; onInvite: () => void }) => {
  const { t } = useT();
  return (
  <EmptyState
    center
    icon="bot"
    title={t("nobot.title", { name: server.name })}
    action={
      <Button variant="primary" icon="plus" onClick={onInvite}>
        {t("action.addBot")}
      </Button>
    }
  >
    {t("nobot.hint")}
  </EmptyState>
  );
};

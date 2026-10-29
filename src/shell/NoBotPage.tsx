import type { Server } from "../api/types";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/basics";

export const NoBotPage = ({ server, onInvite }: { server: Server; onInvite: () => void }) => (
  <EmptyState
    center
    icon="bot"
    title={`ConqBot is not on ${server.name} yet`}
    action={
      <Button variant="primary" icon="plus" onClick={onInvite}>
        Add bot
      </Button>
    }
  >
    Add the bot to this server, then refresh the page to configure it.
  </EmptyState>
);

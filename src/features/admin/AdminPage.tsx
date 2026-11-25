import { useEffect, useState } from "react";
import { addAdminUser, getAdminUsers, removeAdminUser } from "../../api/endpoints/admin";
import { useAuth } from "../../auth/AuthContext";
import { TextInput } from "../../components/form/fields";
import { Button, IconButton } from "../../components/ui/Button";
import { ErrorState, Group, PageHeader, Skeleton } from "../../components/ui/basics";
import { ConfirmDialog } from "../../components/ui/Dialog";
import { Icon } from "../../components/ui/Icon";
import { errorText, useToast } from "../../components/ui/Toast";
import { LogsPanel } from "./LogsPanel";

const AdminUsers = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  const load = () => {
    setError(null);
    getAdminUsers().then(setUsers).catch((err) => setError(errorText(err, "Failed to load admins.")));
  };
  useEffect(load, []);

  const add = async () => {
    const id = input.trim();
    if (!/^\d{5,20}$/.test(id)) {
      toast.error("Enter a Discord user ID (numbers only).");
      return;
    }
    setBusy(true);
    try {
      setUsers(await addAdminUser(id));
      setInput("");
      toast.success("Admin added.");
    } catch (err) {
      toast.error(errorText(err, "Failed to add admin."));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      setUsers(await removeAdminUser(confirm));
      toast.success("Admin removed.");
      setConfirm(null);
    } catch (err) {
      toast.error(errorText(err, "Failed to remove admin."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Group title={<>Panel admins <span className="muted num">{users?.length ?? ""}</span></>} icon="users" description="Admins see this console on every server.">
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      <div className="row" style={{ flexWrap: "nowrap", marginBottom: 12 }}>
        <TextInput value={input} placeholder="Discord user ID" aria-label="Discord user ID" onChange={setInput} onKeyDown={(e) => e.key === "Enter" && void add()} />
        <Button icon="plus" loading={busy && !confirm} onClick={() => void add()}>Add</Button>
      </div>
      {!users && !error ? <Skeleton height={40} /> : null}
      <div className="list">
        {(users ?? []).map((id) => (
          <div key={id} className="list-row">
            <Icon name="user" />
            <span className="grow mono">{id}</span>
            {id === user?.id ? <span className="muted small">you</span> : null}
            <IconButton icon="trash" variant="danger" label="Remove admin" onClick={() => setConfirm(id)} />
          </div>
        ))}
      </div>
      {confirm ? (
        <ConfirmDialog
          title="Remove admin?"
          message={<>User <span className="mono">{confirm}</span> will lose access to the console.</>}
          confirmLabel="Remove"
          danger
          busy={busy}
          onConfirm={() => void remove()}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
    </Group>
  );
};

export default function AdminPage() {
  return (
    <>
      <PageHeader icon="console" hue="var(--cb-hue-console)" title="Console" subtitle="Bot and panel logs, and who can see this console." />
      <div className="split split--admin">
        <LogsPanel />
        <AdminUsers />
      </div>
    </>
  );
}

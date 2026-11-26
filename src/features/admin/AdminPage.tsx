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
import { useT } from "../../i18n";

const AdminUsers = () => {
  const { t } = useT();
  const { user } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  const load = () => {
    setError(null);
    getAdminUsers().then(setUsers).catch((err) => setError(errorText(err, t("admins.loadFailed"))));
  };
  useEffect(load, []);

  const add = async () => {
    const id = input.trim();
    if (!/^\d{5,20}$/.test(id)) {
      toast.error(t("admins.badId"));
      return;
    }
    setBusy(true);
    try {
      setUsers(await addAdminUser(id));
      setInput("");
      toast.success(t("admins.added"));
    } catch (err) {
      toast.error(errorText(err, t("admins.addFailed")));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      setUsers(await removeAdminUser(confirm));
      toast.success(t("admins.removed"));
      setConfirm(null);
    } catch (err) {
      toast.error(errorText(err, t("admins.removeFailed")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Group title={<>{t("admins.title")} <span className="muted num">{users?.length ?? ""}</span></>} icon="users" description={t("admins.desc")}>
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      <div className="row" style={{ flexWrap: "nowrap", marginBottom: 12 }}>
        <TextInput value={input} placeholder={t("admins.userId")} aria-label={t("admins.userId")} onChange={setInput} onKeyDown={(e) => e.key === "Enter" && void add()} />
        <Button icon="plus" loading={busy && !confirm} onClick={() => void add()}>{t("action.add")}</Button>
      </div>
      {!users && !error ? <Skeleton height={40} /> : null}
      <div className="list">
        {(users ?? []).map((id) => (
          <div key={id} className="list-row">
            <Icon name="user" />
            <span className="grow mono">{id}</span>
            {id === user?.id ? <span className="muted small">{t("admins.you")}</span> : null}
            <IconButton icon="trash" variant="danger" label={t("admins.remove")} onClick={() => setConfirm(id)} />
          </div>
        ))}
      </div>
      {confirm ? (
        <ConfirmDialog
          title={t("admins.removeTitle")}
          message={<>{t("admins.removeUser")} <span className="mono">{confirm}</span> {t("admins.removeLose")}</>}
          confirmLabel={t("action.remove")}
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
  const { t } = useT();
  return (
    <>
      <PageHeader icon="console" hue="var(--cb-hue-console)" title={t("section.console")} subtitle={t("console.subtitle")} />
      <div className="split split--admin">
        <LogsPanel />
        <AdminUsers />
      </div>
    </>
  );
}

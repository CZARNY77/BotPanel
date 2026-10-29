import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { useUnsavedChanges } from "../hooks/useEditable";

/** One bar for every editable on the page (replaces the per-section if-chains). */
export const UnsavedBar = () => {
  const { entries, hasDirty, saving, saveAll, discardAll, shakeKey } = useUnsavedChanges();
  if (!hasDirty) return null;
  const what = entries.map((entry) => entry.label).join(", ");
  return (
    <div key={shakeKey} className={`unsaved${shakeKey ? " unsaved--shake" : ""}`} role="region" aria-label="Unsaved changes">
      <Icon name="edit" />
      <div className="grow" style={{ minWidth: 0 }}>
        <strong>Unsaved changes</strong>
        <div className="muted xs truncate" title={what}>
          {what}
        </div>
      </div>
      <Button variant="ghost" onClick={discardAll} disabled={saving}>
        Discard
      </Button>
      <Button variant="primary" icon="check" onClick={() => void saveAll()} loading={saving}>
        Save
      </Button>
    </div>
  );
};

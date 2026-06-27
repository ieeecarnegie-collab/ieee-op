import type { ExecMember } from "@/lib/exec-types";
import { memberCommitteeLabel } from "@/lib/exec-types";

type Props = {
  roster: ExecMember[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

export function AttendeeChecklist({
  roster,
  selectedIds,
  onChange,
  disabled,
}: Props) {
  function toggle(id: string) {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  function setAll(checked: boolean) {
    if (disabled) return;
    onChange(checked ? roster.map((m) => m.id) : []);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3 text-xs">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setAll(true)}
          className="text-[#00629B] hover:underline disabled:opacity-50"
        >
          Select all
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setAll(false)}
          className="text-[#00629B] hover:underline disabled:opacity-50"
        >
          Clear all
        </button>
        <span className="text-slate-500">
          {selectedIds.length}/{roster.length} present
        </span>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {roster.map((member) => {
          const label = memberCommitteeLabel(member);
          return (
            <li key={member.id}>
              <label className="flex cursor-pointer items-start gap-2 rounded border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={selectedIds.includes(member.id)}
                  onChange={() => toggle(member.id)}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium text-slate-900">{member.name}</span>
                  {label && (
                    <span className="mt-0.5 block text-xs capitalize text-slate-500">
                      {label}
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

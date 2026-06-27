"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RosterUser = {
  user: { id: string; name: string; email: string; status: string };
  permissions: {
    canEditAll: boolean | null;
    canManageUsers: boolean | null;
  } | null;
  memberships: { slug: string; name: string }[];
};

type Template = {
  id: string;
  offsetDays: number;
  title: string;
  sortOrder: number;
  isOptional: boolean | null;
  isRecommended: boolean | null;
  condition: string;
};

type SemesterSettings = {
  semesterStart: string;
  semesterEnd: string;
  semesterLabel: string;
};

export function AdminClient({
  roster,
  initialSettings,
  initialTemplates,
}: {
  roster: RosterUser[];
  initialSettings: SemesterSettings;
  initialTemplates: Template[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"roster" | "settings" | "templates" | "email">(
    "roster",
  );
  const [settings, setSettings] = useState(initialSettings);
  const [templates, setTemplates] = useState(initialTemplates);
  const [newTemplate, setNewTemplate] = useState({
    offsetDays: 14,
    title: "",
    sortOrder: 0,
    condition: "always",
  });
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    router.refresh();
  }

  async function addTemplate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTemplate),
    });
    setNewTemplate({ offsetDays: 14, title: "", sortOrder: 0, condition: "always" });
    router.refresh();
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Delete this checklist template item?")) return;
    await fetch(`/api/admin/templates/${id}`, { method: "DELETE" });
    setTemplates((t) => t.filter((x) => x.id !== id));
  }

  async function sendDigest() {
    setEmailStatus("Sending…");
    const res = await fetch("/api/cron/reminders", { method: "POST" });
    const data = await res.json();
    setEmailStatus(data.message ?? (data.sent ? "Sent" : "Failed"));
  }

  const tabs = [
    { id: "roster" as const, label: "Roster" },
    { id: "settings" as const, label: "Semester" },
    { id: "templates" as const, label: "Planning template" },
    { id: "email" as const, label: "Email digest" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2 border-b pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded px-3 py-1.5 text-sm ${
              tab === t.id
                ? "bg-[#00629B] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "roster" && (
        <div className="overflow-x-auto rounded border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Committees</th>
                <th className="px-4 py-3">Permissions</th>
              </tr>
            </thead>
            <tbody>
              {roster.map(({ user, permissions, memberships }) => (
                <tr key={user.id} className="border-b">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3 capitalize">{user.status}</td>
                  <td className="px-4 py-3">
                    {memberships.map((m) => m.slug).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {permissions?.canEditAll && "Edit all · "}
                    {permissions?.canManageUsers && "Admin"}
                    {!permissions?.canEditAll &&
                      !permissions?.canManageUsers &&
                      "Committee-scoped"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "settings" && (
        <form onSubmit={saveSettings} className="max-w-md space-y-4 rounded border bg-white p-4">
          <p className="text-sm text-slate-600">
            Org-wide semester dates for reporting. Signature event tracking uses the current calendar month automatically.
          </p>
          <label className="block text-sm">
            Label
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={settings.semesterLabel}
              onChange={(e) =>
                setSettings({ ...settings, semesterLabel: e.target.value })
              }
            />
          </label>
          <label className="block text-sm">
            Start date
            <input
              type="date"
              className="mt-1 w-full rounded border px-3 py-2"
              value={settings.semesterStart}
              onChange={(e) =>
                setSettings({ ...settings, semesterStart: e.target.value })
              }
            />
          </label>
          <label className="block text-sm">
            End date
            <input
              type="date"
              className="mt-1 w-full rounded border px-3 py-2"
              value={settings.semesterEnd}
              onChange={(e) =>
                setSettings({ ...settings, semesterEnd: e.target.value })
              }
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-[#00629B] px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save semester settings"}
          </button>
        </form>
      )}

      {tab === "templates" && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="px-4 py-3">Milestone</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Condition</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-b">
                    <td className="px-4 py-3">T-{t.offsetDays}</td>
                    <td className="px-4 py-3">{t.title}</td>
                    <td className="px-4 py-3">{t.condition}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => deleteTemplate(t.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form onSubmit={addTemplate} className="grid gap-2 rounded border bg-white p-4 sm:grid-cols-4">
            <select
              className="rounded border px-2 py-1"
              value={newTemplate.offsetDays}
              onChange={(e) =>
                setNewTemplate({
                  ...newTemplate,
                  offsetDays: Number(e.target.value),
                })
              }
            >
              <option value={14}>T-14</option>
              <option value={7}>T-7</option>
              <option value={3}>T-3</option>
              <option value={0}>Day-of</option>
            </select>
            <input
              required
              placeholder="Checklist item title"
              className="rounded border px-2 py-1 sm:col-span-2"
              value={newTemplate.title}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, title: e.target.value })
              }
            />
            <button type="submit" className="rounded bg-[#00629B] text-white">
              Add item
            </button>
          </form>
        </div>
      )}

      {tab === "email" && (
        <div className="max-w-lg rounded border bg-white p-4">
          <p className="text-sm text-slate-600">
            Sends a digest of overdue action items, upcoming signature events (14 days), and events with overdue planning checklist items to all active exec roster emails.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Configure <code className="text-xs">RESEND_API_KEY</code> and{" "}
            <code className="text-xs">RESEND_FROM</code> for production. Without a key, output is logged to the server console.
          </p>
          <button
            type="button"
            onClick={sendDigest}
            className="mt-4 rounded bg-[#00629B] px-4 py-2 text-sm text-white"
          >
            Send digest now
          </button>
          {emailStatus && (
            <p className="mt-2 text-sm text-slate-700">{emailStatus}</p>
          )}
        </div>
      )}
    </div>
  );
}

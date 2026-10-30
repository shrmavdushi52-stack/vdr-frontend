"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Users,
  X,
} from "lucide-react";

type Role = "Admin" | "Compliance Officer" | "Advisor" | "Auditor";

type TeamUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: "Active" | "Invited" | "Suspended";
};

type AuditEntry = {
  id: number;
  action: string;
  detail: string;
  time: string;
};

const initialUsers: TeamUser[] = [
  { id: 1, name: "Ambika Sharma", email: "ambika@example.com", role: "Admin", status: "Active" },
  { id: 2, name: "Sarah Wilson", email: "sarah@example.com", role: "Compliance Officer", status: "Active" },
  { id: 3, name: "John Smith", email: "john@example.com", role: "Advisor", status: "Active" },
  { id: 4, name: "David Brown", email: "david@example.com", role: "Auditor", status: "Active" },
  { id: 5, name: "Priya Kapoor", email: "priya@example.com", role: "Advisor", status: "Invited" },
];

const initialRules = [
  { id: 1, name: "Confidential document review", description: "Flag confidential files before external sharing.", enabled: true },
  { id: 2, name: "Access review reminders", description: "Remind administrators to review user permissions.", enabled: true },
  { id: 3, name: "Audit activity tracking", description: "Enable the demo audit event display.", enabled: true },
  { id: 4, name: "Document expiry alerts", description: "Display reminders for documents approaching expiry.", enabled: false },
];

const initialFeatures = [
  { id: 1, name: "Compliance AI Assistant", description: "Show the compliance chat module.", enabled: true },
  { id: 2, name: "Visual Tree Editor", description: "Show the workflow editor module.", enabled: true },
  { id: 3, name: "Advanced Analytics", description: "Show additional analytics panels.", enabled: false },
  { id: 4, name: "Maintenance Banner", description: "Display a maintenance notice in the demo.", enabled: false },
];

const roleOptions: Role[] = [
  "Admin",
  "Compliance Officer",
  "Advisor",
  "Auditor",
];

function timestamp() {
  return new Date().toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}

function StatCard({
  title,
  value,
  caption,
  icon: Icon,
}: {
  title: string;
  value: string;
  caption: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{caption}</p>
    </div>
  );
}

export default function AdminPage() {
  const [users, setUsers] = useState<TeamUser[]>(initialUsers);
  const [rules, setRules] = useState(initialRules);
  const [features, setFeatures] = useState(initialFeatures);
  const [audit, setAudit] = useState<AuditEntry[]>([
    {
      id: 1,
      action: "Admin workspace opened",
      detail: "Demo administrative workspace initialized.",
      time: "Just now",
    },
  ]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [showAddUser, setShowAddUser] = useState(false);
  const [notice, setNotice] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("Advisor");

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q)
    );
  }, [users, search]);

  function logAction(action: string, detail: string) {
    setAudit((previous) => [
      { id: Date.now(), action, detail, time: timestamp() },
      ...previous,
    ]);
  }

  function addUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = newName.trim();
    const email = newEmail.trim().toLowerCase();

    if (!name || !email) return;

    if (users.some((user) => user.email.toLowerCase() === email)) {
      setNotice("A user with that email already exists.");
      return;
    }

    const user: TeamUser = {
      id: Date.now(),
      name,
      email,
      role: newRole,
      status: "Invited",
    };

    setUsers((previous) => [...previous, user]);
    logAction("User invited", `${name} was added as ${newRole}.`);
    setNewName("");
    setNewEmail("");
    setNewRole("Advisor");
    setShowAddUser(false);
    setNotice(`Demo invitation created for ${email}. No email was sent.`);
  }

  function updateRole(user: TeamUser, role: Role) {
    if (user.role === role) return;

    setUsers((previous) =>
      previous.map((item) =>
        item.id === user.id ? { ...item, role } : item
      )
    );

    logAction("Role changed", `${user.name}: ${user.role} → ${role}.`);
    setNotice(`${user.name}'s demo role was updated.`);
  }

  function removeUser(user: TeamUser) {
    if (!window.confirm(`Remove ${user.name} from this demo user list?`)) {
      return;
    }

    setUsers((previous) => previous.filter((item) => item.id !== user.id));
    logAction("User removed", `${user.name} was removed from the demo list.`);
    setNotice(`${user.name} was removed from the demo list.`);
  }

  function toggleRule(id: number) {
    setRules((previous) =>
      previous.map((rule) => {
        if (rule.id !== id) return rule;

        const enabled = !rule.enabled;
        logAction(
          "Compliance rule changed",
          `${rule.name}: ${enabled ? "enabled" : "disabled"}.`
        );
        return { ...rule, enabled };
      })
    );
  }

  function toggleFeature(id: number) {
    setFeatures((previous) =>
      previous.map((feature) => {
        if (feature.id !== id) return feature;

        const enabled = !feature.enabled;
        logAction(
          "Feature flag changed",
          `${feature.name}: ${enabled ? "enabled" : "disabled"}.`
        );
        return { ...feature, enabled };
      })
    );
  }

  const activeUsers = users.filter((user) => user.status === "Active").length;
  const invitedUsers = users.filter((user) => user.status === "Invited").length;
  const enabledRules = rules.filter((rule) => rule.enabled).length;

  const tabs = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Users & Roles", icon: Users },
    { name: "Compliance Rules", icon: ClipboardCheck },
    { name: "Audit Logs", icon: Activity },
    { name: "Feature Flags", icon: Settings },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold tracking-tight">EnterpriseHub</p>
            <p className="text-xs text-slate-500">Enterprise administration</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:inline-flex">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Demo system ready
          </span>
          <a
            href="/"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Back to VDR
          </a>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-white p-4 lg:min-h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r lg:p-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Administration
          </p>

          <nav className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
            {tabs.map(({ name, icon: Icon }) => (
              <button
                key={name}
                onClick={() => setActiveTab(name)}
                className={`flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm transition ${
                  activeTab === name
                    ? "bg-indigo-50 font-semibold text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {name}
              </button>
            ))}
          </nav>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              Demo permissions
            </div>
            <p className="mt-2 text-xs leading-5 text-amber-800">
              Changes are held in browser memory. This panel does not enforce
              server-side authorization.
            </p>
          </div>
        </aside>

        <section className="min-w-0 p-4 sm:p-7 lg:p-9">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-indigo-600">
                Enterprise workspace / Admin
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {activeTab}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage workspace users, compliance controls, activity, and
                demonstration feature settings.
              </p>
            </div>

            {activeTab === "Users & Roles" && (
              <button
                onClick={() => {
                  setNotice("");
                  setShowAddUser(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Add user
              </button>
            )}
          </div>

          {notice && (
            <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
              <span>{notice}</span>
              <button
                onClick={() => setNotice("")}
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {activeTab === "Overview" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Total users"
                  value={String(users.length)}
                  caption="Users in this demo workspace"
                  icon={Users}
                />
                <StatCard
                  title="Active users"
                  value={String(activeUsers)}
                  caption={`${invitedUsers} invitation(s) pending`}
                  icon={CheckCircle2}
                />
                <StatCard
                  title="Enabled rules"
                  value={`${enabledRules}/${rules.length}`}
                  caption="Demo compliance controls"
                  icon={ClipboardCheck}
                />
                <StatCard
                  title="Audit events"
                  value={String(audit.length)}
                  caption="Actions in this browser session"
                  icon={Activity}
                />
              </div>

              <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">Recent administration activity</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Latest actions recorded in this session
                      </p>
                    </div>
                    <Activity className="h-5 w-5 text-slate-400" />
                  </div>

                  <div className="mt-5 divide-y divide-slate-100">
                    {audit.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="flex gap-3 py-4">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <Clock3 className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{entry.action}</p>
                          <p className="mt-1 text-sm text-slate-500">{entry.detail}</p>
                          <p className="mt-1 text-xs text-slate-400">{entry.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <h2 className="font-semibold">System health</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Basic frontend demonstration status
                  </p>

                  <div className="mt-5 space-y-4">
                    {[
                      ["Admin interface", "Available"],
                      ["User list", "Available"],
                      ["Compliance controls", "Available"],
                      ["Backend authorization", "Not connected"],
                    ].map(([label, status]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0"
                      >
                        <span className="text-sm text-slate-600">{label}</span>
                        <Badge>{status}</Badge>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                    <BarChart3 className="mr-1 inline h-4 w-4" />
                    Metrics represent local demo state, not live production
                    telemetry.
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "Users & Roles" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 sm:p-5">
                <div>
                  <h2 className="font-semibold">Workspace users</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {users.length} demo user(s)
                  </p>
                </div>
                <label className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 sm:w-72">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search users or roles..."
                    className="w-full min-w-0 text-sm outline-none"
                    aria-label="Search users"
                  />
                </label>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">User</th>
                      <th className="px-5 py-3 font-medium">Role</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <p className="font-medium">{user.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          <label className="flex items-center gap-2">
                            <span className="sr-only">Role for {user.name}</span>
                            <select
                              value={user.role}
                              onChange={(event) =>
                                updateRole(user, event.target.value as Role)
                              }
                              className="max-w-52 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                            >
                              {roleOptions.map((role) => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                          </label>
                        </td>
                        <td className="px-5 py-4">
                          <Badge>{user.status}</Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => removeUser(user)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                          No matching users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Compliance Rules" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="font-semibold">Compliance controls</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Toggle the example rules to see their local state and audit events change.
                </p>
              </div>

              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                      <LockKeyhole className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{rule.name}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {rule.description}
                      </p>
                      <p className={`mt-2 text-xs font-medium ${rule.enabled ? "text-emerald-700" : "text-slate-400"}`}>
                        {rule.enabled ? "Enabled in demo" : "Disabled in demo"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleRule(rule.id)}
                    aria-label={`${rule.enabled ? "Disable" : "Enable"} ${rule.name}`}
                    className={`rounded-xl p-2 ${rule.enabled ? "text-indigo-600" : "text-slate-400"}`}
                  >
                    {rule.enabled ? (
                      <ToggleRight className="h-8 w-8" />
                    ) : (
                      <ToggleLeft className="h-8 w-8" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Audit Logs" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-5">
                <h2 className="font-semibold">Administrative audit log</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Local record of actions taken in this demo session
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {audit.map((entry) => (
                  <div key={entry.id} className="flex gap-3 p-5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{entry.action}</p>
                      <p className="mt-1 text-sm text-slate-500">{entry.detail}</p>
                      <p className="mt-2 text-xs text-slate-400">{entry.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Feature Flags" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="font-semibold">Feature flags</h2>
                <p className="mt-1 text-sm text-slate-500">
                  These switches update this page's local demo state. They do not control other routes.
                </p>
              </div>

              {features.map((feature) => (
                <div
                  key={feature.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div>
                    <h3 className="font-medium">{feature.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{feature.description}</p>
                    <p className={`mt-2 text-xs font-medium ${feature.enabled ? "text-emerald-700" : "text-slate-400"}`}>
                      {feature.enabled ? "Enabled in demo" : "Disabled in demo"}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleFeature(feature.id)}
                    aria-label={`${feature.enabled ? "Disable" : "Enable"} ${feature.name}`}
                    className={`rounded-xl p-2 ${feature.enabled ? "text-indigo-600" : "text-slate-400"}`}
                  >
                    {feature.enabled ? (
                      <ToggleRight className="h-8 w-8" />
                    ) : (
                      <ToggleLeft className="h-8 w-8" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400">
            <span>EnterpriseHub Admin · Frontend demonstration</span>
            <span><Check className="mr-1 inline h-3.5 w-3.5" /> Local session state</span>
          </footer>
        </section>
      </div>

      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-user-title"
            className="my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="add-user-title" className="text-xl font-semibold">
                  Add workspace user
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Create a demo user record.
                </p>
              </div>
              <button
                onClick={() => setShowAddUser(false)}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={addUser} className="mt-6 space-y-4">
              <div>
                <label htmlFor="user-name" className="mb-1.5 block text-sm font-medium">
                  Full name
                </label>
                <input
                  id="user-name"
                  required
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="Enter full name"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="user-email" className="mb-1.5 block text-sm font-medium">
                  Email address
                </label>
                <input
                  id="user-email"
                  type="email"
                  required
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="user-role" className="mb-1.5 block text-sm font-medium">
                  Workspace role
                </label>
                <select
                  id="user-role"
                  value={newRole}
                  onChange={(event) => setNewRole(event.target.value as Role)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Create demo user
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}


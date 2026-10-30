"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  GitBranch,
  LayoutGrid,
  Minus,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Workflow,
  X,
} from "lucide-react";

type NodeKind = "start" | "process" | "decision" | "end";

type TreeNode = {
  id: string;
  title: string;
  description: string;
  kind: NodeKind;
  x: number;
  y: number;
};

type Connection = {
  id: string;
  from: string;
  to: string;
};

const initialNodes: TreeNode[] = [
  {
    id: "start",
    title: "Start Review",
    description: "New document submitted",
    kind: "start",
    x: 390,
    y: 35,
  },
  {
    id: "classify",
    title: "Classify Document",
    description: "Check sensitivity level",
    kind: "process",
    x: 390,
    y: 155,
  },
  {
    id: "check",
    title: "Compliance Check",
    description: "Verify required evidence",
    kind: "decision",
    x: 390,
    y: 275,
  },
  {
    id: "approve",
    title: "Approve Document",
    description: "Authorized reviewer approves",
    kind: "process",
    x: 160,
    y: 420,
  },
  {
    id: "resolve",
    title: "Request Changes",
    description: "Resolve outstanding issues",
    kind: "process",
    x: 620,
    y: 420,
  },
  {
    id: "end",
    title: "Complete",
    description: "Review recorded",
    kind: "end",
    x: 390,
    y: 555,
  },
];

const initialConnections: Connection[] = [
  { id: "c1", from: "start", to: "classify" },
  { id: "c2", from: "classify", to: "check" },
  { id: "c3", from: "check", to: "approve" },
  { id: "c4", from: "check", to: "resolve" },
  { id: "c5", from: "approve", to: "end" },
  { id: "c6", from: "resolve", to: "end" },
];

const kindLabels: Record<NodeKind, string> = {
  start: "Start",
  process: "Process",
  decision: "Decision",
  end: "End",
};

const kindStyles: Record<NodeKind, string> = {
  start: "border-emerald-300 bg-emerald-50",
  process: "border-indigo-200 bg-white",
  decision: "border-amber-300 bg-amber-50",
  end: "border-slate-300 bg-slate-100",
};

function makeId() {
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function TreeEditorPage() {
  const [nodes, setNodes] = useState<TreeNode[]>(initialNodes);
  const [connections, setConnections] =
    useState<Connection[]>(initialConnections);
  const [selectedId, setSelectedId] = useState<string | null>("check");
  const [nextKind, setNextKind] = useState<NodeKind>("process");
  const [notice, setNotice] = useState("Example workflow loaded.");
  const [zoom, setZoom] = useState(1);
  const [savedAt, setSavedAt] = useState("");

  const selectedNode = nodes.find((node) => node.id === selectedId) ?? null;

  function updateSelected(field: "title" | "description" | "kind", value: string) {
    if (!selectedId) return;

    setNodes((previous) =>
      previous.map((node) =>
        node.id === selectedId ? { ...node, [field]: value } : node
      )
    );
  }

  function addNode() {
    const id = makeId();
    const count = nodes.length;
    const node: TreeNode = {
      id,
      title: `New ${kindLabels[nextKind]} Node`,
      description: "Click to edit this step",
      kind: nextKind,
      x: 35 + ((count * 115) % 650),
      y: 35 + ((count * 95) % 580),
    };

    setNodes((previous) => [...previous, node]);
    setSelectedId(id);
    setNotice("Node added. Select it to edit its details.");
  }

  function deleteSelected() {
    if (!selectedId) return;

    const node = nodes.find((item) => item.id === selectedId);
    if (!node) return;

    setNodes((previous) => previous.filter((item) => item.id !== selectedId));
    setConnections((previous) =>
      previous.filter(
        (connection) =>
          connection.from !== selectedId && connection.to !== selectedId
      )
    );
    setSelectedId(null);
    setNotice(`"${node.title}" and its connections were removed.`);
  }

  function connectSelected() {
    if (!selectedId) {
      setNotice("Select a source node first.");
      return;
    }

    const target = window.prompt(
      "Enter the exact title of the node you want to connect to:"
    );

    if (!target) return;

    const destination = nodes.find(
      (node) =>
        node.title.toLowerCase() === target.trim().toLowerCase() &&
        node.id !== selectedId
    );

    if (!destination) {
      setNotice("No other node found with that exact title.");
      return;
    }

    const alreadyExists = connections.some(
      (connection) =>
        connection.from === selectedId && connection.to === destination.id
    );

    if (alreadyExists) {
      setNotice("Those nodes are already connected.");
      return;
    }

    setConnections((previous) => [
      ...previous,
      {
        id: `connection-${Date.now()}`,
        from: selectedId,
        to: destination.id,
      },
    ]);
    setNotice(`Connected the selected node to "${destination.title}".`);
  }

  function removeConnection(id: string) {
    setConnections((previous) =>
      previous.filter((connection) => connection.id !== id)
    );
    setNotice("Connection removed.");
  }

  function resetWorkflow() {
    if (!window.confirm("Reset the editor to the original example workflow?")) {
      return;
    }

    setNodes(initialNodes.map((node) => ({ ...node })));
    setConnections(initialConnections.map((connection) => ({ ...connection })));
    setSelectedId("check");
    setZoom(1);
    setNotice("Original example workflow restored.");
    setSavedAt("");
  }

  function saveWorkflow() {
    try {
      const data = JSON.stringify(
        { nodes, connections, updatedAt: new Date().toISOString() },
        null,
        2
      );

      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "enterprisehub-workflow.json";
      link.click();
      URL.revokeObjectURL(url);

      setSavedAt(new Date().toLocaleTimeString());
      setNotice("Workflow exported as a JSON file.");
    } catch {
      setNotice("Could not export the workflow. Please try again.");
    }
  }

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Workflow className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold tracking-tight">EnterpriseHub</p>
            <p className="text-xs text-slate-500">Visual workflow editor</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Back to VDR
          </a>
          <button
            onClick={saveWorkflow}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Save className="h-4 w-4" />
            Export workflow
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1800px] p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-indigo-600">
              <GitBranch className="h-4 w-4" />
              Enterprise workspace / Workflow design
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Visual Tree Editor
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Create, edit, and connect workflow nodes for your document review
              and compliance processes.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
            <LayoutGrid className="h-4 w-4" />
            {nodes.length} nodes
            <span className="text-slate-300">|</span>
            {connections.length} connections
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <CircleHelp className="h-4 w-4 shrink-0" />
          This is an editable frontend demo. Changes stay in page memory until
          exported; workflow execution and shared storage are not connected.
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Workflow canvas</p>
                <p className="mt-1 text-xs text-slate-500">
                  Select a node to edit it in the properties panel.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom((value) => Math.max(0.65, value - 0.1))}
                  aria-label="Zoom out"
                  className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-12 text-center text-xs text-slate-500">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((value) => Math.min(1.3, value + 0.1))}
                  aria-label="Zoom in"
                  className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="overflow-auto bg-slate-50">
              <div
                className="relative min-h-[740px] min-w-[920px] origin-top-left transition-transform"
                style={{
                  width: 920,
                  height: 740,
                  transform: `scale(${zoom})`,
                  marginBottom: `${740 * (zoom - 1)}px`,
                  marginRight: `${920 * (zoom - 1)}px`,
                  backgroundImage:
                    "radial-gradient(#cbd5e1 0.8px, transparent 0.8px)",
                  backgroundSize: "20px 20px",
                }}
              >
                <svg
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  viewBox="0 0 920 740"
                  aria-label="Workflow connections"
                >
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="8"
                      markerHeight="8"
                      refX="6"
                      refY="3"
                      orient="auto"
                    >
                      <path d="M0,0 L0,6 L6,3 z" fill="#94a3b8" />
                    </marker>
                  </defs>

                  {connections.map((connection) => {
                    const from = nodeMap.get(connection.from);
                    const to = nodeMap.get(connection.to);
                    if (!from || !to) return null;

                    const x1 = from.x + 100;
                    const y1 = from.y + 76;
                    const x2 = to.x + 100;
                    const y2 = to.y;

                    const middleY = (y1 + y2) / 2;
                    const path = `M ${x1} ${y1} C ${x1} ${middleY}, ${x2} ${middleY}, ${x2} ${y2}`;

                    return (
                      <g key={connection.id}>
                        <path
                          d={path}
                          fill="none"
                          stroke="#94a3b8"
                          strokeWidth="2"
                          markerEnd="url(#arrowhead)"
                        />
                      </g>
                    );
                  })}
                </svg>

                {nodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => setSelectedId(node.id)}
                    style={{ left: node.x, top: node.y }}
                    className={`absolute w-[200px] rounded-xl border-2 p-3 text-left shadow-sm transition hover:shadow-md ${
                      kindStyles[node.kind]
                    } ${
                      selectedId === node.id
                        ? "z-10 ring-2 ring-indigo-500 ring-offset-2"
                        : ""
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        {kindLabels[node.kind]} node
                      </span>
                      {selectedId === node.id && (
                        <Check className="h-4 w-4 text-indigo-600" />
                      )}
                    </span>
                    <span className="mt-2 block text-sm font-semibold text-slate-900">
                      {node.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      {node.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-500">{notice}</p>
              <button
                onClick={resetWorkflow}
                className="rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Reset example
              </button>
            </div>
          </section>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <SettingsIcon />
              <h2 className="font-semibold">Node properties</h2>
            </div>

            {selectedNode ? (
              <div className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="node-title"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Node title
                  </label>
                  <input
                    id="node-title"
                    value={selectedNode.title}
                    onChange={(event) =>
                      updateSelected("title", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="node-description"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Description
                  </label>
                  <textarea
                    id="node-description"
                    rows={3}
                    value={selectedNode.description}
                    onChange={(event) =>
                      updateSelected("description", event.target.value)
                    }
                    className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="node-kind"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Node type
                  </label>
                  <select
                    id="node-kind"
                    value={selectedNode.kind}
                    onChange={(event) =>
                      updateSelected("kind", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="start">Start</option>
                    <option value="process">Process</option>
                    <option value="decision">Decision</option>
                    <option value="end">End</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={connectSelected}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 px-3 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                  >
                    <ArrowRight className="h-4 w-4" />
                    Connect
                  </button>
                  <button
                    onClick={deleteSelected}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-3 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <p className="text-sm font-semibold">Connections</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Connections attached to this node.
                  </p>

                  <div className="mt-3 space-y-2">
                    {connections
                      .filter(
                        (connection) =>
                          connection.from === selectedNode.id ||
                          connection.to === selectedNode.id
                      )
                      .map((connection) => {
                        const outgoing = connection.from === selectedNode.id;
                        const otherId = outgoing
                          ? connection.to
                          : connection.from;
                        const otherNode = nodeMap.get(otherId);

                        return (
                          <div
                            key={connection.id}
                            className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2.5"
                          >
                            <div className="min-w-0">
                              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                {outgoing ? "Leads to" : "Comes from"}
                              </p>
                              <p className="mt-1 truncate text-xs font-medium">
                                {otherNode?.title ?? "Missing node"}
                              </p>
                            </div>
                            <button
                              onClick={() => removeConnection(connection.id)}
                              aria-label="Remove connection"
                              className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}

                    {!connections.some(
                      (connection) =>
                        connection.from === selectedNode.id ||
                        connection.to === selectedNode.id
                    ) && (
                      <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                        No connections yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                Select a node on the canvas to edit its properties.
              </p>
            )}

            <div className="mt-6 border-t border-slate-200 pt-5">
              <h3 className="text-sm font-semibold">Add node</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Choose a type, then add it to the canvas.
              </p>

              <label htmlFor="new-node-kind" className="sr-only">
                New node type
              </label>
              <select
                id="new-node-kind"
                value={nextKind}
                onChange={(event) =>
                  setNextKind(event.target.value as NodeKind)
                }
                className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="process">Process</option>
                <option value="decision">Decision</option>
                <option value="start">Start</option>
                <option value="end">End</option>
              </select>

              <button
                onClick={addNode}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Add node
              </button>
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
              <ArrowDown className="mr-1 inline h-3.5 w-3.5" />
              Tip: select a node, choose Connect, and enter the exact title of
              another node to create a directed connection.
            </div>
          </aside>
        </div>

        {savedAt && (
          <p className="mt-4 text-right text-xs text-slate-400">
            Last exported at {savedAt}
          </p>
        )}
      </div>
    </main>
  );
}

function SettingsIcon() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
      <GitBranch className="h-4 w-4" />
    </span>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Download,
  GitBranch,
  LayoutGrid,
  Minus,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
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

type WorkflowFile = {
  nodes: TreeNode[];
  connections: Connection[];
};

const initialNodes: TreeNode[] = [
  {
    id: "start",
    title: "Start",
    description: "Workflow entry point.",
    kind: "start",
    x: 320,
    y: 45,
  },
  {
    id: "classify",
    title: "Classify Request",
    description: "Identify the request type and priority.",
    kind: "process",
    x: 320,
    y: 175,
  },
  {
    id: "check",
    title: "Check Requirements",
    description: "Check whether all required information is available.",
    kind: "decision",
    x: 320,
    y: 305,
  },
  {
    id: "approve",
    title: "Approve Request",
    description: "Approve the request when requirements are satisfied.",
    kind: "process",
    x: 600,
    y: 455,
  },
  {
    id: "resolve",
    title: "Request More Information",
    description: "Ask for missing information before proceeding.",
    kind: "process",
    x: 40,
    y: 455,
  },
  {
    id: "end",
    title: "End",
    description: "Workflow completed.",
    kind: "end",
    x: 320,
    y: 590,
  },
];

const initialConnections: Connection[] = [
  { id: "edge-1", from: "start", to: "classify" },
  { id: "edge-2", from: "classify", to: "check" },
  { id: "edge-3", from: "check", to: "approve" },
  { id: "edge-4", from: "check", to: "resolve" },
  { id: "edge-5", from: "approve", to: "end" },
  { id: "edge-6", from: "resolve", to: "end" },
];

const kindLabels: Record<NodeKind, string> = {
  start: "Start",
  process: "Process",
  decision: "Decision",
  end: "End",
};

const kindStyles: Record<NodeKind, string> = {
  start: "border-emerald-300 bg-emerald-50 text-emerald-900",
  process: "border-blue-300 bg-blue-50 text-blue-900",
  decision: "border-amber-300 bg-amber-50 text-amber-900",
  end: "border-rose-300 bg-rose-50 text-rose-900",
};

const kindDotStyles: Record<NodeKind, string> = {
  start: "bg-emerald-500",
  process: "bg-blue-500",
  decision: "bg-amber-500",
  end: "bg-rose-500",
};

const CANVAS_WIDTH = 920;
const CANVAS_HEIGHT = 740;
const NODE_WIDTH = 220;
const NODE_HEIGHT = 90;

function makeId(prefix = "node") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getNodeCenter(node: TreeNode) {
  return {
    x: node.x + NODE_WIDTH / 2,
    y: node.y + NODE_HEIGHT / 2,
  };
}

function getConnectionPath(from: TreeNode, to: TreeNode) {
  const start = getNodeCenter(from);
  const end = getNodeCenter(to);

  const startY = start.y + NODE_HEIGHT / 2;
  const endY = end.y - NODE_HEIGHT / 2;

  if (Math.abs(start.x - end.x) < 10 && end.y > start.y) {
    return `M ${start.x} ${startY} L ${end.x} ${endY}`;
  }

  const middleY = (startY + endY) / 2;

  return `M ${start.x} ${startY} C ${start.x} ${middleY}, ${end.x} ${middleY}, ${end.x} ${endY}`;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [validationMessages, setValidationMessages] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const importInputRef = useRef<HTMLInputElement>(null);

  const selectedNode = nodes.find((node) => node.id === selectedId) ?? null;

  const nodeMap = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes]
  );

  const filteredNodes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return nodes;

    return nodes.filter((node) =>
      [node.title, node.description, node.kind].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [nodes, searchQuery]);

  const filteredNodeIds = useMemo(
    () => new Set(filteredNodes.map((node) => node.id)),
    [filteredNodes]
  );

  function clearValidation() {
    setValidationMessages([]);
  }

  function updateSelected<K extends keyof TreeNode>(
    key: K,
    value: TreeNode[K]
  ) {
    if (!selectedId) return;

    setNodes((previous) =>
      previous.map((node) =>
        node.id === selectedId ? { ...node, [key]: value } : node
      )
    );

    clearValidation();
    setSavedAt("");
  }

  function addNode() {
    const id = makeId();

    const newNode: TreeNode = {
      id,
      title: `New ${kindLabels[nextKind]} Node`,
      description: "Describe what this workflow step does.",
      kind: nextKind,
      x: Math.min(80 + (nodes.length % 3) * 265, 680),
      y: Math.min(70 + Math.floor(nodes.length / 3) * 135, 620),
    };

    setNodes((previous) => [...previous, newNode]);
    setSelectedId(id);
    setNotice("Node added.");
    clearValidation();
    setSavedAt("");
  }

  function deleteSelected() {
    if (!selectedNode) {
      setNotice("Select a node to delete.");
      return;
    }

    if (!window.confirm(`Delete "${selectedNode.title}"?`)) return;

    const deletedId = selectedNode.id;

    setNodes((previous) =>
      previous.filter((node) => node.id !== deletedId)
    );

    setConnections((previous) =>
      previous.filter(
        (connection) =>
          connection.from !== deletedId && connection.to !== deletedId
      )
    );

    setSelectedId(null);
    setNotice("Node and its connections deleted.");
    clearValidation();
    setSavedAt("");
  }

  function duplicateSelected() {
    if (!selectedNode) {
      setNotice("Select a node to duplicate.");
      return;
    }

    const id = makeId();

    const duplicate: TreeNode = {
      ...selectedNode,
      id,
      title: `${selectedNode.title} (Copy)`,
      x: Math.min(selectedNode.x + 35, CANVAS_WIDTH - NODE_WIDTH - 10),
      y: Math.min(selectedNode.y + 35, CANVAS_HEIGHT - NODE_HEIGHT - 10),
    };

    setNodes((previous) => [...previous, duplicate]);
    setSelectedId(id);
    setNotice(`Duplicated "${selectedNode.title}".`);
    clearValidation();
    setSavedAt("");
  }

  function connectSelected() {
    if (!selectedNode) {
      setNotice("Select a node first.");
      return;
    }

    const candidates = nodes.filter((node) => node.id !== selectedNode.id);

    if (candidates.length === 0) {
      setNotice("Add another node before creating a connection.");
      return;
    }

    const targetTitle = window.prompt(
      `Connect "${selectedNode.title}" to which node?\n\nEnter an exact node title:\n${candidates
        .map((node) => `• ${node.title}`)
        .join("\n")}`
    );

    if (!targetTitle) return;

    const target = candidates.find(
      (node) => node.title.toLowerCase() === targetTitle.trim().toLowerCase()
    );

    if (!target) {
      setNotice("No node found with that exact title.");
      return;
    }

    const alreadyExists = connections.some(
      (connection) =>
        connection.from === selectedNode.id && connection.to === target.id
    );

    if (alreadyExists) {
      setNotice("That connection already exists.");
      return;
    }

    const connection: Connection = {
      id: makeId("edge"),
      from: selectedNode.id,
      to: target.id,
    };

    setConnections((previous) => [...previous, connection]);
    setNotice(`Connected "${selectedNode.title}" to "${target.title}".`);
    clearValidation();
    setSavedAt("");
  }

  function removeConnection(id: string) {
    setConnections((previous) =>
      previous.filter((connection) => connection.id !== id)
    );

    setNotice("Connection removed.");
    clearValidation();
    setSavedAt("");
  }

  function autoLayout() {
    const columns = 3;
    const columnWidth = 280;
    const rowHeight = 145;

    setNodes((previous) =>
      previous.map((node, index) => ({
        ...node,
        x: 25 + (index % columns) * columnWidth,
        y: 25 + Math.floor(index / columns) * rowHeight,
      }))
    );

    setNotice("Nodes arranged automatically.");
    setSavedAt("");
  }

  function validateWorkflow() {
    const messages: string[] = [];
    const nodeIds = new Set(nodes.map((node) => node.id));

    if (nodes.length === 0) {
      messages.push("The workflow contains no nodes.");
    }

    const starts = nodes.filter((node) => node.kind === "start");
    const ends = nodes.filter((node) => node.kind === "end");

    if (starts.length !== 1) {
      messages.push(
        `Expected exactly one Start node; found ${starts.length}.`
      );
    }

    if (ends.length !== 1) {
      messages.push(`Expected exactly one End node; found ${ends.length}.`);
    }

    const validConnections = connections.filter(
      (connection) =>
        nodeIds.has(connection.from) && nodeIds.has(connection.to)
    );

    if (validConnections.length !== connections.length) {
      messages.push("Some connections refer to missing nodes.");
    }

    for (const node of nodes) {
      const incoming = validConnections.filter(
        (connection) => connection.to === node.id
      ).length;

      const outgoing = validConnections.filter(
        (connection) => connection.from === node.id
      ).length;

      if (node.kind !== "start" && incoming === 0) {
        messages.push(`"${node.title}" has no incoming connection.`);
      }

      if (node.kind !== "end" && outgoing === 0) {
        messages.push(`"${node.title}" has no outgoing connection.`);
      }
    }

    if (starts.length === 1) {
      const visited = new Set<string>();
      const stack = [starts[0].id];

      while (stack.length > 0) {
        const current = stack.pop()!;

        if (visited.has(current)) continue;

        visited.add(current);

        for (const connection of validConnections) {
          if (connection.from === current && !visited.has(connection.to)) {
            stack.push(connection.to);
          }
        }
      }

      const unreachable = nodes.filter((node) => !visited.has(node.id));

      if (unreachable.length > 0) {
        messages.push(
          `Unreachable from Start: ${unreachable
            .map((node) => node.title)
            .join(", ")}.`
        );
      }
    }

    const visited = new Set<string>();
    const active = new Set<string>();
    let hasCycle = false;

    function visit(id: string) {
      if (active.has(id)) {
        hasCycle = true;
        return;
      }

      if (visited.has(id)) return;

      active.add(id);

      for (const connection of validConnections) {
        if (connection.from === id) {
          visit(connection.to);
        }
      }

      active.delete(id);
      visited.add(id);
    }

    for (const node of nodes) {
      visit(node.id);
    }

    if (hasCycle) {
      messages.push("A cycle was detected in the workflow.");
    }

    setValidationMessages(messages);

    setNotice(
      messages.length === 0
        ? "Validation passed. No workflow issues found."
        : `Validation found ${messages.length} issue(s).`
    );
  }

  function buildWorkflowFile(): WorkflowFile {
    return { nodes, connections };
  }

  function exportWorkflow() {
    try {
      const content = JSON.stringify(buildWorkflowFile(), null, 2);
      const blob = new Blob([content], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "workflow.json";
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      const timestamp = new Date().toLocaleString();
      setSavedAt(timestamp);
      setNotice("Workflow JSON exported successfully.");
    } catch {
      setNotice("Could not export the workflow.");
    }
  }

  async function importWorkflow(file: File) {
    setIsImporting(true);

    try {
      const text = await file.text();
      const data: unknown = JSON.parse(text);

      if (
        typeof data !== "object" ||
        data === null ||
        !("nodes" in data) ||
        !("connections" in data) ||
        !Array.isArray(data.nodes) ||
        !Array.isArray(data.connections)
      ) {
        throw new Error("The JSON file must contain nodes and connections.");
      }

      const importedNodes = data.nodes as TreeNode[];
      const importedConnections = data.connections as Connection[];

      const validKinds: NodeKind[] = [
        "start",
        "process",
        "decision",
        "end",
      ];

      const nodesAreValid = importedNodes.every(
        (node) =>
          node &&
          typeof node.id === "string" &&
          typeof node.title === "string" &&
          typeof node.description === "string" &&
          validKinds.includes(node.kind) &&
          Number.isFinite(node.x) &&
          Number.isFinite(node.y)
      );

      const connectionsAreValid = importedConnections.every(
        (connection) =>
          connection &&
          typeof connection.id === "string" &&
          typeof connection.from === "string" &&
          typeof connection.to === "string"
      );

      if (!nodesAreValid || !connectionsAreValid) {
        throw new Error("The file contains invalid node or connection data.");
      }

      const nodeIdSet = new Set(importedNodes.map((node) => node.id));
      const connectionIdSet = new Set(
        importedConnections.map((connection) => connection.id)
      );

      if (nodeIdSet.size !== importedNodes.length) {
        throw new Error("Every node must have a unique ID.");
      }

      if (connectionIdSet.size !== importedConnections.length) {
        throw new Error("Every connection must have a unique ID.");
      }

      if (
        importedConnections.some(
          (connection) =>
            !nodeIdSet.has(connection.from) ||
            !nodeIdSet.has(connection.to)
        )
      ) {
        throw new Error(
          "Connections must reference nodes that exist in the file."
        );
      }

      setNodes(importedNodes);
      setConnections(importedConnections);
      setSelectedId(importedNodes[0]?.id ?? null);
      setValidationMessages([]);
      setSavedAt("");
      setNotice("Workflow imported successfully.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `Import failed: ${error.message}`
          : "Import failed. Please check the JSON file."
      );
    } finally {
      setIsImporting(false);

      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
  }

  function resetWorkflow() {
    const confirmed = window.confirm(
      "Reset the editor to the example workflow? Your current unsaved changes will be lost."
    );

    if (!confirmed) return;

    setNodes(initialNodes.map((node) => ({ ...node })));
    setConnections(initialConnections.map((connection) => ({ ...connection })));
    setSelectedId("check");
    setZoom(1);
    setSearchQuery("");
    setValidationMessages([]);
    setSavedAt("");
    setNotice("Example workflow restored.");
  }

  function zoomIn() {
    setZoom((current) => Math.min(1.5, Number((current + 0.1).toFixed(2))));
  }

  function zoomOut() {
    setZoom((current) => Math.max(0.5, Number((current - 0.1).toFixed(2))));
  }

  function zoomReset() {
    setZoom(1);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Page header */}
        <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-indigo-600 p-3 text-white shadow-sm">
              <Workflow className="h-7 w-7" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Workflow Tree Editor
                </h1>

                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                  FE-4
                </span>
              </div>

              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Build, connect, validate, and export workflow diagrams.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={validateWorkflow}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              <ShieldCheck className="h-4 w-4" />
              Validate
            </button>

            <button
              type="button"
              onClick={exportWorkflow}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
          </div>
        </header>

        {/* Status message */}
        <div
          role="status"
          aria-live="polite"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
        >
          <div className="flex items-center gap-2 text-slate-600">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{notice}</span>
          </div>

          {savedAt && (
            <span className="text-xs text-slate-400">
              Last exported: {savedAt}
            </span>
          )}
        </div>

        {/* Summary cards */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            label="Total Nodes"
            value={nodes.length}
            icon={<LayoutGrid className="h-5 w-5" />}
          />

          <SummaryCard
            label="Connections"
            value={connections.length}
            icon={<GitBranch className="h-5 w-5" />}
          />

          <SummaryCard
            label="Decisions"
            value={nodes.filter((node) => node.kind === "decision").length}
            icon={<Workflow className="h-5 w-5" />}
          />

          <SummaryCard
            label="Validation Issues"
            value={validationMessages.length}
            icon={
              validationMessages.length > 0 ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )
            }
            danger={validationMessages.length > 0}
          />
        </section>

        {/* Main workspace */}
        <section className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
          {/* Canvas panel */}
          <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Workflow Canvas
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Select a node to edit its details.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={autoLayout}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Auto layout
                </button>

                <div className="flex items-center rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={zoomOut}
                    aria-label="Zoom out"
                    className="rounded-l-lg p-2 text-slate-600 hover:bg-slate-100"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={zoomReset}
                    className="min-w-16 px-2 text-xs font-semibold text-slate-600"
                    title="Reset zoom"
                  >
                    {Math.round(zoom * 100)}%
                  </button>

                  <button
                    type="button"
                    onClick={zoomIn}
                    aria-label="Zoom in"
                    className="rounded-r-lg p-2 text-slate-600 hover:bg-slate-100"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-auto bg-slate-50">
              <div
                className="relative m-4 origin-top-left rounded-xl border border-slate-200 bg-white"
                style={{
                  width: CANVAS_WIDTH * zoom,
                  height: CANVAS_HEIGHT * zoom,
                  backgroundImage:
                    "radial-gradient(#cbd5e1 0.8px, transparent 0.8px)",
                  backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                }}
              >
                <div
                  className="absolute left-0 top-0 origin-top-left"
                  style={{
                    width: CANVAS_WIDTH,
                    height: CANVAS_HEIGHT,
                    transform: `scale(${zoom})`,
                  }}
                >
                  {/* Connections */}
                  <svg
                    className="pointer-events-none absolute inset-0"
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
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
                        <path
                          d="M0,0 L0,6 L6,3 z"
                          fill="#94a3b8"
                        />
                      </marker>
                    </defs>

                    {connections.map((connection) => {
                      const from = nodeMap.get(connection.from);
                      const to = nodeMap.get(connection.to);

                      if (!from || !to) return null;

                      return (
                        <path
                          key={connection.id}
                          d={getConnectionPath(from, to)}
                          fill="none"
                          stroke="#94a3b8"
                          strokeWidth="2"
                          markerEnd="url(#arrowhead)"
                        />
                      );
                    })}
                  </svg>

                  {/* Nodes */}
                  {nodes.map((node) => {
                    const selected = selectedId === node.id;
                    const isVisible = filteredNodeIds.has(node.id);

                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => setSelectedId(node.id)}
                        aria-pressed={selected}
                        aria-label={`Select ${node.title}`}
                        className={`absolute flex flex-col justify-center rounded-xl border-2 px-4 py-3 text-left shadow-sm transition ${
                          kindStyles[node.kind]
                        } ${
                          selected
                            ? "z-10 border-indigo-600 ring-4 ring-indigo-100"
                            : "hover:-translate-y-0.5 hover:shadow-md"
                        } ${
                          !isVisible
                            ? "pointer-events-none opacity-20"
                            : "opacity-100"
                        }`}
                        style={{
                          left: node.x,
                          top: node.y,
                          width: NODE_WIDTH,
                          height: NODE_HEIGHT,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 shrink-0 rounded-full ${kindDotStyles[node.kind]}`}
                          />

                          <span className="truncate text-sm font-bold">
                            {node.title}
                          </span>
                        </div>

                        <span className="mt-1 line-clamp-2 text-xs opacity-75">
                          {node.description || "No description provided."}
                        </span>

                        <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider opacity-60">
                          {kindLabels[node.kind]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Canvas footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
              <span>
                {filteredNodes.length} of {nodes.length} nodes visible
              </span>
              <span>Canvas: {CANVAS_WIDTH} × {CANVAS_HEIGHT}</span>
            </div>
          </div>

          {/* Inspector */}
          <aside className="space-y-5">
            {/* Search and node list */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-slate-900">Find Nodes</h2>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                  {nodes.length}
                </span>
              </div>

              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search title, description, type..."
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="mt-3 max-h-48 space-y-1 overflow-y-auto">
                {filteredNodes.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-400">
                    No matching nodes found.
                  </p>
                ) : (
                  filteredNodes.map((node) => (
                    <button
                      type="button"
                      key={node.id}
                      onClick={() => setSelectedId(node.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                        selectedId === node.id
                          ? "bg-indigo-50 text-indigo-900"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${kindDotStyles[node.kind]}`}
                      />

                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {node.title}
                      </span>

                      <span className="text-[10px] uppercase text-slate-400">
                        {node.kind}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Selected node editor */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-slate-900">
                  Node Inspector
                </h2>

                {selectedNode && (
                  <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                    Selected
                  </span>
                )}
              </div>

              {!selectedNode ? (
                <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-center">
                  <Workflow className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    No node selected
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Select a node on the canvas or from the search list.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor="node-title"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Node title
                    </label>

                    <input
                      id="node-title"
                      value={selectedNode.title}
                      onChange={(event) =>
                        updateSelected("title", event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="node-description"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
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
                      placeholder="Describe this workflow step..."
                      className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="node-kind"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Node type
                    </label>

                    <select
                      id="node-kind"
                      value={selectedNode.kind}
                      onChange={(event) =>
                        updateSelected(
                          "kind",
                          event.target.value as NodeKind
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="start">Start</option>
                      <option value="process">Process</option>
                      <option value="decision">Decision</option>
                      <option value="end">End</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="node-x"
                        className="mb-1.5 block text-xs font-medium text-slate-500"
                      >
                        Position X
                      </label>

                      <input
                        id="node-x"
                        type="number"
                        min={0}
                        max={CANVAS_WIDTH - NODE_WIDTH}
                        value={selectedNode.x}
                        onChange={(event) => {
                          const value = Number(event.target.value);

                          if (Number.isFinite(value)) {
                            updateSelected(
                              "x",
                              Math.max(
                                0,
                                Math.min(value, CANVAS_WIDTH - NODE_WIDTH)
                              )
                            );
                          }
                        }}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="node-y"
                        className="mb-1.5 block text-xs font-medium text-slate-500"
                      >
                        Position Y
                      </label>

                      <input
                        id="node-y"
                        type="number"
                        min={0}
                        max={CANVAS_HEIGHT - NODE_HEIGHT}
                        value={selectedNode.y}
                        onChange={(event) => {
                          const value = Number(event.target.value);

                          if (Number.isFinite(value)) {
                            updateSelected(
                              "y",
                              Math.max(
                                0,
                                Math.min(value, CANVAS_HEIGHT - NODE_HEIGHT)
                              )
                            );
                          }
                        }}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={duplicateSelected}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </button>

                    <button
                      type="button"
                      onClick={connectSelected}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 px-3 py-2.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
                    >
                      <GitBranch className="h-4 w-4" />
                      Connect
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={deleteSelected}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-3 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete selected node
                  </button>
                </div>
              )}
            </div>

            {/* Add node */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="font-semibold text-slate-900">Add a Node</h2>

              <p className="mt-1 text-xs text-slate-500">
                Choose a type to create a new workflow node.
              </p>

              <div className="mt-3 flex gap-2">
                <select
                  aria-label="New node type"
                  value={nextKind}
                  onChange={(event) =>
                    setNextKind(event.target.value as NodeKind)
                  }
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="start">Start</option>
                  <option value="process">Process</option>
                  <option value="decision">Decision</option>
                  <option value="end">End</option>
                </select>

                <button
                  type="button"
                  onClick={addNode}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>

            {/* Connections */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-slate-900">Connections</h2>

                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                  {connections.length}
                </span>
              </div>

              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                {connections.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">
                    No connections yet.
                  </p>
                ) : (
                  connections.map((connection) => {
                    const from = nodeMap.get(connection.from);
                    const to = nodeMap.get(connection.to);

                    if (!from || !to) return null;

                    return (
                      <div
                        key={connection.id}
                        className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-slate-700">
                            {from.title}
                          </p>

                          <div className="my-1 flex items-center gap-1 text-slate-400">
                            <span className="text-[10px]">leads to</span>
                            <ArrowDown className="h-3 w-3" />
                          </div>

                          <p className="truncate text-xs font-semibold text-slate-700">
                            {to.title}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeConnection(connection.id)}
                          aria-label={`Remove connection from ${from.title} to ${to.title}`}
                          title="Remove connection"
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Import/export */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="font-semibold text-slate-900">Workflow Data</h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Export your workflow as JSON or import a previously exported
                workflow file.
              </p>

              <input
                ref={importInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                aria-label="Choose workflow JSON file"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    void importWorkflow(file);
                  }
                }}
              />

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={() => importInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {isImporting ? "Importing..." : "Import JSON"}
                </button>

                <button
                  type="button"
                  onClick={exportWorkflow}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>

              <button
                type="button"
                onClick={resetWorkflow}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 px-3 py-2.5 text-sm font-medium text-amber-800 transition hover:bg-amber-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Reset example workflow
              </button>
            </div>

            {/* Validation */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-slate-900">
                  Workflow Validation
                </h2>

                {validationMessages.length === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                )}
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Check Start/End nodes, connections, reachability, and cycles.
              </p>

              <button
                type="button"
                onClick={validateWorkflow}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <ShieldCheck className="h-4 w-4" />
                Run validation
              </button>

              {validationMessages.length === 0 ? (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    {notice.startsWith("Validation passed")
                      ? "No issues found in the latest validation."
                      : "Run validation to check the current workflow."}
                  </p>
                </div>
              ) : (
                <ul className="mt-3 space-y-2">
                  {validationMessages.map((message, index) => (
                    <li
                      key={`${index}-${message}`}
                      className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-900"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </section>

        {/* Footer */}
        <footer className="flex flex-col justify-between gap-2 border-t border-slate-200 pt-4 text-xs text-slate-400 sm:flex-row">
          <span>Workflow Tree Editor · Frontend workspace</span>
          <span>
            Changes stay in the current page until you export the workflow.
          </span>
        </footer>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  danger = false,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-500">{label}</p>

        <span
          className={`rounded-xl p-2 ${
            danger
              ? "bg-amber-50 text-amber-600"
              : "bg-indigo-50 text-indigo-600"
          }`}
        >
          {icon}
        </span>
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}
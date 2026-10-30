"use client";

import { useMemo, useState } from "react";
import {
  ArrowUp,
  Bot,
  CheckCircle2,
  FileText,
  History,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

type Message = {
  id: number;
  role: "assistant" | "user";
  content: string;
  source?: string;
};

const suggestions = [
  {
    title: "Review document compliance",
    prompt: "What should I check before approving a confidential document?",
  },
  {
    title: "Identify financial risks",
    prompt: "What risks should I look for when reviewing a financial report?",
  },
  {
    title: "Prepare an audit checklist",
    prompt: "Create a checklist for a document compliance audit.",
  },
  {
    title: "Explain access controls",
    prompt: "Explain the importance of role-based access control.",
  },
];

function createDemoResponse(question: string) {
  const q = question.toLowerCase();

  if (q.includes("financial") || q.includes("risk")) {
    return {
      content:
        "Here is a preliminary financial-risk review checklist:\n\n1. Verify reported figures against the approved financial statements.\n2. Check whether assumptions and projections are clearly identified.\n3. Review unusual changes in revenue, expenses, and liabilities.\n4. Confirm that supporting evidence is available.\n5. Record unresolved issues and assign an authorized reviewer.\n\nThis is a general demonstration response, not an analysis of your actual uploaded documents.",
      source: "General compliance guidance",
    };
  }

  if (q.includes("audit") || q.includes("checklist")) {
    return {
      content:
        "Suggested document audit checklist:\n\n1. Confirm document ownership and classification.\n2. Verify that access is limited to authorized roles.\n3. Check document version, approval status, and review date.\n4. Confirm that required supporting records are present.\n5. Record findings, exceptions, and follow-up actions.\n6. Document the reviewer and final approval decision.\n\nAdapt this checklist to your organization's policies.",
      source: "General audit checklist",
    };
  }

  if (q.includes("access") || q.includes("permission") || q.includes("role")) {
    return {
      content:
        "Role-based access control (RBAC) assigns permissions according to a person's job responsibilities.\n\n• Admin: manages approved system and user settings.\n• Compliance Officer: reviews compliance materials and findings.\n• Advisor: accesses information needed for assigned work.\n• Auditor: reviews evidence and audit records.\n\nApply least-privilege access, review permissions regularly, and record important access changes. These are example role descriptions, not enforced server-side permissions.",
      source: "General access-control guidance",
    };
  }

  return {
    content:
      "Here is a general compliance review approach:\n\n1. Identify the applicable policy or requirement.\n2. Confirm the document's classification and owner.\n3. Check whether the evidence supports the relevant claims.\n4. Record missing information, inconsistencies, and potential risks.\n5. Refer unresolved issues to an authorized reviewer.\n6. Document the decision and follow-up actions.\n\nDemo limitation: this assistant is not connected to an AI model or your uploaded document contents yet. It cannot verify actual compliance or provide document-specific findings.",
    source: "General compliance guidance",
  };
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const filteredMessages = useMemo(
    () =>
      messages.filter((message) =>
        message.content.toLowerCase().includes(search.toLowerCase())
      ),
    [messages, search]
  );

  function sendMessage(text = input) {
    const question = text.trim();
    if (!question || sending) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: question,
    };

    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setSending(true);

    window.setTimeout(() => {
      const response = createDemoResponse(question);

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: response.content,
          source: response.source,
        },
      ]);

      setSending(false);
    }, 500);
  }

  function startNewChat() {
    setMessages([]);
    setInput("");
    setSearch("");
    setHistoryOpen(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold tracking-tight">EnterpriseHub</p>
            <p className="text-xs text-slate-500">Compliance workspace</p>
          </div>
        </div>

        <a
          href="/"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Back to VDR
        </a>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1600px] md:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden border-r border-slate-200 bg-white p-5 md:block">
          <button
            onClick={startNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            New conversation
          </button>

          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Workspace
            </p>
            <a
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              <FileText className="h-4 w-4" />
              Virtual Data Room
            </a>
            <div className="mt-1 flex items-center gap-3 rounded-lg bg-indigo-50 px-3 py-2.5 text-sm font-medium text-indigo-700">
              <Bot className="h-4 w-4" />
              Compliance AI
            </div>
          </div>

          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Conversation
            </p>
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50"
            >
              <History className="h-4 w-4" />
              Current session
            </button>

            {historyOpen && (
              <div className="mt-2 rounded-lg border border-slate-200 p-3 text-xs text-slate-500">
                {messages.length
                  ? `${messages.length} messages in this session.`
                  : "No messages yet. Start a conversation to see it here."}
              </div>
            )}
          </div>

          <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <ShieldCheck className="h-4 w-4" />
              Demo environment
            </div>
            <p className="mt-2 text-xs leading-5 text-amber-800">
              Responses are generated from built-in examples. No external AI
              service is connected.
            </p>
          </div>
        </aside>

        <section className="flex min-h-[calc(100vh-4rem)] min-w-0 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <h1 className="text-lg font-semibold">Compliance AI Assistant</h1>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Compliance guidance and review workflows
              </p>
            </div>

            <button
              onClick={startNewChat}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              New chat
            </button>
          </div>

          <div className="border-b border-slate-200 bg-white px-5 py-3 sm:px-8">
            <label className="flex max-w-xl items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search messages in this session..."
                className="w-full bg-transparent text-sm outline-none"
                aria-label="Search messages"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              )}
            </label>
          </div>

          <div className="flex-1 px-4 py-8 sm:px-8">
            {messages.length === 0 ? (
              <div className="mx-auto max-w-3xl pt-6 sm:pt-12">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                  <Bot className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
                  How can I help with compliance?
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-slate-500">
                  Ask a question or choose a suggested task to get started.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.title}
                      onClick={() => sendMessage(suggestion.prompt)}
                      className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-300 hover:shadow-sm"
                    >
                      <p className="text-sm font-semibold">
                        {suggestion.title}
                      </p>
                      <p className="mt-2 text-sm leading-5 text-slate-500">
                        {suggestion.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6">
                {filteredMessages.map((message) => (
                  <article
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        message.role === "user"
                          ? "bg-slate-200 text-slate-700"
                          : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {message.role === "user" ? (
                        <UserRound className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>

                    <div
                      className={`min-w-0 max-w-[85%] rounded-2xl p-4 ${
                        message.role === "user"
                          ? "bg-indigo-600 text-white"
                          : "border border-slate-200 bg-white"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-7">
                        {message.content}
                      </p>

                      {message.source && (
                        <div className="mt-4 border-t border-slate-200 pt-3">
                          <p className="flex items-center gap-2 text-xs text-slate-500">
                            <FileText className="h-3.5 w-3.5" />
                            Reference: {message.source}
                          </p>
                        </div>
                      )}
                    </div>
                  </article>
                ))}

                {filteredMessages.length === 0 && (
                  <p className="text-center text-sm text-slate-500">
                    No messages match your search.
                  </p>
                )}

                {sending && (
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <Bot className="h-5 w-5 text-indigo-600" />
                    Preparing demo response...
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-8">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
              className="mx-auto max-w-3xl"
            >
              <div className="flex items-end gap-3 rounded-2xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-indigo-400">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ask a compliance question..."
                  rows={2}
                  className="max-h-36 min-h-12 flex-1 resize-y bg-transparent px-3 py-2 text-sm outline-none"
                  aria-label="Message the Compliance AI Assistant"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  aria-label="Send message"
                  className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <ArrowUp className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-slate-400">
                <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                Demo responses only. Do not enter sensitive or confidential information.
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

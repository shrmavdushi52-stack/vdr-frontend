"use client";

import { useEffect, useMemo, useState } from "react";
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

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};

const CHAT_STORAGE_KEY = "enterprisehub-ai-conversations";
const ACTIVE_CHAT_KEY = "enterprisehub-active-chat";

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

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      const savedActiveId = localStorage.getItem(ACTIVE_CHAT_KEY);

      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          const valid = parsed.filter(
            (item): item is Conversation =>
              item !== null &&
              typeof item === "object" &&
              typeof item.id === "string" &&
              typeof item.title === "string" &&
              Array.isArray(item.messages) &&
              typeof item.updatedAt === "number"
          );

          setConversations(valid);

          const selected =
            valid.find((chat) => chat.id === savedActiveId) ?? valid[0];

          if (selected) {
            setActiveChatId(selected.id);
            setMessages(selected.messages);
          }
        }
      }
    } catch (error) {
      console.error("Could not restore conversation history.", error);
    } finally {
      setHistoryLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!historyLoaded || !activeChatId) return;

    setConversations((previous) => {
      const existing = previous.find((chat) => chat.id === activeChatId);
      const firstUserMessage = messages.find((message) => message.role === "user");

      const updated: Conversation = {
        id: activeChatId,
        title: firstUserMessage?.content.slice(0, 45) || "New conversation",
        messages,
        updatedAt: Date.now(),
      };

      const next = existing
        ? previous.map((chat) => chat.id === activeChatId ? updated : chat)
        : [updated, ...previous];

      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(next));
        localStorage.setItem(ACTIVE_CHAT_KEY, activeChatId);
      } catch (error) {
        console.error("Could not save conversation history.", error);
      }

      return next;
    });
  }, [messages, activeChatId, historyLoaded]);
  const filteredMessages = useMemo(
    () =>
      messages.filter((message) =>
        message.content.toLowerCase().includes(search.toLowerCase())
      ),
    [messages, search]
  );

  async function sendMessage(text = input) {
    const question = text.trim();

    if (!question || sending) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: question,
    };

    const assistantId = Date.now() + 1;

    setMessages((previous) => [
      ...previous,
      userMessage,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        source: "Gemini AI",
      },
    ]);

    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: question }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "The AI request failed. Please try again.";

        try {
          const errorData = JSON.parse(errorText);
          if (typeof errorData.error === "string") {
            errorMessage = errorData.error;
          }
        } catch {
          // Keep the default error message if the response is not JSON.
        }

        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error("Streaming is not supported by this response.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        answer += decoder.decode(value, { stream: true });

        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantId
              ? { ...message, content: answer }
              : message
          )
        );
      }

      answer += decoder.decode();

      if (!answer.trim()) {
        throw new Error("Gemini returned an empty response. Please try again.");
      }

      setMessages((previous) =>
        previous.map((message) =>
          message.id === assistantId
            ? { ...message, content: answer.trim() }
            : message
        )
      );
    } catch (error) {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content:
                  error instanceof Error
                    ? `Unable to get an AI response: ${error.message}`
                    : "Unable to get an AI response. Please try again.",
                source: "Connection error",
              }
            : message
        )
      );
    } finally {
      setSending(false);
    }
  }

  function startNewChat() {
    const id = crypto.randomUUID();
    setActiveChatId(id);
    setMessages([]);
    setInput("");
    setSearch("");
    setHistoryOpen(false);
  }

  function openConversation(conversation: Conversation) {
    setActiveChatId(conversation.id);
    setMessages(conversation.messages);
    setInput("");
    setSearch("");
  }

  function deleteConversation(id: string) {
    const remaining = conversations.filter((chat) => chat.id !== id);

    setConversations(remaining);

    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(remaining));
    } catch (error) {
      console.error("Could not update saved conversations.", error);
    }

    if (activeChatId === id) {
      if (remaining.length > 0) {
        openConversation(remaining[0]);
      } else {
        startNewChat();
      }
    }
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
        <aside className="border-r border-slate-200 bg-white p-5">
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
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Conversation history
              </p>
              <span className="text-xs text-slate-400">{conversations.length}</span>
            </div>

            <div className="max-h-[60vh] space-y-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="rounded-lg px-3 py-2 text-xs leading-5 text-slate-500">
                  Your saved conversations will appear here.
                </p>
              ) : (
                conversations
                  .slice()
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                  .map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`group flex items-start gap-1 rounded-lg ${
                        activeChatId === conversation.id
                          ? "bg-indigo-50"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <button
                        onClick={() => openConversation(conversation)}
                        className={`min-w-0 flex-1 px-3 py-2.5 text-left text-xs ${
                          activeChatId === conversation.id
                            ? "font-semibold text-indigo-700"
                            : "text-slate-600"
                        }`}
                        title={conversation.title}
                      >
                        <span className="block truncate">{conversation.title}</span>
                        <span className="mt-1 block text-[10px] text-slate-400">
                          {conversation.messages.length} messages
                        </span>
                      </button>
                      <button
                        onClick={() => deleteConversation(conversation.id)}
                        className="mr-1 mt-2 rounded p-1 text-slate-400 hover:bg-white hover:text-red-600"
                        aria-label={`Delete ${conversation.title}`}
                        title="Delete conversation"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>

          <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <ShieldCheck className="h-4 w-4" />
              AI-powered workspace
            </div>
            <p className="mt-2 text-xs leading-5 text-amber-800">
              Ask questions and receive responses from Gemini AI.
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
                    Waiting for Gemini AI...
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
                Powered by Gemini AI. Avoid sending confidential information unless authorized.
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}






"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

type ToastMessage = {
  id: number;
  type: ToastType;
  title: string;
  message: string;
};

type ToastContextType = {
  toast: (
    message: string,
    type?: ToastType,
    title?: string
  ) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

const styles: Record<
  ToastType,
  { icon: typeof CheckCircle2; iconClass: string; borderClass: string }
> = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-600 bg-emerald-50",
    borderClass: "border-l-emerald-500",
  },
  error: {
    icon: XCircle,
    iconClass: "text-rose-600 bg-rose-50",
    borderClass: "border-l-rose-500",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-600 bg-amber-50",
    borderClass: "border-l-amber-500",
  },
  info: {
    icon: Info,
    iconClass: "text-[#405747] bg-[#edf0e9]",
    borderClass: "border-l-blue-500",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (
      message: string,
      type: ToastType = "success",
      title?: string
    ) => {
      const id = Date.now() + Math.random();

      setItems((current) => [
        ...current.slice(-3),
        {
          id,
          type,
          title:
            title ??
            ({
              success: "Completed successfully",
              error: "Something went wrong",
              warning: "Please note",
              info: "Information",
            }[type]),
          message,
        },
      ]);

      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      <div
        aria-label="Notifications"
        aria-live="polite"
        className="fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6"
      >
        {items.map((item) => {
          const style = styles[item.type];
          const Icon = style.icon;

          return (
            <div
              key={item.id}
              role={item.type === "error" ? "alert" : "status"}
              className={`flex items-start gap-3 rounded-2xl border border-slate-200 border-l-4 ${style.borderClass} bg-white p-4 shadow-xl shadow-slate-900/10`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.iconClass}`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-slate-900">
                  {item.title}
                </p>
                <p className="mt-1 text-sm leading-5 text-slate-600">
                  {item.message}
                </p>
              </div>

              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(item.id)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}

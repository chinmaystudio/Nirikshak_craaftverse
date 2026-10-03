import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/common/Icon";
import { useAppState, appStore } from "@/app/providers/store";
import { initialChatMessage, respond } from "@/services/assistant/assistantService";
import { ROUTES } from "@/constants/routes";
import type { ChatMessage } from "@/types/api";
import { navigate } from "@/app/router";

export function useAssistantChat(): {
  messages: ChatMessage[];
  send: (text: string) => void;
  thinking: boolean;
} {
  const stored = useAppState((s) => s.chat);
  const [thinking, setThinking] = useState(false);
  const messages: ChatMessage[] = stored.length > 0 ? stored : [initialChatMessage()];

  const send = useCallbackRef((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const history = appStore.getState().chat;
    const withUser: ChatMessage[] = [...history, { role: "user", text: trimmed }];
    appStore.setState({ chat: withUser });
    setThinking(true);
    void respond(trimmed, null).then((reply) => {
      const current = appStore.getState().chat;
      appStore.setState({ chat: [...current, { role: "assistant", text: reply.text, actions: reply.actions, chips: reply.chips }] });
      setThinking(false);
    });
  });

  return { messages, send, thinking };
}

function useCallbackRef(fn: (text: string) => void): (text: string) => void {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback((text: string) => ref.current(text), []);
}

interface ChatPanelProps {
  embedded?: boolean;
}

export function ChatPanel({ embedded = false }: ChatPanelProps): JSX.Element {
  const { messages, send, thinking } = useAssistantChat();
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages.length, thinking]);

  const submit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    send(input);
    setInput("");
  };

  const runAction = (a: { route?: string; action?: string }): void => {
    if (a.route) {
      navigate(a.route);
      if (!embedded) window.dispatchEvent(new CustomEvent("nirikshan:close-assistant"));
      return;
    }
    if (a.action === "report-location") {
      appStore.setState({
        locationPrefill: { address: "Kothrud, Paud Road (current location)", ward: "Ward 12 — Kothrud West", gps: "18.5089, 73.8083" }
      });
      navigate(ROUTES.REPORT);
    } else if (a.action === "report-map") {
      navigate(ROUTES.REPORT);
    }
  };

  return (
    <div className={`flex flex-col h-full ${embedded ? "" : "bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-sm overflow-hidden"}`}>
      <div className={embedded ? "flex items-center justify-between border-b border-outline-variant/40 px-4 py-3" : "bg-primary-container text-on-primary px-4 py-3.5"}>
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-full bg-secondary text-on-secondary flex items-center justify-center">
            <Icon name="smart_toy" className="text-[20px]" />
          </span>
          <div>
            <div className={`text-headline-sm font-bold ${embedded ? "text-primary" : "text-surface-container-lowest"}`}>NIRIKSHAK Civic Assistant</div>
            <div className={`text-label-sm ${embedded ? "text-outline" : "text-surface-variant"}`}>Public information • Guided services • Not an official decision</div>
          </div>
        </div>
      </div>
      <div ref={logRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-surface min-h-[300px]">
        {messages.map((m, i) => (
          <MessageView key={i} message={m} onAction={runAction} onChip={(c) => send(c)} />
        ))}
        {thinking ? (
          <div className="flex justify-start">
            <div className="max-w-[92%]">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center">
                  <Icon name="smart_toy" className="text-[14px]" />
                </span>
                <span className="text-label-sm font-label-sm text-outline">NIRIKSHAK Assistant is thinking</span>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                <span className="typing-dot w-2 h-2 rounded-full bg-primary inline-block" />
                <span className="typing-dot w-2 h-2 rounded-full bg-primary inline-block" />
                <span className="typing-dot w-2 h-2 rounded-full bg-primary inline-block" />
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <form
        className="border-t border-outline-variant/40 bg-surface-container-lowest p-3 flex items-center gap-2"
        onSubmit={submit}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Ask the civic assistant"
          autoComplete="off"
          placeholder="Ask about projects, budgets, delays, reporting…"
          className="flex-1 px-3.5 py-2.5 border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary-container focus:border-transparent bg-surface-container-lowest"
        />
        <button
          type="submit"
          className="w-10 h-10 rounded-lg bg-secondary text-on-secondary flex items-center justify-center hover:bg-on-secondary-container transition-colors flex-shrink-0"
          aria-label="Send message"
        >
          <Icon name="send" className="text-[20px]" />
        </button>
      </form>
    </div>
  );
}

function MessageView({ message, onAction, onChip }: { message: ChatMessage; onAction: (a: { route?: string; action?: string }) => void; onChip: (c: string) => void }): JSX.Element {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-primary-container text-on-primary rounded-xl rounded-br-sm px-3.5 py-2.5 text-body-md shadow-sm whitespace-pre-line">{message.text}</div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[92%]">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center">
            <Icon name="smart_toy" className="text-[14px]" />
          </span>
          <span className="text-label-sm font-label-sm text-outline">NIRIKSHAK Assistant</span>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl rounded-bl-sm px-3.5 py-2.5 text-body-md text-on-surface shadow-sm whitespace-pre-line">
          {message.text}
        </div>
        {message.actions && message.actions.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-2.5">
            {message.actions.map((a, i) => (
              <button
                key={i}
                onClick={() => onAction(a)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-on-primary text-label-md font-label-md font-semibold hover:bg-primary-container transition-colors active:scale-95"
              >
                {a.icon ? <Icon name={a.icon} className="text-[16px]" /> : null}
                {a.label}
              </button>
            ))}
          </div>
        ) : null}
        {message.chips && message.chips.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {message.chips.map((c, i) => (
              <button
                key={i}
                onClick={() => onChip(c)}
                className="px-2.5 py-1 rounded-full border border-outline-variant text-label-sm font-label-sm text-primary hover:bg-surface-container-low transition-colors"
              >
                {c}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AssistantFab(): JSX.Element {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const handler = (): void => setOpen(false);
    document.addEventListener("nirikshan:close-assistant", handler);
    return () => document.removeEventListener("nirikshan:close-assistant", handler);
  }, []);

  return (
    <>
      <button
        data-vision-fab
        onClick={() => {
          navigate(ROUTES.VISION);
        }}
        className="fixed right-[4.5rem] bottom-20 lg:bottom-6 lg:right-[4.75rem] z-[65] w-11 h-11 rounded-full bg-primary-container text-on-primary shadow-pop flex items-center justify-center hover:bg-primary active:scale-95 transition-all"
        aria-label="Identify Infrastructure with camera"
      >
        <Icon name="photo_camera" className="text-[22px]" />
      </button>
      <button
        data-assistant-fab
        onClick={() => setOpen((o) => !o)}
        className="fixed right-4 bottom-20 lg:bottom-6 z-[65] w-14 h-14 rounded-full bg-secondary text-on-secondary shadow-pop flex items-center justify-center hover:bg-on-secondary-container active:scale-95 transition-all"
        aria-label="Open NIRIKSHAK AI Assistant"
        aria-expanded={open}
      >
        <Icon name="smart_toy" className="text-[26px]" />
        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-success border-2 border-white" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-[85] lg:left-auto lg:inset-y-0 lg:right-0 lg:w-[420px] lg:p-4" role="dialog" aria-label="NIRIKSHAK AI Assistant">
          <div className="absolute inset-0 bg-primary/50 lg:bg-transparent lg:pointer-events-none" onClick={() => setOpen(false)} />
          <div className="relative lg:absolute lg:inset-y-4 lg:right-4 lg:left-auto inset-y-0 left-0 w-full lg:w-[392px] bg-surface-container-lowest border border-outline-variant shadow-pop lg:rounded-xl overflow-hidden flex flex-col view-enter">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 z-10 text-surface-variant hover:text-primary p-1"
              aria-label="Close assistant"
            >
              <Icon name="close" className="text-[20px]" />
            </button>
            <div className="h-full">
              <ChatPanel />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}


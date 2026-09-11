import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  MessageSquare,
  User,
  ShieldCheck,
  Paperclip,
  CheckCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  doc,
  setDoc,
  increment,
} from "firebase/firestore";
import { addDoc } from "../../lib/firestore-wrappers";
import { db } from "../../firebase";
import { useToast } from "../../contexts/ToastContext";

interface ChatViewProps {
  user: any;
}

export const ChatView: React.FC<ChatViewProps> = ({ user }) => {
  const { addToast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
    }
  };

  useEffect(() => {
    if (!user?.uid) return;

    // Listen to messages in chats/${user.uid}/messages (synchronized with AdminSupportChatView)
    const q = query(
      collection(db, "chats", user.uid, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMessages(list);
        setLoading(false);
        setTimeout(() => scrollToBottom("smooth"), 80);
      },
      (err) => {
        console.warn("Retrying with support_messages fallback:", err);
        // Fallback to support_messages collection
        const qFallback = query(
          collection(db, "support_messages"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "asc")
        );
        onSnapshot(qFallback, (s) => {
          setMessages(s.docs.map((d) => ({ id: d.id, ...d.data() })));
          setLoading(false);
          setTimeout(() => scrollToBottom("smooth"), 80);
        });
      }
    );

    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages.length]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !user?.uid) return;

    const text = inputMessage.trim();
    setInputMessage("");

    try {
      const now = Timestamp.now();
      const userName = user.displayName || user.name || user.email || "Usuário";
      const userRole = user.role || "patient";

      // 1. Add to chats/{user.uid}/messages
      await addDoc(collection(db, "chats", user.uid, "messages"), {
        text,
        senderId: user.uid,
        senderName: userName,
        senderRole: "user",
        createdAt: now,
        read: false,
      });

      // 2. Update room document for Admin badge and notifications
      await setDoc(
        doc(db, "chats", user.uid),
        {
          userId: user.uid,
          userName: userName,
          userEmail: user.email || "",
          userRole: userRole,
          lastMessage: text,
          lastSenderRole: "user",
          unreadCount: increment(1),
          status: "open",
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // 3. Fallback collection
      addDoc(collection(db, "support_messages"), {
        userId: user.uid,
        userName,
        userRole,
        text,
        sender: "user",
        createdAt: new Date().toISOString(),
        status: "sent",
      }).catch(() => {});
    } catch (err) {
      console.error("Error sending message:", err);
      addToast("Erro ao enviar mensagem.", "error");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      <div className="bg-vitta-surface p-4 rounded-3xl border border-vitta-border shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-vitta-accent/10 text-vitta-accent flex items-center justify-center font-bold">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-vitta-text-primary">Chat Direto com Suporte ViTTA</h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Equipe ViTTA Conectada
            </p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 bg-vitta-surface border border-vitta-border rounded-3xl p-6 overflow-y-auto space-y-4 shadow-sm flex flex-col scroll-smooth">
        {loading ? (
          <div className="flex items-center justify-center h-full text-xs text-vitta-text-muted">
            Carregando histórico de mensagens...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2">
            <MessageSquare size={36} className="text-vitta-text-muted opacity-40" />
            <h4 className="font-bold text-sm text-vitta-text-primary">Inicie uma conversa</h4>
            <p className="text-xs text-vitta-text-muted max-w-xs">
              Envie sua mensagem abaixo e nosso time de atendimento responderá em instantes.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderRole === "user" || msg.sender === "user";
            const isSystem = msg.isSystemMessage;

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="px-3 py-1.5 rounded-full bg-vitta-surface-2 border border-vitta-border text-[11px] text-vitta-text-muted font-medium flex items-center gap-1.5 shadow-sm">
                    <Sparkles size={12} className="text-vitta-accent" />
                    <span>{msg.text}</span>
                  </div>
                </div>
              );
            }

            const formattedTime = msg.createdAt?.toDate
              ? msg.createdAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "";

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? "bg-vitta-accent text-white rounded-br-none shadow-md shadow-vitta-accent/20"
                      : "bg-vitta-surface-2 text-vitta-text-primary rounded-bl-none border border-vitta-border"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                      isMe ? "text-white/80" : "text-vitta-text-muted"
                    }`}
                  >
                    <span>{formattedTime}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSendMessage}
        className="bg-vitta-surface p-2 rounded-2xl border border-vitta-border shadow-sm flex items-center gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem para o suporte..."
          className="flex-1 px-4 py-2.5 bg-transparent text-xs text-vitta-text-primary focus:outline-none placeholder:text-vitta-text-muted"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim()}
          className="p-2.5 bg-vitta-accent text-white rounded-xl hover:bg-vitta-accent/90 disabled:opacity-40 transition-all shadow-md shadow-vitta-accent/20 cursor-pointer"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatView;

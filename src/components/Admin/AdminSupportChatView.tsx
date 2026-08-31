import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  orderBy,
  where,
  setDoc,
  Timestamp
} from "firebase/firestore";
import { addDoc, updateDoc } from "../../lib/firestore-wrappers";
import { db } from "../../firebase";
import {
  MessageSquare,
  Send,
  User,
  Search,
  CheckCheck,
  CheckCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ShieldCheck,
  XCircle,
  RefreshCw,
  FileText
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { handleFirestoreError, OperationType } from "../../App";
import { logAdminAction } from "../../lib/audit";
import { motion, AnimatePresence } from "motion/react";

const QUICK_RESPONSE_TEMPLATES = [
  {
    title: "Boas-vindas",
    text: "Olá! Seja muito bem-vindo ao Suporte ViTTA. Como posso auxiliar você hoje com sua conta ou convênio?"
  },
  {
    title: "Solicitar Comprovante",
    text: "Por gentileza, poderia nos enviar o comprovante da transação ou documento para que nossa equipe possa validar?"
  },
  {
    title: "Confirmação de Agendamento",
    text: "Verificamos aqui no sistema e sua consulta já consta como confirmada na agenda do profissional."
  },
  {
    title: "Estorno Realizado",
    text: "Informamos que o estorno no valor da sua consulta foi processado e já está disponível em seus créditos ViTTA Coins."
  },
  {
    title: "Encerramento Cordial",
    text: "Foi um prazer atendê-lo! Se precisar de qualquer outra orientação, estamos sempre à disposição. Tenha um excelente dia!"
  }
];

export const AdminSupportChatView = ({ adminUser }: { adminUser: any }) => {
  const { addToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [chatRooms, setChatRooms] = useState<{ [key: string]: any }>({});
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const qUsers = query(collection(db, "users"), orderBy("name", "asc"));
    const unsubscribeUsers = onSnapshot(
      qUsers,
      (snapshot) => {
        const allUsers = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as any
        );
        setUsers(allUsers.filter((u) => u.role !== "admin"));
        setLoadingUsers(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "users");
      }
    );

    const qRooms = collection(db, "chats");
    const unsubscribeRooms = onSnapshot(qRooms, (snapshot) => {
      const rooms: { [key: string]: any } = {};
      snapshot.docs.forEach((doc) => {
        rooms[doc.id] = doc.data();
      });
      setChatRooms(rooms);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeRooms();
    };
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
    setLoadingMessages(true);
    const userId = selectedUser.uid || selectedUser.id;

    const q = query(
      collection(db, "chats", userId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribeMessages = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(data);
        setLoadingMessages(false);
        setTimeout(scrollToBottom, 100);

        // Mark incoming user messages as read
        snapshot.docs.forEach((docSnap) => {
          const msg = docSnap.data();
          if (msg.senderRole === "user" && !msg.read) {
            updateDoc(doc(db, "chats", userId, "messages", docSnap.id), {
              read: true
            });
          }
        });

        // Reset unread count for this room
        setDoc(doc(db, "chats", userId), { unreadCount: 0 }, { merge: true });
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `chats/${userId}/messages`);
      }
    );

    const unsubscribeRoom = onSnapshot(doc(db, "chats", userId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setUserTyping(!!data.userTyping);
      }
    });

    return () => {
      unsubscribeMessages();
      unsubscribeRoom();
    };
  }, [selectedUser]);

  const handleTyping = () => {
    if (!selectedUser || !adminUser) return;
    const userId = selectedUser.uid || selectedUser.id;

    setDoc(
      doc(db, "chats", userId),
      { adminTyping: true, updatedAt: new Date().toISOString() },
      { merge: true }
    );

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setDoc(doc(db, "chats", userId), { adminTyping: false }, { merge: true });
    }, 2000);
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText !== undefined ? customText : newMessage;
    if (!textToSend.trim() || !selectedUser) return;

    const userId = selectedUser.uid || selectedUser.id;
    const text = textToSend.trim();
    if (customText === undefined) setNewMessage("");

    try {
      // 1. Add message subdocument
      await addDoc(collection(db, "chats", userId, "messages"), {
        text,
        senderId: adminUser?.uid || "admin",
        senderName: adminUser?.name || "Suporte ViTTA",
        senderRole: "admin",
        createdAt: Timestamp.now(),
        read: false
      });

      // 2. Update parent chat room
      await setDoc(
        doc(db, "chats", userId),
        {
          userId,
          userName: selectedUser.name || "Usuário",
          userEmail: selectedUser.email || "",
          userRole: selectedUser.role || "patient",
          lastMessage: text,
          lastSenderRole: "admin",
          status: "open",
          updatedAt: new Date().toISOString(),
          adminTyping: false
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      addToast("Erro ao enviar mensagem de suporte.", "error");
    }
  };

  // Resolve / Close Support Ticket
  const handleResolveTicket = async () => {
    if (!selectedUser) return;
    const userId = selectedUser.uid || selectedUser.id;

    try {
      // 1. Send system close message
      await addDoc(collection(db, "chats", userId, "messages"), {
        text: "✅ Atendimento finalizado pela equipe de Suporte ViTTA. Caso precise de mais ajuda, basta enviar uma nova mensagem!",
        senderId: adminUser?.uid || "admin",
        senderName: adminUser?.name || "Suporte ViTTA",
        senderRole: "admin",
        isSystemMessage: true,
        createdAt: Timestamp.now(),
        read: false
      });

      // 2. Mark chat room status as resolved
      await setDoc(
        doc(db, "chats", userId),
        {
          status: "resolved",
          resolvedAt: new Date().toISOString(),
          resolvedBy: adminUser?.name || "Admin",
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      await logAdminAction(
        "RESOLVE_SUPPORT_CHAT",
        `Encerrou chamado de atendimento de ${selectedUser.name || userId}`
      );

      addToast("Atendimento encerrado com sucesso!", "success");
    } catch (err) {
      console.error("Erro ao encerrar chamado:", err);
      addToast("Erro ao encerrar chamado.", "error");
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const name = (u.name || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  return (
    <div className="h-[calc(100vh-12rem)] flex bg-vitta-surface rounded-3xl border border-vitta-border shadow-sm overflow-hidden text-left">
      {/* Left Sidebar: User Conversations */}
      <div className="w-80 border-r border-vitta-border flex flex-col bg-vitta-surface-2">
        <div className="p-4 border-b border-vitta-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-vitta-text-primary flex items-center gap-2">
              <MessageSquare size={16} className="text-vitta-accent" />
              Atendimentos
            </h3>
            <span className="px-2 py-0.5 bg-vitta-accent-bg text-vitta-accent rounded-full text-[10px] font-extrabold">
              {users.length} Contatos
            </span>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-muted" />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary outline-none focus:ring-2 focus:ring-vitta-accent/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-vitta-border">
          {loadingUsers ? (
            <div className="p-8 text-center text-vitta-text-muted">
              <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-vitta-accent" />
              <p className="text-xs">Carregando contatos...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-vitta-text-muted text-xs">
              Nenhum usuário encontrado.
            </div>
          ) : (
            filteredUsers.map((u) => {
              const uid = u.uid || u.id;
              const room = chatRooms[uid];
              const isSelected = selectedUser && (selectedUser.uid === uid || selectedUser.id === uid);
              const unread = room?.unreadCount || 0;
              const isResolved = room?.status === "resolved";

              return (
                <button
                  key={uid}
                  onClick={() => setSelectedUser(u)}
                  className={`w-full p-4 flex items-start gap-3 transition-colors text-left ${
                    isSelected ? "bg-vitta-accent-bg/40 border-r-4 border-vitta-accent" : "hover:bg-vitta-surface"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-2xl bg-vitta-surface border border-vitta-border flex items-center justify-center text-vitta-text-muted font-bold text-xs">
                      {u.name ? u.name.charAt(0).toUpperCase() : <User size={16} />}
                    </div>
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className="font-bold text-xs text-vitta-text-primary truncate">{u.name || "Sem Nome"}</p>
                      {isResolved && (
                        <span className="text-[9px] text-emerald-600 font-bold uppercase">Resolvido</span>
                      )}
                    </div>
                    <p className="text-[10px] text-vitta-text-muted truncate">
                      {room?.lastMessage || u.email}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Area: Active Chat Conversation */}
      <div className="flex-1 flex flex-col bg-vitta-surface">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-vitta-border flex items-center justify-between bg-vitta-surface-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-vitta-accent-bg text-vitta-accent flex items-center justify-center font-bold text-sm">
                  {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : <User size={18} />}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-vitta-text-primary">{selectedUser.name || "Usuário"}</h4>
                  <p className="text-[10px] text-vitta-text-muted">{selectedUser.email} • {selectedUser.role === "professional" ? "Médico/Profissional" : "Paciente"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {chatRooms[selectedUser.uid || selectedUser.id]?.status !== "resolved" ? (
                  <button
                    onClick={handleResolveTicket}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    title="Encerrar Chamado"
                  >
                    <CheckCircle size={14} />
                    Finalizar Atendimento
                  </button>
                ) : (
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs font-bold flex items-center gap-1">
                    <CheckCheck size={14} />
                    Chamado Resolvido
                  </span>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingMessages ? (
                <div className="flex justify-center p-12">
                  <RefreshCw size={24} className="animate-spin text-vitta-accent" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-vitta-text-muted space-y-2">
                  <MessageSquare size={36} className="opacity-20" />
                  <p className="font-bold text-sm text-vitta-text-primary">Nenhuma mensagem nesta conversa</p>
                  <p className="text-xs">Utilize o campo abaixo ou um template de resposta rápida para iniciar o contato.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isAdmin = m.senderRole === "admin";
                  const isSystem = m.isSystemMessage;

                  if (isSystem) {
                    return (
                      <div key={m.id} className="flex justify-center my-3">
                        <div className="px-4 py-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-2xl text-xs font-bold border border-emerald-500/20 max-w-md text-center">
                          {m.text}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                    >
                      <span className="text-[10px] text-vitta-text-muted mb-1 px-1">
                        {isAdmin ? "Suporte ViTTA" : selectedUser.name || "Usuário"}
                      </span>
                      <div
                        className={`max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isAdmin
                            ? "bg-vitta-accent text-white rounded-br-none shadow-sm"
                            : "bg-vitta-surface-2 text-vitta-text-primary rounded-bl-none border border-vitta-border"
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[9px] text-vitta-text-muted mt-1 px-1">
                        {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                  );
                })
              )}
              {userTyping && (
                <div className="text-xs text-vitta-text-muted italic flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-vitta-accent"></span>
                  {selectedUser.name} está digitando...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Response Templates Dropdown */}
            <div className="px-4 pt-2 pb-1 border-t border-vitta-border bg-vitta-surface flex items-center justify-between">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTemplatesDropdown(!showTemplatesDropdown)}
                  className="flex items-center gap-1.5 text-xs font-bold text-vitta-accent hover:underline py-1"
                >
                  <Sparkles size={13} />
                  Respostas Rápidas
                  <ChevronDown size={12} />
                </button>

                <AnimatePresence>
                  {showTemplatesDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full left-0 mb-2 w-80 bg-vitta-surface border border-vitta-border rounded-2xl shadow-xl p-2 z-20 space-y-1"
                    >
                      <p className="text-[10px] uppercase font-bold text-vitta-text-muted px-2 py-1">
                        Modelos de Atendimento
                      </p>
                      {QUICK_RESPONSE_TEMPLATES.map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setNewMessage(tmpl.text);
                            setShowTemplatesDropdown(false);
                          }}
                          className="w-full p-2 text-left rounded-xl hover:bg-vitta-surface-2 transition-all space-y-0.5"
                        >
                          <p className="text-xs font-bold text-vitta-text-primary">{tmpl.title}</p>
                          <p className="text-[10px] text-vitta-text-muted line-clamp-1">{tmpl.text}</p>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <span className="text-[10px] text-vitta-text-muted">Pressione Enter para enviar</span>
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-vitta-surface-2 border-t border-vitta-border flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Digite sua resposta para o usuário..."
                className="flex-1 px-4 py-3 bg-vitta-surface border border-vitta-border rounded-2xl text-xs text-vitta-text-primary outline-none focus:ring-2 focus:ring-vitta-accent/20"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-5 py-3 bg-vitta-accent hover:bg-vitta-accent-hover disabled:opacity-40 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-vitta-accent/20"
              >
                <Send size={15} />
                Enviar
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-vitta-text-muted space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-vitta-surface-2 flex items-center justify-center text-vitta-accent">
              <MessageSquare size={32} />
            </div>
            <h4 className="font-bold text-lg text-vitta-text-primary">Central de Suporte ViTTA</h4>
            <p className="text-xs text-vitta-text-secondary max-w-sm text-center">
              Selecione um paciente ou credenciado na coluna ao lado para iniciar ou dar andamento ao atendimento em tempo real.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

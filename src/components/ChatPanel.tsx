import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import type { ChatMessage } from "../game/protocol";
import type { Player } from "../game/logic";

interface ChatPanelProps {
  messages: ChatMessage[];
  players: Player[]; // para resolver el color del jugador que mandó cada mensaje
  myPlayerId: number;
  onSendChat: (text: string) => void;
}

export function ChatPanel({ messages, players, myPlayerId, onSendChat }: ChatPanelProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje cuando llega uno nuevo, solo si el panel está abierto.
  useEffect(() => {
    if (!collapsed) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, collapsed]);

  const handleSend = () => {
    const trimmed = draft.trim();
    if (trimmed.length === 0) return;
    onSendChat(trimmed);
    setDraft("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  const playerColor = (playerId: number) => players.find((p) => p.id === playerId)?.color ?? "#9aa3b5";

  if (collapsed) {
    return (
      <button style={styles.collapsedButton} onClick={() => setCollapsed(false)}>
        💬 Chat{messages.length > 0 ? ` (${messages.length})` : ""}
      </button>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>Chat</span>
        <button style={styles.collapseButton} onClick={() => setCollapsed(true)}>
          ✕
        </button>
      </div>

      <div style={styles.messageList}>
        {messages.length === 0 && <div style={styles.emptyHint}>Nadie ha escrito todavía.</div>}
        {messages.map((m, i) => (
          <div key={i} style={styles.messageRow}>
            <span style={{ ...styles.messageAuthor, color: playerColor(m.playerId) }}>
              {m.playerId === myPlayerId ? "Tú" : m.playerName}:
            </span>{" "}
            <span style={styles.messageText}>{m.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputRow}>
        <input
          style={styles.input}
          value={draft}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          maxLength={500}
        />
        <button style={styles.sendButton} onClick={handleSend}>
          Enviar
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  collapsedButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    pointerEvents: "auto",
    background: "rgba(28, 32, 48, 0.9)",
    backdropFilter: "blur(6px)",
    color: "#f5f5f5",
    border: "1px solid #3d4456",
    borderRadius: 10,
    padding: "10px 16px",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  container: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 280,
    maxHeight: 360,
    display: "flex",
    flexDirection: "column",
    background: "rgba(20, 22, 30, 0.95)",
    backdropFilter: "blur(6px)",
    border: "1px solid #3d4456",
    borderRadius: 12,
    pointerEvents: "auto",
    fontFamily: "system-ui, -apple-system, sans-serif",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    borderBottom: "1px solid #333a4d",
    color: "#c5cad6",
    fontSize: 13,
    fontWeight: 600,
  },
  collapseButton: {
    background: "transparent",
    border: "none",
    color: "#9aa3b5",
    cursor: "pointer",
    fontSize: 14,
  },
  messageList: {
    flex: 1,
    overflowY: "auto",
    padding: "10px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minHeight: 100,
    maxHeight: 240,
  },
  emptyHint: {
    color: "#6b7280",
    fontSize: 12,
    fontStyle: "italic",
  },
  messageRow: {
    fontSize: 13,
    color: "#e5e7eb",
    lineHeight: 1.4,
    wordBreak: "break-word",
  },
  messageAuthor: {
    fontWeight: 600,
  },
  messageText: {
    color: "#e5e7eb",
  },
  inputRow: {
    display: "flex",
    gap: 6,
    padding: "10px 14px",
    borderTop: "1px solid #333a4d",
  },
  input: {
    flex: 1,
    background: "#14161e",
    border: "1px solid #3d4456",
    borderRadius: 8,
    padding: "8px 10px",
    color: "#f5f5f5",
    fontSize: 13,
    outline: "none",
  },
  sendButton: {
    background: "#5c9dff",
    color: "#0a0b10",
    border: "none",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
};

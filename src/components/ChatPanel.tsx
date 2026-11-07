import { useEffect, useRef, useState } from "react";
import { useI18n, legalHref } from "../i18n";
import type { ChangeEvent, KeyboardEvent } from "react";
import type { ChatMessage } from "../game/protocol";
import type { Player } from "../game/logic";

interface ChatPanelProps {
  messages: ChatMessage[];
  players: Player[]; // para resolver el color del jugador que mandó cada mensaje
  myPlayerId: number;
  onSendChat: (text: string) => void;
  onReportMessage: (message: ChatMessage, reason: string) => void; // reporta un mensaje ajeno a moderación
}

export function ChatPanel({ messages, players, myPlayerId, onSendChat, onReportMessage }: ChatPanelProps) {
  const { t, lang } = useI18n();
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

  const handleReport = (m: ChatMessage) => {
    // window.prompt devuelve null si se cancela: en ese caso no se reporta nada.
    const reason = window.prompt(t("Reportar el mensaje de {name}.\n¿Cuál es el motivo? (opcional)", { name: m.playerName }), "");
    if (reason === null) return;
    onReportMessage(m, reason);
  };

  const playerColor = (playerId: number) => players.find((p) => p.id === playerId)?.color ?? "var(--muted)";

  if (collapsed) {
    return (
      <button style={styles.collapsedButton} onClick={() => setCollapsed(false)}>
        {t("Chat")}{messages.length > 0 ? ` (${messages.length})` : ""}
      </button>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>{t("Chat")}</span>
        <button style={styles.collapseButton} onClick={() => setCollapsed(true)}>
          ✕
        </button>
      </div>

      <div style={styles.privacyNotice}>
        {t("El chat de esta sala se registra para moderación.")}{" "}
        <a href={legalHref(lang, "privacy")} target="_blank" rel="noreferrer" style={styles.privacyLink}>
          {t("Más info")}
        </a>
      </div>

      <div style={styles.messageList}>
        {messages.length === 0 && <div style={styles.emptyHint}>{t("Nadie ha escrito todavía.")}</div>}
        {messages.map((m, i) => (
          <div key={i} style={styles.messageRow}>
            <span style={{ ...styles.messageAuthor, color: playerColor(m.playerId) }}>
              {m.playerId === myPlayerId ? t("Tú") : m.playerName}:
            </span>{" "}
            <span style={styles.messageText}>{m.text}</span>
            {m.playerId !== myPlayerId && (
              <button style={styles.reportButton} title={t("Reportar este mensaje")} onClick={() => handleReport(m)}>
                ⚑
              </button>
            )}
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
          placeholder={t("Escribe un mensaje...")}
          maxLength={500}
        />
        <button style={styles.sendButton} onClick={handleSend}>
          {t("Enviar")}
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
    background: "rgba(27, 25, 21, 0.9)",
    color: "var(--text)",
    border: "1px solid var(--line2)",
    borderRadius: 3,
    padding: "10px 16px",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "var(--font-body)",
  },
  container: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 280,
    maxHeight: 360,
    display: "flex",
    flexDirection: "column",
    background: "rgba(19, 18, 16, 0.95)",
    border: "1px solid var(--line2)",
    borderRadius: 12,
    pointerEvents: "auto",
    fontFamily: "var(--font-body)",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    borderBottom: "1px solid var(--line)",
    color: "var(--text2)",
    fontSize: 13,
    fontWeight: 600,
  },
  collapseButton: {
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    fontSize: 14,
  },
  privacyNotice: {
    padding: "6px 14px",
    fontSize: 11,
    color: "var(--muted)",
    borderBottom: "1px solid var(--line)",
    background: "rgba(255, 255, 255, 0.03)",
  },
  privacyLink: {
    color: "var(--accent)",
  },
  reportButton: {
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    fontSize: 12,
    padding: "0 4px",
    marginLeft: 4,
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
    color: "var(--muted)",
    fontSize: 12,
    fontStyle: "italic",
  },
  messageRow: {
    fontSize: 13,
    color: "var(--text)",
    lineHeight: 1.4,
    wordBreak: "break-word",
  },
  messageAuthor: {
    fontWeight: 600,
  },
  messageText: {
    color: "var(--text)",
  },
  inputRow: {
    display: "flex",
    gap: 6,
    padding: "10px 14px",
    borderTop: "1px solid var(--line)",
  },
  input: {
    flex: 1,
    background: "var(--bg)",
    border: "1px solid var(--line2)",
    borderRadius: 3,
    padding: "8px 10px",
    color: "var(--text)",
    fontSize: 13,
    outline: "none",
  },
  sendButton: {
    background: "var(--accent)",
    color: "var(--on-accent)",
    border: "none",
    borderRadius: 3,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
};

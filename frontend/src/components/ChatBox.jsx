import { useEffect, useRef, useState } from "react";
import "./ChatBox.css";

function ChatBox({ systemId, currentUser, isOpen, onClose, onNewUnread }) {
  const storageKey = `chat-${systemId}`;
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  function loadMessages() {
    const saved = localStorage.getItem(storageKey);
    const parsed = saved ? JSON.parse(saved) : [];

    setMessages(parsed);

    const unreadClientMessages = parsed.filter(
      (msg) =>
        currentUser.role === "operator" &&
        msg.role === "viewer" &&
        !msg.readByOperator
    );

    onNewUnread(unreadClientMessages);
  }

  useEffect(() => {
    loadMessages();

    const interval = setInterval(() => {
      loadMessages();
    }, 1000);

    return () => clearInterval(interval);
  }, [storageKey, currentUser.role]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && currentUser.role === "operator") {
      const updated = messages.map((msg) =>
        msg.role === "viewer" ? { ...msg, readByOperator: true } : msg
      );

      localStorage.setItem(storageKey, JSON.stringify(updated));
      setMessages(updated);
      onNewUnread([]);
    }
  }, [isOpen]);

  function sendMessage(e) {
    e.preventDefault();

    if (!text.trim()) return;

    const newMessage = {
      id: Date.now(),
      systemId,
      sender: currentUser.username,
      role: currentUser.role,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString(),
      readByOperator: currentUser.role === "operator",
    };

    const updatedMessages = [...messages, newMessage];

    setMessages(updatedMessages);
    localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
    setText("");
  }

  if (!isOpen) return null;

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div>
          <h2>Site Chat</h2>
          <p>{systemId}</p>
        </div>

        <button type="button" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <p className="empty-chat">No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message ${
                msg.role === "operator" ? "operator-msg" : "viewer-msg"
              }`}
            >
              <div className="chat-meta">
                <strong>{msg.sender}</strong>
                <span>{msg.role}</span>
                <span>{msg.timestamp}</span>
              </div>

              <p>{msg.text}</p>
            </div>
          ))
        )}

        <div ref={messagesEndRef}></div>
      </div>

      <form className="chat-form" onSubmit={sendMessage}>
        <input
          type="text"
          placeholder={
            currentUser.role === "operator"
              ? "Reply to client..."
              : "Message operator..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default ChatBox;
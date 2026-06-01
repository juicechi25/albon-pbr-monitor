import { useEffect, useRef, useState } from "react";
import "./ChatBox.css";

function ChatBox({ systemId, currentUser, isOpen, onClose }) {
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  async function loadMessages() {
    try {
      const response = await fetch(`http://localhost:8000/chat/${systemId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Failed to load chat messages:", error);
    }
  }

  async function markAsRead() {
    if (!isOpen) return;
    try {
      await fetch(`http://localhost:8000/chat/${systemId}/read?role=${currentUser.role}`, {
        method: "POST"
      });
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  }

  useEffect(() => {
    loadMessages();

    const interval = setInterval(() => {
      loadMessages();
    }, 2000);

    return () => clearInterval(interval);
  }, [systemId]);

  useEffect(() => {
    if (isOpen) {
      markAsRead();
    }
  }, [isOpen, messages.length, systemId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isOpen]);

  async function sendMessage(e) {
    e.preventDefault();

    if (!text.trim()) return;

    const payload = {
      system_id: systemId,
      sender: currentUser.username,
      role: currentUser.role,
      text: text.trim(),
    };

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages((prev) => [...prev, newMessage]);
        setText("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Backend unavailable while sending message");
    }
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
                <span>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ""}</span>
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
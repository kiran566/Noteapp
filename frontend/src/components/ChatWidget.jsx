import React, { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, BookmarkPlus, Loader2, Bot, User, Check } from "lucide-react";
import API from "../Services/api";

const ChatWidget = ({ onNoteSaved }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I am your AI Notes Assistant. Ask me anything about your notes, or ask me to brainstorm and draft a new one!",
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [savedIndex, setSavedIndex] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming, isOpen]);

  const handleSend = async (messageText) => {
    const textToSend = typeof messageText === "string" ? messageText : input;
    if (!textToSend.trim() || isStreaming) return;

    const userMessage = { role: "user", content: textToSend.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    try {
      const token = localStorage.getItem("token");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

      const response = await fetch(`${apiUrl}/api/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: updatedMessages
            .filter((m) => m.content)
            .slice(-6)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response stream available");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let botReply = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        botReply += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: botReply };
          return updated;
        });
      }
    } catch (err) {
      console.error("Chat streaming error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I had trouble connecting to the AI assistant. Please make sure the backend is running.",
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSaveAsNote = async (content, index) => {
    if (!content.trim()) return;

    // Extract first line as note title, clean leading markdown symbols
    const cleanLines = content.trim().split("\n").filter((l) => l.trim().length > 0);
    const rawTitle = cleanLines[0] || "AI Generated Note";
    const title = rawTitle.replace(/^[#*-\s]+/, "").slice(0, 60).trim() || "AI Generated Note";

    try {
      await API.post("/api/notes/", { title, content });
      setSavedIndex(index);
      if (onNoteSaved) onNoteSaved();
      setTimeout(() => setSavedIndex(null), 3000);
    } catch (err) {
      console.error("Failed to save note:", err);
      alert("Failed to save note. Please try again.");
    }
  };

  const suggestions = [
    "What are my recent notes about?",
    "Summarize my main ideas",
    "Draft a project launch checklist",
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-10 right-28 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 z-40 transform hover:scale-105"
        title="AI Notes Assistant"
        aria-label="AI Notes Assistant"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </button>

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-28 right-6 w-96 max-w-[92vw] h-[540px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-sm leading-tight">AI Notes Assistant</h4>
                <p className="text-[11px] text-blue-100">Ask notes • Draft ideas</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              aria-label="Close Chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-sm">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}

                <div className={`flex flex-col max-w-[82%] ${m.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`p-3 rounded-2xl whitespace-pre-wrap leading-relaxed ${
                      m.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-none shadow-sm text-sm"
                        : "bg-white text-slate-800 rounded-tl-none shadow-sm border border-slate-100 text-sm"
                    }`}
                  >
                    {m.content || (isStreaming && idx === messages.length - 1 ? (
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking...
                      </span>
                    ) : "")}
                  </div>

                  {/* "Save as Note" Button on AI responses */}
                  {m.role === "assistant" && m.content && idx !== 0 && (
                    <button
                      onClick={() => handleSaveAsNote(m.content, idx)}
                      disabled={savedIndex === idx}
                      className={`flex items-center gap-1.5 text-[11px] font-medium mt-1 px-2 py-0.5 rounded-md transition ${
                        savedIndex === idx
                          ? "text-emerald-700 bg-emerald-50"
                          : "text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                      }`}
                    >
                      {savedIndex === idx ? (
                        <>
                          <Check className="h-3 w-3" /> Saved to Notes
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="h-3.5 w-3.5" /> Save as note
                        </>
                      )}
                    </button>
                  )}
                </div>

                {m.role === "user" && (
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}

            {/* Quick Suggestion Chips if only welcome message */}
            {messages.length === 1 && (
              <div className="pt-2 space-y-1.5">
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Try asking:</p>
                <div className="flex flex-col gap-1.5">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s)}
                      className="text-left text-xs bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-lg px-3 py-2 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center">
            <input
              type="text"
              placeholder="Ask your notes or draft an idea..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isStreaming}
              className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition shadow-sm"
              aria-label="Send message"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatWidget;

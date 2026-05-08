import { useState, useEffect, useRef } from 'react';

const CHAT_STORAGE_KEY = 'chat_messages';
const MAX_MESSAGES = 30;

function loadMessages() {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveMessages(msgs) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_MESSAGES)));
  } catch { /* ignore */ }
}

export default function ChatBot({ issData, newsData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(loadMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const buildContext = () => {
    const ctx = [];
    if (issData?.position) {
      ctx.push(`ISS Current Position: Latitude ${issData.position.latitude.toFixed(4)}, Longitude ${issData.position.longitude.toFixed(4)}`);
    }
    if (issData?.speed) {
      ctx.push(`ISS Current Speed: ${issData.speed.toFixed(2)} km/h`);
    }
    if (issData?.nearestPlace) {
      ctx.push(`ISS Nearest Place: ${issData.nearestPlace}`);
    }
    if (issData?.positions) {
      ctx.push(`ISS Tracked Positions: ${issData.positions.length}`);
    }
    if (issData?.astronauts) {
      ctx.push(`People in Space: ${issData.astronauts.number}`);
      if (issData.astronauts.people?.length) {
        ctx.push(`Astronauts: ${issData.astronauts.people.map(p => `${p.name} (${p.craft})`).join(', ')}`);
      }
    }
    if (newsData?.allArticles?.length) {
      ctx.push(`Total News Articles Loaded: ${newsData.allArticles.length}`);
      const summaries = newsData.allArticles.slice(0, 10).map((a, i) =>
        `${i + 1}. "${a.title}" from ${a.source?.name || 'Unknown'} (${a.category}) - ${a.description || 'No desc'}`
      );
      ctx.push(`News Articles:\n${summaries.join('\n')}`);
    }
    return ctx.join('\n');
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input.trim(), timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const token = import.meta.env.VITE_AI_TOKEN;
      if (!token) {
        throw new Error('AI token not configured');
      }

      const contextData = buildContext();
      const systemPrompt = `You are an AI assistant for a dashboard that tracks the ISS and shows news. You can ONLY answer using the following dashboard data. Do NOT use any external knowledge. If the question is not answerable from the data below, say "I can only answer questions about the dashboard data (ISS tracking and loaded news articles)."

DASHBOARD DATA:
${contextData}`;

      const apiMessages = [
        { role: 'user', content: `${systemPrompt}\n\nUser question: ${userMsg.content}` }
      ];

      const res = await fetch(
        'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            inputs: `<s>[INST] ${systemPrompt}\n\nUser question: ${userMsg.content} [/INST]`,
            parameters: {
              max_new_tokens: 300,
              temperature: 0.3,
              return_full_text: false,
            },
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `AI service error: ${res.status}`);
      }

      const data = await res.json();
      let reply = 'Sorry, I could not generate a response.';
      
      // Handle the array format (most common for this HF API endpoint)
      if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
        // The API often returns the prompt + the answer. We need to extract just the answer.
        const fullText = data[0].generated_text;
        const promptEnd = fullText.lastIndexOf('[/INST]');
        
        if (promptEnd !== -1) {
          reply = fullText.substring(promptEnd + 7).trim();
        } else {
          reply = fullText.trim();
        }
      } 
      // Handle the object format
      else if (data.generated_text) {
         reply = data.generated_text.trim();
      }
      // Handle potential errors wrapped in a 200 response
      else if (data.error) {
         throw new Error(data.error);
      }

      setMessages((prev) => [...prev, { role: 'bot', content: reply, timestamp: Date.now() }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: `Error: ${err.message}. Please try again.`, timestamp: Date.now() },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <button
        className="chat-fab"
        onClick={() => setIsOpen(!isOpen)}
        id="chat-fab"
        title={isOpen ? 'Close chat' : 'Open AI Assistant'}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {isOpen && (
        <div className="chat-window" id="chat-window">
          <div className="chat-header">
            <h3>AI Assistant</h3>
            <button className="chat-clear-btn" onClick={clearChat}>Clear</button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-msg system">
                Ask about ISS, speed, or loaded news.
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {isTyping && (
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              className="chat-input"
              type="text"
              placeholder="Ask from dashboard data only"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              id="chat-input"
            />
            <button className="chat-send-btn" onClick={sendMessage} disabled={isTyping} id="chat-send">
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

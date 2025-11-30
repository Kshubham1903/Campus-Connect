// frontend/src/components/Chat.jsx
import React, { useEffect, useState, useRef } from 'react';
import API, { getSavedToken } from '../api';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';

/**
 * Chat component (Tailwind)
 * - shows partner name at top
 * - right-aligned bubbles for me (sender)
 * - left-aligned bubbles for others (receiver)
 *
 * NOTE: relies on saved JWT in localStorage via getSavedToken()
 * and on endpoints:
 *  GET /api/chats/:chatId/messages
 *  GET /api/chats (to obtain partner metadata if needed)
 * Socket.io server at http://localhost:5000
 */

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    // add padding if needed
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export default function Chat() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [partner, setPartner] = useState(null);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // get my id from token payload
  const token = getSavedToken();
  const payload = token ? decodeJwt(token) : null;
  const myId = payload?.id;

  useEffect(() => {
    if (!chatId) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // fetch messages (history)
        const res = await API.get(`/chats/${chatId}/messages`);
        if (!cancelled) setMessages(res.data.messages || []);
      } catch (err) {
        console.error('fetch history err', err);
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setLoading(false);
        scrollToBottom();
      }
    })();

    // fetch partner info from /api/chats
    (async () => {
      try {
        const r = await API.get('/chats');
        const found = (r.data.chats || []).find(c => String(c._id) === String(chatId));
        if (found) setPartner(found.partner || null);
      } catch (e) {
        // ignore
      }
    })();

    // connect socket
    if (!token) {
      console.warn('No token found — you must be logged in');
      return;
    }
    const socket = io('http://localhost:5000', { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinChat', { chatId });
    });

    socket.on('newMessage', (msg) => {
      if (String(msg.chatId) !== String(chatId)) return;
      setMessages(prev => {
        // avoid duplicates
        if (prev.find(p => String(p._id) === String(msg._id))) return prev;
        return [...prev, msg];
      });
      scrollToBottom();
    });

    socket.on('connect_error', (err) => {
      console.error('socket connect_error', err);
    });

    socket.on('error', (e) => {
      console.error('socket error', e);
    });

    return () => {
      cancelled = true;
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  function scrollToBottom() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }

  async function send() {
    if (!text.trim()) return;
    const socket = socketRef.current;
    const payloadText = text.trim();
    setText('');
    if (socket && socket.connected) {
      socket.emit('sendMessage', { chatId, text: payloadText });
      // optimistic UI: we can optionally push a temporary message, but we rely on server 'newMessage' event
    } else {
      // fallback HTTP
      try {
        await API.post(`/chats/${chatId}/messages`, { text: payloadText });
      } catch (err) {
        console.error('fallback send failed', err);
        alert('Failed to send message');
      }
    }
  }

  // helper for bubble alignment and styles
  function renderMessage(m) {
    const isMe = String(m.senderId) === String(myId);
    const time = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[78%] break-words p-3 rounded-2xl ${isMe ? 'bg-primary/10 text-slate-900 rounded-br-none' : 'bg-white border'} shadow-sm`}>
          <div className="text-sm">{m.text}</div>
          <div className="text-xs text-gray-400 mt-1 text-right">{time}</div>
        </div>
      </div>
    );
  }

  // header partner name / status
  const partnerName = partner?.name || partner?.email || 'Chat';

  return (
    <div className="max-w-3xl mx-auto">
      {/* header */}
      <div className="bg-white rounded-lg shadow p-3 mb-4 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">{partnerName}</div>
          <div className="text-xs text-gray-500">You are chatting with {partnerName}</div>
        </div>
      </div>

      {/* chat area */}
      <div className="bg-white rounded-lg shadow p-3">
        <div className="h-[520px] overflow-auto p-4 flex flex-col gap-3 bg-gray-50 rounded" id="chat-scroll">
          {loading ? (
            <div className="text-center text-gray-400">Loading messages…</div>
          ) : (
            messages.map(m => renderMessage(m))
          )}
          <div ref={bottomRef} />
        </div>

        {/* input */}
        <div className="mt-3 flex gap-3 items-end">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={2}
            placeholder="Write a message..."
            className="flex-1 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <div className="flex flex-col gap-2">
            <button onClick={send} className="px-4 py-2 rounded-lg bg-primary text-white">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

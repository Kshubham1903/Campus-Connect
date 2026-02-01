// frontend/components/Chat.jsx
import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useParams, useNavigate } from 'react-router-dom';
import API, { getSavedToken } from '../api';
import { displayName, initials } from '../utils/displayName';

// Decode JWT safely (extract payload part)
function decodeJwt(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payloadPart = parts[1]; // second part is payload
    const b64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch (err) {
    console.warn('decodeJwt failed', err);
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

  const token = getSavedToken();
  const payload = token ? decodeJwt(token) : null;
  const myId = payload?.id;
  const navigate = useNavigate();

  // If no token, redirect to login (avoid trying to connect sockets)
  useEffect(() => {
    if (!token) {
      console.warn('No token found — redirecting to /login');
      navigate('/login');
    }
  }, [token, navigate]);

  // load history, partner and setup socket
  useEffect(() => {
    if (!chatId || !token) return;

    let cancelled = false;

        (async () => {
      setLoading(true);
      try {
        // fetch messages + partner from server
        const res = await API.get(`/chats/${chatId}/messages`);
        console.log('[chat messages API]', { chatId, data: res?.data }); // debug log

        if (!cancelled) {
          setMessages(res.data.messages || []);

          // If partner exists, normalize avatar URL to absolute and ensure name
          if (res.data.partner) {
            const p = { ...res.data.partner };
            if (p.avatarUrl && typeof p.avatarUrl === 'string' && !p.avatarUrl.startsWith('http')) {
              // Use window.location.origin (or replace with your API origin if different)
              p.avatarUrl = `${window.location.origin}${p.avatarUrl}`;
            }
              // leave partner fields as-is; UI will use displayName() fallback
              setPartner(p);
            console.log('[chat partner normalized]', p);
          }
        }
      } catch (err) {
        // don't reference `res` here (it may not exist)
        console.error('fetch history err', err);
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setLoading(false);
        // small delay to allow rendering then scroll
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
      }
    })();


    // fallback: if partner not provided by messages endpoint, fetch chats list and find partner
    (async () => {
      try {
        const r = await API.get('/chats');
        const found = (r.data.chats || []).find(c => String(c._id) === String(chatId));
        if (found && !cancelled) {
          // if partner already set from messages, don't overwrite unless partner is null
          if (!partner) setPartner(found.partner || null);
        }
      } catch (err) {
        // ignore
      }
    })();

    // connect socket
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token }
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinChat', { chatId });
    });

    socket.on('newMessage', (msg) => {
      if (String(msg.chatId) !== String(chatId)) return;
      setMessages(prev => {
        if (prev.find(p => String(p._id) === String(msg._id))) return prev;
        return [...prev, msg];
      });
    });

    socket.on('connect_error', (err) => {
      console.error('socket connect_error', err);
    });

    socket.on('error', (e) => {
      console.error('socket error', e);
    });

    return () => {
      cancelled = true;
      try {
        socket.disconnect();
      } catch (e) {}
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, token]);

  // scroll when messages change
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, [messages]);

  async function send() {
    if (!text.trim() || !chatId) return;
    const payloadText = text.trim();
    setText('');
    const socket = socketRef.current;

    if (socket && socket.connected) {
      socket.emit('sendMessage', { chatId, text: payloadText });
    } else {
      try {
        await API.post(`/chats/${chatId}/messages`, { text: payloadText });
      } catch (err) {
        console.error('fallback send failed', err);
        alert('Failed to send message');
      }
    }
  }

  function renderMessage(m) {
    const isMe = String(m.senderId) === String(myId);
    const time = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    }) : '';

    return (
      <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-[78%] break-words p-3 rounded-2xl ${isMe ? 'bubble-me' : 'bubble-other'} shadow-sm`}
        >
          <div className="text-sm">{m.text}</div>
          <div className="text-xs text-white/60 mt-1 text-right">{time}</div>
        </div>
      </div>
    );
  }

  const partnerName = (partner ? displayName(partner) : null) || 'Chat';

  return (
    <div className="max-w-3xl mx-auto">
      {/* header */}
      <div className="card p-3 sm:p-4 mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-white/5"
            aria-label="Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/90" >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Profile Image or initials avatar (uses partner.avatarUrl) */}
          {partner && partner.avatarUrl && !partner._imgFailed ? (
            <img
              src={partner.avatarUrl}
              alt={displayName(partner)}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                // hide broken image and trigger initials fallback
                e.currentTarget.onerror = null;
                e.currentTarget.style.display = 'none';
                setPartner(prev => prev ? { ...prev, _imgFailed: true } : prev);
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-accent-400 flex items-center justify-center text-white/90 font-semibold">
              {initials(partner)}
            </div>
          )}

          <div className="leading-tight">
            <div className="text-sm font-semibold text-white/95">{partnerName}</div>
            {/* If you want presence text, uncomment below */}
            {/* <div className="text-xs text-white/60">online</div> */}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-white/5" aria-label="More">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-white/90"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20 2-7 7-7z" />
            </svg>
          </button>
        </div>
      </div>

      {/* chat body */}
      <div className="card p-2 sm:p-3">
        <div className="h-[64vh] sm:h-[60vh] overflow-auto p-2 sm:p-4 flex flex-col gap-3 bg-transparent rounded hide-scrollbar">
          {loading ? (
            <div className="text-center text-white/60">Loading messages…</div>
          ) : (
            messages.map(m => renderMessage(m))
          )}
          <div ref={bottomRef} />
        </div>

        {/* input */}
        <div className="mt-3">
          <div className="flex items-center gap-3 bg-white/5 border border-white/6 rounded-full px-3 py-2">
            <button className="p-2 rounded-full hover:bg-white/6 text-white/80" aria-label="Attach">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
              </svg>
            </button>

            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={1}
              placeholder="Write a message..."
              className="flex-1 bg-transparent resize-none outline-none text-white placeholder:text-white/60 px-2 py-1 max-h-28"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />

            <button
              onClick={send}
              className="ml-2 p-2 rounded-full bg-primary/90 text-white shadow-md hover:scale-105 transition-transform"
              aria-label="Send"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2l-7 20 2-7 7-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

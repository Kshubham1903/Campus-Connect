import React, { useEffect, useState } from 'react';
import Avatar from './Avatar';
import { displayName } from '../utils/displayName';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function JuniorDashboard() {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();
  // add at top of component hooks
const [processingId, setProcessingId] = useState(null);


  useEffect(() => {
    fetchRequests();
    fetchChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchRequests() {
    try {
      const res = await API.get('/requests');
      const data = res?.data || {};
      setIncoming((data.incoming || []).filter(r => r?.status === 'PENDING'));
      setOutgoing(data.outgoing || []);
    } catch (err) {
      console.error('fetch requests err', err);
      setIncoming([]);
      setOutgoing([]);
    }
  }

  async function fetchChats() {
    try {
      const res = await API.get('/chats');
      const data = res?.data || {};
      setChats(Array.isArray(data.chats) ? data.chats : []);
    } catch (err) {
      console.error('fetch chats err', err);
      setChats([]);
    }
  }

async function respond(id, action) {
  if (!id) return;
  if (processingId) return;
  setProcessingId(id);

  try {
    console.debug('respond ->', { id, action });
    console.log('Calling respond endpoint', {
      url: `/requests/${id}/respond`,
      body: { action },
      tokenSet: !!localStorage.getItem('mc_token')
    });

    const res = await API.post(`/requests/${id}/respond`, { action });
    console.debug('respond response', res?.status, res?.data);

    // If server already returned a chat id, use it
    const chatId = res?.data?.chatId || res?.data?.chat || null;
    if (chatId) {
      setIncoming(prev => prev.filter(r => r._id !== id));
      await fetchChats();
      toast.success('Request accepted — opening chat');
      navigate(`/chat/${chatId}`);
      return;
    }

    // ---- If server did NOT return a chat id, create one from frontend ----
    try {
      // get the current user id (adjust if you store it elsewhere)
      const storedUser = localStorage.getItem('mc_user') || localStorage.getItem('user');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      const currentUserId = currentUser?._id || currentUser?.id || null;

      // find the request object in local state to get the other user's id
      const reqObj = incoming.find(r => r._id === id) || res?.data?.request || null;
      const otherUserId = reqObj?.fromUser?._id || reqObj?.fromUser?.id || null;

      if (!currentUserId || !otherUserId) {
        console.warn('Could not determine current user or other user id for chat creation', { currentUserId, otherUserId, res });
      } else {
        const createRes = await API.post('/chat/create', {
          fromUser: currentUserId,
          toUser: otherUserId
        });

        const newChatId = createRes?.data?.chat?._id || createRes?.data?.chatId || createRes?.data?.chat?._id || null;
        if (newChatId) {
          setIncoming(prev => prev.filter(r => r._id !== id));
          await fetchChats();
          toast.success('Request accepted — opening chat');
          navigate(`/chat/${newChatId}`);
          return;
        } else {
          console.warn('Chat created but could not find id in response', createRes?.data);
        }
      }
    } catch (chatErr) {
      console.error('Failed to create chat after accept:', chatErr);
      // don't block - fall through to update UI
    }

    // If we reach here, either no chat was created or chat creation failed:
    await fetchRequests();
    await fetchChats();
    toast.success('Request updated');

  } catch (err) {
    // rich error logging
    console.error('respond() failed — full error object:', err);

    // Axios response present (server responded with non-2xx)
    if (err?.response) {
      console.error('response.status:', err.response.status);
      console.error('response.headers:', err.response.headers);
      console.error('response.data:', err.response.data);

      const status = err.response.status;
      // attempt to extract meaningful message from common shapes
      const serverMsg =
        err.response.data?.error ||
        err.response.data?.message ||
        (typeof err.response.data === 'string' ? err.response.data : null) ||
        JSON.stringify(err.response.data).slice(0, 300);

      toast.error(`Server ${status}: ${serverMsg || 'Unknown error'}`);
    } else if (err?.request) {
      // Request made but no response
      console.error('No response received. err.request:', err.request);
      toast.error('No response from server (network or CORS issue). Check console.');
    } else {
      // Something else
      console.error('Error message:', err.message);
      toast.error(err.message || 'Request failed');
    }
  } finally {
    setProcessingId(null);
  }
}




  async function handleDeclineRequest(requestId) {
    // optimistic UI remove
    const prior = incoming;
    setIncoming(prev => prev.filter(r => r._id !== requestId));
    try {
      await API.delete(`/requests/${requestId}`);
      toast.success('Request declined');
    } catch (err) {
      console.error('Failed to delete request', err);
      // rollback
      setIncoming(prior);
      toast.error('Could not decline request. Please try again.');
    }
  }

  function formatLastMessage(c) {
    if (!c?.lastMessage) return 'No messages';
    const text = c.lastMessage.text || '';
    // truncate if long
    const max = 80;
    const short = text.length > max ? text.slice(0, max - 1) + '…' : text;
    if (c.lastMessage.createdAt) {
      try {
        const time = new Date(c.lastMessage.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
        return `${short} · ${time}`;
      } catch {}
    }
    return short;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Incoming requests (for juniors) */}
      <div className="lg:col-span-1 card p-4 rounded-xl">
        <h3 className="text-lg font-semibold mb-3">Requests for You</h3>
        {incoming.length === 0 && (
          <div className="text-sm text-slate-400">No new requests.</div>
        )}
        <div className="space-y-3 mt-2">
          {incoming.map(r => (
            <motion.div
              key={r._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg card-pop surface border border-transparent hover:border-white/5"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10">
                    <Avatar user={r.fromUser} size={40} />
                  </div>
                  <div>
                    <div className="font-semibold">{displayName(r.fromUser)}</div>
                    <div className="text-sm text-gray-400">{r.fromUser?.email || ''}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-400">{r.status}</div>
              </div>

              <div className="text-sm text-gray-200 mt-2">{r.message || ''}</div>

              <div className="flex gap-2 mt-3">
                <motion.button
  whileHover={{ scale: 1.03 }}
  whileTap={{ scale: 0.98 }}
  onClick={() => respond(r._id, 'accept')}
  className="px-3 py-1 rounded bg-primary text-white btn-neon"
  disabled={processingId === r._id}
>
  {processingId === r._id ? 'Accepting…' : 'Accept'}
</motion.button>

                <motion.button
                  className="px-3 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                  onClick={() => {
                    if (!confirm('Decline this request?')) return;
                    handleDeclineRequest(r._id);
                  }}
                >
                  Decline
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Your outgoing requests */}
      <div className="card p-4 rounded-xl">
        <h3 className="text-lg font-semibold mb-3">Your Requests</h3>
        {outgoing.length === 0 && (
          <div className="text-sm text-slate-400">No requests sent yet.</div>
        )}
        <ul className="space-y-3 mt-2">
          {outgoing.map(r => (
            <li key={r._id} className="card p-3 border-transparent hover:border-white/5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm text-muted">
                    <strong>To:</strong> {displayName(r.toUser)}{' '}
                    <span className="text-xs text-gray-300">({r.toUser?.email || ''})</span>
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    <strong>Status:</strong> {r.status}
                  </div>
                  <div className="mt-3 text-sm text-gray-200">{r.message || ''}</div>
                </div>

                {r.status === 'ACCEPTED' && (r.chat || r.chatId) && (
                  <div className="flex-shrink-0 ml-3">
                    <button
                      onClick={() => navigate(`/chat/${r.chat || r.chatId}`)}
                      className="btn btn-primary"
                    >
                      Open Chat
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Chats */}
      <div className="card p-4 rounded-xl">
        <h3 className="text-lg font-semibold mb-3">Your Chats</h3>
        {chats.length === 0 && (
          <div className="text-sm text-slate-400">
            No active chats. When a senior accepts, a chat will appear here.
          </div>
        )}
        <ul className="space-y-3 mt-2">
          {chats.map(c => (
            <li key={c._id} className="card p-3 border-transparent hover:border-white/5">
              <div className="flex items-center justify-between gap-4">
                <div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10">
                              <Avatar user={c.partner} size={40} />
                            </div>
                            <div>
                              <div className="font-semibold">{displayName(c.partner)}</div>
                              <div className="text-xs text-muted">{c.partner?.email || ''}</div>
                            </div>
                          </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/chat/${c._id}`)}
                    className="btn btn-primary text-sm"
                  >
                    Open
                  </button>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-300">{formatLastMessage(c)}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

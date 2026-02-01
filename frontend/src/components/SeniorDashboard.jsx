import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import API from '../api';
import Avatar from './Avatar';
import { displayName } from '../utils/displayName';

export default function SeniorDashboard() {
  const [incoming, setIncoming] = useState([]);
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
    fetchChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchRequests() {
    try {
      const res = await API.get('/requests');
      const data = res?.data || {};
      // normalize to array safely
      const arr = Array.isArray(data.incoming) ? data.incoming : (data.incoming ? [data.incoming] : []);
      setIncoming(arr.filter(r => r && r.status === 'PENDING'));
    } catch (e) {
      console.error('fetchRequests error', e);
      setIncoming([]);
    }
  }

  async function fetchChats() {
    try {
      const res = await API.get('/chats');
      const data = res?.data || {};
      setChats(Array.isArray(data.chats) ? data.chats : []);
    } catch (e) {
      console.error('fetchChats error', e);
      setChats([]);
    }
  }

  async function respond(id, action) {
    try {
      const res = await API.post(`/requests/${id}/respond`, { action });
      // If server created a chat for accepted request, open it
      if (res?.data?.chatId) {
        setIncoming(prev => prev.filter(r => r._id !== id));
        await fetchChats();
        toast.success('Request accepted — opening chat');
        navigate(`/chat/${res.data.chatId}`);
        return;
      }
      await fetchRequests();
      await fetchChats();
      toast.success('Request updated');
    } catch (e) {
      console.error('respond error', e);
      alert('Failed to respond');
    }
  }

  async function handleDeclineRequest(requestId) {
    // optimistic remove from UI
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

  return (
    <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
      <div className="card p-3 sm:p-4 rounded-xl">
        <h3 className="text-lg font-medium mb-3">Incoming Requests</h3>
        {incoming.length === 0 && (
          <div className="text-sm text-slate-400">No incoming requests</div>
        )}

        <div className="space-y-3">
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

              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => respond(r._id, 'accept')}
                  className="px-3 py-2 rounded bg-primary text-white btn-neon w-full sm:w-auto"
                >
                  Accept
                </motion.button>

                <motion.button
                  className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 w-full sm:w-auto"
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

      <div className="card p-3 sm:p-4 rounded-xl">
        <h3 className="text-lg font-medium mb-3">My Chats</h3>
        {chats.length === 0 && (
          <div className="text-sm text-slate-400">No chats yet</div>
        )}

        <div className="space-y-3">
          {chats.map(c => (
            <div
              key={c._id}
              className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-white/5 surface"
            >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10">
                    <Avatar user={c.partner} size={40} />
                  </div>
                  <div>
                    <div className="font-semibold">{displayName(c.partner)}</div>
                    <div className="text-sm text-gray-400">{c.partner?.email || ''}</div>
                  </div>
                </div>

              <div className="flex flex-col items-end">
                <div className="text-sm text-gray-200">
                  {c.lastMessage?.text ?? 'No messages'}
                </div>

                <button
                  onClick={() => navigate(`/chat/${c._id}`)}
                  className="text-sm text-primary mt-2"
                >
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

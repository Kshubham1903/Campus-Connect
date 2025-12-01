import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../api';
import { useNavigate } from 'react-router-dom';

export default function SeniorDashboard(){
  const [incoming, setIncoming] = useState([]);
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();

  useEffect(()=>{ fetchRequests(); fetchChats(); },[]);

  async function fetchRequests(){
    try{
      const res = await API.get('/requests');
      // only show pending incoming requests in the "Incoming Requests" list for seniors
      if(Array.isArray(res.data.incoming)){
        setIncoming(res.data.incoming.filter(r => r.status === 'PENDING'));
      } else {
        setIncoming(res.data.incoming || []);
      }
    }catch(e){console.error(e);} }
  async function fetchChats(){ try{ const res = await API.get('/chats'); setChats(res.data.chats || []); }catch(e){console.error(e);} }

  async function respond(id, action){
    try{
      const res = await API.post(`/requests/${id}/respond`, { action });
      // if we accepted a request the backend will return chatId
      if(res.data?.chatId){
        // remove the request from incoming in UI immediately
        setIncoming(prev => prev.filter(r => r._id !== id));

        // refresh chats so the new chat appears under "My Chats"
        await fetchChats();

        toast.success('Request accepted — opening chat');
        // navigate to chat
        navigate(`/chat/${res.data.chatId}`);
        return;
      }

      // otherwise just refresh lists
      fetchRequests();
      fetchChats();
      toast.success('Request updated');
    }catch(e){ console.error(e); alert('Failed to respond'); }
  }

async function handleDeclineRequest(requestId) {
  // remove immediately from UI (optimistic)
  setIncoming(prev => prev.filter(r => r._id !== requestId));

  try {
    await API.delete(`/requests/${requestId}`);
    // server succeeded — nothing else to do
    toast.success('Request declined');
  } catch (err) {
    console.error('Failed to delete request', err);
    // rollback: re-fetch list or re-insert the removed request
    // Easiest: re-fetch requests from server to sync
    fetchRequests();
    // optionally show error to user
    toast.error('Could not decline request. Please try again.');
  }
}

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="card p-4 rounded-xl">
        <h3 className="text-lg font-medium mb-3">Incoming Requests</h3>
        {incoming.length === 0 && <div className="text-sm text-slate-500">No incoming requests</div>}
        <div className="space-y-3">
          {incoming.map(r => (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} key={r._id} className="p-3 rounded-lg card-pop surface border border-transparent hover:border-white/5">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{r.fromUser?.name || '(no name)'}</div>
                  <div className="text-sm text-gray-500">{r.fromUser?.email}</div>
                </div>
                <div className="text-sm text-gray-400">{r.status}</div>
              </div>
              <div className="text-sm text-gray-300 mt-2">{r.message}</div>
              <div className="flex gap-2 mt-3">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={()=>respond(r._id,'accept')} className="px-3 py-1 rounded bg-primary text-white btn-neon">Accept</motion.button>
                <motion.button
  className="px-3 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
  onClick={() => {
    if (!confirm('Decline this request?')) return;
    handleDeclineRequest(r._id);
  }}
>
  Decline
</motion.button>

                {r.status==='ACCEPTED' && r.chat && <button onClick={()=>navigate(`/chat/${r.chat}`)} className="px-3 py-1 rounded text-primary">Open Chat</button>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="card p-4 rounded-xl">
        <h3 className="text-lg font-medium mb-3">My Chats</h3>
        {chats.length === 0 && <div className="text-sm text-slate-500">No chats yet</div>}
        <div className="space-y-3">
          {chats.map(c => (
            <div key={c._id} className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-white/5 surface">
              <div>
                <div className="font-semibold">{c.partner?.name}</div>
                <div className="text-sm text-gray-500">{c.partner?.email}</div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-sm text-gray-300">{c.lastMessage?.text ?? 'No messages'}</div>
                <button onClick={()=>navigate(`/chat/${c._id}`)} className="text-sm text-primary mt-2">Open</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

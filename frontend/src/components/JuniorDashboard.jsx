// frontend/src/components/JuniorDashboard.jsx
import React, { useEffect, useState } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

export default function JuniorDashboard(){
  const [outgoing, setOutgoing] = useState([]);
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();

  useEffect(()=>{
    fetchRequests();
    fetchChats();
    // optionally poll every 10s for updates:
    // const iv = setInterval(()=>{ fetchRequests(); fetchChats(); }, 10000);
    // return () => clearInterval(iv);
  },[]);

  async function fetchRequests(){
    try{
      const res = await API.get('/requests');
      setOutgoing(res.data.outgoing || []);
    }catch(err){
      console.error('fetch outgoing err', err);
      // don't alert repeatedly in prod
    }
  }

  async function fetchChats(){
    try{
      const res = await API.get('/chats');
      setChats(res.data.chats || []);
    }catch(err){
      console.error('fetch chats err', err);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Your Requests</h3>
        {outgoing.length === 0 && (
          <div className="card py-6 px-4 text-center text-sm text-muted">No requests sent yet.</div>
        )}

        <ul className="space-y-3 mt-4">
          {outgoing.map(r => (
            <li key={r._id} className="card p-3 border-transparent hover:border-white/5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm text-muted"><strong>To:</strong> {r.toUser?.name} <span className="text-xs text-gray-300">({r.toUser?.email})</span></div>
                  <div className="mt-1 text-xs text-muted"><strong>Status:</strong> {r.status}</div>
                  <div className="mt-3 text-sm text-gray-200">{r.message}</div>
                </div>

                {r.status === 'ACCEPTED' && r.chat ? (
                  <div className="flex-shrink-0 ml-3">
                    <button onClick={() => navigate(`/chat/${r.chat}`)} className="btn btn-primary">Open Chat</button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Your Chats</h3>
        {chats.length === 0 && (
          <div className="card py-6 px-4 text-center text-sm text-muted">No active chats. When a senior accepts, a chat will appear here.</div>
        )}

        <ul className="space-y-3 mt-4">
          {chats.map(c => (
            <li key={c._id} className="card p-3 border-transparent hover:border-white/5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold">{c.partner?.name || 'Unknown'}</div>
                  <div className="text-xs text-muted">{c.partner?.email}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/chat/${c._id}`)} className="btn btn-sm btn-primary">Open</button>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-300">
                {c.lastMessage ? `${c.lastMessage.text} — ${new Date(c.lastMessage.createdAt).toLocaleString()}` : <em>No messages yet</em>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

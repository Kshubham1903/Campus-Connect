import React, { useEffect, useState } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

export default function SeniorDashboard(){
  const [incoming, setIncoming] = useState([]);
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();

  useEffect(()=>{ fetchRequests(); fetchChats(); },[]);

  async function fetchRequests(){ try{ const res = await API.get('/requests'); setIncoming(res.data.incoming || []); }catch(e){console.error(e);} }
  async function fetchChats(){ try{ const res = await API.get('/chats'); setChats(res.data.chats || []); }catch(e){console.error(e);} }

  async function respond(id, action){
    try{
      const res = await API.post(`/requests/${id}/respond`, { action });
      if(res.data?.chatId){ fetchRequests(); fetchChats(); navigate(`/chat/${res.data.chatId}`); return; }
      fetchRequests(); fetchChats();
    }catch(e){ console.error(e); alert('Failed to respond'); }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-3">Incoming Requests</h3>
        {incoming.length === 0 && <div className="text-sm text-gray-500">No incoming requests</div>}
        <div className="space-y-3">
          {incoming.map(r => (
            <div key={r._id} className="p-3 border rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{r.fromUser?.name || '(no name)'}</div>
                  <div className="text-sm text-gray-500">{r.fromUser?.email}</div>
                </div>
                <div className="text-sm text-gray-400">{r.status}</div>
              </div>
              <div className="text-sm text-gray-700 mt-2">{r.message}</div>
              <div className="flex gap-2 mt-3">
                <button onClick={()=>respond(r._id,'accept')} className="px-3 py-1 rounded bg-primary text-white">Accept</button>
                <button onClick={()=>respond(r._id,'decline')} className="px-3 py-1 rounded border">Decline</button>
                {r.status==='ACCEPTED' && r.chat && <button onClick={()=>navigate(`/chat/${r.chat}`)} className="px-3 py-1 rounded text-primary">Open Chat</button>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-3">My Chats</h3>
        {chats.length === 0 && <div className="text-sm text-gray-500">No chats yet</div>}
        <div className="space-y-3">
          {chats.map(c => (
            <div key={c._id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-semibold">{c.partner?.name}</div>
                <div className="text-sm text-gray-500">{c.partner?.email}</div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-sm text-gray-600">{c.lastMessage?.text ?? 'No messages'}</div>
                <button onClick={()=>navigate(`/chat/${c._id}`)} className="text-sm text-primary mt-2">Open</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

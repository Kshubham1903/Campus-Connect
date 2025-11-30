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
    <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:20 }}>
      <div>
        <h3>Your Requests</h3>
        {outgoing.length === 0 && <div style={{ color:'#666' }}>No requests sent yet.</div>}
        <ul style={{ listStyle:'none', padding:0 }}>
          {outgoing.map(r => (
            <li key={r._id} style={{ padding:10, border:'1px solid #eee', marginBottom:8 }}>
              <div><strong>To:</strong> {r.toUser?.name} ({r.toUser?.email})</div>
              <div><strong>Status:</strong> {r.status}</div>
              <div style={{ marginTop:6 }}>{r.message}</div>
              {r.status === 'ACCEPTED' && r.chat ? (
                <div style={{ marginTop:8 }}>
                  <button onClick={() => navigate(`/chat/${r.chat}`)}>Open Chat</button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3>Your Chats</h3>
        {chats.length === 0 && <div style={{ color:'#666' }}>No active chats. When a senior accepts, a chat will appear here.</div>}
        <ul style={{ listStyle:'none', padding:0 }}>
          {chats.map(c => (
            <li key={c._id} style={{ padding:10, border:'1px solid #eee', marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <strong>{c.partner?.name || 'Unknown'}</strong>
                  <div style={{ fontSize:12, color:'#666' }}>{c.partner?.email}</div>
                </div>
                <div>
                  <button onClick={() => navigate(`/chat/${c._id}`)}>Open</button>
                </div>
              </div>
              <div style={{ marginTop:8, color:'#333' }}>
                {c.lastMessage ? `${c.lastMessage.text} — ${new Date(c.lastMessage.createdAt).toLocaleString()}` : <em>No messages yet</em>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

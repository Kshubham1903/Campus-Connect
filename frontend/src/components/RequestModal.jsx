// frontend/src/components/RequestModal.jsx
import React, { useState } from 'react';
import API from '../api';

export default function RequestModal({ senior, onClose, onSent }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function send() {
    setError('');
    if (!message.trim()) {
      setError('Please enter a short message explaining the help you need.');
      return;
    }
    setSending(true);
    try {
      await API.post('/requests', { toUserId: senior._id, message });
      setSending(false);
      if (onSent) onSent();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to send request');
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-start justify-center pt-24 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow p-6 w-[640px] z-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-semibold">Request help from {senior.name || senior.email}</div>
            <div className="text-sm text-gray-500">The senior will review and accept to start chatting.</div>
          </div>
          <div>
            <button onClick={onClose} className="text-sm text-gray-500 px-3 py-1">Close</button>
          </div>
        </div>

        <textarea
          className="w-full p-3 border rounded-md mb-3 h-36"
          placeholder="Describe the problem briefly (what you tried, where you're stuck)..."
          value={message}
          onChange={e=>setMessage(e.target.value)}
        />

        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

        <div className="flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
          <button onClick={send} disabled={sending} className="px-4 py-2 rounded-md bg-primary text-white">
            {sending ? 'Sending…' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

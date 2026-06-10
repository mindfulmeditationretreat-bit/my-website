'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, assetUrl } from '@/lib/api';
import { useSocket } from '@/components/SocketProvider';

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const IMAGE_EXTS = /\.(png|jpe?g|gif|webp|svg)$/i;
const isImage = (name) => name && IMAGE_EXTS.test(name);

export default function MessageThreadPage() {
  const { peerId } = useParams();
  const socketRef = useSocket();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [file, setFile] = useState(null);
  const [me, setMe] = useState(null);
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const fileRef = useRef(null);

  const scrollToBottom = () => setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

  const load = useCallback(async () => {
    const msgs = await api.get(`/messages/${peerId}`);
    setMessages(msgs);
    scrollToBottom();
  }, [peerId]);

  useEffect(() => { api.get('/users/me').then(setMe); load(); }, [peerId, load]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onNewMessage = (msg) => {
      if (String(msg.senderId) === String(peerId)) {
        setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
        scrollToBottom();
      }
    };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('new_message', onNewMessage);
    if (socket.connected) setConnected(true);
    return () => { socket.off('connect', onConnect); socket.off('disconnect', onDisconnect); socket.off('new_message', onNewMessage); };
  }, [socketRef, peerId]);

  async function handleSend(e) {
    e.preventDefault();
    if (!body.trim() && !file) return;
    setSending(true);
    try {
      let msg;
      if (file) {
        const fd = new FormData();
        fd.append('recipientId', peerId);
        if (body.trim()) fd.append('body', body.trim());
        fd.append('file', file);
        msg = await api.upload('/messages', fd);
      } else {
        msg = await api.post('/messages', { recipientId: Number(peerId), body });
      }
      setMessages((prev) => [...prev, msg]);
      setBody(''); setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      scrollToBottom();
    } catch (err) { alert(err.message); }
    finally { setSending(false); }
  }

  function renderAttachment(m) {
    if (!m.fileUrl) return null;
    const url = m.fileUrl.startsWith('http') ? m.fileUrl : `${BASE}${m.fileUrl}`;
    if (isImage(m.fileName || m.fileUrl)) {
      return <img src={url} alt={m.fileName || 'image'} className="max-w-[220px] rounded-xl mt-2 border border-gold/20" />;
    }
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 mt-2 text-xs text-gold/80 hover:text-gold border border-gold/20 rounded-lg px-3 py-2 bg-black/30">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        {m.fileName || 'Download file'}
      </a>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] min-h-[400px]">
      <div className="flex items-center justify-between mb-4">
        <Link href="/dashboard/messages" className="text-cream/60 hover:text-gold text-sm">← Back</Link>
        <span className={'flex items-center gap-1.5 text-xs ' + (connected ? 'text-green-400/70' : 'text-cream/30')}>
          <span className={'w-1.5 h-1.5 rounded-full ' + (connected ? 'bg-green-400' : 'bg-cream/30')} />
          {connected ? 'Live' : 'Connecting…'}
        </span>
      </div>

      <div className="card flex-1 overflow-y-auto space-y-3 mb-3 p-4">
        {messages.map((m) => {
          const mine = m.senderId === me?.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={
                'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ' +
                (mine ? 'bg-gold/20 text-cream rounded-br-none' : 'bg-white/[0.05] text-cream/90 rounded-bl-none')
              }>
                {m.body && <p>{m.body}</p>}
                {renderAttachment(m)}
                <p className="text-cream/40 text-[10px] mt-1">{new Date(m.createdAt).toLocaleString()}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* File preview strip */}
      {file && (
        <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-gold/10 border border-gold/20 rounded-xl text-sm text-cream/80">
          <svg className="w-4 h-4 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span className="truncate flex-1">{file.name}</span>
          <button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }} className="text-cream/50 hover:text-red-400">✕</button>
        </div>
      )}

      <form onSubmit={handleSend} className="flex gap-2 items-end">
        <input type="file" ref={fileRef} className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button type="button" onClick={() => fileRef.current?.click()}
          className="p-3 rounded-xl border border-gold/20 text-cream/60 hover:text-gold hover:border-gold/40 transition flex-shrink-0"
          title="Attach file">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input className="input flex-1" placeholder={file ? 'Add a caption (optional)…' : 'Type a message…'}
          value={body} onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }} />
        <button className="btn-primary flex-shrink-0" type="submit" disabled={sending}>
          {sending ? '…' : 'Send'}
        </button>
      </form>
    </div>
  );
}

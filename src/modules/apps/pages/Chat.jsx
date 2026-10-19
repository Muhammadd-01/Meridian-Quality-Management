import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Pin, PinOff, BellOff, Bell, Phone, Video, Search, MoreVertical, Paperclip, Smile, Send, X, FileText,
  Trash2, MessageSquarePlus, Users, MailOpen, Download, CheckCheck, Image as ImageIcon,
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import useCollection from '../../../hooks/useCollection';
import useCollections from '../../../hooks/useCollections';
import { useSettings } from '../../../lib/settings';
import { ENTITIES } from '../../../data/entities';
import {
  AppFrame, Pane, Avatar, LocalNotice, SearchField, FilterPills, IconButton, DemoBadge,
  uid, shortTime, dayLabel, formatBytes, readAsDataUrl, persisted, useQueryParam,
} from '../components/AppKit';
import { PEOPLE } from '../data';

const MAX_INLINE_BYTES = 300 * 1024; // files up to 300 KB are kept as data URLs
const MAX_ATTACHMENTS = 5;
const EMOJIS = ['😀', '😂', '😊', '😍', '🤔', '😅', '👍', '👏', '🙏', '🎉', '🔥', '✅', '❌', '⚠️', '📎', '📅', '💡', '🚀', '☕', '🤝', '👀', '💯', '📈', '📝'];

export default function Chat() {
  const toast = useToast();
  const [settings] = useSettings();
  const myName = settings.profile.name;
  const [conversations, setConversations] = useCollection('chatConversations');
  const [messages, setMessages] = useCollection('chatMessages');
  const { team } = useCollections(['team']);
  const q = useQueryParam();

  const [search, setSearch] = useState(q);
  const [tab, setTab] = useState('all');
  const [activeId, setActiveId] = useState(null);
  const [mobileThread, setMobileThread] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [threadSearch, setThreadSearch] = useState('');
  const [threadSearchOpen, setThreadSearchOpen] = useState(false);

  useEffect(() => { if (q) setSearch(q); }, [q]);

  const people = useMemo(() => {
    const map = new Map();
    PEOPLE.forEach(p => map.set(p.name, p));
    (team || []).forEach(m => { if (m?.name && !map.has(m.name)) map.set(m.name, { name: m.name, role: m.role, email: m.email, phone: m.phone }); });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [team]);

  const byConversation = useMemo(() => {
    const map = new Map();
    messages.forEach(m => {
      if (!map.has(m.conversationId)) map.set(m.conversationId, []);
      map.get(m.conversationId).push(m);
    });
    map.forEach(list => list.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
    return map;
  }, [messages]);

  const lastOf = (c) => {
    const list = byConversation.get(c.id);
    return list?.[list.length - 1];
  };

  const sorted = useMemo(() => [...conversations].sort((a, b) => {
    if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
    const la = lastOf(a)?.createdAt || a.createdAt || '';
    const lb = lastOf(b)?.createdAt || b.createdAt || '';
    return lb.localeCompare(la);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [conversations, byConversation]);

  const term = search.trim().toLowerCase();
  const visible = sorted.filter(c => {
    if (tab === 'unread' && !(c.unread > 0)) return false;
    if (tab === 'groups' && c.type !== 'group') return false;
    if (tab === 'pinned' && !c.pinned) return false;
    if (!term) return true;
    if (c.name.toLowerCase().includes(term)) return true;
    return (byConversation.get(c.id) || []).some(m => (m.text || '').toLowerCase().includes(term) || m.attachments?.some(a => a.name.toLowerCase().includes(term)));
  });

  // Desktop opens the first conversation; mobile starts on the list.
  useEffect(() => {
    if (activeId && conversations.some(c => c.id === activeId)) return;
    setActiveId(visible[0]?.id || sorted[0]?.id || null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, activeId]);

  const active = conversations.find(c => c.id === activeId) || null;
  const thread = active ? byConversation.get(active.id) || [] : [];
  const unreadTotal = conversations.reduce((s, c) => s + (Number(c.unread) || 0), 0);

  const updateConversation = (id, patch) => setConversations(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));

  const open = (id) => {
    setActiveId(id);
    setMobileThread(true);
    setMenuOpen(false);
    setThreadSearch('');
    setThreadSearchOpen(false);
    const c = conversations.find(x => x.id === id);
    if (c?.unread) updateConversation(id, { unread: 0 });
  };

  const sendMessage = ({ text, attachments }) => {
    if (!active) return false;
    const record = { id: uid('cm'), conversationId: active.id, sender: 'me', text, attachments, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, record]);
    if (!persisted(ENTITIES.chatMessages.key, list => list.some(m => m.id === record.id))) {
      setMessages(prev => prev.filter(m => m.id !== record.id));
      toast?.('Browser storage is full — the message was not saved. Remove large attachments or old files and try again.', 'error', 5000);
      return false;
    }
    return true;
  };

  const deleteMessage = (id) => setMessages(prev => prev.filter(m => m.id !== id));

  const deleteConversation = () => {
    if (!active) return;
    const id = active.id;
    setMessages(prev => prev.filter(m => m.conversationId !== id));
    setConversations(prev => prev.filter(c => c.id !== id));
    setActiveId(null);
    setMobileThread(false);
    setConfirmDelete(false);
    toast?.(`Conversation with ${active.name} deleted`, 'success');
  };

  const createConversation = (record) => {
    const existing = record.type === 'direct' && conversations.find(c => c.type === 'direct' && c.name === record.name);
    if (existing) {
      open(existing.id);
    } else {
      const c = { id: uid('conv'), unread: 0, pinned: false, muted: false, archived: false, online: false, createdAt: new Date().toISOString(), ...record };
      setConversations(prev => [c, ...prev]);
      setActiveId(c.id);
      setMobileThread(true);
      toast?.(record.type === 'group' ? `Group “${record.name}” created` : `Conversation with ${record.name} started`, 'success');
    }
    setNewOpen(false);
  };

  const shownThread = threadSearch.trim()
    ? thread.filter(m => (m.text || '').toLowerCase().includes(threadSearch.trim().toLowerCase()))
    : thread;

  return (
    <div>
      <PageHeader
        title="Chat"
        subtitle={`${conversations.length} conversations · ${unreadTotal} unread`}
        actions={<button type="button" className="btn-primary btn-sm" onClick={() => setNewOpen(true)}><MessageSquarePlus size={15} aria-hidden="true" /> New chat</button>}
      />
      <AppFrame>
        {/* Conversation list */}
        <Pane label="Conversations" className={`w-full lg:w-[340px] shrink-0 ${mobileThread ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 pb-3 space-y-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-gray-900">Chats</h2>
              <IconButton icon={MessageSquarePlus} label="New conversation" tone="ghost" size="sm" onClick={() => setNewOpen(true)} />
            </div>
            <SearchField id="chat-search" label="Search conversations and messages" value={search} onChange={setSearch} placeholder="Search chats or messages" />
            <FilterPills
              label="Conversation filter"
              value={tab}
              onChange={setTab}
              items={[
                { id: 'all', label: 'All' },
                { id: 'unread', label: 'Unread', count: conversations.filter(c => c.unread > 0).length },
                { id: 'groups', label: 'Groups' },
                { id: 'pinned', label: 'Pinned' },
              ]}
            />
          </div>
          <ul className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {visible.map(c => {
              const last = lastOf(c);
              const preview = last ? `${last.sender === 'me' ? 'You: ' : c.type === 'group' ? `${last.sender.split(' ')[0]}: ` : ''}${last.text || (last.attachments?.length ? `📎 ${last.attachments[0].name}` : '')}` : 'No messages yet';
              const isActive = c.id === activeId;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => open(c.id)}
                    aria-current={isActive ? 'true' : undefined}
                    className={`w-full flex items-center gap-3 rounded px-2.5 py-2.5 text-left transition-colors border-l-2 ${isActive ? 'bg-primary-50 border-primary-500' : 'border-transparent hover:bg-gray-50'}`}
                  >
                    <Avatar name={c.name} group={c.type === 'group'} online={c.type === 'direct' ? !!c.online : undefined} />
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className={`truncate text-[13.5px] ${c.unread ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>{c.name}</span>
                        {c.pinned && <Pin size={11} className="text-gray-400 shrink-0" aria-label="Pinned" />}
                        {c.muted && <BellOff size={11} className="text-gray-400 shrink-0" aria-label="Muted" />}
                        <span className="ml-auto text-[10.5px] text-gray-400 shrink-0">{shortTime(last?.createdAt || c.createdAt)}</span>
                      </span>
                      <span className="flex items-center gap-2 mt-0.5">
                        <span className={`truncate text-xs ${c.unread ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>{preview}</span>
                        {c.unread > 0 && <span className="ml-auto shrink-0 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary-600 text-white text-[10px] font-bold" aria-label={`${c.unread} unread`}>{c.unread}</span>}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
            {!visible.length && (
              <li className="px-4 py-10 text-center text-sm text-gray-500">
                {conversations.length ? 'No conversations match.' : 'No conversations yet.'}
              </li>
            )}
          </ul>
          <div className="px-4 py-3 border-t border-gray-100">
            <LocalNotice>Messages are stored in this browser only. There is no messaging server, so nobody else receives them.</LocalNotice>
          </div>
        </Pane>

        {/* Thread */}
        <Pane label="Conversation" className={`flex-1 ${mobileThread ? 'flex' : 'hidden lg:flex'}`}>
          {active ? (
            <>
              <div className="flex items-center gap-3 px-3 sm:px-4 py-3 border-b border-gray-100">
                <IconButton icon={ArrowLeft} label="Back to conversations" tone="ghost" size="sm" className="lg:hidden" onClick={() => setMobileThread(false)} />
                <Avatar name={active.name} group={active.type === 'group'} online={active.type === 'direct' ? !!active.online : undefined} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 truncate flex items-center gap-1.5">{active.name}<DemoBadge show={active.isDemo} /></p>
                  <p className="text-xs text-gray-500 truncate">
                    {active.type === 'group' ? (active.members || []).join(', ') : active.role || (active.online ? 'Online' : 'Offline')}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 relative">
                  {active.type === 'direct' && (
                    <>
                      <Link to={`/apps/voice-call?contact=${encodeURIComponent(active.name)}`} className="hidden sm:grid place-items-center w-8 h-8 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100" aria-label={`Voice call ${active.name}`} title="Voice call"><Phone size={15} aria-hidden="true" /></Link>
                      <Link to={`/apps/video-call?contact=${encodeURIComponent(active.name)}`} className="hidden sm:grid place-items-center w-8 h-8 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100" aria-label={`Video call ${active.name}`} title="Video call"><Video size={15} aria-hidden="true" /></Link>
                    </>
                  )}
                  <IconButton icon={Search} label="Search in conversation" tone="ghost" size="sm" active={threadSearchOpen} onClick={() => { setThreadSearchOpen(o => !o); setThreadSearch(''); }} />
                  <IconButton icon={MoreVertical} label="Conversation options" tone="ghost" size="sm" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)} />
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                      <div role="menu" className="menu-panel absolute right-0 top-10 z-20 w-52 py-1">
                        <button type="button" role="menuitem" className="menu-item w-full" onClick={() => { updateConversation(active.id, { pinned: !active.pinned }); setMenuOpen(false); }}>
                          {active.pinned ? <PinOff size={14} aria-hidden="true" /> : <Pin size={14} aria-hidden="true" />} {active.pinned ? 'Unpin' : 'Pin to top'}
                        </button>
                        <button type="button" role="menuitem" className="menu-item w-full" onClick={() => { updateConversation(active.id, { muted: !active.muted }); setMenuOpen(false); }}>
                          {active.muted ? <Bell size={14} aria-hidden="true" /> : <BellOff size={14} aria-hidden="true" />} {active.muted ? 'Unmute' : 'Mute'}
                        </button>
                        <button type="button" role="menuitem" className="menu-item w-full" onClick={() => { updateConversation(active.id, { unread: Math.max(1, active.unread || 0) }); setMenuOpen(false); setMobileThread(false); }}>
                          <MailOpen size={14} aria-hidden="true" /> Mark as unread
                        </button>
                        <button type="button" role="menuitem" className="menu-item w-full text-danger-600" onClick={() => { setConfirmDelete(true); setMenuOpen(false); }}>
                          <Trash2 size={14} aria-hidden="true" /> Delete conversation
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {threadSearchOpen && (
                <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  <SearchField id="thread-search" label="Search this conversation" value={threadSearch} onChange={setThreadSearch} placeholder="Search this conversation" className="flex-1" />
                  <span className="text-xs text-gray-500 shrink-0">{threadSearch ? `${shownThread.length} found` : ''}</span>
                </div>
              )}
              <MessageList messages={shownThread} isGroup={active.type === 'group'} myName={myName} onDelete={deleteMessage} highlight={threadSearch.trim()} />
              <Composer key={active.id} onSend={sendMessage} recipient={active.name} />
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-center p-6">
              <div>
                <span className="mx-auto mb-3 grid place-items-center w-14 h-14 rounded-full bg-primary-50 text-primary-600"><MessageSquarePlus size={24} aria-hidden="true" /></span>
                <p className="font-bold text-gray-900">No conversation selected</p>
                <p className="text-sm text-gray-500 mt-1">Pick a chat from the list or start a new one.</p>
                <button type="button" className="btn-primary btn-sm mt-4" onClick={() => setNewOpen(true)}>New chat</button>
              </div>
            </div>
          )}
        </Pane>
      </AppFrame>

      <NewConversationModal isOpen={newOpen} onClose={() => setNewOpen(false)} people={people} onCreate={createConversation} />
      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteConversation}
        title="Delete conversation"
        message={`Delete the conversation with ${active?.name} and all ${thread.length} messages? This cannot be undone.`}
      />
    </div>
  );
}

function MessageList({ messages, isGroup, myName, onDelete, highlight }) {
  const endRef = useRef(null);
  const last = messages[messages.length - 1]?.id;
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [last]);

  if (!messages.length) {
    return (
      <div className="flex-1 grid place-items-center p-6 text-center text-sm text-gray-500">
        {highlight ? 'No messages match your search.' : 'No messages yet — say hello 👋'}
      </div>
    );
  }

  let lastDay = '';
  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-3 bg-gray-50/60" aria-live="polite">
      {messages.map(m => {
        const day = dayLabel(m.createdAt);
        const showDay = day !== lastDay;
        lastDay = day;
        const mine = m.sender === 'me';
        return (
          <React.Fragment key={m.id}>
            {showDay && (
              <div className="flex items-center gap-3 py-1" role="separator">
                <span className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] font-semibold text-gray-500 bg-surface-raised border border-gray-200 rounded-full px-3 py-0.5">{day}</span>
                <span className="flex-1 h-px bg-gray-200" />
              </div>
            )}
            <div className={`group flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
              <Avatar name={mine ? myName : m.sender} size="sm" />
              <div className={`max-w-[85%] sm:max-w-[70%] min-w-0 ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                {isGroup && !mine && <span className="text-[11px] font-semibold text-gray-500 mb-0.5 px-1">{m.sender}</span>}
                {m.text && (
                  <div className={`px-3.5 py-2 rounded-lg text-[13.5px] leading-relaxed whitespace-pre-wrap break-words ${mine ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-surface-raised border border-gray-200 text-gray-800 rounded-bl-sm'}`}>
                    {m.text}
                  </div>
                )}
                {m.attachments?.length > 0 && (
                  <div className={`mt-1 flex flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}>
                    {m.attachments.map((a, i) => <Attachment key={`${a.name}-${i}`} a={a} />)}
                  </div>
                )}
                <span className="flex items-center gap-1 text-[10.5px] text-gray-400 mt-1 px-1">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {mine && <CheckCheck size={12} className="text-primary-500" aria-label="Saved" />}
                  {mine && (
                    <button type="button" onClick={() => onDelete(m.id)} className="ml-1 opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-400 hover:text-danger-600 transition-opacity" aria-label="Delete message">
                      <Trash2 size={12} aria-hidden="true" />
                    </button>
                  )}
                </span>
              </div>
            </div>
          </React.Fragment>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

function Attachment({ a }) {
  const isImage = a.type?.startsWith('image/');
  if (isImage && a.dataUrl) {
    return (
      <a href={a.dataUrl} download={a.name} className="block rounded-lg overflow-hidden border border-gray-200 max-w-[240px]" title={`Download ${a.name}`}>
        <img src={a.dataUrl} alt={a.name} className="block max-h-48 w-auto object-cover" />
      </a>
    );
  }
  const body = (
    <>
      <span className="grid place-items-center w-8 h-8 rounded bg-primary-50 text-primary-600 shrink-0">{isImage ? <ImageIcon size={15} aria-hidden="true" /> : <FileText size={15} aria-hidden="true" />}</span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-gray-800 truncate max-w-[180px]">{a.name}</span>
        <span className="block text-[10.5px] text-gray-500">{formatBytes(a.size)}{a.dataUrl ? '' : ' · name only'}</span>
      </span>
      {a.dataUrl && <Download size={14} className="text-gray-400 shrink-0" aria-hidden="true" />}
    </>
  );
  return a.dataUrl
    ? <a href={a.dataUrl} download={a.name} className="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-surface-raised px-2.5 py-2 hover:border-primary-300">{body}</a>
    : <div className="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-surface-raised px-2.5 py-2" title="Larger than 300 KB, so only the file name was kept">{body}</div>;
}

function Composer({ onSend, recipient }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const fileRef = useRef(null);

  const addFiles = async (list) => {
    const picked = [...list].slice(0, MAX_ATTACHMENTS - files.length);
    if (list.length > picked.length) toast?.(`Up to ${MAX_ATTACHMENTS} attachments per message.`, 'info');
    setBusy(true);
    const next = [];
    for (const f of picked) {
      if (f.size <= MAX_INLINE_BYTES) {
        try {
          next.push({ name: f.name, size: f.size, type: f.type, dataUrl: await readAsDataUrl(f) });
        } catch {
          next.push({ name: f.name, size: f.size, type: f.type });
        }
      } else {
        next.push({ name: f.name, size: f.size, type: f.type });
        toast?.(`${f.name} is over 300 KB — only its name and size are kept, not the file itself.`, 'info', 4500);
      }
    }
    setFiles(prev => [...prev, ...next]);
    setBusy(false);
  };

  const submit = (e) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body && !files.length) return;
    if (onSend({ text: body, attachments: files })) {
      setText('');
      setFiles([]);
      setEmojiOpen(false);
      inputRef.current?.focus();
    }
  };

  return (
    <form onSubmit={submit} className="border-t border-gray-100 p-3 relative" aria-label={`Message ${recipient}`}>
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 mb-2" aria-label="Attachments to send">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 pl-2.5 pr-1 py-1 text-xs text-gray-700 max-w-full">
              <Paperclip size={12} aria-hidden="true" />
              <span className="truncate max-w-[160px]">{f.name}</span>
              <span className="text-gray-400">{formatBytes(f.size)}</span>
              <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="grid place-items-center w-5 h-5 rounded-full hover:bg-gray-200" aria-label={`Remove ${f.name}`}><X size={11} aria-hidden="true" /></button>
            </li>
          ))}
        </ul>
      )}
      {emojiOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setEmojiOpen(false)} aria-hidden="true" />
          <div className="menu-panel absolute bottom-full left-3 mb-2 z-20 p-2 grid grid-cols-8 gap-0.5 w-[min(300px,calc(100%-1.5rem))]" role="dialog" aria-label="Emoji picker">
            {EMOJIS.map(e => (
              <button key={e} type="button" className="grid place-items-center h-8 rounded hover:bg-gray-100 text-lg" onClick={() => { setText(t => t + e); inputRef.current?.focus(); }} aria-label={`Insert ${e}`}>{e}</button>
            ))}
          </div>
        </>
      )}
      <div className="flex items-end gap-1.5">
        <IconButton icon={Smile} label="Insert emoji" tone="ghost" size="sm" active={emojiOpen} onClick={() => setEmojiOpen(o => !o)} />
        <IconButton icon={Paperclip} label="Attach files" tone="ghost" size="sm" disabled={busy || files.length >= MAX_ATTACHMENTS} onClick={() => fileRef.current?.click()} />
        <input ref={fileRef} type="file" multiple className="hidden" aria-hidden="true" tabIndex={-1} onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        <label htmlFor="chat-composer" className="sr-only">Message</label>
        <textarea
          id="chat-composer"
          ref={inputRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder="Type a message…"
          className="form-input resize-none min-h-[38px] max-h-32 flex-1"
        />
        <button type="submit" className="btn-primary !px-3 h-[38px] shrink-0" disabled={busy || (!text.trim() && !files.length)} aria-label="Send message">
          <Send size={15} aria-hidden="true" />
        </button>
      </div>
      <p className="text-[10.5px] text-gray-400 mt-1.5 hidden sm:block">Enter to send · Shift+Enter for a new line · attachments up to 300 KB are stored in full</p>
    </form>
  );
}

function NewConversationModal({ isOpen, onClose, people, onCreate }) {
  const [type, setType] = useState('direct');
  const [person, setPerson] = useState('');
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) { setType('direct'); setPerson(''); setGroupName(''); setMembers([]); setErrors({}); }
  }, [isOpen]);

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (type === 'direct' && !person) errs.person = 'Choose who to message.';
    if (type === 'group') {
      if (!groupName.trim()) errs.groupName = 'Give the group a name.';
      if (members.length < 2) errs.members = 'Pick at least two members.';
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (type === 'direct') {
      const p = people.find(x => x.name === person);
      onCreate({ type: 'direct', name: person, role: p?.role || '' });
    } else {
      onCreate({ type: 'group', name: groupName.trim(), members });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New conversation"
      footer={<><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="submit" form="new-chat-form" className="btn-primary">{type === 'group' ? 'Create group' : 'Start chat'}</button></>}
    >
      <form id="new-chat-form" onSubmit={submit} className="space-y-4" noValidate>
        <fieldset>
          <legend className="form-label">Type</legend>
          <div className="grid grid-cols-2 gap-2">
            {[{ id: 'direct', label: 'Direct message', icon: MessageSquarePlus }, { id: 'group', label: 'Group', icon: Users }].map(o => (
              <label key={o.id} className={`flex items-center gap-2 rounded border px-3 py-2.5 cursor-pointer text-sm font-medium ${type === o.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                <input type="radio" name="chat-type" value={o.id} checked={type === o.id} onChange={() => setType(o.id)} className="sr-only" />
                <o.icon size={15} aria-hidden="true" /> {o.label}
              </label>
            ))}
          </div>
        </fieldset>
        {type === 'direct' ? (
          <div>
            <label htmlFor="chat-person" className="form-label">Person</label>
            <select id="chat-person" className="form-select" value={person} onChange={(e) => setPerson(e.target.value)} aria-invalid={!!errors.person} aria-describedby={errors.person ? 'chat-person-error' : undefined}>
              <option value="">Select a person…</option>
              {people.map(p => <option key={p.name} value={p.name}>{p.name}{p.role ? ` — ${p.role}` : ''}</option>)}
            </select>
            {errors.person && <p id="chat-person-error" className="form-error">{errors.person}</p>}
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="chat-group-name" className="form-label">Group name</label>
              <input id="chat-group-name" className="form-input" value={groupName} onChange={(e) => setGroupName(e.target.value)} maxLength={60} placeholder="e.g. Cascade Retail Audit" aria-invalid={!!errors.groupName} aria-describedby={errors.groupName ? 'chat-group-name-error' : undefined} />
              {errors.groupName && <p id="chat-group-name-error" className="form-error">{errors.groupName}</p>}
            </div>
            <fieldset aria-describedby={errors.members ? 'chat-members-error' : undefined}>
              <legend className="form-label">Members ({members.length} selected)</legend>
              <div className="max-h-56 overflow-y-auto rounded border border-gray-200 divide-y divide-gray-100">
                {people.map((p, i) => (
                  <label key={p.name} htmlFor={`chat-member-${i}`} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                    <input id={`chat-member-${i}`} type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" checked={members.includes(p.name)} onChange={(e) => setMembers(prev => (e.target.checked ? [...prev, p.name] : prev.filter(n => n !== p.name)))} />
                    <Avatar name={p.name} size="xs" />
                    <span className="text-sm text-gray-800 truncate">{p.name}</span>
                    <span className="ml-auto text-xs text-gray-400 truncate hidden sm:block">{p.role}</span>
                  </label>
                ))}
              </div>
              {errors.members && <p id="chat-members-error" className="form-error">{errors.members}</p>}
            </fieldset>
          </>
        )}
      </form>
    </Modal>
  );
}

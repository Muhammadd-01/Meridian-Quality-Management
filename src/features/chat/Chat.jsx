import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import {
  Search, Bell, Settings, MoreHorizontal, MoreVertical, Clock, Smile, Image as ImageIcon,
  FileText, Send, ArrowLeft, Users, X, Copy, Trash2, BellOff, Eraser, Paperclip, MessageSquare,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import useLocalStorage from '../../hooks/useLocalStorage';
import { generateId } from '../../utils/format';
import { useSettings } from '../../lib/settings';
import {
  chatContacts, initialConversations, demoReplies,
} from '../../data/chatData';

// Fixed colours (not theme variables) so initials stay legible in both modes.
const AVATAR_TONES = [
  'bg-teal-800 text-primrose',
  'bg-primrose text-primary-ink',
  'bg-teal-500 text-white',
  'bg-accent text-white',
  'bg-teal-300 text-teal-900',
  'bg-rust text-white',
];

const STATUS = {
  online: { dot: 'bg-success-400', label: 'Active now' },
  away: { dot: 'bg-accent', label: 'Away' },
  offline: { dot: 'bg-gray-400', label: 'Offline' },
};

const TABS = [
  { id: 'chat', label: 'Chat' },
  { id: 'groups', label: 'Groups' },
  { id: 'contacts', label: 'Contacts' },
];

const EMOJIS = ['😀', '😂', '😊', '😍', '👍', '👏', '🙏', '🎉', '✅', '📌', '📊', '📎', '🔥', '💡', '🤝', '👀'];

const contactById = Object.fromEntries(chatContacts.map(c => [c.id, c]));

const initials = (name) => name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
const toneFor = (key) => AVATAR_TONES[[...key].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_TONES.length];
const nowTime = () => format(new Date(), 'HH:mm');
const formatSize = (bytes) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`);

function Avatar({ name, size = 'md', status, group }) {
  const sizes = { sm: 'w-8 h-8 text-[11px]', md: 'w-10 h-10 text-xs', lg: 'w-11 h-11 text-sm' };
  return (
    <span className="relative shrink-0">
      <span className={`${sizes[size]} rounded-full grid place-items-center font-bold ${toneFor(name)}`} aria-hidden="true">
        {group ? <Users size={size === 'sm' ? 14 : 17} /> : initials(name)}
      </span>
      {status && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[color:var(--surface-raised)] ${STATUS[status].dot}`} />
      )}
    </span>
  );
}

/** Display info for a conversation: title, subtitle, presence and avatar key. */
function describe(conv) {
  if (conv.kind === 'group') {
    const names = conv.members.map(id => contactById[id]?.name.split(' ')[0]).filter(Boolean);
    return { title: conv.name, subtitle: `${conv.members.length + 1} members · You, ${names.join(', ')}`, status: null, group: true };
  }
  const contact = contactById[conv.contactId];
  return { title: contact.name, subtitle: STATUS[contact.status].label, status: contact.status, role: contact.role, group: false };
}

/** Small popover that closes on outside click or Escape. */
function usePopover() {
  const [open, setOpen] = useState(null);
  const ref = useRef(null);
  useEffect(() => {
    if (open === null) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(null); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(null); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return [open, setOpen, ref];
}

export default function Chat() {
  const addToast = useToast();
  const [{ profile }] = useSettings();
  const [conversations, setConversations] = useLocalStorage('meridian-chat', initialConversations);
  const [activeId, setActiveId] = useState(initialConversations[0].id);
  const [tab, setTab] = useState('chat');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(null); // { convId, name }
  const [mobileThread, setMobileThread] = useState(false);
  const [threadSearchOpen, setThreadSearchOpen] = useState(false);
  const [threadQuery, setThreadQuery] = useState('');
  const [muted, setMuted] = useState({});
  const [menu, setMenu, menuRef] = usePopover();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Escape closes the message search (an open menu takes the first Escape).
  useEffect(() => {
    if (!threadSearchOpen || menu !== null) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setThreadSearchOpen(false);
      setThreadQuery('');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [threadSearchOpen, menu]);

  const active = conversations.find(c => c.id === activeId) || conversations[0];
  const activeInfo = describe(active);

  const visibleMessages = useMemo(() => {
    const q = threadQuery.trim().toLowerCase();
    if (!q) return active.messages;
    return active.messages.filter(m => (m.text || m.attachment?.name || '').toLowerCase().includes(q));
  }, [active, threadQuery]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeId, active.messages.length, typing]);

  const listItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (text) => !q || text.toLowerCase().includes(q);
    if (tab === 'contacts') {
      return chatContacts.filter(c => matches(`${c.name} ${c.role}`)).sort((a, b) => a.name.localeCompare(b.name));
    }
    return conversations
      .filter(c => (tab === 'groups' ? c.kind === 'group' : c.kind === 'direct'))
      .filter(c => matches(describe(c).title));
  }, [conversations, tab, query]);

  const openConversation = (id) => {
    setActiveId(id);
    setMobileThread(true);
    setThreadSearchOpen(false);
    setThreadQuery('');
    setConversations(prev => prev.map(c => (c.id === id && c.unread ? { ...c, unread: 0 } : c)));
  };

  const openContact = (contact) => {
    const existing = conversations.find(c => c.kind === 'direct' && c.contactId === contact.id);
    if (existing) {
      openConversation(existing.id);
    } else {
      const conv = { id: `c-${generateId()}`, kind: 'direct', contactId: contact.id, unread: 0, messages: [] };
      setConversations(prev => [conv, ...prev]);
      setActiveId(conv.id);
      setMobileThread(true);
    }
    setTab('chat');
    setQuery('');
  };

  const appendMessage = (convId, message) => {
    setConversations(prev => {
      const target = prev.find(c => c.id === convId);
      if (!target) return prev;
      // Most recent conversation moves to the top of the list.
      return [{ ...target, messages: [...target.messages, message] }, ...prev.filter(c => c.id !== convId)];
    });
  };

  // Demo only: the other side "types" and answers with a canned reply.
  const simulateReply = (conv) => {
    const responderId = conv.kind === 'group'
      ? conv.members[Math.floor(Math.random() * conv.members.length)]
      : conv.contactId;
    const responder = contactById[responderId];
    timers.current.push(setTimeout(() => setTyping({ convId: conv.id, name: responder.name }), 700));
    timers.current.push(setTimeout(() => {
      setTyping(null);
      appendMessage(conv.id, {
        id: generateId(),
        from: responderId,
        text: demoReplies[Math.floor(Math.random() * demoReplies.length)],
        time: nowTime(),
      });
    }, 2300));
  };

  const send = (payload) => {
    appendMessage(active.id, { id: generateId(), from: 'me', time: nowTime(), ...payload });
    simulateReply(active);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    send({ text });
    setDraft('');
    setMenu(null);
  };

  const handleAttach = (e, kind) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    send({ attachment: { name: file.name, size: formatSize(file.size), kind } });
  };

  const deleteMessage = (messageId) => {
    setConversations(prev => prev.map(c => (c.id === active.id ? { ...c, messages: c.messages.filter(m => m.id !== messageId) } : c)));
    setMenu(null);
    addToast('Message deleted.', 'success');
  };

  const copyMessage = async (message) => {
    setMenu(null);
    try {
      await navigator.clipboard.writeText(message.text || message.attachment?.name || '');
      addToast('Message copied to clipboard.', 'success');
    } catch {
      addToast('Could not copy the message.', 'error');
    }
  };

  const clearChat = () => {
    setConversations(prev => prev.map(c => (c.id === active.id ? { ...c, messages: [] } : c)));
    setMenu(null);
    addToast('Conversation cleared.', 'success');
  };

  const toggleMute = () => {
    const next = !muted[active.id];
    setMuted(prev => ({ ...prev, [active.id]: next }));
    setMenu(null);
    addToast(next ? `Notifications muted for ${activeInfo.title}.` : `Notifications on for ${activeInfo.title}.`, 'info');
  };

  const senderName = (from) => (from === 'me' ? 'You' : contactById[from]?.name || 'Unknown');
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
  const unreadFor = (kind) => conversations.filter(c => c.kind === kind).reduce((sum, c) => sum + (c.unread || 0), 0);

  // Contacts tab is grouped by first letter.
  const contactGroups = tab === 'contacts'
    ? listItems.reduce((acc, c) => {
      const letter = c.name[0].toUpperCase();
      (acc[letter] ||= []).push(c);
      return acc;
    }, {})
    : null;

  return (
    <div className="flex gap-6 h-[calc(100vh-9.5rem)] min-h-[560px]" data-no-reveal>
      {/* ── Conversation list ─────────────────────────────────────────── */}
      <aside className={`${mobileThread ? 'hidden' : 'flex'} lg:flex flex-col w-full lg:w-[320px] xl:w-[340px] shrink-0 min-h-0`}>
        <div className="flex items-center gap-3 pb-5 border-b border-[color:var(--border-subtle)]">
          <Avatar name={profile.name} size="lg" status="online" />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-gray-900 truncate">{profile.name}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success-400" />
              Active · {profile.title}
            </p>
          </div>
          <button type="button" className="btn-icon relative" aria-label={`${totalUnread} unread messages`} title="Unread messages">
            <Bell size={18} />
            {totalUnread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />}
          </button>
        </div>

        <div className="relative mt-5">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={tab === 'contacts' ? 'Search contacts…' : 'Search conversations…'}
            className="form-input !pl-9"
            aria-label="Search chats"
          />
        </div>

        <div role="tablist" aria-label="Chat lists" className="mt-5 grid grid-cols-3 gap-1 p-1 rounded-lg bg-surface-raised border border-[color:var(--border-subtle)]">
          {TABS.map(t => {
            const count = t.id === 'chat' ? unreadFor('direct') : t.id === 'groups' ? unreadFor('group') : 0;
            const selected = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(t.id)}
                className={`relative py-2 rounded-md text-[13px] font-semibold transition-colors ${
                  selected ? 'bg-primary text-primary-ink shadow-glow-primary' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {t.label}
                {count > 0 && !selected && <span className="ml-1.5 inline-grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold align-middle">{count}</span>}
              </button>
            );
          })}
        </div>

        <p className="mt-5 mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-gray-500">
          {tab === 'chat' ? 'Recent' : tab === 'groups' ? 'Groups' : 'Contacts'}
        </p>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1 pb-2 space-y-1">
          {listItems.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-10">No matches for “{query}”.</p>
          )}

          {tab !== 'contacts' && listItems.map(conv => {
            const info = describe(conv);
            const last = conv.messages[conv.messages.length - 1];
            const isActive = conv.id === active.id;
            const isTyping = typing?.convId === conv.id;
            const preview = last ? `${last.from === 'me' ? 'You: ' : ''}${last.text || `📎 ${last.attachment.name}`}` : 'Say hello 👋';
            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => openConversation(conv.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all ${
                  isActive
                    ? 'bg-surface-raised shadow-sm ring-1 ring-[color:var(--hover-border)]'
                    : 'hover:bg-surface-raised/70'
                }`}
              >
                <Avatar name={info.title} status={info.status} group={info.group} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={`text-[13.5px] truncate ${conv.unread ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>{info.title}</span>
                    <span className="text-[11px] text-gray-500 shrink-0">{last?.time || ''}</span>
                  </span>
                  <span className="flex items-center justify-between gap-2 mt-0.5">
                    <span className={`text-xs truncate ${isTyping ? 'text-brand font-semibold italic' : conv.unread ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                      {isTyping ? 'typing…' : preview}
                    </span>
                    {conv.unread > 0 && (
                      <span className="shrink-0 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold">{conv.unread}</span>
                    )}
                    {muted[conv.id] && <BellOff size={12} className="shrink-0 text-gray-400" aria-label="Muted" />}
                  </span>
                </span>
              </button>
            );
          })}

          {tab === 'contacts' && Object.keys(contactGroups).map(letter => (
            <div key={letter} className="pb-2">
              <p className="px-3 pt-2 pb-1 text-xs font-extrabold text-brand">{letter}</p>
              {contactGroups[letter].map(contact => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => openContact(contact)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-surface-raised/70 transition-colors"
                >
                  <Avatar name={contact.name} size="sm" status={contact.status} />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-gray-800 truncate">{contact.name}</span>
                    <span className="block text-[11.5px] text-gray-500 truncate">{contact.role}</span>
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* ── Active conversation ──────────────────────────────────────── */}
      <section className={`${mobileThread ? 'flex' : 'hidden'} lg:flex card !rounded-xl flex-1 min-w-0 flex-col overflow-hidden hover:!shadow-sm`}>
        <header className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-[color:var(--border-subtle)]">
          <button type="button" className="btn-icon lg:hidden -ml-2" onClick={() => setMobileThread(false)} aria-label="Back to conversations">
            <ArrowLeft size={18} />
          </button>
          <Avatar name={activeInfo.title} status={activeInfo.status} group={activeInfo.group} />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-gray-900 truncate">{activeInfo.title}</p>
            <p className="text-xs text-gray-500 truncate flex items-center gap-1.5">
              {typing?.convId === active.id
                ? <span className="text-brand font-semibold italic">{typing.name.split(' ')[0]} is typing…</span>
                : <>
                  {activeInfo.status && <span className={`w-2 h-2 rounded-full ${STATUS[activeInfo.status].dot}`} />}
                  {activeInfo.subtitle}{activeInfo.role ? ` · ${activeInfo.role}` : ''}
                </>}
            </p>
          </div>

          <div className="flex items-center gap-2" ref={menu === 'header' ? menuRef : undefined}>
            <button
              type="button"
              onClick={() => { setThreadSearchOpen(o => !o); setThreadQuery(''); }}
              className={`w-10 h-10 rounded-full grid place-items-center transition-colors ${threadSearchOpen ? 'bg-primary text-primary-ink' : 'bg-gray-100 text-gray-600 hover:bg-primary-100 hover:text-brand-strong'}`}
              aria-label="Search in conversation"
              aria-pressed={threadSearchOpen}
            >
              <Search size={16} />
            </button>
            <button
              type="button"
              onClick={() => addToast('Chat settings will be available once messaging is connected.', 'info')}
              className="hidden sm:grid w-10 h-10 rounded-full place-items-center bg-gray-100 text-gray-600 hover:bg-primary-100 hover:text-brand-strong transition-colors"
              aria-label="Chat settings"
            >
              <Settings size={16} />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenu(menu === 'header' ? null : 'header')}
                className="w-10 h-10 rounded-full grid place-items-center bg-gray-100 text-gray-600 hover:bg-primary-100 hover:text-brand-strong transition-colors"
                aria-label="More options"
                aria-expanded={menu === 'header'}
              >
                <MoreHorizontal size={16} />
              </button>
              {menu === 'header' && (
                <div className="menu-panel absolute right-0 top-12 z-20 w-52 p-1.5" role="menu">
                  <button type="button" role="menuitem" className="menu-item" onClick={toggleMute}>
                    <BellOff size={15} /> {muted[active.id] ? 'Unmute notifications' : 'Mute notifications'}
                  </button>
                  <button type="button" role="menuitem" className="menu-item" onClick={() => { setThreadSearchOpen(true); setMenu(null); }}>
                    <Search size={15} /> Search messages
                  </button>
                  <button type="button" role="menuitem" className="menu-item !text-danger hover:!bg-danger-50" onClick={clearChat}>
                    <Eraser size={15} /> Clear chat
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {threadSearchOpen && (
          <div className="px-4 sm:px-6 py-2.5 border-b border-[color:var(--border-subtle)] bg-gray-50 flex items-center gap-2 animate-fade-in">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              autoFocus
              value={threadQuery}
              onChange={e => setThreadQuery(e.target.value)}
              placeholder={`Search messages with ${activeInfo.title}…`}
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
              aria-label="Search messages"
            />
            {threadQuery && <span className="text-xs text-gray-500 shrink-0">{visibleMessages.length} found</span>}
            <button type="button" className="btn-icon !w-7 !h-7" onClick={() => { setThreadSearchOpen(false); setThreadQuery(''); }} aria-label="Close search">
              <X size={14} />
            </button>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5 space-y-5 bg-[radial-gradient(circle_at_top_right,var(--canvas-glow),transparent_45%)]">
          {active.messages.length > 0 && !threadQuery && (
            <div className="flex items-center gap-3" aria-hidden="true">
              <span className="flex-1 h-px bg-[color:var(--border-subtle)]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 px-3 py-1 rounded-full bg-gray-100">Today</span>
              <span className="flex-1 h-px bg-[color:var(--border-subtle)]" />
            </div>
          )}

          {active.messages.length === 0 && (
            <div className="h-full grid place-items-center text-center">
              <div>
                <span className="mx-auto w-14 h-14 rounded-2xl grid place-items-center bg-primary-100 text-brand-strong mb-3">
                  <MessageSquare size={24} />
                </span>
                <p className="font-semibold text-gray-900">No messages yet</p>
                <p className="text-sm text-gray-500 mt-1">Start the conversation with {activeInfo.title}.</p>
              </div>
            </div>
          )}

          {threadQuery && visibleMessages.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-10">No messages match “{threadQuery}”.</p>
          )}

          {visibleMessages.map(m => {
            const mine = m.from === 'me';
            return (
              <div key={m.id} className={`group flex items-start gap-1.5 ${mine ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-xl px-4 py-3 animate-fade-in ${
                    mine
                      ? 'bg-primary-100 text-gray-900 rounded-tr-sm text-right'
                      : 'bg-teal-50 text-gray-900 rounded-tl-sm'
                  }`}
                >
                  <p className={`text-xs font-bold mb-1 ${mine ? 'text-brand-strong' : 'text-brand'}`}>{senderName(m.from)}</p>
                  {m.text && <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words text-left">{m.text}</p>}
                  {m.attachment && (
                    <div className="flex items-center gap-3 mt-1 p-2.5 rounded-lg bg-surface-raised/80 border border-[color:var(--border-subtle)] text-left">
                      <span className="w-9 h-9 rounded-md grid place-items-center bg-teal-800 text-primrose shrink-0">
                        {m.attachment.kind === 'image' ? <ImageIcon size={16} /> : <FileText size={16} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold truncate max-w-[200px]">{m.attachment.name}</span>
                        <span className="block text-[11px] text-gray-500">{m.attachment.size}</span>
                      </span>
                    </div>
                  )}
                  <p className={`mt-2 text-[11px] text-gray-500 flex items-center gap-1 ${mine ? 'justify-end' : ''}`}>
                    <Clock size={11} /> {m.time}
                  </p>
                </div>

                <div className="relative" ref={menu === m.id ? menuRef : undefined}>
                  <button
                    type="button"
                    onClick={() => setMenu(menu === m.id ? null : m.id)}
                    className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 opacity-60 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    aria-label="Message options"
                    aria-expanded={menu === m.id}
                  >
                    <MoreVertical size={15} />
                  </button>
                  {menu === m.id && (
                    <div className={`menu-panel absolute top-7 z-20 w-36 p-1.5 ${mine ? 'right-0' : 'left-0'}`} role="menu">
                      <button type="button" role="menuitem" className="menu-item" onClick={() => copyMessage(m)}>
                        <Copy size={14} /> Copy
                      </button>
                      <button type="button" role="menuitem" className="menu-item !text-danger hover:!bg-danger-50" onClick={() => deleteMessage(m.id)}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {typing?.convId === active.id && !threadQuery && (
            <div className="flex items-end gap-2 animate-fade-in" aria-live="polite">
              <div className="bg-teal-50 rounded-xl rounded-tl-sm px-4 py-3">
                <p className="text-xs font-bold text-brand mb-1.5">{typing.name}</p>
                <span className="flex gap-1" aria-label={`${typing.name} is typing`}>
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 sm:px-6 py-4 border-t border-[color:var(--border-subtle)]">
          <div className="relative flex-1 min-w-0 flex items-center rounded-full bg-gray-100 border border-transparent focus-within:border-[color:var(--focus-border)] focus-within:ring-[3px] focus-within:ring-[color:var(--focus-ring)] transition-shadow">
            <input
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Enter message…"
              className="flex-1 min-w-0 bg-transparent pl-5 pr-2 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none"
              aria-label="Message"
            />
            <div className="flex items-center gap-0.5 pr-3 text-brand" ref={menu === 'emoji' ? menuRef : undefined}>
              <button type="button" onClick={() => setMenu(menu === 'emoji' ? null : 'emoji')} className="p-1.5 rounded-full hover:bg-primary-100 transition-colors" aria-label="Insert emoji" aria-expanded={menu === 'emoji'}>
                <Smile size={17} />
              </button>
              <button type="button" onClick={() => imageInputRef.current?.click()} className="p-1.5 rounded-full hover:bg-primary-100 transition-colors" aria-label="Send image">
                <ImageIcon size={17} />
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="hidden sm:block p-1.5 rounded-full hover:bg-primary-100 transition-colors" aria-label="Attach file">
                <Paperclip size={17} />
              </button>
              {menu === 'emoji' && (
                <div className="menu-panel absolute right-0 bottom-14 z-20 p-2 grid grid-cols-8 gap-0.5 w-72">
                  {EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => { setDraft(d => d + emoji); inputRef.current?.focus(); }}
                      className="h-8 rounded-md text-lg hover:bg-primary-100 transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleAttach(e, 'image')} />
            <input ref={fileInputRef} type="file" className="hidden" onChange={e => handleAttach(e, 'file')} />
          </div>
          <button type="submit" disabled={!draft.trim()} className="btn-primary !rounded-full !px-6 shrink-0">
            <span className="hidden sm:inline">Send</span> <Send size={15} />
          </button>
        </form>
      </section>
    </div>
  );
}

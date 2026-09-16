import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import SkillBadge from '../components/SkillBadge';
import Modal from '../components/Modal';
import {
  Send,
  Calendar,
  MessageSquare,
  Loader2,
  CheckCheck,
  Check,
  ArrowRightLeft,
  Star,
  Video,
  ExternalLink,
  Code,
  Copy,
  User,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Search,
  Image as ImageIcon,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';

const MessagesPage = () => {
  const { user } = useAuth();
  const { socket, isUserOnline } = useSocket();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const targetConnectionId = searchParams.get('connectionId');
  const targetUserId = searchParams.get('userId');

  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [showBarterPanel, setShowBarterPanel] = useState(true);

  // New Chat Modal state
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [creatingChatId, setCreatingChatId] = useState(null);

  // Code Snippet Sharing State
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [codeToShare, setCodeToShare] = useState('');
  const [codeLang, setCodeLang] = useState('javascript');

  // File / Image Attachment State
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');

  // In-Chat Session Proposal Modal State
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [proposalTopic, setProposalTopic] = useState('');
  const [proposalDate, setProposalDate] = useState('');
  const [proposalStartTime, setProposalStartTime] = useState('18:00');
  const [proposalEndTime, setProposalEndTime] = useState('19:00');
  const [proposalNotes, setProposalNotes] = useState('');
  const [proposalRole, setProposalRole] = useState('peerTeaches'); // 'peerTeaches' or 'iTeach'
  const [actionLoadingProposalId, setActionLoadingProposalId] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // 1. Fetch user's active connections & handle targetUserId / targetConnectionId
  const fetchConnections = async () => {
    try {
      setLoadingConnections(true);
      const res = await api.get('/connections');
      let currentConns = [];
      if (res.data.success) {
        currentConns = res.data.data;
        setConnections(currentConns);
      }

      // If a targetUserId is passed in URL, ensure connection exists
      if (targetUserId) {
        try {
          const connRes = await api.post('/connections', { targetUserId });
          if (connRes.data.success && connRes.data.data) {
            const newConn = connRes.data.data;
            setConnections((prev) => {
              if (prev.some((c) => c._id === newConn._id)) return prev;
              return [newConn, ...prev];
            });
            setSelectedConnection(newConn);
            return;
          }
        } catch (cErr) {
          console.error('Failed to create/get connection for targetUserId', cErr);
        }
      }

      // Select initial connection by targetConnectionId or fallback to first
      if (targetConnectionId) {
        const found = currentConns.find((c) => c._id === targetConnectionId);
        if (found) setSelectedConnection(found);
        else if (currentConns.length > 0) setSelectedConnection(currentConns[0]);
      } else if (currentConns.length > 0) {
        setSelectedConnection(currentConns[0]);
      }
    } catch (err) {
      console.error('Error fetching connections:', err);
    } finally {
      setLoadingConnections(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [targetConnectionId, targetUserId]);

  // 2. Fetch messages when selected connection changes
  const fetchConversation = async (silent = false) => {
    if (!selectedConnection) return;
    try {
      if (!silent) setLoadingMessages(true);
      const res = await api.get(`/messages/${selectedConnection._id}`);
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!selectedConnection) return;

    fetchConversation();

    // Reset proposal defaults when switching conversation
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setProposalDate(d.toISOString().split('T')[0]);
    if (selectedConnection.sharedSkills?.length > 0) {
      setProposalTopic(selectedConnection.sharedSkills[0].name || 'Skill Exchange Session');
    } else if (selectedConnection.peer?.skillsToTeach?.length > 0) {
      setProposalTopic(selectedConnection.peer.skillsToTeach[0].skill?.name || '1:1 Session');
    } else {
      setProposalTopic('System Design & Code Review');
    }

    // Socket: Join conversation room
    if (socket) {
      socket.emit('join_conversation', selectedConnection._id);
    }

    // Polling fallback to keep messages synced even if socket lags
    const pollInterval = setInterval(() => {
      fetchConversation(true);
    }, 4000);

    return () => {
      clearInterval(pollInterval);
      if (socket) {
        socket.emit('leave_conversation', selectedConnection._id);
      }
    };
  }, [selectedConnection?._id, socket]);

  // 3. Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPeerTyping]);

  // 4. Listen for incoming socket messages and typing events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      const convId = typeof msg.conversation === 'object' ? msg.conversation?._id : msg.conversation;
      if (selectedConnection && convId === selectedConnection._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
      setConnections((prev) =>
        prev.map((c) => (c._id === convId ? { ...c, lastMessage: msg } : c))
      );
    };

    const handleMessageUpdated = (updatedMsg) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m))
      );
    };

    const handlePeerTyping = ({ conversationId, isTyping }) => {
      if (selectedConnection && conversationId === selectedConnection._id) {
        setIsPeerTyping(isTyping);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_updated', handleMessageUpdated);
    socket.on('peer_typing', handlePeerTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_updated', handleMessageUpdated);
      socket.off('peer_typing', handlePeerTyping);
    };
  }, [socket, selectedConnection?._id]);

  // 5. Typing indicator emission
  const handleInputChange = (e) => {
    setNewMessageText(e.target.value);

    if (!socket || !selectedConnection) return;

    socket.emit('typing_start', {
      conversationId: selectedConnection._id,
      peerId: selectedConnection.peer?._id,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', {
        conversationId: selectedConnection._id,
        peerId: selectedConnection.peer?._id,
      });
    }, 1500);
  };

  // 6. Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedConnection) return;

    const text = newMessageText.trim();
    setNewMessageText('');

    const peerId = selectedConnection.peer?._id || selectedConnection.peer?.id;

    if (socket) {
      socket.emit('typing_stop', {
        conversationId: selectedConnection._id,
        peerId,
      });
    }

    try {
      const res = await api.post('/messages', {
        connectionId: selectedConnection._id,
        receiverId: peerId,
        text,
      });

      if (res.data.success) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.data.data._id)) return prev;
          return [...prev, res.data.data];
        });
      }
    } catch (err) {
      addToast('Failed to send message', 'error');
    }
  };

  // 7. Start New Chat Search
  const handleSearchUsers = async (query) => {
    setUserSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoadingSearch(true);
      const res = await api.get(`/users?search=${encodeURIComponent(query)}&limit=8`);
      if (res.data.success) {
        const filtered = (res.data.data || []).filter((u) => u._id !== user?._id);
        setSearchResults(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleStartChatWithUser = async (targetUser) => {
    try {
      setCreatingChatId(targetUser._id);
      const res = await api.post('/connections', { targetUserId: targetUser._id });
      if (res.data.success && res.data.data) {
        const newConn = res.data.data;
        setConnections((prev) => {
          const exists = prev.find((c) => c._id === newConn._id);
          if (exists) return prev;
          return [newConn, ...prev];
        });
        setSelectedConnection(newConn);
        setIsNewChatModalOpen(false);
        setUserSearchQuery('');
        setSearchResults([]);
        addToast(`Chat opened with ${targetUser.name}`, 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to start conversation', 'error');
    } finally {
      setCreatingChatId(null);
    }
  };

  const peer = selectedConnection?.peer;

  // 8. Send Code Snippet
  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!codeToShare.trim() || !selectedConnection) return;

    const peerId = selectedConnection.peer?._id || selectedConnection.peer?.id;

    try {
      const res = await api.post('/messages', {
        connectionId: selectedConnection._id,
        receiverId: peerId,
        text: `Shared a ${codeLang} code snippet`,
        messageType: 'code',
        codeSnippet: {
          code: codeToShare.trim(),
          language: codeLang,
        },
      });

      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.data]);
        setCodeToShare('');
        setIsCodeModalOpen(false);
        addToast('Code snippet shared!', 'success');
      }
    } catch (err) {
      addToast('Failed to send code snippet', 'error');
    }
  };

  // 9. Send File / Image Attachment
  const handleSendFile = async (e) => {
    e.preventDefault();
    if (!fileUrl.trim() || !selectedConnection) return;

    const peerId = selectedConnection.peer?._id || selectedConnection.peer?.id;

    try {
      const res = await api.post('/messages', {
        connectionId: selectedConnection._id,
        receiverId: peerId,
        text: fileName ? `Attached: ${fileName}` : 'Shared an image attachment',
        messageType: 'file',
        fileAttachment: {
          url: fileUrl.trim(),
          name: fileName.trim() || 'Attachment',
        },
      });

      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.data]);
        setFileUrl('');
        setFileName('');
        setIsFileModalOpen(false);
        addToast('Attachment shared!', 'success');
      }
    } catch (err) {
      addToast('Failed to send attachment', 'error');
    }
  };

  // 10. In-Chat Session Proposal Submission
  const handleSendProposal = async (e) => {
    e.preventDefault();
    if (!proposalTopic || !proposalDate || !proposalStartTime || !selectedConnection) {
      addToast('Please complete all required fields', 'error');
      return;
    }

    const peerId = selectedConnection.peer?._id || selectedConnection.peer?.id;
    const teacherId = proposalRole === 'peerTeaches' ? peerId : user?._id;
    const learnerId = proposalRole === 'peerTeaches' ? user?._id : peerId;

    try {
      const res = await api.post('/messages', {
        connectionId: selectedConnection._id,
        receiverId: peerId,
        text: `Proposed a 1:1 Live Practice Session for ${proposalTopic}`,
        messageType: 'session_proposal',
        sessionProposal: {
          skillName: proposalTopic,
          teacher: teacherId,
          learner: learnerId,
          date: proposalDate,
          startTime: proposalStartTime,
          endTime: proposalEndTime,
          notes: proposalNotes || 'Proposed directly from in-app chat.',
          status: 'pending',
        },
      });

      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.data]);
        setIsProposalModalOpen(false);
        setProposalNotes('');
        addToast('Session proposal sent directly in chat!', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to send proposal', 'error');
    }
  };

  // 11. Respond to In-Chat Proposal
  const handleRespondProposal = async (messageId, status) => {
    try {
      setActionLoadingProposalId(messageId);
      const res = await api.put(`/messages/${messageId}/respond-proposal`, { status });
      if (res.data.success) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? res.data.data : m))
        );
        if (status === 'accepted') {
          addToast('Session accepted! Google Meet workspace room created.', 'success');
        } else {
          addToast('Session proposal declined.', 'info');
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update proposal', 'error');
    } finally {
      setActionLoadingProposalId(null);
    }
  };

  // Renders Rich Message Content
  const renderMessageContent = (msg, isMe) => {
    // 1. Session Proposal Card
    if (msg.messageType === 'session_proposal' && msg.sessionProposal) {
      const prop = msg.sessionProposal;
      const isPending = prop.status === 'pending';
      const isAccepted = prop.status === 'accepted';
      const isDeclined = prop.status === 'declined';
      const amRecipient = msg.receiver?._id === user?._id || msg.receiver === user?._id;

      return (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-3 shadow-md border border-slate-800 min-w-[260px] sm:min-w-[320px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Session Proposal</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isAccepted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : isDeclined
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {isAccepted ? '✓ Accepted' : isDeclined ? 'Declined' : 'Pending Response'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Topic / Skill
            </span>
            <p className="font-bold text-slate-100 text-sm mt-0.5">{prop.skillName}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>{prop.date || 'TBD'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>{prop.startTime} - {prop.endTime}</span>
            </div>
          </div>

          {prop.notes && (
            <p className="text-[11px] text-slate-400 italic bg-slate-950/30 p-2 rounded-lg">
              "{prop.notes}"
            </p>
          )}

          {/* Action Area */}
          <div className="pt-2 border-t border-slate-800">
            {isPending ? (
              amRecipient ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRespondProposal(msg._id, 'declined')}
                    disabled={actionLoadingProposalId === msg._id}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRespondProposal(msg._id, 'accepted')}
                    disabled={actionLoadingProposalId === msg._id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    {actionLoadingProposalId === msg._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Accept Session</span>
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 text-center italic">
                  Proposal sent • Waiting for peer confirmation
                </p>
              )
            ) : isAccepted ? (
              <div className="space-y-2">
                {prop.meetingLink && (
                  <a
                    href={prop.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Launch Google Meet Room</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <Link
                  to="/sessions"
                  className="w-full text-center text-[11px] text-indigo-400 hover:underline block"
                >
                  View in Sessions Management →
                </Link>
              </div>
            ) : (
              <p className="text-[11px] text-rose-400 text-center italic">
                This proposal was declined. You can propose a new time above.
              </p>
            )}
          </div>
        </div>
      );
    }

    // 2. Rich Syntax Highlighted Code Block
    if (msg.messageType === 'code' && msg.codeSnippet?.code) {
      return (
        <div className="space-y-2 min-w-[240px] max-w-lg">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 bg-slate-900/95 px-3.5 py-1.5 rounded-t-xl border-b border-slate-800">
            <span className="font-bold uppercase tracking-wider text-emerald-400">
              {msg.codeSnippet.language || 'code'}
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(msg.codeSnippet.code);
                addToast('Code copied to clipboard!', 'info');
              }}
              className="hover:text-white flex items-center gap-1 text-[10px] text-slate-400 transition-colors"
            >
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </button>
          </div>
          <pre className="p-3.5 bg-slate-950 text-emerald-300 rounded-b-xl text-xs font-mono overflow-x-auto max-h-72 leading-relaxed border border-slate-900 shadow-inner">
            <code>{msg.codeSnippet.code}</code>
          </pre>
          {msg.text && !msg.text.startsWith('Shared a') && (
            <p className="text-xs pt-1">{msg.text}</p>
          )}
        </div>
      );
    }

    // 3. File / Image Attachment
    if (msg.messageType === 'file' && msg.fileAttachment?.url) {
      const isImg = msg.fileAttachment.url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
      return (
        <div className="space-y-2 max-w-sm">
          {isImg ? (
            <a href={msg.fileAttachment.url} target="_blank" rel="noopener noreferrer">
              <img
                src={msg.fileAttachment.url}
                alt={msg.fileAttachment.name || 'Attachment'}
                className="rounded-xl max-h-60 w-full object-cover border border-slate-200 hover:opacity-95 transition-opacity"
              />
            </a>
          ) : (
            <a
              href={msg.fileAttachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors"
            >
              <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-xs truncate">
                  {msg.fileAttachment.name || 'File Attachment'}
                </p>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span>Open Resource</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </span>
              </div>
            </a>
          )}
          {msg.text && !msg.text.startsWith('Attached') && (
            <p className="text-xs">{msg.text}</p>
          )}
        </div>
      );
    }

    // 4. Default Text with Link & Google Meet detection
    const text = msg.text || '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    const googleMeetMatch = text.match(/(https:\/\/meet\.google\.com\/[a-z0-9-]+)/i);

    return (
      <div className="space-y-2">
        <p className="whitespace-pre-wrap break-words">
          {parts.map((part, i) => {
            if (part.match(urlRegex)) {
              return (
                <a
                  key={i}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`underline font-semibold ${
                    isMe ? 'text-indigo-100 hover:text-white' : 'text-indigo-600 hover:text-indigo-800'
                  }`}
                >
                  {part}
                </a>
              );
            }
            return part;
          })}
        </p>
        {googleMeetMatch && (
          <div className="pt-1">
            <a
              href={googleMeetMatch[0]}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-colors shadow-xs ${
                isMe
                  ? 'bg-white text-indigo-700 hover:bg-indigo-50'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Join Google Meet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    );
  };

  if (loadingConnections) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="mt-2 text-xs text-slate-400 font-medium">Connecting to live chat...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden h-[82vh] flex flex-col md:flex-row">
      {/* Sidebar: Conversation List */}
      <div className="w-full md:w-80 border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-900 text-sm">Direct Messages</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
              {connections.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsNewChatModalOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs"
            title="Start new conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {connections.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 space-y-3 flex-1 flex flex-col justify-center items-center">
            <MessageSquare className="w-8 h-8 text-indigo-300" />
            <p className="font-medium">No active chats yet</p>
            <button
              type="button"
              onClick={() => setIsNewChatModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
            >
              Start a Conversation
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {connections.map((conn) => {
              const cPeer = conn.peer;
              const isSelected = selectedConnection?._id === conn._id;
              const online = cPeer?._id && isUserOnline(cPeer._id);

              return (
                <button
                  key={conn._id}
                  type="button"
                  onClick={() => setSelectedConnection(conn)}
                  className={`w-full text-left p-3.5 flex items-center gap-3 transition-colors ${
                    isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={
                        cPeer?.profileImage?.url ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
                      }
                      alt={cPeer?.name || 'Peer'}
                      className="w-11 h-11 rounded-2xl object-cover ring-1 ring-slate-200"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        online ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900 text-xs truncate">
                        {cPeer?.name || 'Member'}
                      </p>
                      {conn.lastMessage && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(conn.lastMessage.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {conn.lastMessage ? conn.lastMessage.text : 'Start conversation...'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Chat Window */}
      {selectedConnection ? (
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30">
          {/* Top Bar */}
          <div className="px-5 py-3.5 bg-white border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={
                    peer?.profileImage?.url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
                  }
                  alt={peer?.name || 'User'}
                  className="w-10 h-10 rounded-2xl object-cover"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                    peer?._id && isUserOnline(peer._id) ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
              </div>

              <div className="min-w-0">
                <Link
                  to={`/profile/${peer?._id}`}
                  className="font-bold text-slate-900 hover:text-indigo-600 text-xs sm:text-sm transition-colors truncate block"
                >
                  {peer?.name || 'Peer'}
                </Link>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className={
                      peer?._id && isUserOnline(peer._id)
                        ? 'text-emerald-600 font-medium'
                        : 'text-slate-400'
                    }
                  >
                    {peer?._id && isUserOnline(peer._id) ? 'Active now' : 'Offline'}
                  </span>
                  {peer?.rating && (
                    <span className="text-amber-600 flex items-center gap-0.5 font-semibold">
                      • <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{' '}
                      {peer.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsProposalModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Propose Session</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBarterPanel((prev) => !prev)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                title={showBarterPanel ? 'Hide Barter Details' : 'Show Barter Details'}
              >
                {showBarterPanel ? (
                  <PanelRightClose className="w-4 h-4" />
                ) : (
                  <PanelRightOpen className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {loadingMessages ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-600">No messages yet</p>
                <p>Say hello to {peer?.name || 'your peer'} or drop an in-chat Session Proposal!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe =
                  msg.sender?._id === user?._id ||
                  msg.sender === user?._id ||
                  msg.sender?.id === user?._id;

                return (
                  <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                        msg.messageType === 'session_proposal'
                          ? 'p-0 bg-transparent border-0'
                          : isMe
                          ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-xs'
                      }`}
                    >
                      {renderMessageContent(msg, isMe)}
                      {msg.messageType !== 'session_proposal' && (
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                            isMe ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                        >
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isMe && (
                            <span>
                              {msg.read ? (
                                <CheckCheck className="w-3 h-3 text-emerald-300 inline" />
                              ) : (
                                <Check className="w-3 h-3 opacity-70 inline" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing Indicator */}
            {isPeerTyping && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 italic px-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-100" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-200" />
                <span className="ml-1">{peer?.name || 'Peer'} is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar with Action Buttons */}
          <form
            onSubmit={handleSendMessage}
            className="p-3.5 bg-white border-t border-slate-200/80 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => setIsCodeModalOpen(true)}
              title="Share syntax-highlighted code snippet"
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <Code className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsFileModalOpen(true)}
              title="Share file or image link"
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsProposalModalOpen(true)}
              title="Propose actionable 1:1 session card in chat"
              className="p-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold transition-colors flex items-center gap-1 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Propose</span>
            </button>

            <input
              type="text"
              value={newMessageText}
              onChange={handleInputChange}
              placeholder={`Message ${peer?.name || 'peer'}...`}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={!newMessageText.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs space-y-3">
          <MessageSquare className="w-12 h-12 text-slate-300" />
          <p className="font-medium text-slate-600 text-sm">Select or start a conversation</p>
          <p className="max-w-xs text-slate-400">
            Choose a conversation from the sidebar or click "New Chat" to message any platform peer.
          </p>
          <button
            type="button"
            onClick={() => setIsNewChatModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Start a New Chat</span>
          </button>
        </div>
      )}

      {/* Contextual Barter Panel (Collapsible Sidebar) */}
      {selectedConnection && showBarterPanel && (
        <div className="w-full md:w-72 border-l border-slate-200 bg-white flex flex-col shrink-0 p-5 space-y-5 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
              <span>Barter Context</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowBarterPanel(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              ×
            </button>
          </div>

          {/* Peer Quick Profile */}
          <div className="text-center space-y-2">
            <img
              src={
                peer?.profileImage?.url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
              }
              alt={peer?.name || 'Member'}
              className="w-16 h-16 rounded-2xl object-cover mx-auto ring-2 ring-indigo-50 shadow-xs"
            />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{peer?.name || 'Member'}</h4>
              <p className="text-[11px] text-slate-400">{peer?.occupation || 'Member'}</p>
            </div>
            {peer?._id && (
              <Link
                to={`/profile/${peer._id}`}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                <User className="w-3 h-3" />
                <span>View Full Profile</span>
              </Link>
            )}
          </div>

          {/* Agreed Barter Skills */}
          <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1.5">
                They Teach You:
              </span>
              <div className="flex flex-wrap gap-1">
                {peer?.skillsToTeach && peer.skillsToTeach.length > 0 ? (
                  peer.skillsToTeach.slice(0, 3).map((item, idx) => (
                    <SkillBadge
                      key={idx}
                      skill={item.skill}
                      level={item.level}
                      variant="teach"
                      size="sm"
                    />
                  ))
                ) : (
                  <span className="text-slate-400 italic">None listed</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider block mb-1.5">
                You Teach Them:
              </span>
              <div className="flex flex-wrap gap-1">
                {user?.skillsToTeach && user.skillsToTeach.length > 0 ? (
                  user.skillsToTeach.slice(0, 3).map((item, idx) => (
                    <SkillBadge
                      key={idx}
                      skill={item.skill}
                      level={item.level}
                      variant="learn"
                      size="sm"
                    />
                  ))
                ) : (
                  <span className="text-slate-400 italic">None listed</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsProposalModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Propose Session in Chat</span>
            </button>
          </div>
        </div>
      )}

      {/* Start New Chat Modal */}
      <Modal
        isOpen={isNewChatModalOpen}
        onClose={() => {
          setIsNewChatModalOpen(false);
          setUserSearchQuery('');
          setSearchResults([]);
        }}
        title="Start a Direct Chat"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={userSearchQuery}
              onChange={(e) => handleSearchUsers(e.target.value)}
              placeholder="Search member by name, skill, or username..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
            {loadingSearch ? (
              <div className="py-6 text-center">
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mx-auto" />
              </div>
            ) : userSearchQuery.trim() && searchResults.length === 0 ? (
              <p className="py-6 text-center text-slate-400 text-xs italic">
                No members found matching "{userSearchQuery}".
              </p>
            ) : searchResults.length > 0 ? (
              searchResults.map((u) => (
                <div
                  key={u._id}
                  className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={
                        u.profileImage?.url ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
                      }
                      alt={u.name}
                      className="w-9 h-9 rounded-xl object-cover"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-xs truncate">{u.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        @{u.username} • {u.occupation || 'Member'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartChatWithUser(u)}
                    disabled={creatingChatId === u._id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
                  >
                    {creatingChatId === u._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Chat</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-slate-400 text-xs">
                Type a name or skill above to find members and start chatting.
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* In-Chat Session Proposal Modal */}
      <Modal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        title="Propose a Live Session (Direct in Chat)"
      >
        <form onSubmit={handleSendProposal} className="space-y-4 text-xs sm:text-sm text-slate-800">
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900">
              Sends an interactive, actionable card in this chat. Once {peer?.name || 'your peer'} clicks Accept, it automatically provisions the session and Google Meet room!
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Session Role:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProposalRole('peerTeaches')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                  proposalRole === 'peerTeaches'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {peer?.name || 'Peer'} teaches me
              </button>
              <button
                type="button"
                onClick={() => setProposalRole('iTeach')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                  proposalRole === 'iTeach'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                I teach {peer?.name || 'Peer'}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Topic / Skill Focus:</label>
            <input
              type="text"
              value={proposalTopic}
              onChange={(e) => setProposalTopic(e.target.value)}
              placeholder="e.g. System Design Mock Interview & Caching Architecture"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date:</label>
              <input
                type="date"
                value={proposalDate}
                onChange={(e) => setProposalDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Time:</label>
              <input
                type="time"
                value={proposalStartTime}
                onChange={(e) => setProposalStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Time:</label>
              <input
                type="time"
                value={proposalEndTime}
                onChange={(e) => setProposalEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Agenda / Focus Notes (Optional):</label>
            <textarea
              value={proposalNotes}
              onChange={(e) => setProposalNotes(e.target.value)}
              rows={2}
              placeholder="Outline exercises, questions, or repo links to review..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsProposalModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Proposal Card</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Share Code Snippet Modal */}
      <Modal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        title="Share Code Snippet in Chat"
      >
        <form onSubmit={handleSendCode} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Language:</label>
            <select
              value={codeLang}
              onChange={(e) => setCodeLang(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="typescript">TypeScript</option>
              <option value="html">HTML / CSS</option>
              <option value="sql">SQL</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="rust">Rust</option>
              <option value="go">Go</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Code Snippet:</label>
            <textarea
              value={codeToShare}
              onChange={(e) => setCodeToShare(e.target.value)}
              rows={8}
              placeholder="// Paste your code or algorithm here..."
              className="w-full p-3 rounded-xl border border-slate-800 bg-slate-900 text-emerald-400 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none leading-relaxed"
              spellCheck={false}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCodeModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
            >
              Share Snippet
            </button>
          </div>
        </form>
      </Modal>

      {/* Share File / Image Attachment Modal */}
      <Modal
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        title="Share File or Image Attachment"
      >
        <form onSubmit={handleSendFile} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Image or Document URL:</label>
            <input
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... or https://github.com/..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Attachment Label (Optional):</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g. Architecture Diagram or PR screenshot"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {fileUrl.trim() && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Preview</span>
              <img
                src={fileUrl.trim()}
                alt="Preview"
                className="max-h-40 rounded-lg mx-auto object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFileModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
            >
              Attach to Chat
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MessagesPage;

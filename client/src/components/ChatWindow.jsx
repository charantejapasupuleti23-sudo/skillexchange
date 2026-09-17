import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Send,
  Calendar,
  Loader2,
  CheckCheck,
  Check,
  Star,
  Video,
  ExternalLink,
  Code,
  Copy,
  PanelRightClose,
  PanelRightOpen,
  Image as ImageIcon,
  FileText,
  Clock,
  Sparkles,
  Upload,
  Download,
} from 'lucide-react';
import Modal from './Modal';

export default function ChatWindow({
  activeUser,
  selectedConnection,
  currentUser,
  socket,
  isUserOnline,
  showBarterPanel,
  setShowBarterPanel,
  onUpdateLastMessage,
}) {
  const { addToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  const [isPeerTyping, setIsPeerTyping] = useState(false);

  // Modals inside chat window
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [codeToShare, setCodeToShare] = useState('');
  const [codeLang, setCodeLang] = useState('javascript');

  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [fileMimeType, setFileMimeType] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [proposalTopic, setProposalTopic] = useState('');
  const [proposalDate, setProposalDate] = useState('');
  const [proposalStartTime, setProposalStartTime] = useState('18:00');
  const [proposalEndTime, setProposalEndTime] = useState('19:00');
  const [proposalNotes, setProposalNotes] = useState('');
  const [proposalRole, setProposalRole] = useState('peerTeaches');
  const [actionLoadingProposalId, setActionLoadingProposalId] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const peer = activeUser || selectedConnection?.peer;
  const connectionId = selectedConnection?._id;
  const peerId = peer?._id || peer?.id;
  const currentUserId = currentUser?._id || currentUser?.id;

  // 1. Fetch messages immediately when active contact / connection changes
  useEffect(() => {
    if (!connectionId && !peerId) return;

    // Reset state immediately so previous contact's chat doesn't linger
    setMessages([]);
    setIsPeerTyping(false);

    // Reset proposal defaults
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setProposalDate(d.toISOString().split('T')[0]);
    if (selectedConnection?.sharedSkills?.length > 0) {
      setProposalTopic(selectedConnection.sharedSkills[0].name || 'Skill Exchange Session');
    } else if (peer?.skillsToTeach?.length > 0) {
      setProposalTopic(peer.skillsToTeach[0].skill?.name || '1:1 Session');
    } else {
      setProposalTopic('System Design & Code Review');
    }

    const fetchMessages = async (silent = false) => {
      try {
        if (!silent) setLoadingMessages(true);
        const endpoint = connectionId ? `/messages/${connectionId}` : `/messages/${peerId}`;
        const res = await api.get(endpoint);
        if (res.data.success && Array.isArray(res.data.data)) {
          setMessages(res.data.data);
        } else if (Array.isArray(res.data)) {
          setMessages(res.data);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        if (!silent) setLoadingMessages(false);
      }
    };

    fetchMessages();

    // Socket: Join conversation room
    if (socket && connectionId) {
      socket.emit('join_conversation', connectionId);
    }

    // Polling fallback to keep messages synced
    const pollInterval = setInterval(() => {
      fetchMessages(true);
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      if (socket && connectionId) {
        socket.emit('leave_conversation', connectionId);
      }
    };
  }, [connectionId, peerId, socket]);

  // 2. Socket listeners with proper cleanup to prevent duplicate messages
  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (newMsg) => {
      const msgConvId = typeof newMsg.conversation === 'object' ? newMsg.conversation?._id : newMsg.conversation;
      const msgSenderId = (newMsg.sender?._id || newMsg.sender || newMsg.senderId || '').toString();
      const msgReceiverId = (newMsg.receiver?._id || newMsg.receiver || newMsg.receiverId || '').toString();
      const currentPeerIdStr = peerId ? peerId.toString() : '';
      const currentUserIdStr = currentUserId ? currentUserId.toString() : '';

      // Check if message belongs to this open chat conversation
      const isCurrentChat =
        (connectionId && msgConvId && msgConvId.toString() === connectionId.toString()) ||
        (msgSenderId === currentPeerIdStr && msgReceiverId === currentUserIdStr) ||
        (msgSenderId === currentUserIdStr && msgReceiverId === currentPeerIdStr);

      if (isCurrentChat) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      }

      if (onUpdateLastMessage) {
        onUpdateLastMessage(msgConvId || connectionId, newMsg);
      }
    };

    const handleMessageUpdated = (updatedMsg) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m))
      );
    };

    const handlePeerTyping = ({ conversationId: typingConvId, userId: typingUserId, isTyping }) => {
      if (
        (connectionId && typingConvId === connectionId) ||
        (peerId && typingUserId && typingUserId.toString() === peerId.toString())
      ) {
        setIsPeerTyping(isTyping);
      }
    };

    socket.on('receive_message', handleIncomingMessage);
    socket.on('new_message', handleIncomingMessage);
    socket.on('message_updated', handleMessageUpdated);
    socket.on('peer_typing', handlePeerTyping);

    return () => {
      socket.off('receive_message', handleIncomingMessage);
      socket.off('new_message', handleIncomingMessage);
      socket.off('message_updated', handleMessageUpdated);
      socket.off('peer_typing', handlePeerTyping);
    };
  }, [socket, connectionId, peerId, currentUserId, onUpdateLastMessage]);

  // 3. Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPeerTyping]);

  // 4. Typing indicator emission
  const handleInputChange = (e) => {
    setNewMessageText(e.target.value);

    if (!socket) return;

    socket.emit('typing_start', {
      conversationId,
      peerId,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', {
        conversationId,
        peerId,
      });
    }, 1500);
  };

  // 5. Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const text = newMessageText.trim();
    setNewMessageText('');

    if (socket) {
      socket.emit('typing_stop', {
        conversationId,
        peerId,
      });
    }

    try {
      const res = await api.post('/messages', {
        connectionId,
        receiverId: peerId,
        text,
      });

      if (res.data.success && res.data.data) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.data.data._id)) return prev;
          return [...prev, res.data.data];
        });
      }
    } catch (err) {
      addToast('Failed to send message', 'error');
    }
  };

  // 6. Send Code Snippet
  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!codeToShare.trim()) return;

    try {
      const res = await api.post('/messages', {
        connectionId,
        receiverId: peerId,
        text: `Shared a ${codeLang} code snippet`,
        messageType: 'code',
        type: 'code',
        codeSnippet: {
          code: codeToShare.trim(),
          language: codeLang,
        },
      });

      if (res.data.success && res.data.data) {
        setMessages((prev) => [...prev, res.data.data]);
        setCodeToShare('');
        setIsCodeModalOpen(false);
        addToast('Code snippet sent!', 'success');
      }
    } catch (err) {
      addToast('Failed to send code snippet', 'error');
    }
  };

  // 7. File Attachment handling
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      addToast('File size must be less than 10MB', 'error');
      return;
    }

    setUploadingFile(true);
    setFileName(file.name);
    setFileSize(file.size);
    setFileMimeType(file.type || 'application/octet-stream');

    const reader = new FileReader();
    reader.onload = () => {
      setFileUrl(reader.result);
      setUploadingFile(false);
    };
    reader.onerror = () => {
      addToast('Failed to read file', 'error');
      setUploadingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const handleClearFile = () => {
    setFileUrl('');
    setFileName('');
    setFileSize(0);
    setFileMimeType('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendFile = async (e) => {
    e.preventDefault();
    if (!fileUrl) return;

    try {
      const isImg = fileMimeType.startsWith('image/') || fileUrl.startsWith('data:image/');
      const res = await api.post('/messages', {
        connectionId,
        receiverId: peerId,
        text: fileName ? `Attached: ${fileName}` : isImg ? 'Shared an image attachment' : 'Shared a file attachment',
        messageType: 'file',
        type: 'file',
        fileAttachment: {
          url: fileUrl,
          name: fileName.trim() || 'Attachment',
          size: fileSize,
          mimeType: fileMimeType,
        },
      });

      if (res.data.success && res.data.data) {
        setMessages((prev) => [...prev, res.data.data]);
        handleClearFile();
        setIsFileModalOpen(false);
        addToast('File attached successfully!', 'success');
      }
    } catch (err) {
      addToast('Failed to send file attachment', 'error');
    }
  };

  // 8. Session Proposal Submission
  const handleSendProposal = async (e) => {
    e.preventDefault();
    if (!proposalTopic || !proposalDate || !proposalStartTime) {
      addToast('Please complete all required fields', 'error');
      return;
    }

    const teacherId = proposalRole === 'peerTeaches' ? peerId : currentUserId;
    const learnerId = proposalRole === 'peerTeaches' ? currentUserId : peerId;

    try {
      const res = await api.post('/messages', {
        connectionId,
        receiverId: peerId,
        text: `Proposed a 1:1 Live Practice Session for ${proposalTopic}`,
        messageType: 'session_proposal',
        type: 'session_proposal',
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

      if (res.data.success && res.data.data) {
        setMessages((prev) => [...prev, res.data.data]);
        setIsProposalModalOpen(false);
        setProposalNotes('');
        addToast('Session proposal sent directly in chat!', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to send proposal', 'error');
    }
  };

  // 9. Respond to Proposal
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

  const renderMessageContent = (msg, isMe) => {
    if (msg.messageType === 'session_proposal' && msg.sessionProposal) {
      const prop = msg.sessionProposal;
      const isPending = prop.status === 'pending';
      const isAccepted = prop.status === 'accepted';
      const isDeclined = prop.status === 'declined';
      const amRecipient =
        (msg.receiver?._id || msg.receiver || msg.receiverId)?.toString() === currentUserId?.toString();

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
              <span>
                {prop.startTime} - {prop.endTime}
              </span>
            </div>
          </div>

          {prop.notes && (
            <p className="text-[11px] text-slate-400 italic bg-slate-950/30 p-2 rounded-lg">
              "{prop.notes}"
            </p>
          )}

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

    if (msg.messageType === 'file' && msg.fileAttachment?.url) {
      const isImg =
        msg.fileAttachment.mimeType?.startsWith('image/') ||
        msg.fileAttachment.url.startsWith('data:image/') ||
        msg.fileAttachment.url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);

      return (
        <div className="space-y-2 max-w-sm">
          {isImg ? (
            <div className="relative group">
              <a href={msg.fileAttachment.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={msg.fileAttachment.url}
                  alt={msg.fileAttachment.name || 'Attachment'}
                  className="rounded-xl max-h-60 w-full object-cover border border-slate-200 hover:opacity-95 transition-opacity"
                />
              </a>
              <a
                href={msg.fileAttachment.url}
                download={msg.fileAttachment.name || 'download'}
                className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                title="Download image"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors">
              <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-xs truncate">
                  {msg.fileAttachment.name || 'File Attachment'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <a
                    href={msg.fileAttachment.url}
                    download={msg.fileAttachment.name || 'attachment'}
                    className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5 font-semibold"
                  >
                    <Download className="w-2.5 h-2.5" />
                    <span>Download</span>
                  </a>
                  <a
                    href={msg.fileAttachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-slate-500 hover:underline flex items-center gap-0.5"
                  >
                    <span>Preview</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>
          )}
          {msg.text && !msg.text.startsWith('Attached') && !msg.text.startsWith('Shared a') && (
            <p className="text-xs">{msg.text}</p>
          )}
        </div>
      );
    }

    const text = msg.text || msg.content || '';
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

  const isOnline = peerId && isUserOnline ? isUserOnline(peerId) : false;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30 h-full">
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
                isOnline ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            />
          </div>

          <div className="min-w-0">
            <Link
              to={peerId ? `/profile/${peerId}` : '#'}
              className="font-bold text-slate-900 hover:text-indigo-600 text-xs sm:text-sm transition-colors truncate block"
            >
              {peer?.name || 'Peer'}
            </Link>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className={isOnline ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                {isOnline ? 'Active now' : 'Offline'}
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

          {setShowBarterPanel && (
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
          )}
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
              msg.sender?._id === currentUserId ||
              msg.sender === currentUserId ||
              msg.sender?.id === currentUserId ||
              msg.senderId === currentUserId;

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
          title="Upload file or image attachment"
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
              Sends an interactive, actionable card in this chat. Once {peer?.name || 'your peer'} clicks
              Accept, it automatically provisions the session and Google Meet room!
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
            <label className="block font-semibold text-slate-700 mb-1">
              Agenda / Focus Notes (Optional):
            </label>
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
        title="Send CodeSnippet"
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
              Send CodeSnippet
            </button>
          </div>
        </form>
      </Modal>

      {/* Share File / Image Attachment Modal */}
      <Modal
        isOpen={isFileModalOpen}
        onClose={() => {
          setIsFileModalOpen(false);
          handleClearFile();
        }}
        title="Upload File or Image Attachment"
      >
        <form onSubmit={handleSendFile} className="space-y-4 text-xs sm:text-sm">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar,.json,.js,.py,.html,.css,.cpp,.java"
          />

          {!fileUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 group"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-100 group-hover:bg-indigo-200 text-indigo-600 flex items-center justify-center transition-colors">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-700 text-xs sm:text-sm">
                  Click to upload or drag and drop file
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Images, PDFs, documents, or code files (Max 10MB)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Selected File Preview
                  </span>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                  >
                    Remove File
                  </button>
                </div>

                {fileMimeType.startsWith('image/') || fileUrl.startsWith('data:image/') ? (
                  <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                    <img
                      src={fileUrl}
                      alt="Preview"
                      className="max-h-48 rounded-lg mx-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                    <FileText className="w-8 h-8 text-indigo-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 text-xs truncate">{fileName}</p>
                      <p className="text-[11px] text-slate-400">
                        {fileSize ? `${(fileSize / 1024).toFixed(1)} KB` : 'Document file'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Attachment Name / Label:
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="File name or description..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsFileModalOpen(false);
                handleClearFile();
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!fileUrl || uploadingFile}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              {uploadingFile ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Upload & Attach File</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

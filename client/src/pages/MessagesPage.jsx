import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import ScheduleSessionModal from '../components/ScheduleSessionModal';
import SkillBadge from '../components/SkillBadge';
import EmptyState from '../components/EmptyState';
import {
  Send,
  Calendar,
  MessageSquare,
  Loader2,
  CheckCheck,
  Check,
  Circle,
  ArrowRightLeft,
  ChevronRight,
  ChevronLeft,
  Star,
  Award,
  GraduationCap,
  Clock,
  User,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';

const MessagesPage = () => {
  const { user } = useAuth();
  const { socket, isUserOnline } = useSocket();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const targetConnectionId = searchParams.get('connectionId');

  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [showBarterPanel, setShowBarterPanel] = useState(true);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // 1. Fetch user's active connections
  const fetchConnections = async () => {
    try {
      setLoadingConnections(true);
      const res = await api.get('/connections');
      if (res.data.success) {
        setConnections(res.data.data);

        // Select initial connection
        if (targetConnectionId) {
          const found = res.data.data.find((c) => c._id === targetConnectionId);
          if (found) setSelectedConnection(found);
          else if (res.data.data.length > 0) setSelectedConnection(res.data.data[0]);
        } else if (res.data.data.length > 0) {
          setSelectedConnection(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConnections(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  // 2. Fetch messages when selected connection changes
  useEffect(() => {
    if (!selectedConnection) return;

    const fetchConversation = async () => {
      try {
        setLoadingMessages(true);
        const res = await api.get(`/messages/${selectedConnection._id}`);
        if (res.data.success) {
          setMessages(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchConversation();

    // Socket: Join conversation room
    if (socket) {
      socket.emit('join_conversation', selectedConnection._id);
    }

    return () => {
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
      if (selectedConnection && msg.conversation === selectedConnection._id) {
        setMessages((prev) => {
          // Avoid duplicate appends
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
      // Update preview in connections list
      setConnections((prev) =>
        prev.map((c) =>
          c._id === msg.conversation ? { ...c, lastMessage: msg } : c
        )
      );
    };

    const handlePeerTyping = ({ conversationId, isTyping }) => {
      if (selectedConnection && conversationId === selectedConnection._id) {
        setIsPeerTyping(isTyping);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('peer_typing', handlePeerTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
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

    if (socket) {
      socket.emit('typing_stop', {
        conversationId: selectedConnection._id,
        peerId: selectedConnection.peer?._id,
      });
    }

    try {
      const res = await api.post('/messages', {
        connectionId: selectedConnection._id,
        receiverId: selectedConnection.peer._id,
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

  if (loadingConnections) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="mt-2 text-xs text-slate-400 font-medium">Connecting to live chat...</p>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No active conversations yet"
        description="Propose or accept a skill exchange request to unlock direct real-time messaging with peers."
        actionText="Discover Mentors"
        actionLink="/discover"
      />
    );
  }

  const peer = selectedConnection?.peer;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden h-[82vh] flex flex-col md:flex-row">
      {/* Sidebar: Conversation List */}
      <div className="w-full md:w-80 border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm">Direct Messages</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
            {connections.length}
          </span>
        </div>

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
                    src={cPeer?.profileImage?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                    alt={cPeer?.name}
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
                      {cPeer?.name}
                    </p>
                    {conn.lastMessage && (
                      <span className="text-[10px] text-slate-400">
                        {new Date(conn.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
      </div>

      {/* Main Chat Window */}
      {selectedConnection ? (
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30">
          {/* Top Bar */}
          <div className="px-5 py-3.5 bg-white border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={peer?.profileImage?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                  alt={peer?.name}
                  className="w-10 h-10 rounded-2xl object-cover"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                    isUserOnline(peer?._id)
                      ? 'bg-emerald-500'
                      : 'bg-slate-300'
                  }`}
                />
              </div>

              <div className="min-w-0">
                <Link
                  to={`/profile/${peer?._id}`}
                  className="font-bold text-slate-900 hover:text-indigo-600 text-xs sm:text-sm transition-colors truncate block"
                >
                  {peer?.name}
                </Link>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className={isUserOnline(peer?._id) ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                    {isUserOnline(peer?._id) ? 'Active now' : 'Offline'}
                  </span>
                  {peer?.rating && (
                    <span className="text-amber-600 flex items-center gap-0.5 font-semibold">
                      • <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {peer.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Schedule Session</span>
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
                <p>Say hello to {peer?.name} and arrange your skill exchange practice session!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                return (
                  <div
                    key={msg._id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
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
                <span className="ml-1">{peer?.name} is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3.5 bg-white border-t border-slate-200/80 flex items-center gap-2"
          >
            <input
              type="text"
              value={newMessageText}
              onChange={handleInputChange}
              placeholder={`Message ${peer?.name}...`}
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
        <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400 text-xs">
          Select a conversation from the sidebar to begin chatting.
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
              src={peer?.profileImage?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
              alt={peer?.name}
              className="w-16 h-16 rounded-2xl object-cover mx-auto ring-2 ring-indigo-50 shadow-xs"
            />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{peer?.name}</h4>
              <p className="text-[11px] text-slate-400">{peer?.occupation || 'Member'}</p>
            </div>
            <Link
              to={`/profile/${peer?._id}`}
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              <User className="w-3 h-3" />
              <span>View Full Profile</span>
            </Link>
          </div>

          {/* Agreed Barter Skills */}
          <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1.5">
                They Teach You:
              </span>
              <div className="flex flex-wrap gap-1">
                {peer?.skillsToTeach?.slice(0, 3).map((item, idx) => (
                  <SkillBadge
                    key={idx}
                    skill={item.skill}
                    level={item.level}
                    variant="teach"
                    size="sm"
                  />
                )) || <span className="text-slate-400 italic">None listed</span>}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider block mb-1.5">
                You Teach Them:
              </span>
              <div className="flex flex-wrap gap-1">
                {user?.skillsToTeach?.slice(0, 3).map((item, idx) => (
                  <SkillBadge
                    key={idx}
                    skill={item.skill}
                    level={item.level}
                    variant="learn"
                    size="sm"
                  />
                )) || <span className="text-slate-400 italic">None listed</span>}
              </div>
            </div>
          </div>

          {/* Quick Schedule Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule Live Session</span>
            </button>
          </div>
        </div>
      )}

      {/* Schedule Session Modal */}
      {selectedConnection && (
        <ScheduleSessionModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          connection={selectedConnection}
          peerUser={peer}
          onSuccess={() => {
            addToast('Session scheduled! View in Sessions tab.', 'success');
          }}
        />
      )}
    </div>
  );
};

export default MessagesPage;

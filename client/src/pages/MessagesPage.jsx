import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import SkillBadge from '../components/SkillBadge';
import Modal from '../components/Modal';
import ChatWindow from '../components/ChatWindow';
import {
  MessageSquare,
  Loader2,
  ArrowRightLeft,
  User,
  Plus,
  Search,
  Sparkles,
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
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [showBarterPanel, setShowBarterPanel] = useState(true);

  // New Chat Modal state
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [creatingChatId, setCreatingChatId] = useState(null);

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

  const handleUpdateLastMessage = (convId, msg) => {
    setConnections((prev) =>
      prev.map((c) => {
        const cPeerId = (c.peer?._id || c.peer?.id || '').toString();
        const msgSenderId = (msg.sender?._id || msg.sender || msg.senderId || '').toString();
        const msgReceiverId = (msg.receiver?._id || msg.receiver || msg.receiverId || '').toString();
        const myId = (user?._id || user?.id || '').toString();

        const isMatch =
          c._id === convId ||
          (cPeerId && (msgSenderId === cPeerId || msgReceiverId === cPeerId) && (msgSenderId === myId || msgReceiverId === myId));

        return isMatch ? { ...c, lastMessage: msg } : c;
      })
    );
  };

  // Start New Chat Search
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

      {/* Main Chat Window Keyed on Active Connection */}
      {selectedConnection ? (
        <ChatWindow
          key={selectedConnection?._id}
          activeUser={selectedConnection?.peer}
          selectedConnection={selectedConnection}
          currentUser={user}
          socket={socket}
          isUserOnline={isUserOnline}
          showBarterPanel={showBarterPanel}
          setShowBarterPanel={setShowBarterPanel}
          onUpdateLastMessage={handleUpdateLastMessage}
        />
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
                      <MessageSquare className="w-3.5 h-3.5" />
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
    </div>
  );
};

export default MessagesPage;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import SkillBadge from '../components/SkillBadge';
import EmptyState from '../components/EmptyState';
import {
  Inbox,
  Send,
  Check,
  X,
  Clock,
  ArrowRightLeft,
  Loader2,
  MessageSquare,
} from 'lucide-react';

const RequestsPage = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [recRes, sentRes] = await Promise.all([
        api.get('/requests/received'),
        api.get('/requests/sent'),
      ]);

      if (recRes.data.success) setReceivedRequests(recRes.data.data);
      if (sentRes.data.success) setSentRequests(sentRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept = async (requestId) => {
    try {
      setActionLoadingId(requestId);
      const res = await api.put(`/requests/${requestId}/accept`);
      if (res.data.success) {
        addToast('Request accepted! You are now connected.', 'success');
        fetchRequests();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to accept request', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setActionLoadingId(requestId);
      const res = await api.put(`/requests/${requestId}/reject`);
      if (res.data.success) {
        addToast('Request declined.', 'info');
        fetchRequests();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to decline request', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (requestId) => {
    try {
      setActionLoadingId(requestId);
      const res = await api.delete(`/requests/${requestId}`);
      if (res.data.success) {
        addToast('Request cancelled.', 'info');
        fetchRequests();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to cancel request', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const currentList = activeTab === 'received' ? receivedRequests : sentRequests;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Skill Exchange Requests
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review incoming exchange proposals and track outgoing invitations
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('received')}
          className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'received'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Received ({receivedRequests.filter((r) => r.status === 'Pending').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sent')}
          className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'sent'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Sent ({sentRequests.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="mt-2 text-xs text-slate-400 font-medium">Loading requests...</p>
        </div>
      ) : currentList.length === 0 ? (
        <EmptyState
          icon={ArrowRightLeft}
          title={activeTab === 'received' ? 'No incoming requests' : 'No sent requests'}
          description={
            activeTab === 'received'
              ? 'When other members propose to exchange skills with you, they will appear here.'
              : 'Find matching peers on the discover page and propose an exchange to get started.'
          }
          actionText="Find Peers to Exchange"
          actionLink="/discover"
        />
      ) : (
        <div className="space-y-4">
          {currentList.map((reqItem) => {
            const peer = activeTab === 'received' ? reqItem.sender : reqItem.receiver;
            const isPending = reqItem.status === 'Pending';
            const isActing = actionLoadingId === reqItem._id;

            return (
              <div
                key={reqItem._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4"
              >
                {/* Header: Peer info and status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={peer.profileImage?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                      alt={peer.name}
                      className="w-11 h-11 rounded-xl object-cover"
                    />
                    <div>
                      <Link
                        to={`/profile/${peer._id}`}
                        className="font-semibold text-slate-900 hover:text-indigo-600 text-sm transition-colors"
                      >
                        {peer.name}
                      </Link>
                      <p className="text-xs text-slate-400">@{peer.username}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      reqItem.status === 'Accepted'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : reqItem.status === 'Rejected'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : reqItem.status === 'Cancelled'
                        ? 'bg-slate-50 text-slate-600 border border-slate-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {reqItem.status}
                  </span>
                </div>

                {/* Skill trade details */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      {activeTab === 'received' ? 'They offer to teach you:' : 'You offered to teach them:'}
                    </span>
                    <SkillBadge skill={reqItem.teachSkill} size="sm" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      {activeTab === 'received' ? 'They want to learn from you:' : 'You want to learn from them:'}
                    </span>
                    <SkillBadge skill={reqItem.learnSkill} size="sm" />
                  </div>
                </div>

                {/* Message */}
                {reqItem.message && (
                  <p className="text-xs text-slate-600 italic bg-white p-3 rounded-xl border border-slate-100">
                    "{reqItem.message}"
                  </p>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                  <span>
                    Requested on {new Date(reqItem.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    {activeTab === 'received' && isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReject(reqItem._id)}
                          disabled={isActing}
                          className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAccept(reqItem._id)}
                          disabled={isActing}
                          className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
                        >
                          {isActing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Accept & Connect</span>
                        </button>
                      </>
                    )}

                    {activeTab === 'sent' && isPending && (
                      <button
                        type="button"
                        onClick={() => handleCancel(reqItem._id)}
                        disabled={isActing}
                        className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-medium text-xs transition-colors"
                      >
                        Cancel Request
                      </button>
                    )}

                    {reqItem.status === 'Accepted' && (
                      <Link
                        to="/messages"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs hover:bg-emerald-100 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Open Chat</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RequestsPage;

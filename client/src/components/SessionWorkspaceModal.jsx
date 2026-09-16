import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import {
  Video,
  Code,
  FileText,
  Save,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Coins,
  Sparkles,
  RefreshCw,
  Copy,
  Users,
} from 'lucide-react';

const SessionWorkspaceModal = ({
  isOpen,
  onClose,
  session,
  onSessionUpdated,
  onOpenReview,
}) => {
  const { user, refreshUser } = useAuth();
  const { socket } = useSocket();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'code'
  const [notes, setNotes] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [saving, setSaving] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    if (isOpen && session) {
      setNotes(session.workspaceNotes || '');
      setCode(
        session.workspaceCode ||
          '// Collaborative live code scratchpad\nfunction main() {\n  console.log("SkillLoop Session Active");\n}'
      );
      setLanguage(session.workspaceLanguage || 'javascript');
    }
  }, [isOpen, session]);

  // Real-time socket sync for collaborative notes and code
  useEffect(() => {
    if (!socket || !session?._id) return;

    const handleWorkspaceSync = (data) => {
      if (data.sessionId === session._id) {
        if (data.workspaceNotes !== undefined) setNotes(data.workspaceNotes);
        if (data.workspaceCode !== undefined) setCode(data.workspaceCode);
        if (data.workspaceLanguage !== undefined) setLanguage(data.workspaceLanguage);
        addToast(`Workspace updated by peer`, 'info');
      }
    };

    socket.on('workspace_updated', handleWorkspaceSync);

    return () => {
      socket.off('workspace_updated', handleWorkspaceSync);
    };
  }, [socket, session?._id]);

  const handleSaveWorkspace = async () => {
    try {
      setSaving(true);
      const res = await api.put(`/sessions/${session._id}/workspace`, {
        workspaceNotes: notes,
        workspaceCode: code,
        workspaceLanguage: language,
      });

      if (res.data.success) {
        addToast('Workspace scratchpad synced!', 'success');
        if (onSessionUpdated) {
          onSessionUpdated({
            ...session,
            workspaceNotes: notes,
            workspaceCode: code,
            workspaceLanguage: language,
          });
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save workspace', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmCompletion = async () => {
    try {
      setCheckingIn(true);
      const res = await api.put(`/sessions/${session._id}/complete`);

      if (res.data.success) {
        addToast('Session verified & completed! 1 Time Credit released.', 'success');
        if (refreshUser) refreshUser();
        if (onSessionUpdated) onSessionUpdated(res.data.data);

        // If learner, prompt review modal
        if (session.learner?._id === user?._id || session.learner === user?._id) {
          if (onOpenReview) onOpenReview(session);
        }
        onClose();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to confirm check-in', 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  if (!session) return null;

  const isTeacher = session.teacher?._id === user?._id || session.teacher === user?._id;
  const peer = isTeacher ? session.learner : session.teacher;
  const isCompleted = session.status === 'Completed';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Session Workspace: ${session.skill?.name || 'Skill'}`}>
      <div className="space-y-4 text-slate-800 text-xs sm:text-sm max-w-2xl">
        {/* Call Link Bar & Check-in Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold backdrop-blur-xs">
                {isTeacher ? 'Teaching' : 'Learning'}
              </span>
              <p className="text-xs text-emerald-100">
                With <strong className="text-white">{peer?.name || 'Peer'}</strong>
              </p>
            </div>
            <p className="font-bold text-sm mt-1 flex items-center gap-1.5">
              <span>{session.startTime} - {session.endTime}</span>
              <span className="text-emerald-200 text-xs">({new Date(session.date).toLocaleDateString()})</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {session.meetingLink && (
              <a
                href={session.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs shadow-xs transition-all"
              >
                <Video className="w-4 h-4 text-emerald-600" />
                <span>Join Google Meet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Two-Way Mutual Check-in / Completion Bar */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Coins className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="font-bold text-xs text-slate-900">Mutual Session Check-In</p>
              <p className="text-[11px] text-slate-500">
                {isCompleted
                  ? 'Session officially completed. 1 Credit released to mentor.'
                  : 'Click check-in when call concludes to verify hours & release credit.'}
              </p>
            </div>
          </div>

          <div>
            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified & Finished</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleConfirmCompletion}
                disabled={checkingIn}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                {checkingIn ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Confirm Completion & Release Credit</span>
              </button>
            )}
          </div>
        </div>

        {/* Workspace Mode Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'notes'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Notes & Scratchpad</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'code'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Code Editor</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'code' && (
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white font-medium"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="typescript">TypeScript</option>
                <option value="html">HTML / CSS</option>
                <option value="sql">SQL</option>
              </select>
            )}

            <button
              type="button"
              onClick={handleSaveWorkspace}
              disabled={saving}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Sync Scratchpad</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        {activeTab === 'notes' ? (
          <div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={8}
              placeholder="Jot down meeting agenda, key takeaways, resources, and action items..."
              className="w-full p-3.5 rounded-2xl border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm font-sans focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none"
            />
          </div>
        ) : (
          <div className="relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={9}
              placeholder="// Type or paste code snippets to solve together"
              className="w-full p-3.5 rounded-2xl border border-slate-800 bg-slate-900 text-emerald-400 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none"
              spellCheck={false}
            />
          </div>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2">
          <span>Real-time collaborative updates sync automatically.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors"
          >
            Close Workspace
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SessionWorkspaceModal;

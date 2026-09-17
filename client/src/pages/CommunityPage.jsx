import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import EmptyState from '../components/EmptyState';
import {
  Hash,
  MessageSquare,
  Sparkles,
  HelpCircle,
  Coins,
  Send,
  Code,
  ThumbsUp,
  Heart,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Coffee,
  CloudRain,
  Trees,
  Radio,
  Plus,
  CheckCircle2,
  Share2,
  Loader2,
  Copy,
  Check,
  Search,
  Users,
  Timer,
  BookOpen,
  Award,
  Zap,
} from 'lucide-react';

// Ambient Audio Synth generator using HTML5 Web Audio API
class AmbientSoundGenerator {
  constructor() {
    this.ctx = null;
    this.nodes = [];
    this.gainNode = null;
    this.isPlaying = false;
    this.currentTrack = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  stop() {
    this.nodes.forEach((n) => {
      try {
        if (n.stop) n.stop();
        if (n.disconnect) n.disconnect();
      } catch (e) {
        // ignore
      }
    });
    this.nodes = [];
    this.isPlaying = false;
    this.currentTrack = null;
  }

  play(type, volume = 0.3) {
    this.stop();
    this.init();
    if (!this.ctx) return;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);
    this.currentTrack = type;
    this.isPlaying = true;

    if (type === 'rain') {
      // Pink/Brown noise for soothing rain
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.95 * b1 + white * 0.08;
        b2 = 0.85 * b2 + white * 0.15;
        output[i] = (b0 + b1 + b2) * 0.4;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(this.gainNode);
      whiteNoise.start();
      this.nodes.push(whiteNoise, filter);
    } else if (type === 'lofi') {
      // Gentle chord drone with slow LFO modulation
      const freqs = [196.0, 246.94, 293.66, 369.99]; // Gmaj7 soothing drone
      freqs.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

        // Subtle vibrato LFO
        const lfo = this.ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(1.5, this.ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        osc.connect(oscGain);
        oscGain.connect(this.gainNode);
        osc.start();
        this.nodes.push(osc, oscGain, lfo, lfoGain);
      });
    } else if (type === 'cafe') {
      // Low ambient rumble + warmth
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.2;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(this.gainNode);
      noise.start();
      this.nodes.push(noise, filter);
    } else if (type === 'forest') {
      // Warm breeze & high frequency soft rustle
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.15;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(this.gainNode);
      noise.start();
      this.nodes.push(noise, filter);
    }
  }

  setVolume(vol) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  playChime() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.3); // A5

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.2);
  }
}

const soundGenerator = new AmbientSoundGenerator();

const CommunityPage = () => {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();
  const { socket } = useSocket();
  const location = useLocation();

  // Active Tab: 'channels' | 'lounge' | 'bounties' | 'highlights'
  const [activeTab, setActiveTab] = useState('channels');

  // ==========================================
  // TAB 1: DISCUSSION CHANNELS STATE
  // ==========================================
  const [channels, setChannels] = useState([]);
  const [activeChannelSlug, setActiveChannelSlug] = useState('react-frontend');
  const [channelMessages, setChannelMessages] = useState([]);
  const [channelLoading, setChannelLoading] = useState(false);
  const [channelInput, setChannelInput] = useState('');
  const [channelSnippetCode, setChannelSnippetCode] = useState('');
  const [channelSnippetLang, setChannelSnippetLang] = useState('javascript');
  const [showCodeSnippetInput, setShowCodeSnippetInput] = useState(false);
  const [channelSending, setChannelSending] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const channelChatEndRef = useRef(null);

  // ==========================================
  // TAB 2: VIRTUAL STUDY LOUNGE & POMODORO
  // ==========================================
  const [pomoMode, setPomoMode] = useState('work'); // 'work' (25m) | 'short' (5m) | 'long' (15m)
  const [pomoSecondsLeft, setPomoSecondsLeft] = useState(25 * 60);
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoCompletedCycles, setPomoCompletedCycles] = useState(0);
  const [activeSound, setActiveSound] = useState(null);
  const [soundVolume, setSoundVolume] = useState(0.3);
  const [myLoungeStatus, setMyLoungeStatus] = useState('Grinding Code 💻');
  const [isJoinedLounge, setIsJoinedLounge] = useState(true);

  // Mock study peers in lounge + current user
  const [loungePeers, setLoungePeers] = useState([
    { id: '1', name: 'Sophia Chen', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80', status: 'Practicing System Design 📐', minutesActive: 42 },
    { id: '2', name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80', status: 'Solving Tree/Graph LeetCode 🌲', minutesActive: 78 },
    { id: '3', name: 'Priya Sharma', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80', status: 'Building Next.js 14 API ⚡', minutesActive: 25 },
    { id: '4', name: 'Marcus Vance', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80', status: 'Reviewing Redis Caching 🚀', minutesActive: 15 },
  ]);

  // ==========================================
  // TAB 3: 1-CREDIT BOUNTY Q&A STATE
  // ==========================================
  const [bounties, setBounties] = useState([]);
  const [bountiesLoading, setBountiesLoading] = useState(false);
  const [bountyFilter, setBountyFilter] = useState('all'); // 'all' | 'open' | 'solved'
  const [selectedBounty, setSelectedBounty] = useState(null);
  const [isAskBountyOpen, setIsAskBountyOpen] = useState(false);
  const [askBountyTitle, setAskBountyTitle] = useState('');
  const [askBountyDesc, setAskBountyDesc] = useState('');
  const [askBountyCode, setAskBountyCode] = useState('');
  const [askBountyLang, setAskBountyLang] = useState('javascript');
  const [askBountyTags, setAskBountyTags] = useState('React, Architecture');
  const [askBountySubmitting, setAskBountySubmitting] = useState(false);

  // Answering a bounty
  const [answerText, setAnswerText] = useState('');
  const [answerCode, setAnswerCode] = useState('');
  const [answerLang, setAnswerLang] = useState('javascript');
  const [showAnswerCode, setShowAnswerCode] = useState(false);
  const [answerSubmitting, setAnswerSubmitting] = useState(false);

  // ==========================================
  // TAB 4: WHAT I LEARNED TODAY (HIGHLIGHTS)
  // ==========================================
  const [highlights, setHighlights] = useState([]);
  const [highlightsLoading, setHighlightsLoading] = useState(false);
  const [isCreateHighlightOpen, setIsCreateHighlightOpen] = useState(false);
  const [hlTitle, setHlTitle] = useState('');
  const [hlTakeaways, setHlTakeaways] = useState('');
  const [hlCode, setHlCode] = useState('');
  const [hlLang, setHlLang] = useState('javascript');
  const [hlMentor, setHlMentor] = useState('');
  const [hlSubmitting, setHlSubmitting] = useState(false);

  // Check URL tab query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['channels', 'lounge', 'bounties', 'highlights'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // ------------------------------------------
  // 1. CHANNELS LOGIC
  // ------------------------------------------
  const fetchChannels = async () => {
    try {
      const res = await api.get('/channels');
      if (res.data.success) {
        setChannels(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChannelMessages = async (slug) => {
    try {
      setChannelLoading(true);
      const res = await api.get(`/channels/${slug}/messages`);
      if (res.data.success) {
        setChannelMessages(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChannelLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (activeTab === 'channels' && activeChannelSlug) {
      fetchChannelMessages(activeChannelSlug);
    }
  }, [activeTab, activeChannelSlug]);

  useEffect(() => {
    if (activeTab === 'channels') {
      channelChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [channelMessages, activeTab]);

  // Socket listener for channels
  useEffect(() => {
    if (!socket) return;
    const handleNewChannelMessage = ({ channelSlug, message }) => {
      if (channelSlug === activeChannelSlug) {
        setChannelMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }
    };
    socket.on('channel_message_received', handleNewChannelMessage);
    return () => {
      socket.off('channel_message_received', handleNewChannelMessage);
    };
  }, [socket, activeChannelSlug]);

  const handleSendChannelMessage = async (e) => {
    e.preventDefault();
    if (!channelInput.trim() && !channelSnippetCode.trim()) return;

    try {
      setChannelSending(true);
      const payload = {
        text: channelInput.trim(),
        codeSnippet: channelSnippetCode.trim()
          ? { code: channelSnippetCode.trim(), language: channelSnippetLang }
          : undefined,
      };
      const res = await api.post(`/channels/${activeChannelSlug}/messages`, payload);
      if (res.data.success) {
        setChannelMessages((prev) => [...prev, res.data.data]);
        setChannelInput('');
        setChannelSnippetCode('');
        setShowCodeSnippetInput(false);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to send message', 'error');
    } finally {
      setChannelSending(false);
    }
  };

  const handleUpvoteChannelMessage = async (msgId) => {
    try {
      const res = await api.post(`/channels/${activeChannelSlug}/messages/${msgId}/upvote`);
      if (res.data.success) {
        setChannelMessages((prev) =>
          prev.map((m) => (m._id === msgId ? res.data.data : m))
        );
      }
    } catch (err) {
      addToast('Could not upvote message', 'error');
    }
  };

  // ------------------------------------------
  // 2. POMODORO TIMER & AMBIENT AUDIO LOGIC
  // ------------------------------------------
  useEffect(() => {
    let interval = null;
    if (pomoRunning && pomoSecondsLeft > 0) {
      interval = setInterval(() => {
        setPomoSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (pomoSecondsLeft === 0) {
      soundGenerator.playChime();
      if (pomoMode === 'work') {
        const nextCycles = pomoCompletedCycles + 1;
        setPomoCompletedCycles(nextCycles);
        addToast('Focus session complete! Take a well-deserved break.', 'success');
        if (nextCycles % 4 === 0) {
          setPomoMode('long');
          setPomoSecondsLeft(15 * 60);
        } else {
          setPomoMode('short');
          setPomoSecondsLeft(5 * 60);
        }
      } else {
        addToast('Break finished! Ready to lock back in?', 'info');
        setPomoMode('work');
        setPomoSecondsLeft(25 * 60);
      }
      setPomoRunning(false);
    }
    return () => clearInterval(interval);
  }, [pomoRunning, pomoSecondsLeft, pomoMode, pomoCompletedCycles]);

  const switchPomoMode = (mode) => {
    setPomoMode(mode);
    setPomoRunning(false);
    if (mode === 'work') setPomoSecondsLeft(25 * 60);
    if (mode === 'short') setPomoSecondsLeft(5 * 60);
    if (mode === 'long') setPomoSecondsLeft(15 * 60);
  };

  const handleToggleSound = (soundType) => {
    if (activeSound === soundType) {
      soundGenerator.stop();
      setActiveSound(null);
    } else {
      soundGenerator.play(soundType, soundVolume);
      setActiveSound(soundType);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setSoundVolume(val);
    soundGenerator.setVolume(val);
  };

  const formatPomoTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // ------------------------------------------
  // 3. BOUNTY QUESTIONS LOGIC
  // ------------------------------------------
  const fetchBounties = async () => {
    try {
      setBountiesLoading(true);
      const res = await api.get(`/bounties?status=${bountyFilter}`);
      if (res.data.success) {
        setBounties(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBountiesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bounties') {
      fetchBounties();
    }
  }, [activeTab, bountyFilter]);

  const handleAskBounty = async (e) => {
    e.preventDefault();
    if (!askBountyTitle.trim() || !askBountyDesc.trim()) {
      addToast('Please provide a title and description', 'error');
      return;
    }
    if ((user?.timeCredits ?? 0) < 1) {
      addToast('You need at least 1 Time Credit to place a bounty!', 'error');
      return;
    }

    try {
      setAskBountySubmitting(true);
      const tagsArray = askBountyTags.split(',').map((t) => t.trim()).filter(Boolean);
      const payload = {
        title: askBountyTitle.trim(),
        description: askBountyDesc.trim(),
        tags: tagsArray,
        codeSnippet: askBountyCode.trim()
          ? { code: askBountyCode.trim(), language: askBountyLang }
          : undefined,
      };
      const res = await api.post('/bounties', payload);
      if (res.data.success) {
        addToast('Bounty question posted! 1 credit held in escrow.', 'success');
        setIsAskBountyOpen(false);
        setAskBountyTitle('');
        setAskBountyDesc('');
        setAskBountyCode('');
        if (refreshUser) refreshUser();
        fetchBounties();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to post bounty', 'error');
    } finally {
      setAskBountySubmitting(false);
    }
  };

  const handlePostAnswer = async (bountyId) => {
    if (!answerText.trim()) {
      addToast('Please write your answer solution', 'error');
      return;
    }

    try {
      setAnswerSubmitting(true);
      const payload = {
        text: answerText.trim(),
        codeSnippet: answerCode.trim()
          ? { code: answerCode.trim(), language: answerLang }
          : undefined,
      };
      const res = await api.post(`/bounties/${bountyId}/answers`, payload);
      if (res.data.success) {
        addToast('Answer submitted!', 'success');
        setSelectedBounty(res.data.data);
        setBounties((prev) =>
          prev.map((b) => (b._id === bountyId ? res.data.data : b))
        );
        setAnswerText('');
        setAnswerCode('');
        setShowAnswerCode(false);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to post answer', 'error');
    } finally {
      setAnswerSubmitting(false);
    }
  };

  const handleAcceptAnswer = async (bountyId, answerId) => {
    try {
      const res = await api.put(`/bounties/${bountyId}/answers/${answerId}/accept`);
      if (res.data.success) {
        addToast('Answer accepted! 1 credit awarded to author.', 'success');
        setSelectedBounty(res.data.data);
        setBounties((prev) =>
          prev.map((b) => (b._id === bountyId ? res.data.data : b))
        );
        if (refreshUser) refreshUser();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to accept answer', 'error');
    }
  };

  const handleUpvoteAnswer = async (bountyId, answerId) => {
    try {
      const res = await api.post(`/bounties/${bountyId}/answers/${answerId}/upvote`);
      if (res.data.success) {
        setSelectedBounty(res.data.data);
        setBounties((prev) =>
          prev.map((b) => (b._id === bountyId ? res.data.data : b))
        );
      }
    } catch (err) {
      addToast('Could not upvote answer', 'error');
    }
  };

  // ------------------------------------------
  // 4. WHAT I LEARNED TODAY (HIGHLIGHTS) LOGIC
  // ------------------------------------------
  const fetchHighlights = async () => {
    try {
      setHighlightsLoading(true);
      const res = await api.get('/highlights');
      if (res.data.success) {
        setHighlights(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHighlightsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'highlights') {
      fetchHighlights();
    }
  }, [activeTab]);

  const handleCreateHighlight = async (e) => {
    e.preventDefault();
    if (!hlTitle.trim() || !hlTakeaways.trim()) {
      addToast('Please enter a topic and key takeaways', 'error');
      return;
    }

    try {
      setHlSubmitting(true);
      const payload = {
        title: hlTitle.trim(),
        takeaways: hlTakeaways.trim(),
        mentorName: hlMentor.trim() || undefined,
        codeSnippet: hlCode.trim()
          ? { code: hlCode.trim(), language: hlLang }
          : undefined,
      };
      const res = await api.post('/highlights', payload);
      if (res.data.success) {
        addToast('Highlight shared to community feed!', 'success');
        setIsCreateHighlightOpen(false);
        setHlTitle('');
        setHlTakeaways('');
        setHlCode('');
        setHlMentor('');
        fetchHighlights();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to share highlight', 'error');
    } finally {
      setHlSubmitting(false);
    }
  };

  const handleToggleLikeHighlight = async (hlId) => {
    try {
      const res = await api.post(`/highlights/${hlId}/like`);
      if (res.data.success) {
        setHighlights((prev) =>
          prev.map((h) => (h._id === hlId ? res.data.data : h))
        );
      }
    } catch (err) {
      addToast('Could not like highlight', 'error');
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    addToast('Code snippet copied to clipboard', 'info');
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Community Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Peer Circles, Knowledge Exchange & Study Lounges</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            SkillLoop Community Hub
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100">
            Collaborate in real-time topic channels, focus in the virtual study lounge with ambient soundscapes, answer 1-credit bounty questions, and celebrate your daily learning milestones.
          </p>
        </div>

        {/* Quick Action Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 flex items-center gap-2 text-xs font-semibold">
            <Coins className="w-4 h-4 text-amber-300" />
            <span>{user?.timeCredits ?? 0} Credits Available</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('channels')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'channels'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Hash className="w-4 h-4" />
          <span>Discussion Channels</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lounge')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'lounge'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>Virtual Study Lounge</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bounties')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'bounties'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-amber-500" />
          <span>1-Credit Bounty Q&A</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('highlights')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'highlights'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award className="w-4 h-4 text-rose-500" />
          <span>What I Learned Today</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TOPIC DISCUSSION CHANNELS */}
      {/* ========================================================================= */}
      {activeTab === 'channels' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-sm min-h-[600px]">
          {/* Channel Sidebar */}
          <div className="lg:col-span-1 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 lg:pr-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Peer Channels
              </span>
              <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-600">
                {channels.length} Rooms
              </span>
            </div>

            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {channels.map((channel) => {
                const isActive = channel.slug === activeChannelSlug;
                return (
                  <button
                    key={channel._id}
                    type="button"
                    onClick={() => setActiveChannelSlug(channel.slug)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-left text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-100'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Hash className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="truncate">{channel.name}</span>
                    </div>
                    {channel.messages?.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-semibold px-1.5 py-0.5 rounded-md bg-slate-100">
                        {channel.messages.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                <span>Async Peer Circles</span>
              </div>
              <p className="text-indigo-700/80">
                Drop technical questions, syntax snippets, and get quick asynchronous feedback from peers.
              </p>
            </div>
          </div>

          {/* Chat Feed Area */}
          <div className="lg:col-span-3 flex flex-col justify-between h-[650px]">
            {/* Room Header */}
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Hash className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    {channels.find((c) => c.slug === activeChannelSlug)?.name || activeChannelSlug}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {channels.find((c) => c.slug === activeChannelSlug)?.description}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Real-time Sync</span>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
              {channelLoading ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                  <p className="mt-2 text-xs text-slate-400">Loading channel messages...</p>
                </div>
              ) : channelMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No messages in this channel yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Start the conversation! Ask a question or share a snippet with the circle.
                  </p>
                </div>
              ) : (
                channelMessages.map((msg) => {
                  const isMe = msg.sender?._id === user?._id;
                  const hasSnippet = msg.codeSnippet && msg.codeSnippet.code;
                  const hasUpvoted = msg.upvotes?.includes(user?._id);

                  return (
                    <div key={msg._id} className="flex gap-3 group">
                      <img
                        src={
                          msg.sender?.profileImage?.url ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
                        }
                        alt={msg.sender?.name}
                        className="w-9 h-9 rounded-2xl object-cover shrink-0 mt-0.5 ring-1 ring-slate-200"
                      />
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {msg.sender?.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Text Message */}
                        {msg.text && (
                          <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-2xl rounded-tl-none inline-block max-w-2xl border border-slate-100">
                            {msg.text}
                          </div>
                        )}

                        {/* Code Snippet */}
                        {hasSnippet && (
                          <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 text-slate-100 max-w-2xl shadow-sm my-2">
                            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400">
                              <span className="font-mono font-bold text-indigo-400">
                                {msg.codeSnippet.language}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(msg.codeSnippet.code, msg._id)}
                                className="flex items-center gap-1 hover:text-white transition-colors"
                              >
                                {copiedCodeId === msg._id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                                <span>{copiedCodeId === msg._id ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                            <pre className="p-3 text-[11px] font-mono overflow-x-auto whitespace-pre leading-relaxed text-emerald-300">
                              <code>{msg.codeSnippet.code}</code>
                            </pre>
                          </div>
                        )}

                        {/* Message Actions */}
                        <div className="flex items-center gap-3 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpvoteChannelMessage(msg._id)}
                            className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg transition-all ${
                              hasUpvoted
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>{msg.upvotes?.length || 0}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={channelChatEndRef} />
            </div>

            {/* Input Composer */}
            <form onSubmit={handleSendChannelMessage} className="pt-3 border-t border-slate-100 space-y-2">
              {showCodeSnippetInput && (
                <div className="bg-slate-900 rounded-2xl p-3 space-y-2 border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-bold flex items-center gap-1.5">
                      <Code className="w-4 h-4 text-indigo-400" />
                      Syntax Code Snippet
                    </span>
                    <select
                      value={channelSnippetLang}
                      onChange={(e) => setChannelSnippetLang(e.target.value)}
                      className="bg-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 border border-slate-700 font-mono outline-none"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="python">Python</option>
                      <option value="cpp">C++</option>
                      <option value="java">Java</option>
                      <option value="sql">SQL</option>
                      <option value="json">JSON</option>
                      <option value="html">HTML</option>
                    </select>
                  </div>
                  <textarea
                    rows={4}
                    value={channelSnippetCode}
                    onChange={(e) => setChannelSnippetCode(e.target.value)}
                    placeholder="// Paste your code block here..."
                    className="w-full bg-slate-950 text-emerald-300 font-mono text-xs p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCodeSnippetInput(!showCodeSnippetInput)}
                  className={`p-2.5 rounded-2xl border transition-all ${
                    showCodeSnippetInput
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Send CodeSnippet"
                >
                  <Code className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={channelInput}
                  onChange={(e) => setChannelInput(e.target.value)}
                  placeholder={`Message #${activeChannelSlug}...`}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />

                <button
                  type="submit"
                  disabled={channelSending || (!channelInput.trim() && !channelSnippetCode.trim())}
                  className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {channelSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VIRTUAL STUDY LOUNGE & POMODORO TIMER */}
      {/* ========================================================================= */}
      {activeTab === 'lounge' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pomodoro Focus Station & Ambient Audio */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold">Deep Work Pomodoro Station</h2>
                </div>
                <div className="flex items-center gap-1.5 text-xs bg-indigo-500/20 px-3 py-1 rounded-full text-indigo-300 border border-indigo-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{pomoCompletedCycles} Cycles Done Today</span>
                </div>
              </div>

              {/* Mode Selectors */}
              <div className="flex items-center justify-center gap-2 bg-slate-950/60 p-1.5 rounded-2xl max-w-sm mx-auto border border-slate-800">
                <button
                  type="button"
                  onClick={() => switchPomoMode('work')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    pomoMode === 'work'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Focus (25m)
                </button>
                <button
                  type="button"
                  onClick={() => switchPomoMode('short')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    pomoMode === 'short'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Short Break (5m)
                </button>
                <button
                  type="button"
                  onClick={() => switchPomoMode('long')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    pomoMode === 'long'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Long Break (15m)
                </button>
              </div>

              {/* Timer Display */}
              <div className="text-center py-4">
                <div className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-white drop-shadow-md">
                  {formatPomoTime(pomoSecondsLeft)}
                </div>
                <p className="text-xs text-indigo-200/80 mt-2 font-medium">
                  {pomoMode === 'work' ? '🚀 Dedicated Study & Coding Sprint' : '☕ Relax, Stretch & Grab Water'}
                </p>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setPomoRunning(!pomoRunning)}
                  className={`px-8 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg transition-all ${
                    pomoRunning
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                  }`}
                >
                  {pomoRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                  <span>{pomoRunning ? 'Pause Sprint' : 'Start Focus Sprint'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPomoRunning(false);
                    if (pomoMode === 'work') setPomoSecondsLeft(25 * 60);
                    if (pomoMode === 'short') setPomoSecondsLeft(5 * 60);
                    if (pomoMode === 'long') setPomoSecondsLeft(15 * 60);
                  }}
                  className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Ambient Soundscape Player */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Ambient Audio Generator
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Volume:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={soundVolume}
                    onChange={handleVolumeChange}
                    className="w-20 accent-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'rain', name: 'Rainfall', icon: CloudRain, desc: 'Pink Noise' },
                  { id: 'lofi', name: 'Lofi Chords', icon: Radio, desc: 'Warm Drone' },
                  { id: 'cafe', name: 'Coffee Shop', icon: Coffee, desc: 'Ambient Chatter' },
                  { id: 'forest', name: 'Breeze', icon: Trees, desc: 'Highpass Soft' },
                ].map((track) => {
                  const Icon = track.icon;
                  const isPlaying = activeSound === track.id;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => handleToggleSound(track.id)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        isPlaying
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-102'
                          : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-5 h-5 ${isPlaying ? 'text-white' : 'text-indigo-600'}`} />
                        {isPlaying && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                      </div>
                      <div className="text-xs font-bold">{track.name}</div>
                      <div className={`text-[10px] ${isPlaying ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {track.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Lounge Co-Working Peers Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Live Co-Working Peers
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  {loungePeers.length + (isJoinedLounge ? 1 : 0)} Active
                </span>
              </div>

              {/* My Status Update */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="text-xs font-bold text-slate-700">My Study Goal Status:</div>
                <input
                  type="text"
                  value={myLoungeStatus}
                  onChange={(e) => setMyLoungeStatus(e.target.value)}
                  placeholder="e.g. Grinding Leetcode Graphs..."
                  className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>

              {/* Peers List */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {/* Current User */}
                {isJoinedLounge && (
                  <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center gap-3">
                    <img
                      src={user?.profileImage?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                      alt={user?.name}
                      className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-indigo-900 truncate">
                          {user?.name} (You)
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-700 truncate font-medium">
                        {myLoungeStatus}
                      </p>
                    </div>
                  </div>
                )}

                {loungePeers.map((peer) => (
                  <div
                    key={peer.id}
                    className="p-3 rounded-2xl bg-white border border-slate-100 hover:bg-slate-50 transition-colors flex items-center gap-3"
                  >
                    <img
                      src={peer.avatar}
                      alt={peer.name}
                      className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {peer.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {peer.minutesActive}m in
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate">
                        {peer.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: 1-CREDIT BOUNTY Q&A FEED */}
      {/* ========================================================================= */}
      {activeTab === 'bounties' && (
        <div className="space-y-6">
          {/* Bounty Header Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              {['all', 'open', 'solved'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setBountyFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize ${
                    bountyFilter === f
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f} Bounties
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsAskBountyOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all self-start sm:self-auto"
            >
              <Coins className="w-4 h-4 text-amber-300" />
              <span>Ask Bounty Question (1 Credit)</span>
            </button>
          </div>

          {/* Bounty Questions Grid / Feed */}
          {bountiesLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="mt-2 text-xs text-slate-400">Loading bounty questions...</p>
            </div>
          ) : bounties.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title="No bounty questions found"
              description="Post a challenging problem and offer 1 time-credit to the peer who solves it!"
              actionText="Post 1-Credit Bounty"
              onAction={() => setIsAskBountyOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bounties.map((bounty) => {
                const isResolved = bounty.status === 'solved';
                return (
                  <div
                    key={bounty._id}
                    onClick={() => setSelectedBounty(bounty)}
                    className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            isResolved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}
                        >
                          {isResolved ? '✓ Solved' : '⚡ 1 Credit Bounty'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(bounty.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                        {bounty.title}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {bounty.description}
                      </p>

                      {bounty.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {bounty.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-semibold"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            bounty.author?.profileImage?.url ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
                          }
                          alt={bounty.author?.name}
                          className="w-6 h-6 rounded-lg object-cover"
                        />
                        <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">
                          {bounty.author?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{bounty.answers?.length || 0} solutions</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected Bounty Details Modal */}
      {selectedBounty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      selectedBounty.status === 'solved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}
                  >
                    {selectedBounty.status === 'solved' ? '✓ Solved' : '⚡ 1 Credit Escrow Bounty'}
                  </span>
                  <span className="text-xs text-slate-400">
                    Asked by {selectedBounty.author?.name}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">{selectedBounty.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBounty(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Description & Code */}
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {selectedBounty.description}
              </p>

              {selectedBounty.codeSnippet?.code && (
                <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 text-slate-100 shadow-sm">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400">
                    <span className="font-mono text-indigo-400">
                      {selectedBounty.codeSnippet.language}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedBounty.codeSnippet.code, 'bounty-main')}
                      className="hover:text-white transition-colors"
                    >
                      {copiedCodeId === 'bounty-main' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono overflow-x-auto text-emerald-300">
                    <code>{selectedBounty.codeSnippet.code}</code>
                  </pre>
                </div>
              )}
            </div>

            {/* Answers Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Answers & Solutions</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">
                  {selectedBounty.answers?.length || 0}
                </span>
              </h3>

              {selectedBounty.answers?.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  No solutions submitted yet. Be the first to answer and claim the 1-credit bounty!
                </p>
              ) : (
                <div className="space-y-4">
                  {selectedBounty.answers?.map((ans) => {
                    const isBountyAuthor = selectedBounty.author?._id === user?._id;
                    const canAccept = isBountyAuthor && selectedBounty.status === 'open' && !ans.isAccepted;

                    return (
                      <div
                        key={ans._id}
                        className={`p-4 rounded-2xl border transition-all ${
                          ans.isAccepted
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : 'bg-slate-50 border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={
                                ans.author?.profileImage?.url ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
                              }
                              alt={ans.author?.name}
                              className="w-7 h-7 rounded-lg object-cover"
                            />
                            <span className="text-xs font-bold text-slate-900">
                              {ans.author?.name}
                            </span>
                            {ans.isAccepted && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                                ✓ Accepted Solution (+1 Credit)
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUpvoteAnswer(selectedBounty._id, ans._id)}
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 font-bold"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>{ans.upvotes?.length || 0}</span>
                          </button>
                        </div>

                        <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {ans.text}
                        </p>

                        {ans.codeSnippet?.code && (
                          <div className="bg-slate-900 rounded-xl overflow-hidden mt-3 text-slate-100 text-xs font-mono p-3 text-emerald-300">
                            <code>{ans.codeSnippet.code}</code>
                          </div>
                        )}

                        {canAccept && (
                          <div className="mt-3 pt-2 border-t border-slate-200 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleAcceptAnswer(selectedBounty._id, ans._id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Accept Solution & Award 1 Credit</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Submit Answer Form */}
              {selectedBounty.status === 'open' && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900">Submit Your Solution:</h4>
                  <textarea
                    rows={3}
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Explain your solution clearly..."
                    className="w-full text-xs p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  {showAnswerCode && (
                    <div className="bg-slate-900 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Code Solution:</span>
                        <select
                          value={answerLang}
                          onChange={(e) => setAnswerLang(e.target.value)}
                          className="bg-slate-800 text-xs text-slate-200 rounded px-2 py-0.5"
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="python">Python</option>
                          <option value="cpp">C++</option>
                          <option value="java">Java</option>
                          <option value="typescript">TypeScript</option>
                        </select>
                      </div>
                      <textarea
                        rows={4}
                        value={answerCode}
                        onChange={(e) => setAnswerCode(e.target.value)}
                        placeholder="// Code snippet here..."
                        className="w-full bg-slate-950 text-emerald-300 font-mono text-xs p-2.5 rounded-xl border border-slate-800"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowAnswerCode(!showAnswerCode)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>{showAnswerCode ? 'Remove Code Block' : '+ Add Code Snippet'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePostAnswer(selectedBounty._id)}
                      disabled={answerSubmitting || !answerText.trim()}
                      className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      {answerSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Post Solution</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ask Bounty Question Modal */}
      {isAskBountyOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">
                  Ask 1-Credit Bounty Question
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAskBountyOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAskBounty} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Question Title</label>
                <input
                  type="text"
                  required
                  value={askBountyTitle}
                  onChange={(e) => setAskBountyTitle(e.target.value)}
                  placeholder="e.g. How to structure Redux Toolkit with RTK Query optimistic updates?"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Detailed Description</label>
                <textarea
                  rows={4}
                  required
                  value={askBountyDesc}
                  onChange={(e) => setAskBountyDesc(e.target.value)}
                  placeholder="Explain the background, what you have tried, and expected behavior..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Code Snippet (Optional)</label>
                  <select
                    value={askBountyLang}
                    onChange={(e) => setAskBountyLang(e.target.value)}
                    className="text-xs bg-slate-100 rounded px-2 py-0.5"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                  </select>
                </div>
                <textarea
                  rows={3}
                  value={askBountyCode}
                  onChange={(e) => setAskBountyCode(e.target.value)}
                  placeholder="// Paste your problem code here..."
                  className="w-full bg-slate-900 text-emerald-300 font-mono text-xs p-2.5 rounded-xl border border-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Tags (comma separated)</label>
                <input
                  type="text"
                  value={askBountyTags}
                  onChange={(e) => setAskBountyTags(e.target.value)}
                  placeholder="React, TypeScript, Redux"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-600 shrink-0" />
                <span>1 Time Credit will be transferred to escrow and rewarded to the accepted solver.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAskBountyOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={askBountySubmitting}
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  {askBountySubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                  <span>Post 1-Credit Bounty</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: WHAT I LEARNED TODAY HIGHLIGHTS FEED */}
      {/* ========================================================================= */}
      {activeTab === 'highlights' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">
                Community Highlights & Session Insights
              </h2>
              <p className="text-xs text-slate-500">
                Celebrate key breakthroughs, aha moments, and mentor shoutouts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateHighlightOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Share What You Learned</span>
            </button>
          </div>

          {highlightsLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="mt-2 text-xs text-slate-400">Loading highlights feed...</p>
            </div>
          ) : highlights.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No highlights shared yet"
              description="Share your key takeaway from your latest 1-on-1 session or coding session!"
              actionText="Share Learning"
              onAction={() => setIsCreateHighlightOpen(true)}
            />
          ) : (
            <div className="space-y-4">
              {highlights.map((hl) => {
                const hasLiked = hl.likes?.includes(user?._id);
                return (
                  <div
                    key={hl._id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            hl.user?.profileImage?.url ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
                          }
                          alt={hl.user?.name}
                          className="w-10 h-10 rounded-2xl object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{hl.user?.name}</h4>
                          <span className="text-[11px] text-slate-400">
                            {new Date(hl.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      {hl.mentorName && (
                        <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100">
                          Mentor: {hl.mentorName}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{hl.title}</h3>

                    <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {hl.takeaways}
                    </p>

                    {hl.codeSnippet?.code && (
                      <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 text-slate-100 text-xs font-mono shadow-sm">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 text-slate-400">
                          <span className="font-bold text-indigo-400">{hl.codeSnippet.language}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(hl.codeSnippet.code, hl._id)}
                            className="hover:text-white"
                          >
                            {copiedCodeId === hl._id ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <pre className="p-3.5 text-emerald-300 overflow-x-auto">
                          <code>{hl.codeSnippet.code}</code>
                        </pre>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleToggleLikeHighlight(hl._id)}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                          hasLiked
                            ? 'bg-rose-50 text-rose-600 scale-105'
                            : 'text-slate-500 hover:text-rose-600 hover:bg-slate-50'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                        <span>{hl.likes?.length || 0} Kudos</span>
                      </button>

                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Skill Milestone</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Share Highlight Modal */}
      {isCreateHighlightOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Share What I Learned Today
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateHighlightOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHighlight} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Topic / Key Discovery</label>
                <input
                  type="text"
                  required
                  value={hlTitle}
                  onChange={(e) => setHlTitle(e.target.value)}
                  placeholder="e.g. Mastered Redis Cache-Aside & TTL Strategies"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Key Takeaways & Insight</label>
                <textarea
                  rows={4}
                  required
                  value={hlTakeaways}
                  onChange={(e) => setHlTakeaways(e.target.value)}
                  placeholder="What was the main breakthrough? How did it change your mental model?"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Mentor / Peer Shoutout (Optional)</label>
                <input
                  type="text"
                  value={hlMentor}
                  onChange={(e) => setHlMentor(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Code Snippet (Optional)</label>
                  <select
                    value={hlLang}
                    onChange={(e) => setHlLang(e.target.value)}
                    className="text-xs bg-slate-100 rounded px-2 py-0.5"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="cpp">C++</option>
                    <option value="typescript">TypeScript</option>
                  </select>
                </div>
                <textarea
                  rows={3}
                  value={hlCode}
                  onChange={(e) => setHlCode(e.target.value)}
                  placeholder="// Paste key code discovery here..."
                  className="w-full bg-slate-900 text-emerald-300 font-mono text-xs p-2.5 rounded-xl border border-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateHighlightOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={hlSubmitting}
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  {hlSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                  <span>Share Highlight</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPage;

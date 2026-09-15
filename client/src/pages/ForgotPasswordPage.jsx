import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Layers, Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [resetTokenDev, setResetTokenDev] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setLoading(false);
      if (res.data.success) {
        setSubmitted(true);
        setMessage(res.data.message);
        if (res.data.resetToken) {
          setResetTokenDev(res.data.resetToken);
        }
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to dispatch reset email');
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-200">
            <Layers className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs text-slate-500">
            Enter your email and we'll send you instructions to reset your password
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Email Sent</span>
              </div>
              <p>{message}</p>
            </div>

            {resetTokenDev && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs space-y-2">
                <p className="font-semibold text-indigo-900">
                  Local Dev Reset Link:
                </p>
                <Link
                  to={`/reset-password?token=${resetTokenDev}`}
                  className="text-indigo-600 underline break-all font-mono text-[11px]"
                >
                  Click here to set new password
                </Link>
              </div>
            )}

            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Account Email:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-indigo-200 transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>

            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-1.5 w-full text-center text-xs text-slate-500 hover:text-slate-800 pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to login</span>
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

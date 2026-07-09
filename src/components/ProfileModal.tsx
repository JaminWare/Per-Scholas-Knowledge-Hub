import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, UserCog } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [currentName, setCurrentName] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isManualClaim, setIsManualClaim] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setSuccess(false);
    setLoading(false);
    setNewName('');
    try {
      const saved = localStorage.getItem('learnerHub_authorName') || '';
      setCurrentName(saved);
      setIsManualClaim(!saved);
    } catch {
      setCurrentName('');
      setIsManualClaim(true);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedNew = newName.trim();
    if (!trimmedNew) {
      setError('Please enter a new display name.');
      return;
    }
    if (trimmedNew.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (trimmedNew === currentName) {
      setError('New name is the same as current name.');
      return;
    }
    if (!currentName.trim()) {
      setError('Please enter your previous display name so we can locate your submissions.');
      return;
    }

    setLoading(true);

    try {
      const { error: insertError } = await supabase
        .from('name_change_requests')
        .insert({ current_name: currentName.trim(), requested_name: trimmedNew });

      if (insertError) {
        setError('Request failed: ' + insertError.message);
        return;
      }

      setNewName('');
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[400px] bg-zinc-900 rounded-2xl border border-zinc-800/50 shadow-lg overflow-hidden">
        <div className="px-6 pt-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
              <UserCog className="w-4.5 h-4.5 shrink-0 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Edit Display Name</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Submit a name change request for admin review.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1 -mt-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5 shrink-0" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
              Name change requested! An admin will review it shortly.
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1.5">
              Current Name
              {isManualClaim && (
                <span className="ml-2 text-amber-400 font-normal">(type the name you used before)</span>
              )}
            </label>
            {isManualClaim ? (
              <input
                type="text"
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
                placeholder="Enter your exact previous display name"
                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800/50 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:border-blue-600/50 transition-all"
              />
            ) : (
              <input
                type="text"
                value={currentName}
                disabled
                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800/50 text-sm text-zinc-500 cursor-not-allowed"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">New Display Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter your corrected name..."
              className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800/50 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:border-blue-600/50 transition-all"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all text-white bg-blue-600 hover:bg-blue-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 shrink-0 animate-spin" /> Submitting...</>
            ) : success ? (
              'Requested'
            ) : (
              'Request Name Change'
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}

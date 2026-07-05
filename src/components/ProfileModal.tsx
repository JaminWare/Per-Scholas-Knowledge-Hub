import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setSuccess(false);
    setLoading(false);
    setNewName('');
    try {
      const saved = localStorage.getItem('learnerHub_authorName') || '';
      setCurrentName(saved);
    } catch {
      setCurrentName('');
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
    if (!currentName) {
      setError('No current name found. Submit a contribution first.');
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase
      .from('submissions')
      .update({ full_name: trimmedNew })
      .eq('full_name', currentName);

    if (updateError) {
      setError('Update failed: ' + updateError.message);
      setLoading(false);
      return;
    }

    await supabase
      .from('articles')
      .update({ author_name: trimmedNew })
      .eq('author_name', currentName);

    try {
      localStorage.setItem('learnerHub_authorName', trimmedNew);
    } catch { /* non-critical */ }

    setCurrentName(trimmedNew);
    setNewName('');
    setSuccess(true);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[400px] bg-zinc-900 rounded-2xl shadow-2xl shadow-black/60 border border-zinc-800 overflow-hidden">
        <div className="px-6 pt-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <UserCog className="w-4.5 h-4.5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Edit Display Name</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Updates all past and future submissions.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1 -mt-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
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
              Display name updated successfully.
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Current Name</label>
            <input
              type="text"
              value={currentName || '(none saved)'}
              disabled
              className="w-full px-4 py-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-sm text-zinc-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">New Display Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter your corrected name..."
              className="w-full px-4 py-3 rounded-xl bg-zinc-950/60 border border-zinc-700/60 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all text-white bg-sky-500 hover:bg-sky-400 shadow-lg shadow-sky-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
            ) : success ? (
              'Done'
            ) : (
              'Update Display Name'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

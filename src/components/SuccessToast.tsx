import { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface Props {
  message: string;
  isVisible: boolean;
  onDismiss: () => void;
}

export default function SuccessToast({ message, isVisible, onDismiss }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onDismiss, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[200] flex items-start gap-3 px-5 py-4 bg-zinc-900 rounded-2xl shadow-2xl border border-emerald-500/20 max-w-sm transition-all duration-300 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="p-1 rounded-full bg-emerald-500/20">
        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-zinc-100 text-sm">Badge Claimed!</p>
        <p className="text-zinc-400 text-xs mt-0.5 truncate">{message}</p>
      </div>
      <button
        onClick={() => { setShow(false); setTimeout(onDismiss, 300); }}
        className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

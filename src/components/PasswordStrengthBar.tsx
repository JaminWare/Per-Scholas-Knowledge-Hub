interface Props {
  score: number;
  feedback: string;
  crackTime: string;
}

const LABELS = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const COLORS = [
  'bg-red-500',
  'bg-red-400',
  'bg-amber-400',
  'bg-emerald-400',
  'bg-emerald-500',
];
const TEXT_COLORS = [
  'text-red-400',
  'text-red-400',
  'text-amber-400',
  'text-emerald-400',
  'text-emerald-400',
];

export default function PasswordStrengthBar({ score, feedback, crackTime }: Props) {
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < score ? COLORS[score] : 'bg-zinc-700/60'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${TEXT_COLORS[score]}`}>
          {LABELS[score]}
        </span>
        {crackTime && score > 0 && (
          <span className="text-[11px] text-zinc-500">
            Crack time: {crackTime}
          </span>
        )}
      </div>
      {feedback && (
        <p className="text-xs text-zinc-400 leading-snug">{feedback}</p>
      )}
    </div>
  );
}

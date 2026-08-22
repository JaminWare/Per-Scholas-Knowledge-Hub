export default function DeskolasIcon({ className }: { className?: string }) {
  return (
    <div className={`bg-blue-600 text-white flex items-center justify-center rounded-2xl p-1.5 ${className ?? ''}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
      >
        <path d="M7 4h4a7 7 0 0 1 7 7v2a7 7 0 0 1-7 7H7V4z" />
        <line x1="7" y1="4" x2="7" y2="20" />
      </svg>
    </div>
  );
}

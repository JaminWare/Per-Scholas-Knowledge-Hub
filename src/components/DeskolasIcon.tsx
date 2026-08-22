export default function DeskolasIcon({ className }: { className?: string }) {
  return (
    <div className={`bg-blue-600 text-white flex items-center justify-center rounded-2xl p-1.5 ${className ?? ''}`}>
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="none"
        className="w-full h-full"
      >
        <path d="M6 3h5.5C15.64 3 19 6.36 19 10.5v3C19 17.64 15.64 21 11.5 21H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm2 2v14h3.5C14.54 19 17 16.54 17 13.5v-3C17 7.46 14.54 5 11.5 5H8z" />
      </svg>
    </div>
  );
}

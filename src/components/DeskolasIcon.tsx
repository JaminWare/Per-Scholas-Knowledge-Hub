export default function DeskolasIcon({ className }: { className?: string }) {
  return (
    <div className={`bg-blue-600 text-white flex items-center justify-center rounded-lg p-0.5 ${className ?? ''}`}>
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="none"
        fillRule="evenodd"
        clipRule="evenodd"
        className="w-full h-full"
      >
        {/* Outer D silhouette */}
        <path d="M5 2h6c5.523 0 10 4.477 10 10v0c0 5.523-4.477 10-10 10H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
        {/* Inner cutout shifted left for asymmetric weight */}
        <path d="M7 5.5h3c3.59 0 6.5 2.91 6.5 6.5s-2.91 6.5-6.5 6.5H7V5.5z" fill="rgb(37 99 235)" />
      </svg>
    </div>
  );
}

import { useState, useId, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface CollapsibleCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function CollapsibleCard({ title, icon, children, defaultOpen = false }: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className="bg-zinc-950/50 rounded-2xl border border-zinc-800/30 p-6 md:p-8 transition-all duration-300 ease-out">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="w-full flex items-center gap-3 cursor-pointer select-none outline-none ring-0 focus:ring-0 group"
      >
        {icon && (
          <div className="flex-shrink-0">{icon}</div>
        )}
        <span className="rounded-full px-5 py-2 bg-zinc-800/40 border border-zinc-700/50 text-sm font-medium text-zinc-200 transition-colors group-hover:bg-zinc-800/60 group-hover:text-white">
          {title}
        </span>
        <ChevronRight
          className={`w-4 h-4 text-zinc-500 flex-shrink-0 ml-auto transition-transform duration-300 ease-in-out group-hover:text-zinc-300 ${
            isOpen ? 'rotate-90' : ''
          }`}
        />
      </button>

      <div
        id={panelId}
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="pt-6">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

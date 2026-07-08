import { useNavigate } from 'react-router-dom';
import { Sparkles, Network, HeartPulse, ChevronRight } from 'lucide-react';

interface QuickLaunchTile {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  accentClass: string;
  iconBg: string;
}

const tiles: QuickLaunchTile[] = [
  {
    id: 'networking',
    label: 'Networking Domain',
    description: 'Ports, protocols, OSI model & TCP/IP deep dives',
    icon: Network,
    route: '/core1-networking',
    accentClass: 'hover:border-sky-500/40',
    iconBg: 'bg-gradient-to-br from-sky-500 to-sky-400 shadow-sky-500/20',
  },
  {
    id: 'healthcare',
    label: 'Healthcare Lab',
    description: 'Clinical workflows, EHR devices & lab troubleshooting scenarios',
    icon: HeartPulse,
    route: '/healthcare-clinical',
    accentClass: 'hover:border-sky-500/40',
    iconBg: 'bg-gradient-to-br from-sky-500 to-sky-400 shadow-sky-500/20',
  },
];

export default function UniqueHacksGrid() {
  const navigate = useNavigate();

  return (
    <section className="mt-8">
      <div className="bg-zinc-600 border border-zinc-500 rounded-xl p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-sky-500 to-sky-400">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Unique Hacks Quick Reference Grid</h2>
            <p className="text-sm text-zinc-500">Jump directly into a Control Panelno searching required</p>
          </div>
        </div>

        {/* Quick-launch tiles */}
        <div className="grid sm:grid-cols-2 gap-4">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <button
                key={tile.id}
                onClick={() => navigate(tile.route)}
                className={`group flex items-start gap-4 p-4 text-left bg-zinc-500/50 border border-zinc-500 rounded-xl transition-all ${tile.accentClass}`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform ${tile.iconBg}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-zinc-100">
                      {tile.label}
                    </p>
                    <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{tile.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

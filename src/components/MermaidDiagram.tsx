import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#2563eb',
    primaryTextColor: '#f4f4f5',
    primaryBorderColor: '#3f3f46',
    lineColor: '#71717a',
    secondaryColor: '#18181b',
    tertiaryColor: '#27272a',
    background: '#18181b',
    mainBkg: '#27272a',
    nodeBorder: '#3f3f46',
    clusterBkg: '#1e1e22',
    titleColor: '#f4f4f5',
    edgeLabelBackground: '#27272a',
  },
  flowchart: { curve: 'basis' },
});

let idCounter = 0;

interface Props {
  chart: string;
}

export default function MermaidDiagram({ chart }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const id = `mermaid-${Date.now()}-${idCounter++}`;
    let cancelled = false;

    try {
      mermaid
        .render(id, chart.trim())
        .then(({ svg }) => {
          if (!cancelled && containerRef.current) {
            containerRef.current.innerHTML = svg;
            setError(null);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err?.message || 'Invalid diagram syntax');
          }
        });
    } catch (err: any) {
      if (!cancelled) {
        setError(err?.message || 'Invalid diagram syntax');
      }
    }

    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="rounded-xl overflow-hidden border border-red-500/30 my-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-red-950/40 border-b border-red-500/30">
          <span className="text-xs font-mono text-red-400 uppercase tracking-wider">mermaid (render error)</span>
        </div>
        <pre className="p-4 bg-zinc-900 overflow-x-auto text-sm">
          <code className="text-zinc-400 font-mono leading-relaxed whitespace-pre">{chart}</code>
        </pre>
      </div>
    );
  }

  return (
    <Zoom>
      <div className="my-4 rounded-xl border border-zinc-700 bg-zinc-900/80 p-4 overflow-x-auto cursor-zoom-in">
        <div ref={containerRef} className="flex justify-center [&_svg]:max-w-full" />
      </div>
    </Zoom>
  );
}

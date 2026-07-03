export function FirewallNetworkSegmentationDiagram({ className }: { className?: string }) {
  return (
    <div className={`w-full overflow-x-auto ${className ?? ''}`}>
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
        Figure 1Network Segmentation Architecture
      </p>
      <svg viewBox="0 0 800 220" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* Left: Internet/WAN */}
        <rect x="20" y="40" width="140" height="140" rx="8" fill="rgba(239, 68, 68, 0.1)" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="2" />
        <text x="90" y="95" fontSize="18" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          🌐
        </text>
        <text x="90" y="125" fontSize="12" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          INTERNET / WAN
        </text>

        {/* Arrow: left -> center */}
        <defs>
          <marker id="arrowRed" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="rgba(239, 68, 68, 0.6)" />
          </marker>
          <marker id="arrowSky" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="rgba(14, 165, 233, 0.6)" />
          </marker>
          <marker id="arrowTeal" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="rgba(20, 184, 166, 0.6)" />
          </marker>
        </defs>
        <line x1="160" y1="110" x2="210" y2="110" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="2" markerEnd="url(#arrowRed)" />
        <text x="185" y="100" fontSize="11" style={{ fill: 'currentColor' }} className="text-red-600 dark:text-red-400" textAnchor="middle" fontWeight="bold">
          Untrusted
        </text>

        {/* Center: Firewall */}
        <rect x="210" y="20" width="160" height="180" rx="8" fill="rgba(180, 83, 9, 0.15)" stroke="rgba(217, 119, 6, 0.7)" strokeWidth="2" />
        <text x="290" y="70" fontSize="22" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          🔥
        </text>
        <text x="290" y="105" fontSize="14" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          FIREWALL
        </text>
        <text x="290" y="135" fontSize="10" style={{ fill: 'currentColor' }} className="text-zinc-600 dark:text-zinc-400" textAnchor="middle">
          ACL Rules
        </text>
        <text x="290" y="155" fontSize="10" style={{ fill: 'currentColor' }} className="text-zinc-600 dark:text-zinc-400" textAnchor="middle">
          SPI Engine
        </text>

        {/* Arrow: center -> right-top (Private LAN) */}
        <line x1="370" y1="70" x2="420" y2="70" stroke="rgba(14, 165, 233, 0.6)" strokeWidth="2" markerEnd="url(#arrowSky)" />
        <text x="395" y="60" fontSize="11" style={{ fill: 'currentColor' }} className="text-sky-600 dark:text-sky-400" textAnchor="middle" fontWeight="bold">
          Allowed
        </text>

        {/* Arrow: center -> right-bottom (DMZ) */}
        <line x1="370" y1="140" x2="420" y2="140" stroke="rgba(20, 184, 166, 0.6)" strokeWidth="2" markerEnd="url(#arrowTeal)" />
        <text x="395" y="160" fontSize="11" style={{ fill: 'currentColor' }} className="text-teal-600 dark:text-teal-400" textAnchor="middle" fontWeight="bold">
          Isolated
        </text>

        {/* Right: Private LAN (top) */}
        <rect x="420" y="20" width="160" height="80" rx="8" fill="rgba(14, 165, 233, 0.1)" stroke="rgba(14, 165, 233, 0.6)" strokeWidth="2" />
        <text x="500" y="50" fontSize="16" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          💻
        </text>
        <text x="500" y="73" fontSize="11" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          PRIVATE LAN
        </text>

        {/* Right: DMZ (bottom) */}
        <rect x="420" y="120" width="160" height="80" rx="8" fill="rgba(20, 184, 166, 0.1)" stroke="rgba(20, 184, 166, 0.6)" strokeWidth="2" />
        <text x="500" y="150" fontSize="16" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          🌐
        </text>
        <text x="500" y="173" fontSize="11" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          DMZ
        </text>

        {/* Labels inside right boxes */}
        <text x="500" y="62" fontSize="9" style={{ fill: 'currentColor' }} className="text-zinc-600 dark:text-zinc-400" textAnchor="middle">
          Endpoints · Servers
        </text>
        <text x="500" y="162" fontSize="9" style={{ fill: 'currentColor' }} className="text-zinc-600 dark:text-zinc-400" textAnchor="middle">
          Public Servers
        </text>
      </svg>
    </div>
  );
}

export function FirewallPacketInspectionDiagram({ className }: { className?: string }) {
  return (
    <div className={`w-full overflow-x-auto ${className ?? ''}`}>
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
        Figure 2Packet Inspection Lifecycle
      </p>
      <svg viewBox="0 0 900 140" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="arrowZinc" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="rgba(113, 113, 122, 0.6)" />
          </marker>
        </defs>

        {/* Node 1: Header Parse */}
        <rect x="20" y="30" width="140" height="80" rx="20" fill="rgba(14, 165, 233, 0.15)" stroke="rgba(56, 189, 248, 0.6)" strokeWidth="2" />
        <text x="90" y="75" fontSize="13" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          Header Parse
        </text>

        {/* Arrow 1 -> 2 */}
        <line x1="160" y1="70" x2="200" y2="70" stroke="rgba(113, 113, 122, 0.5)" strokeWidth="2" markerEnd="url(#arrowZinc)" />

        {/* Node 2: State Table Lookup */}
        <rect x="200" y="30" width="140" height="80" rx="20" fill="rgba(139, 92, 246, 0.15)" stroke="rgba(167, 139, 250, 0.6)" strokeWidth="2" />
        <text x="270" y="75" fontSize="13" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          State Table Lookup
        </text>

        {/* Arrow 2 -> 3 */}
        <line x1="340" y1="70" x2="380" y2="70" stroke="rgba(113, 113, 122, 0.5)" strokeWidth="2" markerEnd="url(#arrowZinc)" />

        {/* Node 3: ACL Rules Check */}
        <rect x="380" y="30" width="140" height="80" rx="20" fill="rgba(217, 119, 6, 0.15)" stroke="rgba(251, 191, 36, 0.6)" strokeWidth="2" />
        <text x="450" y="75" fontSize="13" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          ACL Rules Check
        </text>

        {/* Arrow 3 -> 4a (Allow) */}
        <line x1="520" y1="50" x2="560" y2="35" stroke="rgba(113, 113, 122, 0.5)" strokeWidth="2" markerEnd="url(#arrowZinc)" />

        {/* Arrow 3 -> 4b (Drop) */}
        <line x1="520" y1="90" x2="560" y2="105" stroke="rgba(113, 113, 122, 0.5)" strokeWidth="2" markerEnd="url(#arrowZinc)" />

        {/* Node 4a: ALLOW */}
        <rect x="560" y="10" width="120" height="50" rx="15" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(34, 197, 94, 0.6)" strokeWidth="2" />
        <text x="620" y="40" fontSize="12" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          ALLOW ✓
        </text>

        {/* Node 4b: DROP */}
        <rect x="560" y="80" width="120" height="50" rx="15" fill="rgba(239, 68, 68, 0.15)" stroke="rgba(248, 113, 113, 0.6)" strokeWidth="2" />
        <text x="620" y="110" fontSize="12" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          DROP ✗
        </text>
      </svg>
    </div>
  );
}

export function HealthcareCloudHierarchyDiagram({ className }: { className?: string }) {
  return (
    <div className={`w-full overflow-x-auto ${className ?? ''}`}>
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
        Healthcare Cloud HierarchyService Model Comparison
      </p>
      <div className={`flex flex-col-reverse gap-3 ${className ?? ''}`}>
        {/* IaaS (bottom) */}
        <div className="bg-sky-100 dark:bg-sky-900/30 border border-sky-300 dark:border-sky-700 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-sky-700 dark:text-sky-300">IaaS</span>
            <span className="text-sm text-sky-700 dark:text-sky-300">
              <span className="font-bold">Customer:</span> OS · Apps · Data | <span className="font-bold">Provider:</span> Physical Infra
            </span>
          </div>
        </div>

        {/* PaaS (middle) */}
        <div className="bg-teal-100 dark:bg-teal-900/30 border border-teal-300 dark:border-teal-700 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-teal-700 dark:text-teal-300">PaaS</span>
            <span className="text-sm text-teal-700 dark:text-teal-300">
              <span className="font-bold">Customer:</span> Apps + Data | <span className="font-bold">Provider:</span> Infra + OS
            </span>
          </div>
        </div>

        {/* SaaS (top) */}
        <div className="bg-violet-100 dark:bg-violet-900/30 border border-violet-300 dark:border-violet-700 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-violet-700 dark:text-violet-300">SaaS</span>
            <span className="text-sm text-violet-700 dark:text-violet-300">
              <span className="font-bold">Customer:</span> Data only | <span className="font-bold">Provider:</span> Everything
            </span>
          </div>
        </div>

        {/* BAA Compliance Boundary Annotation */}
        <div className="mt-4 p-3 border-l-4 border-sky-400 bg-sky-50 dark:bg-sky-950/20 rounded">
          <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">
            🔒 BAA Compliance BoundaryCustomer-managed zones
          </p>
        </div>
      </div>
    </div>
  );
}

export function TRACEPromptPipelineDiagram({ className }: { className?: string }) {
  return (
    <div className={`w-full overflow-x-auto ${className ?? ''}`}>
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
        TRACE Prompt FrameworkPHI-Safe Pipeline
      </p>
      <svg viewBox="0 0 1000 140" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="arrowPipeline" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="rgba(113, 113, 122, 0.6)" />
          </marker>
        </defs>

        {/* Node 1: Raw Prompt */}
        <rect x="20" y="30" width="120" height="80" rx="15" fill="rgba(161, 161, 170, 0.15)" stroke="rgba(161, 161, 170, 0.6)" strokeWidth="2" />
        <text x="80" y="75" fontSize="12" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          Raw Prompt
        </text>

        {/* Arrow 1->2 */}
        <line x1="140" y1="70" x2="170" y2="70" stroke="rgba(113, 113, 122, 0.5)" strokeWidth="2" markerEnd="url(#arrowPipeline)" />

        {/* Node 2: PHI Scrubbing */}
        <rect x="170" y="30" width="140" height="80" rx="15" fill="rgba(217, 119, 6, 0.15)" stroke="rgba(251, 191, 36, 0.6)" strokeWidth="2" />
        <text x="240" y="70" fontSize="12" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          🛡
        </text>
        <text x="240" y="88" fontSize="11" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          PHI Scrubbing
        </text>

        {/* Arrow 2->3 */}
        <line x1="310" y1="70" x2="340" y2="70" stroke="rgba(113, 113, 122, 0.5)" strokeWidth="2" markerEnd="url(#arrowPipeline)" />

        {/* Node 3: LLM Context */}
        <rect x="340" y="30" width="140" height="80" rx="15" fill="rgba(14, 165, 233, 0.15)" stroke="rgba(56, 189, 248, 0.6)" strokeWidth="2" />
        <text x="410" y="75" fontSize="12" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          LLM Context
        </text>

        {/* Arrow 3->4 */}
        <line x1="480" y1="70" x2="510" y2="70" stroke="rgba(113, 113, 122, 0.5)" strokeWidth="2" markerEnd="url(#arrowPipeline)" />

        {/* Node 4: Clinical Verification */}
        <rect x="510" y="30" width="140" height="80" rx="15" fill="rgba(20, 184, 166, 0.15)" stroke="rgba(45, 212, 191, 0.6)" strokeWidth="2" />
        <text x="580" y="75" fontSize="12" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          Clinical Verify
        </text>

        {/* Arrow 4->5 */}
        <line x1="650" y1="70" x2="680" y2="70" stroke="rgba(113, 113, 122, 0.5)" strokeWidth="2" markerEnd="url(#arrowPipeline)" />

        {/* Node 5: Sanitized Output */}
        <rect x="680" y="30" width="140" height="80" rx="15" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(34, 197, 94, 0.6)" strokeWidth="2" />
        <text x="750" y="75" fontSize="12" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          Output ✓
        </text>
      </svg>
    </div>
  );
}

export function OSIModelStackDiagram({ className }: { className?: string }) {
  const layers = [
    { number: 7, name: 'Application', pdu: 'Data', color: 'sky' },
    { number: 6, name: 'Presentation', pdu: 'Data', color: 'violet' },
    { number: 5, name: 'Session', pdu: 'Data', color: 'purple' },
    { number: 4, name: 'Transport', pdu: 'Segments', color: 'teal' },
    { number: 3, name: 'Network', pdu: 'Packets', color: 'emerald' },
    { number: 2, name: 'Data Link', pdu: 'Frames', color: 'amber' },
    { number: 1, name: 'Physical', pdu: 'Bits', color: 'orange' },
  ];

  const colorMap: Record<string, string> = {
    sky: 'bg-sky-500',
    violet: 'bg-violet-500',
    purple: 'bg-purple-500',
    teal: 'bg-teal-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    orange: 'bg-orange-500',
  };

  const borderColorMap: Record<string, string> = {
    sky: 'border-sky-300 dark:border-sky-600',
    violet: 'border-violet-300 dark:border-violet-600',
    purple: 'border-purple-300 dark:border-purple-600',
    teal: 'border-teal-300 dark:border-teal-600',
    emerald: 'border-emerald-300 dark:border-emerald-600',
    amber: 'border-amber-300 dark:border-amber-600',
    orange: 'border-orange-300 dark:border-orange-600',
  };

  return (
    <div className={`w-full overflow-x-auto ${className ?? ''}`}>
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
        7-Layer OSI Reference Model
      </p>
      <div className="space-y-1">
        {layers.map((layer, idx) => (
          <div
            key={layer.number}
            className={`flex items-center gap-3 p-3 rounded ${
              idx % 2 === 0 ? 'bg-zinc-100 dark:bg-zinc-800/50' : 'bg-zinc-200/60 dark:bg-zinc-900/40'
            }`}
          >
            {/* Layer Number Badge */}
            <div className={`${colorMap[layer.color]} w-8 h-8 rounded-full font-bold text-sm flex items-center justify-center text-white flex-shrink-0`}>
              {layer.number}
            </div>

            {/* Layer Name */}
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 w-32 flex-shrink-0">
              {layer.name}
            </span>

            {/* PDU Chip */}
            <div className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono border ${borderColorMap[layer.color]} text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800/50`}>
              {layer.pdu}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HL7MessageRoutingDiagram({ className }: { className?: string }) {
  return (
    <div className={`w-full overflow-x-auto ${className ?? ''}`}>
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
        HL7 Message Routing Flow
      </p>
      <svg viewBox="0 0 800 180" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="arrowHL7" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="rgba(16, 185, 129, 0.7)" />
          </marker>
        </defs>

        {/* Node 1: Bedside Vitals Monitor - Terminal Box */}
        <rect x="20" y="20" width="180" height="140" rx="8" fill="rgba(24, 24, 27, 0.8)" stroke="rgba(16, 185, 129, 0.7)" strokeWidth="2" />
        <text x="110" y="60" fontSize="16" fontWeight="bold" style={{ fill: 'rgba(34, 197, 94, 0.9)' }} textAnchor="middle">
          📡
        </text>
        <text x="110" y="85" fontSize="13" fontWeight="bold" style={{ fill: 'rgba(240, 240, 240, 0.95)' }} textAnchor="middle">
          Vitals Monitor
        </text>
        <text x="110" y="110" fontSize="10" style={{ fill: 'rgba(161, 161, 170, 0.8)' }} textAnchor="middle">
          HL7 v2.x ADT
        </text>

        {/* Arrow 1 -> 2 */}
        <line x1="200" y1="90" x2="260" y2="90" stroke="rgba(16, 185, 129, 0.6)" strokeWidth="2.5" markerEnd="url(#arrowHL7)" />
        <text x="230" y="80" fontSize="10" style={{ fill: 'currentColor' }} className="text-emerald-600 dark:text-emerald-400" textAnchor="middle" fontWeight="bold">
          Raw HL7 →
        </text>

        {/* Node 2: Interface Engine - Terminal Box */}
        <rect x="260" y="20" width="180" height="140" rx="8" fill="rgba(24, 24, 27, 0.8)" stroke="rgba(56, 189, 248, 0.7)" strokeWidth="2" />
        <text x="350" y="60" fontSize="16" fontWeight="bold" style={{ fill: 'rgba(56, 189, 248, 0.9)' }} textAnchor="middle">
          ⚙
        </text>
        <text x="350" y="85" fontSize="13" fontWeight="bold" style={{ fill: 'rgba(240, 240, 240, 0.95)' }} textAnchor="middle">
          Parser / MuleSoft
        </text>
        <text x="350" y="110" fontSize="10" style={{ fill: 'rgba(161, 161, 170, 0.8)' }} textAnchor="middle">
          Validate · Transform
        </text>

        {/* Arrow 2 -> 3 */}
        <line x1="440" y1="90" x2="500" y2="90" stroke="rgba(16, 185, 129, 0.6)" strokeWidth="2.5" markerEnd="url(#arrowHL7)" />
        <text x="470" y="80" fontSize="10" style={{ fill: 'currentColor' }} className="text-teal-600 dark:text-teal-400" textAnchor="middle" fontWeight="bold">
          FHIR →
        </text>

        {/* Node 3: EHR Production DB - Terminal Box */}
        <rect x="500" y="20" width="180" height="140" rx="8" fill="rgba(24, 24, 27, 0.8)" stroke="rgba(45, 212, 191, 0.7)" strokeWidth="2" />
        <text x="590" y="60" fontSize="16" fontWeight="bold" style={{ fill: 'rgba(45, 212, 191, 0.9)' }} textAnchor="middle">
          🗄
        </text>
        <text x="590" y="85" fontSize="13" fontWeight="bold" style={{ fill: 'rgba(240, 240, 240, 0.95)' }} textAnchor="middle">
          Epic / Cerner EHR
        </text>
        <text x="590" y="110" fontSize="10" style={{ fill: 'rgba(161, 161, 170, 0.8)' }} textAnchor="middle">
          Production Write
        </text>
      </svg>
    </div>
  );
}

export function MDMEnrollmentFlowDiagram({ className }: { className?: string }) {
  return (
    <div className={`w-full overflow-x-auto ${className ?? ''}`}>
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
        OTA Device Enrollment & Security Profile Push Lifecycle
      </p>
      <svg viewBox="0 0 950 140" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="arrowMDM" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="rgba(113, 113, 122, 0.6)" />
          </marker>
        </defs>

        {/* Step 1: Device Powers On */}
        <rect x="20" y="30" width="130" height="80" rx="20" fill="rgba(161, 161, 170, 0.15)" stroke="rgba(161, 161, 170, 0.6)" strokeWidth="2" />
        <text x="85" y="75" fontSize="12" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          Device Powers On
        </text>

        {/* Arrow 1->2 */}
        <line x1="150" y1="70" x2="180" y2="70" stroke="rgba(113, 113, 122, 0.5)" strokeWidth="2" markerEnd="url(#arrowMDM)" />

        {/* Step 2: MDM Server Discovery */}
        <rect x="180" y="30" width="130" height="80" rx="20" fill="rgba(14, 165, 233, 0.15)" stroke="rgba(56, 189, 248, 0.6)" strokeWidth="2" />
        <text x="245" y="75" fontSize="12" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          MDM Discovery
        </text>

        {/* Arrow 2->3 */}
        <line x1="310" y1="70" x2="340" y2="70" stroke="rgba(113, 113, 122, 0.5)" strokeWidth="2" markerEnd="url(#arrowMDM)" />

        {/* Step 3: Profile Push */}
        <rect x="340" y="30" width="130" height="80" rx="20" fill="rgba(20, 184, 166, 0.15)" stroke="rgba(45, 212, 191, 0.6)" strokeWidth="2" />
        <text x="405" y="75" fontSize="12" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          Profile Push
        </text>

        {/* Arrow 3->4 */}
        <line x1="470" y1="70" x2="500" y2="70" stroke="rgba(113, 113, 122, 0.5)" strokeWidth="2" markerEnd="url(#arrowMDM)" />

        {/* Step 4: Compliance Check */}
        <rect x="500" y="30" width="130" height="80" rx="20" fill="rgba(217, 119, 6, 0.15)" stroke="rgba(251, 191, 36, 0.6)" strokeWidth="2" />
        <text x="565" y="75" fontSize="12" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          Compliance Check
        </text>

        {/* Arrow 4->5 */}
        <line x1="630" y1="70" x2="660" y2="70" stroke="rgba(113, 113, 122, 0.5)" strokeWidth="2" markerEnd="url(#arrowMDM)" />

        {/* Step 5: Enrolled */}
        <rect x="660" y="30" width="130" height="80" rx="20" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(34, 197, 94, 0.6)" strokeWidth="2" />
        <text x="725" y="75" fontSize="12" fontWeight="bold" style={{ fill: 'currentColor' }} className="text-zinc-700 dark:text-zinc-300" textAnchor="middle">
          Enrolled ✓
        </text>
      </svg>
    </div>
  );
}

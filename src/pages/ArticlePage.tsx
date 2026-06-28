import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Bookmark, BookOpen, ExternalLink, UploadCloud } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ArticleCard from '../components/ArticleCard';
import MarkdownRenderer from '../components/MarkdownRenderer';
import {
  OSIModelStackDiagram,
  HL7MessageRoutingDiagram,
  MDMEnrollmentFlowDiagram,
  FirewallNetworkSegmentationDiagram,
  FirewallPacketInspectionDiagram,
} from '../components/DiagramComponents';
import { articleContentMap } from '../data/articles';
import type { Article, Contributor } from '../types/database';

const sectionTrackLabels: Record<string, string> = {
  'core1-networking':      'COMPTIA A+ CORE 1 — NETWORKING',
  'core1-troubleshooting': 'COMPTIA A+ CORE 1 — TROUBLESHOOTING',
  'core1-mobile':          'COMPTIA A+ CORE 1 — MOBILE DEVICES',
  'core1-hardware':        'COMPTIA A+ CORE 1 — HARDWARE',
  'core1-cloud':           'COMPTIA A+ CORE 1 — CLOUD',
  'core2-os':              'COMPTIA A+ CORE 2 — OPERATING SYSTEMS',
  'core2-security':        'COMPTIA A+ CORE 2 — SECURITY',
  'core2-software':        'COMPTIA A+ CORE 2 — SOFTWARE TROUBLESHOOTING',
  'core2-operations':      'COMPTIA A+ CORE 2 — OPERATIONS',
  'healthcare-hipaa':      'ADVANCED HEALTHCARE IT — HIPAA SECURITY',
  'healthcare-ehr':        'ADVANCED HEALTHCARE IT — EHR ARCHITECTURE',
  'healthcare-clinical':   'ADVANCED HEALTHCARE IT — CLINICAL WORKFLOWS',
  'azari-prompt-playbook': 'AI PROMPT PLAYBOOK',
  'study-tips':            'STUDY TIPS',
  'quick-references':      'QUICK REFERENCES',
  'diagrams':              'DIAGRAMS',
};

// Slugs that must never fall through to "Article Not Found"
const FOUNDER_SLUGS = new Set([
  'firewall-basics', 'command-documentation', 'snap-in',
  'intro-healthcare-it-security', 'cloud-computing-healthcare',
  'ai-prompt-engineering-healthcare',
  'diagrams/network-topology-architecture', 'diagrams/osi-pdu-flow',
  'quick-references/osi-model',
  'core1-networking/sample-protocols',
]);

const roleBadgeStyles: Record<string, string> = {
  'Founder':             'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20',
  'HealthIT Specialist': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  'Reference Author':    'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'Core 1 Expert':       'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  'Core 2 Expert':       'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  'Playbook Engineer':   'bg-violet-500/10 text-violet-600 dark:text-violet-400',
};

const SAMPLE_KEYWORDS = [
  'comptia', 'core1', 'core2', 'mobile', 'networking', 'hardware',
  'virtualization', 'troubleshooting', 'os', 'security', 'software',
  'operations', 'hipaa', 'ehr', 'clinical', 'healthcare', 'sample',
  'mnemonic', 'commands', 'shortcuts', 'quick-references', 'diagrams',
];

function isKnownSampleSlug(slug: string): boolean {
  const lower = slug.toLowerCase();
  return SAMPLE_KEYWORDS.some((kw) => lower.includes(kw));
}

function slugToSampleTitle(slug: string): string {
  const stripped = slug
    .replace(/^(core1|core2|healthcare)-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return `[Sample] ${stripped}`;
}

function deriveTrackLabel(article: Article): string {
  if (article.section) {
    const key = article.section.slug;
    return sectionTrackLabels[key] ?? article.section.title.toUpperCase();
  }
  const prefix = article.slug.split('/')[0];
  return sectionTrackLabels[prefix] ?? 'LEARNERS KNOWLEDGE BASE';
}

function deriveAuthorName(contributor: Contributor | null, article: Article): string {
  if (contributor?.name) return contributor.name;
  if (FOUNDER_SLUGS.has(article.slug)) return 'Jamin Ware';
  const featuredSlugs = ['firewall-basics', 'command-documentation', 'snap-in', 'intro-healthcare-it-security', 'cloud-computing-healthcare', 'ai-prompt-engineering-healthcare'];
  if (featuredSlugs.includes(article.slug)) return 'Jamin Ware';
  return 'Knowledge Base';
}

// Full-page diagram panels for founder Diagrams articles
function NetworkTopologyArticleDiagrams() {
  return (
    <div className="space-y-8">
      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
        <FirewallNetworkSegmentationDiagram />
      </div>
      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
        <FirewallPacketInspectionDiagram />
      </div>
      <div className="prose-style space-y-4 text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
        <p>The three-tier network topology model divides enterprise switching infrastructure into three distinct functional layers. The <strong className="text-zinc-800 dark:text-zinc-200">Core Layer</strong> provides high-speed backbone connectivity between distribution switches with sub-millisecond failover. The <strong className="text-zinc-800 dark:text-zinc-200">Distribution Layer</strong> enforces routing policy, VLAN segmentation, and inter-subnet ACLs. The <strong className="text-zinc-800 dark:text-zinc-200">Access Layer</strong> connects end-user devices with port security, 802.1X authentication, and Power over Ethernet (PoE).</p>
        <p>The firewall segmentation diagram above illustrates how the DMZ acts as a controlled buffer zone. Public-facing services (web servers, DNS resolvers) sit in the DMZ — reachable from the internet but fully isolated from the private LAN. Stateful Packet Inspection (SPI) tracks each TCP/UDP session in a state table, allowing return traffic for established connections while silently dropping unsolicited inbound probes.</p>
      </div>

      {/* Citations */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/5 overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-amber-200 dark:border-amber-500/20">
          <ExternalLink className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <h2 className="text-base font-bold text-amber-700 dark:text-amber-400">References &amp; Citations</h2>
        </div>
        <ul className="px-5 py-4 space-y-2.5">
          <li className="flex gap-2.5 items-start text-sm">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400" />
            <span className="text-zinc-600 dark:text-zinc-400">
              <strong className="font-semibold text-zinc-800 dark:text-zinc-200">Cisco Press:</strong>{' '}
              <a href="https://www.ciscopress.com/articles/article.asp?p=2202410" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline underline-offset-2">
                Campus Network Architecture and Hierarchical Design Models (Core, Distribution, Access)
              </a>
            </span>
          </li>
          <li className="flex gap-2.5 items-start text-sm">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400" />
            <span className="text-zinc-600 dark:text-zinc-400">
              <strong className="font-semibold text-zinc-800 dark:text-zinc-200">IEEE Standards:</strong>{' '}
              <a href="https://www.ieee802.org/3/" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline underline-offset-2">
                IEEE 802.3 Ethernet Working Group LAN/MAN Infrastructure Standards
              </a>
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function OSIPDUArticleDiagrams() {
  return (
    <div className="space-y-8">
      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
        <OSIModelStackDiagram />
      </div>
      <div className="space-y-4 text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
        <p>Data encapsulation is the process of wrapping payload data with protocol-specific headers (and sometimes trailers) as it descends through the OSI stack before transmission. Each layer adds its own metadata so the receiving peer at the same layer can process it correctly.</p>
        <p><strong className="text-zinc-800 dark:text-zinc-200">Layer 7–5 (Application/Presentation/Session):</strong> Raw data is formatted, encrypted if applicable (TLS lives here conceptually), and session multiplexed. PDU is simply called "Data".</p>
        <p><strong className="text-zinc-800 dark:text-zinc-200">Layer 4 (Transport):</strong> TCP or UDP adds source/destination ports and, for TCP, sequence numbers and checksum. The PDU becomes a <code className="px-1 bg-zinc-200 dark:bg-zinc-800 rounded font-mono text-sky-700 dark:text-sky-400">Segment</code>.</p>
        <p><strong className="text-zinc-800 dark:text-zinc-200">Layer 3 (Network):</strong> IP header adds source and destination IP addresses. The PDU becomes a <code className="px-1 bg-zinc-200 dark:bg-zinc-800 rounded font-mono text-sky-700 dark:text-sky-400">Packet</code>. Routers operate at this layer.</p>
        <p><strong className="text-zinc-800 dark:text-zinc-200">Layer 2 (Data Link):</strong> Ethernet header adds MAC addresses; a trailer adds a Frame Check Sequence (FCS) CRC. PDU = <code className="px-1 bg-zinc-200 dark:bg-zinc-800 rounded font-mono text-sky-700 dark:text-sky-400">Frame</code>. Switches operate here.</p>
        <p><strong className="text-zinc-800 dark:text-zinc-200">Layer 1 (Physical):</strong> Frames are serialized into electrical voltages, light pulses, or radio waves. PDU = <code className="px-1 bg-zinc-200 dark:bg-zinc-800 rounded font-mono text-sky-700 dark:text-sky-400">Bits</code>.</p>
      </div>

      {/* Citations */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/5 overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-amber-200 dark:border-amber-500/20">
          <ExternalLink className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <h2 className="text-base font-bold text-amber-700 dark:text-amber-400">References &amp; Citations</h2>
        </div>
        <ul className="px-5 py-4 space-y-2.5">
          <li className="flex gap-2.5 items-start text-sm">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400" />
            <span className="text-zinc-600 dark:text-zinc-400">
              <strong className="font-semibold text-zinc-800 dark:text-zinc-200">ISO Standard:</strong>{' '}
              <a href="https://www.iso.org/standard/20269.html" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline underline-offset-2">
                ISO/IEC 7498-1: Open Systems Interconnection Basic Reference Model
              </a>
            </span>
          </li>
          <li className="flex gap-2.5 items-start text-sm">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400" />
            <span className="text-zinc-600 dark:text-zinc-400">
              <strong className="font-semibold text-zinc-800 dark:text-zinc-200">Cisco Press:</strong>{' '}
              <a href="https://www.ciscopress.com/store/interconnecting-cisco-network-devices-part-1-icnd1-9780132877435" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline underline-offset-2">
                Interconnecting Cisco Network Devices — Data Encapsulation and Segment-to-Bit Flowcharts
              </a>
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function OSIQuickRefArticleDiagrams() {
  return (
    <div className="space-y-8">
      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
        <OSIModelStackDiagram />
      </div>

      <div className="space-y-5 text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-2">OSI Model — Layer-by-Layer Technical Breakdown</h2>

        <p>The Open Systems Interconnection (OSI) model is a conceptual framework standardized by the ISO (ISO/IEC 7498-1) that divides network communication into 7 distinct functional layers. Each layer communicates with its adjacent layers through defined service interfaces, and with its peer layer on the remote host through shared protocols. For the CompTIA A+ Core 1 exam (Domain 2.0), understanding how data moves through these layers — and what Protocol Data Unit (PDU) each layer produces — is a foundational requirement.</p>

        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-6">Data Encapsulation Flow</h3>
        <p>When an application sends data, that payload descends through the sender's OSI stack, gaining a new header (and sometimes a trailer) at each layer. This process is called <strong className="font-semibold text-zinc-900 dark:text-zinc-100">encapsulation</strong>. On the receiving end, each layer strips its corresponding header and passes the payload up — called <strong className="font-semibold text-zinc-900 dark:text-zinc-100">de-encapsulation</strong>.</p>

        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700 my-4">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-zinc-200/60 dark:bg-zinc-800/60">
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700">Layer</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700">PDU</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700">Key Protocols</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700">Device / Function</th>
              </tr>
            </thead>
            <tbody>
              {[
                { layer: 7, name: 'Application', pdu: 'Data', protocols: 'HTTP, HTTPS, FTP, DNS, SMTP', device: 'End-user application' },
                { layer: 6, name: 'Presentation', pdu: 'Data', protocols: 'TLS/SSL, JPEG, ASCII', device: 'Translator / Encryptor' },
                { layer: 5, name: 'Session', pdu: 'Data', protocols: 'NetBIOS, PPTP, SIP', device: 'Session manager' },
                { layer: 4, name: 'Transport', pdu: 'Segment', protocols: 'TCP, UDP', device: 'End-to-end delivery' },
                { layer: 3, name: 'Network', pdu: 'Packet', protocols: 'IP, ICMP, OSPF, BGP', device: 'Router' },
                { layer: 2, name: 'Data Link', pdu: 'Frame', protocols: 'Ethernet, 802.11 Wi-Fi, ARP', device: 'Switch / Bridge' },
                { layer: 1, name: 'Physical', pdu: 'Bits', protocols: 'CAT6, Fiber, DSL, Radio', device: 'Hub / NIC / Cable' },
              ].map((row, i) => (
                <tr key={row.layer} className={`border-b border-zinc-100 dark:border-zinc-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-zinc-50/50 dark:bg-zinc-800/20'}`}>
                  <td className="px-4 py-2.5 font-bold text-zinc-900 dark:text-zinc-100">{row.layer}</td>
                  <td className="px-4 py-2.5 font-medium text-zinc-800 dark:text-zinc-200">{row.name}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-sky-700 dark:text-sky-400">{row.pdu}</td>
                  <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400 text-[12px]">{row.protocols}</td>
                  <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400 text-[12px]">{row.device}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-6">CompTIA A+ Exam Focus Areas</h3>
        <p>CompTIA A+ Core 1 (220-1201) Domain 2.0 — Networking, tests your ability to:</p>
        <ul className="space-y-1.5 pl-0 list-none">
          {[
            'Identify which OSI layer a given device or protocol operates at',
            'Explain the difference between TCP (connection-oriented, reliable) and UDP (connectionless, low-latency)',
            'Understand why ARP resolves MAC addresses and lives at Layer 2 / Layer 3 boundary',
            'Know that switches operate at Layer 2 (MAC addressing) while routers operate at Layer 3 (IP addressing)',
            'Distinguish between a collision domain (Layer 1/2) and a broadcast domain (Layer 3)',
          ].map((item, i) => (
            <li key={i} className="flex gap-2.5 items-start">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500 dark:bg-sky-400" />
              <span className="text-zinc-600 dark:text-zinc-400">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Citations */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/5 overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-amber-200 dark:border-amber-500/20">
          <ExternalLink className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <h2 className="text-base font-bold text-amber-700 dark:text-amber-400">References &amp; Citations</h2>
        </div>
        <ul className="px-5 py-4 space-y-2.5">
          <li className="flex gap-2.5 items-start text-sm">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400" />
            <span className="text-zinc-600 dark:text-zinc-400">
              <strong className="font-semibold text-zinc-800 dark:text-zinc-200">ISO Standard:</strong>{' '}
              <a href="https://www.iso.org/standard/20269.html" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline underline-offset-2">
                ISO/IEC 7498-1: Open Systems Interconnection Basic Reference Model
              </a>
            </span>
          </li>
          <li className="flex gap-2.5 items-start text-sm">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400" />
            <span className="text-zinc-600 dark:text-zinc-400">
              <strong className="font-semibold text-zinc-800 dark:text-zinc-200">CompTIA Official:</strong>{' '}
              <a href="https://www.comptia.org/certifications/a" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline underline-offset-2">
                CompTIA A+ Core 1 Certification Exam Objectives (220-1201) — Domain 2.0
              </a>
            </span>
          </li>
          <li className="flex gap-2.5 items-start text-sm">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400" />
            <span className="text-zinc-600 dark:text-zinc-400">
              <strong className="font-semibold text-zinc-800 dark:text-zinc-200">Cisco Press:</strong>{' '}
              <a href="https://www.ciscopress.com/store/interconnecting-cisco-network-devices-part-1-icnd1-9780132877435" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline underline-offset-2">
                Interconnecting Cisco Network Devices — Data Encapsulation and Segment-to-Bit Flowcharts
              </a>
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function TCPIPArticleContent() {
  return (
    <div className="space-y-8">
      <div className="space-y-5 text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-2">TCP/IP Protocol Suite — Four-Layer Model</h2>

        <p>The <strong className="font-semibold text-zinc-900 dark:text-zinc-100">TCP/IP model</strong> is the practical implementation framework for internet communication, developed by DARPA in the 1970s and formally standardized through IETF RFCs. Unlike the theoretical 7-layer OSI model, TCP/IP collapses communication into four functional layers, each of which maps to one or more OSI layers.</p>

        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700 my-4">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-zinc-200/60 dark:bg-zinc-800/60">
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700">TCP/IP Layer</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700">OSI Equivalent</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700">Key Protocols</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700">PDU</th>
              </tr>
            </thead>
            <tbody>
              {[
                { layer: 'Application',   osi: 'Layers 5, 6, 7',  protocols: 'HTTP, HTTPS, FTP, DNS, SMTP, SSH',     pdu: 'Data'    },
                { layer: 'Transport',     osi: 'Layer 4',          protocols: 'TCP (RFC 793), UDP',                   pdu: 'Segment' },
                { layer: 'Internet',      osi: 'Layer 3',          protocols: 'IP (RFC 791), ICMP, OSPF, BGP',        pdu: 'Packet'  },
                { layer: 'Network Access',osi: 'Layers 1, 2',      protocols: 'Ethernet 802.3, Wi-Fi 802.11, ARP',   pdu: 'Frame / Bits' },
              ].map((row, i) => (
                <tr key={row.layer} className={`border-b border-zinc-100 dark:border-zinc-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-zinc-50/50 dark:bg-zinc-800/20'}`}>
                  <td className="px-4 py-2.5 font-bold text-zinc-900 dark:text-zinc-100">{row.layer}</td>
                  <td className="px-4 py-2.5 font-medium text-zinc-600 dark:text-zinc-400 text-[12px]">{row.osi}</td>
                  <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400 text-[12px]">{row.protocols}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-sky-700 dark:text-sky-400">{row.pdu}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-6">IPv4 vs. IPv6 Header Architecture</h3>
        <p>The shift from IPv4 to IPv6 was driven by IPv4 address exhaustion (32-bit address space = ~4.3 billion unique addresses) and the need for a simpler, more scalable packet format. IPv6 uses 128-bit addresses, providing 3.4 × 10³⁸ unique addresses.</p>

        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700 my-4">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-zinc-200/60 dark:bg-zinc-800/60">
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700">Field</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700">IPv4 (RFC 791)</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700">IPv6</th>
              </tr>
            </thead>
            <tbody>
              {[
                { field: 'Header Size',      v4: '20–60 bytes (variable)',      v6: '40 bytes (fixed)'                  },
                { field: 'Address Length',   v4: '32 bits (4 octets)',           v6: '128 bits (16 octets)'              },
                { field: 'Address Format',   v4: 'Dotted-decimal (192.168.1.1)', v6: 'Colon-hex (2001:db8::1)'          },
                { field: 'Checksum',         v4: 'Included in header',           v6: 'Removed (handled by transport)'   },
                { field: 'Fragmentation',    v4: 'Routers can fragment',         v6: 'Only source host fragments'        },
                { field: 'NAT Required',     v4: 'Yes (address scarcity)',       v6: 'No (vast address space)'          },
                { field: 'Auto-config',      v4: 'DHCP required',               v6: 'SLAAC built-in (RFC 4862)'        },
              ].map((row, i) => (
                <tr key={row.field} className={`border-b border-zinc-100 dark:border-zinc-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-zinc-50/50 dark:bg-zinc-800/20'}`}>
                  <td className="px-4 py-2.5 font-semibold text-zinc-800 dark:text-zinc-200">{row.field}</td>
                  <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400 text-[12px]">{row.v4}</td>
                  <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400 text-[12px]">{row.v6}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-6">Stateful vs. Stateless Packet Transmission</h3>
        <p>The two primary Transport layer protocols — TCP and UDP — represent the fundamental trade-off between reliability and performance in packet delivery.</p>

        <div className="grid md:grid-cols-2 gap-4 my-4">
          <div className="rounded-lg border border-sky-200 dark:border-sky-500/30 bg-sky-50/60 dark:bg-sky-500/5 p-4">
            <h4 className="font-bold text-sky-800 dark:text-sky-300 text-sm mb-2">TCP — Stateful / Connection-Oriented</h4>
            <ul className="space-y-1.5 text-[12px] text-zinc-600 dark:text-zinc-400">
              {[
                'Three-way handshake (SYN → SYN-ACK → ACK) before data transfer',
                'Sequence numbers track every byte — out-of-order segments are reordered',
                'Acknowledgements confirm receipt; unacknowledged segments are retransmitted',
                'Flow control via sliding window prevents receiver buffer overflow',
                'Used by: HTTP/S, FTP, SMTP, SSH — any protocol requiring guaranteed delivery',
              ].map((item, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sky-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-teal-200 dark:border-teal-500/30 bg-teal-50/60 dark:bg-teal-500/5 p-4">
            <h4 className="font-bold text-teal-800 dark:text-teal-300 text-sm mb-2">UDP — Stateless / Connectionless</h4>
            <ul className="space-y-1.5 text-[12px] text-zinc-600 dark:text-zinc-400">
              {[
                'No handshake — datagrams sent immediately without session establishment',
                'No sequence numbers, no acknowledgements, no retransmission',
                'Receiver gets data in arrival order, not transmission order',
                'Minimal header overhead (8 bytes vs. TCP\'s 20+ bytes)',
                'Used by: DNS lookups, DHCP, VoIP, video streaming, online gaming',
              ].map((item, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-6">CompTIA A+ Core 1 Exam Focus Areas</h3>
        <p>CompTIA A+ Core 1 (220-1201) Section 2.1 — Protocol Suites tests your ability to:</p>
        <ul className="space-y-1.5 pl-0 list-none">
          {[
            'Distinguish between the 4-layer TCP/IP model and the 7-layer OSI model and map protocols to their correct layers',
            'Identify when TCP vs. UDP is used for a given application scenario (e.g., DNS uses UDP port 53 for queries, TCP port 53 for zone transfers)',
            'Explain the TCP three-way handshake and its role in establishing a reliable session',
            'Understand the difference between IPv4 and IPv6 addressing, including CIDR notation and SLAAC auto-configuration',
            'Know that NAT (Network Address Translation) is required with IPv4 but not with IPv6 due to its enormous address space',
          ].map((item, i) => (
            <li key={i} className="flex gap-2.5 items-start">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500 dark:bg-sky-400" />
              <span className="text-zinc-600 dark:text-zinc-400">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Citations */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/5 overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-amber-200 dark:border-amber-500/20">
          <ExternalLink className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <h2 className="text-base font-bold text-amber-700 dark:text-amber-400">References &amp; Citations</h2>
        </div>
        <ul className="px-5 py-4 space-y-2.5">
          <li className="flex gap-2.5 items-start text-sm">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400" />
            <span className="text-zinc-600 dark:text-zinc-400">
              <strong className="font-semibold text-zinc-800 dark:text-zinc-200">IETF Standards:</strong>{' '}
              <a href="https://www.rfc-editor.org/rfc/rfc791" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline underline-offset-2">
                RFC 791 (Internet Protocol)
              </a>
              {' & '}
              <a href="https://www.rfc-editor.org/rfc/rfc793" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline underline-offset-2">
                RFC 793 (Transmission Control Protocol)
              </a>
              {' — Core standard documentations.'}
            </span>
          </li>
          <li className="flex gap-2.5 items-start text-sm">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400" />
            <span className="text-zinc-600 dark:text-zinc-400">
              <strong className="font-semibold text-zinc-800 dark:text-zinc-200">CompTIA Official:</strong>{' '}
              <a href="https://www.comptia.org/certifications/a" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline underline-offset-2">
                CompTIA A+ Core 1 (220-1201) Exam Blueprint — Section 2.1 Protocol Suites
              </a>
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function makeLocalArticle(slug: string, title?: string): Article {
  const isFounder = FOUNDER_SLUGS.has(slug);
  return {
    id: slug,
    slug,
    title: title ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    content: articleContentMap[slug] ?? '',
    excerpt: null,
    section_id: null,
    contributor_id: null,
    tags: [],
    is_featured: isFounder,
    is_sample: !isFounder && title !== undefined,
    study_category: null,
    source_file: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export default function ArticlePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const slug = location.pathname.replace(/^\/article\//, '').replace(/\/$/, '');
  const [article, setArticle] = useState<Article | null>(null);
  const [contributor, setContributor] = useState<Contributor | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      if (!slug) { setIsLoading(false); return; }
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*, contributor:contributors(*), section:sections(*)')
          .eq('slug', slug)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setArticle(data);
          if (data.contributor) setContributor(data.contributor as Contributor);
          if (data.tags && data.tags.length > 0) {
            const { data: related } = await supabase
              .from('articles')
              .select('*')
              .neq('id', data.id)
              .overlaps('tags', data.tags)
              .limit(3);
            if (related) setRelatedArticles(related);
          }
        } else if (articleContentMap[slug]) {
          setArticle(makeLocalArticle(slug));
        } else if (FOUNDER_SLUGS.has(slug)) {
          setArticle(makeLocalArticle(slug));
        } else if (isKnownSampleSlug(slug)) {
          setArticle(makeLocalArticle(slug, slugToSampleTitle(slug)));
        }
      } catch (error) {
        console.error('Error fetching article:', error);
        if (articleContentMap[slug]) setArticle(makeLocalArticle(slug));
        else if (FOUNDER_SLUGS.has(slug)) setArticle(makeLocalArticle(slug));
        else if (isKnownSampleSlug(slug)) setArticle(makeLocalArticle(slug, slugToSampleTitle(slug)));
      } finally {
        setIsLoading(false);
      }
    }
    fetchArticle();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 mb-6" />
        <div className="h-48 bg-zinc-200 dark:bg-zinc-800 rounded-2xl mb-6" />
        <div className="space-y-4">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-4">Article Not Found</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          The article you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sky-600 dark:text-sky-400 font-medium hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    );
  }

  const isSample = article.is_sample === true || article.title.includes('[Sample]');
  const markdownContent = articleContentMap[article.slug] ?? article.content;
  const authorName = deriveAuthorName(contributor, article);
  const trackLabel = deriveTrackLabel(article);
  const authorInitial = authorName.charAt(0).toUpperCase();

  // Founder bypass: never render sample gateway for known founder slugs
  const isFounderSlug = FOUNDER_SLUGS.has(article.slug) || authorName === 'Jamin Ware';
  const effectiveIsSample = (article.title.toLowerCase().startsWith('[sample]') || isSample) && !isFounderSlug;

  // Full-page diagram panel routing
  const isNetworkTopologyArticle = article.slug === 'diagrams/network-topology-architecture';
  const isOSIPDUArticle          = article.slug === 'diagrams/osi-pdu-flow';
  const isOSIQuickRefArticle     = article.slug === 'quick-references/osi-model';
  const isTCPIPArticle           = article.slug === 'core1-networking/sample-protocols';

  function handleBack() {
    if (article?.section?.slug) {
      navigate('/' + article.section.slug);
    } else {
      navigate(-1);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-sm font-medium mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        {article.section ? `Back to ${article.section.title}` : 'Back'}
      </button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-5">
        <Link to="/" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">Home</Link>
        <span>/</span>
        {article.section && (
          <>
            <Link
              to={`/${article.section.slug}`}
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              {article.section.title}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-zinc-800 dark:text-zinc-100 truncate max-w-xs">{article.title}</span>
      </nav>

      {/* ── Hero Banner ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-sky-950 border border-zinc-700/50 p-8 mb-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-400/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative">
          {/* Track label */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-500/30">
              <BookOpen className="w-5 h-5 text-sky-400" />
            </div>
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">{trackLabel}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 mb-5 leading-tight">
            {article.title}
          </h1>

          {/* Author row */}
          <div className="flex flex-wrap items-center gap-3">
            {isSample ? (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-dashed border-zinc-500/60 text-xs font-semibold text-zinc-400 bg-zinc-800/40">
                [Sample Learner — Open Slot]
              </span>
            ) : (
              <>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-sky-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md shadow-sky-500/20">
                    {authorInitial}
                  </div>
                  <span className="text-sm font-medium text-zinc-200">{authorName}</span>
                </div>
                {authorName === 'Jamin Ware' && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadgeStyles['Founder']}`}>
                    [Founder]
                  </span>
                )}
                {contributor?.name && contributor.name !== 'Jamin Ware' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400">
                    [Contributor]
                  </span>
                )}
              </>
            )}

            {/* Tags */}
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-full text-xs bg-zinc-700/60 text-zinc-300 border border-zinc-600/40"
              >
                {tag}
              </span>
            ))}

            {/* Actions */}
            <div className="ml-auto flex items-center gap-1">
              <button className="p-2 rounded-lg hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors">
                <Bookmark className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Article body ─────────────────────────────────────── */}
      <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 md:p-8">
        {isNetworkTopologyArticle ? (
          <NetworkTopologyArticleDiagrams />
        ) : isOSIPDUArticle ? (
          <OSIPDUArticleDiagrams />
        ) : isOSIQuickRefArticle ? (
          <OSIQuickRefArticleDiagrams />
        ) : isTCPIPArticle ? (
          <TCPIPArticleContent />
        ) : effectiveIsSample ? (
          <div className="max-w-2xl mx-auto text-center my-12">
            <div className="bg-white dark:bg-zinc-700/40 border border-dashed border-zinc-400 dark:border-zinc-600 rounded-lg p-8">
              <div className="flex justify-center mb-5">
                <UploadCloud className="w-10 h-10 text-sky-500" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3">
                Active Curriculum Research Slot
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                To encourage active recall, hands-on lab replication, and peer-to-peer research, the content for this domain applet is left completely open for the cohort.
              </p>

              <div className="mt-2 mb-6 text-left">
                <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-3">
                  Research Pointers &amp; Getting Started
                </p>
                <ul className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
                  {[
                    { icon: '📋', label: 'Cross-Reference Objectives', detail: 'Identify the precise sub-domain criteria outlined in the official CompTIA A+ or Healthcare IT blueprints to capture all mandatory definitions.' },
                    { icon: '💻', label: 'Stand Up a Sandbox Lab', detail: 'Replicate the concept practically using localized virtual machines, Windows administrative command shells, or clinical interface test environments.' },
                    { icon: '🛠️', label: 'Map Command Syntax & Ports', detail: 'Document explicit troubleshooting switches, exact transport protocols, configuration flags, or standard healthcare messaging paths.' },
                    { icon: '📑', label: 'Gather Authoritative Citations', detail: 'Collect official vendor documentation endpoints (such as Microsoft Learn, IETF RFC definitions, or Cisco Press) to build your article footer references.' },
                  ].map(({ icon, label, detail }) => (
                    <li key={label} className="flex gap-3 items-start rounded-md bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2">
                      <span className="flex-shrink-0 text-sm leading-[1.4]">{icon}</span>
                      <span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{label}: </span>
                        {detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-colors"
              >
                Submit your contribution
              </Link>
            </div>
          </div>
        ) : (
          <MarkdownRenderer content={markdownContent} />
        )}
      </div>

      {/* All tags */}
      {article.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* References & Citations — only for live non-founder-diagram articles */}
      {!effectiveIsSample && !isNetworkTopologyArticle && !isOSIPDUArticle && !isOSIQuickRefArticle && !isTCPIPArticle && (
        <div className="mt-8 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/5 overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-amber-200 dark:border-amber-500/20">
            <ExternalLink className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <h2 className="text-base font-bold text-amber-700 dark:text-amber-400">References &amp; Citations</h2>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Contributors: add your references and citations using standard format (APA, MLA, or URL) in your submission via the portal below. External links will open in a new tab.
            </p>
          </div>
        </div>
      )}

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <div className="mt-12 pt-8 border-t border-zinc-300 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Related Articles</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedArticles.map((related) => (
              <ArticleCard key={related.id} article={related} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

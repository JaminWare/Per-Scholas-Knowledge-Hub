import { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Share2, Bookmark, BookOpen, ExternalLink, UploadCloud } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSmartBack } from '../hooks/useSmartBack';
import ArticleCard from '../components/ArticleCard';
import MarkdownRenderer from '../components/MarkdownRenderer';
import ContributorSubmissionModal, { type NewSubmission } from '../components/ContributorSubmissionModal';
import {
  OSIModelStackDiagram,
  HL7MessageRoutingDiagram,
  MDMEnrollmentFlowDiagram,
  FirewallNetworkSegmentationDiagram,
  FirewallPacketInspectionDiagram,
} from '../components/DiagramComponents';
import { articleContentMap } from '../data/articles';
import contentMap from '../data/contentMap';
import ArticleRenderer from '../components/ArticleRenderer';
import type { Article, Contributor } from '../types/database';

const sectionTrackLabels: Record<string, string> = {
  'core1-networking':      'COMPTIA A+ CORE 1 NETWORKING',
  'core1-troubleshooting': 'COMPTIA A+ CORE 1 TROUBLESHOOTING',
  'core1-mobile':          'COMPTIA A+ CORE 1 MOBILE DEVICES',
  'core1-hardware':        'COMPTIA A+ CORE 1 HARDWARE',
  'core1-cloud':           'COMPTIA A+ CORE 1 CLOUD',
  'core2-os':              'COMPTIA A+ CORE 2 OPERATING SYSTEMS',
  'core2-security':        'COMPTIA A+ CORE 2 SECURITY',
  'core2-software':        'COMPTIA A+ CORE 2 SOFTWARE TROUBLESHOOTING',
  'core2-operations':      'COMPTIA A+ CORE 2 OPERATIONS',
  'healthcare-hipaa':      'ADVANCED HEALTHCARE IT HIPAA SECURITY',
  'healthcare-ehr':        'ADVANCED HEALTHCARE IT EHR ARCHITECTURE',
  'healthcare-clinical':   'ADVANCED HEALTHCARE IT CLINICAL WORKFLOWS',
  'learner-experience':    'LEARNER EXPERIENCE & FAQS',
};

// Slugs that must never fall through to "Article Not Found"
const FOUNDER_SLUGS = new Set([
  'core1-networking/firewall-basics', 'core1-troubleshooting/command-documentation', 'core2-os/snap-in',
  'healthcare-hipaa/intro-healthcare-it-security', 'healthcare-ehr/cloud-computing-healthcare',
  'ai-prompt-engineering-healthcare',
  'core1-networking/network-topology-architecture', 'core1-networking/osi-pdu-flow',
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
  'mnemonic', 'commands', 'shortcuts', 'diagrams',
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
  return `[OPEN SLOT] ${stripped}`;
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
  if (article.author_name) return article.author_name;
  if (FOUNDER_SLUGS.has(article.slug)) return 'Jamin Ware';
  const featuredSlugs = ['core1-networking/firewall-basics', 'core1-troubleshooting/command-documentation', 'core2-os/snap-in', 'healthcare-hipaa/intro-healthcare-it-security', 'healthcare-ehr/cloud-computing-healthcare', 'ai-prompt-engineering-healthcare'];
  if (featuredSlugs.includes(article.slug)) return 'Jamin Ware';
  return 'Jamin Ware';
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
        <p>The firewall segmentation diagram above illustrates how the DMZ acts as a controlled buffer zone. Public-facing services (web servers, DNS resolvers) sit in the DMZ reachable from the internet but fully isolated from the private LAN. Stateful Packet Inspection (SPI) tracks each TCP/UDP session in a state table, allowing return traffic for established connections while silently dropping unsolicited inbound probes.</p>
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
                Interconnecting Cisco Network Devices Data Encapsulation and Segment-to-Bit Flowcharts
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
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-2">TCP/IP Protocol Suite Four-Layer Model</h2>

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
        <p>The two primary Transport layer protocols TCP and UDP represent the fundamental trade-off between reliability and performance in packet delivery.</p>

        <div className="grid md:grid-cols-2 gap-4 my-4">
          <div className="rounded-lg border border-sky-200 dark:border-sky-500/30 bg-sky-50/60 dark:bg-sky-500/5 p-4">
            <h4 className="font-bold text-sky-800 dark:text-sky-300 text-sm mb-2">TCP Stateful / Connection-Oriented</h4>
            <ul className="space-y-1.5 text-[12px] text-zinc-600 dark:text-zinc-400">
              {[
                'Three-way handshake (SYN → SYN-ACK → ACK) before data transfer',
                'Sequence numbers track every byteout-of-order segments are reordered',
                'Acknowledgements confirm receipt; unacknowledged segments are retransmitted',
                'Flow control via sliding window prevents receiver buffer overflow',
                'Used by: HTTP/S, FTP, SMTP, SSHany protocol requiring guaranteed delivery',
              ].map((item, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sky-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-teal-200 dark:border-teal-500/30 bg-teal-50/60 dark:bg-teal-500/5 p-4">
            <h4 className="font-bold text-teal-800 dark:text-teal-300 text-sm mb-2">UDP Stateless / Connectionless</h4>
            <ul className="space-y-1.5 text-[12px] text-zinc-600 dark:text-zinc-400">
              {[
                'No handshake datagrams sent immediately without session establishment',
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
        <p>CompTIA A+ Core 1 (220-1201) Section 2.1 Protocol Suites tests your ability to:</p>
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
              {'Core standard documentation.'}
            </span>
          </li>
          <li className="flex gap-2.5 items-start text-sm">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400" />
            <span className="text-zinc-600 dark:text-zinc-400">
              <strong className="font-semibold text-zinc-800 dark:text-zinc-200">CompTIA Official:</strong>{' '}
              <a href="https://www.comptia.org/certifications/a" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline underline-offset-2">
                CompTIA A+ Core 1 (220-1201) Exam BlueprintSection 2.1 Protocol Suites
              </a>
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function TicketOrMarkdownContent({ content }: { content: string }) {
  const hasTicketFormat = /Problem:/i.test(content) && /Solution:/i.test(content);
  if (!hasTicketFormat) return <MarkdownRenderer content={content} />;

  const problemMatch = content.match(/Problem:\s*([\s\S]*?)(?=Solution:)/i);
  const solutionMatch = content.match(/Solution:\s*([\s\S]*?)$/i);
  const problem = problemMatch?.[1]?.trim() || '';
  const solution = solutionMatch?.[1]?.trim() || '';

  return (
    <div className="space-y-6">
      <div className="rounded-xl border-l-4 border-amber-400/70 bg-amber-50 dark:bg-amber-500/5 px-5 py-4 space-y-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Problem</h3>
        <div className="text-sm text-amber-900 dark:text-amber-200/80 leading-relaxed whitespace-pre-wrap">
          {problem.replace(/^#+\s*/gm, '').replace(/\*\*/g, '')}
        </div>
      </div>
      <div className="rounded-xl border-l-4 border-emerald-400/70 bg-emerald-50 dark:bg-emerald-500/5 px-5 py-4 space-y-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Solution</h3>
        <div className="text-sm text-emerald-900 dark:text-emerald-200/80 leading-relaxed whitespace-pre-wrap">
          {solution.replace(/^#+\s*/gm, '').replace(/\*\*/g, '')}
        </div>
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
  const slug = decodeURIComponent(location.pathname.replace(/^\/article\//, '').replace(/\/$/, ''));
  const [article, setArticle] = useState<Article | null>(null);
  const [contributor, setContributor] = useState<Contributor | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

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
        } else if (contentMap[slug]) {
          setArticle(makeLocalArticle(slug, contentMap[slug].title));
        } else if (FOUNDER_SLUGS.has(slug)) {
          setArticle(makeLocalArticle(slug));
        } else if (isKnownSampleSlug(slug)) {
          setArticle(makeLocalArticle(slug, slugToSampleTitle(slug)));
        }
      } catch (error) {
        console.error('Error fetching article:', error);
        if (articleContentMap[slug]) setArticle(makeLocalArticle(slug));
        else if (contentMap[slug]) setArticle(makeLocalArticle(slug, contentMap[slug].title));
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

  const strictlyIsSample = /\[\s*(sample|OPEN SLOT)\s*\]/i.test(article?.title ?? '');
  const isSample = strictlyIsSample || article.is_sample === true;
  const localContentEntry = contentMap[article.slug];
  const markdownContent = articleContentMap[article.slug] ?? article.formatted_content ?? article.content;
  const authorName = localContentEntry?.contributor ?? deriveAuthorName(contributor, article);
  const trackLabel = localContentEntry?.trackLabel?.toUpperCase() ?? deriveTrackLabel(article);
  const authorInitial = authorName.charAt(0).toUpperCase();

  // Founder bypass: never render sample gateway for known founder slugs
  const isFounderSlug = FOUNDER_SLUGS.has(article.slug) || authorName === 'Jamin Ware';
  const effectiveIsSample = isSample && !isFounderSlug;

  // Full-page diagram panel routingeach is suppressed when title matches [Sample]
  const isNetworkTopologyArticle = article.slug === 'core1-networking/network-topology-architecture' && !strictlyIsSample;
  const isOSIPDUArticle          = article.slug === 'core1-networking/osi-pdu-flow' && !strictlyIsSample;
  const isTCPIPArticle           = article.slug === 'core1-networking/sample-protocols' && !strictlyIsSample;

  const backFallback = useMemo(() => {
    if (article?.section?.slug) return '/' + article.section.slug;
    if (article?.slug?.startsWith('learner-experience/') || article?.study_category?.startsWith('Learner Experience')) return '/learner-experience';
    return '/';
  }, [article]);
  const { goBack } = useSmartBack(backFallback);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={goBack}
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-700/60 p-8 mb-8">
        <div className="relative">
          {/* Track label */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-500/30">
              <BookOpen className="w-5 h-5 text-sky-400" />
            </div>
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">{trackLabel}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-5 leading-tight">
            {article.title}
          </h1>

          {/* Author row */}
          <div className="flex flex-wrap items-center gap-3">
            {isSample ? (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-sky-500/40 text-xs font-bold tracking-wider text-sky-400 bg-sky-500/10" style={{ textShadow: '0 0 8px rgba(56,189,248,0.8)' }}>
                [OPEN SLOT]
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
        ) : isTCPIPArticle ? (
          <TCPIPArticleContent />
        ) : localContentEntry ? (
          <ArticleRenderer blocks={localContentEntry.content} />
        ) : effectiveIsSample ? (
          <div className="max-w-2xl mx-auto text-center my-16">
            <div className="relative rounded-2xl border-2 border-dashed border-sky-300 dark:border-sky-500/30 bg-sky-50/40 dark:bg-zinc-800/60 p-10">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
                  <UploadCloud className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                Claim this Open Slot
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-lg mx-auto mb-8">
                This curriculum endpoint is currently open for peer review and documentation. Submit your verified research, definitions, or script matrices to populate this hub node!
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:shadow-[0_0_30px_rgba(56,189,248,0.6)] transition-all"
              >
                <UploadCloud className="w-4.5 h-4.5" />
                Submit your Contribution
              </button>
            </div>
          </div>
        ) : article.submission_type === 'Resource Link' ? (
          <a
            href={article.content}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-xl border border-zinc-700 bg-zinc-800/60 p-5 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/10 transition-all duration-200"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center group-hover:bg-sky-500/25 transition-colors">
              <ExternalLink className="w-5 h-5 text-sky-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-400 mb-1 font-medium">Open External Resource</p>
              <p className="font-mono text-sm text-sky-400 truncate group-hover:text-sky-300 transition-colors">
                {article.content}
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-sky-400 flex-shrink-0 transition-colors" />
          </a>
        ) : (
          <TicketOrMarkdownContent content={markdownContent} />
        )}
      </div>

      {/* All tags */}
      {article.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-zinc-200 dark:bg-zinc-100 text-zinc-700 dark:text-zinc-700 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* References & Citationsonly for live non-founder-diagram articles */}
      {!effectiveIsSample && !isNetworkTopologyArticle && !isOSIPDUArticle && !isTCPIPArticle && (
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
      {relatedArticles.length > 0 && !strictlyIsSample && (
        <div className="mt-12 pt-8 border-t border-zinc-300 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Related Articles</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedArticles.map((related) => (
              <ArticleCard key={related.id} article={related} />
            ))}
          </div>
        </div>
      )}

      <ContributorSubmissionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitted={(_s: NewSubmission) => setModalOpen(false)}
      />
    </div>
  );
}

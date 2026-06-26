export interface LocalArticle {
  title: string;
  trackLabel: string;
  contributor: string;
  cohort: string;
  tags: string[];
  content: ContentBlock[];
}

export type ContentBlock =
  | { type: 'intro'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'warning'; text: string }
  | { type: 'tip'; text: string }
  | { type: 'steps'; items: string[] }
  | { type: 'code'; lang: string; code: string }
  | { type: 'table'; headers: string[]; rows: string[][] };

const contentMap: Record<string, LocalArticle> = {
  // ── Core 1 ───────────────────────────────────────────────
  'core1-troubleshooting': {
    title: 'Interactive Motherboard Troubleshooting & Hardware PBQs',
    trackLabel: 'CompTIA A+ Core 1 — Domain 5.0',
    contributor: 'Cohort Member — RTT-23',
    cohort: '2026-RTT-23',
    tags: ['hardware', 'motherboard', 'troubleshooting', 'PBQ'],
    content: [
      {
        type: 'intro',
        text: 'Performance-Based Questions (PBQs) around motherboard diagnostics are among the trickiest on the 220-1201 exam. This guide walks through every common POST failure scenario with step-by-step remediation strategies.',
      },
      { type: 'heading', text: '1. POST Failure Sequence' },
      {
        type: 'steps',
        items: [
          'Power on the system and listen for POST beep codes.',
          'One long + two short beeps → video card failure (Award BIOS).',
          'Continuous beeping → RAM not seated; reseat DIMMs and retry.',
          'No beeps + no display → CPU or motherboard failure; swap components methodically.',
          'POST passes but OS fails to load → check boot order in BIOS/UEFI first.',
        ],
      },
      { type: 'heading', text: '2. Motherboard Component Map' },
      {
        type: 'table',
        headers: ['Component', 'Socket/Slot', 'Common Failure'],
        rows: [
          ['CPU', 'AM5 / LGA1700', 'Bent pins, thermal paste degradation'],
          ['RAM', 'DDR5 DIMM', 'Incompatible XMP profile, incomplete seating'],
          ['GPU', 'PCIe 5.0 x16', 'Insufficient PCIe power connector'],
          ['NVMe SSD', 'M.2 2280', 'Missing standoff screw, wrong key (B vs M)'],
          ['CMOS Battery', 'CR2032', 'Date/time reset loop on boot'],
        ],
      },
      {
        type: 'warning',
        text: 'Always ground yourself before handling motherboard components. Electrostatic discharge (ESD) can destroy components without any visible damage — use an anti-static wrist strap or touch the chassis before touching parts.',
      },
      { type: 'heading', text: '3. PBQ Drill: Video Card Not Detected' },
      {
        type: 'code',
        lang: 'powershell',
        code: `# Run in elevated PowerShell to check device status
Get-PnpDevice -Class Display | Select-Object Status, FriendlyName

# Expected output (healthy):
# Status    FriendlyName
# ------    ------------
# OK        NVIDIA GeForce RTX 4070

# If 'Unknown' or 'Error' status:
# 1. Reseat the GPU in the PCIe slot
# 2. Verify both 8-pin power connectors are fully clicked in
# 3. Try alternate PCIe slot
# 4. Update chipset drivers`,
      },
      {
        type: 'tip',
        text: 'Exam tip: On PBQ drag-and-drop questions, the BIOS beep code table is your friend. Memorize AMI vs Award vs Phoenix differences — the exam will mix them.',
      },
    ],
  },

  'core1-networking': {
    title: 'Networking Fundamentals: OSI, TCP/IP & Protocol Reference',
    trackLabel: 'CompTIA A+ Core 1 — Domain 2.0',
    contributor: 'Cohort Member — RTT-23',
    cohort: '2026-RTT-23',
    tags: ['networking', 'OSI', 'TCP/IP', 'protocols'],
    content: [
      {
        type: 'intro',
        text: 'A deep-dive reference covering the OSI model, TCP/IP stack, essential port numbers, and real-world network hardware — all mapped to 220-1201 exam objectives.',
      },
      { type: 'heading', text: 'OSI Model Quick Reference' },
      {
        type: 'table',
        headers: ['Layer', 'Name', 'Protocol/Device', 'Mnemonic'],
        rows: [
          ['7', 'Application', 'HTTP, FTP, DNS, SMTP', 'Away'],
          ['6', 'Presentation', 'SSL/TLS, JPEG, MPEG', 'Pizza'],
          ['5', 'Session', 'NetBIOS, RPC, PPTP', 'Sausage'],
          ['4', 'Transport', 'TCP, UDP', 'Throw'],
          ['3', 'Network', 'IP, ICMP, Router', 'Not'],
          ['2', 'Data Link', 'Ethernet, Switch, MAC', 'Do'],
          ['1', 'Physical', 'Cables, Hubs, NICs', 'Please'],
        ],
      },
      {
        type: 'tip',
        text: 'Bottom-to-top mnemonic: "Please Do Not Throw Sausage Pizza Away". The exam often shows a protocol and asks which layer — memorize these cold.',
      },
      { type: 'heading', text: 'Essential Port Numbers' },
      {
        type: 'code',
        lang: 'bash',
        code: `# Critical ports for the A+ exam
FTP          20/21    # File Transfer Protocol (data/control)
SSH          22       # Secure Shell
Telnet       23       # Unencrypted remote access (avoid!)
SMTP         25       # Email sending
DNS          53       # Domain Name System
DHCP         67/68    # Dynamic IP assignment
HTTP         80       # Unencrypted web
POP3         110      # Email retrieval
IMAP         143      # Email retrieval (folder-aware)
HTTPS        443      # Encrypted web (TLS)
SMB          445      # Windows file sharing
RDP          3389     # Remote Desktop Protocol`,
      },
    ],
  },

  'core1-hardware': {
    title: 'Hardware Deep-Dive: CPUs, RAM, Storage & Power',
    trackLabel: 'CompTIA A+ Core 1 — Domain 3.0',
    contributor: 'Cohort Member — RTT-23',
    cohort: '2026-RTT-23',
    tags: ['hardware', 'CPU', 'RAM', 'storage', 'power'],
    content: [
      {
        type: 'intro',
        text: 'Covers everything from CPU socket compatibility to PSU wattage calculations — the hardware domain that accounts for the highest question count on the 220-1201 exam.',
      },
      { type: 'heading', text: 'CPU Cooler Types' },
      {
        type: 'table',
        headers: ['Type', 'TDP Range', 'Best For'],
        rows: [
          ['Stock Air Cooler', 'Up to 65W', 'Standard office workloads'],
          ['Aftermarket Air Tower', '65W–125W', 'Gaming, moderate rendering'],
          ['AIO Liquid (240mm)', '125W–200W', 'High-performance workstations'],
          ['Custom Loop Liquid', '200W+', 'Server / extreme OC'],
        ],
      },
      { type: 'heading', text: 'PSU Wattage Calculator Logic' },
      {
        type: 'steps',
        items: [
          'List all components: CPU TDP + GPU TDP + RAM (5W per stick) + storage (5W HDD, 3W SSD).',
          'Add 20% headroom for efficiency and future upgrades.',
          'Always choose 80 PLUS Bronze or higher for reliable power delivery.',
          'Example: 125W CPU + 200W GPU + 20W misc = 345W × 1.2 = 414W → choose 500W PSU.',
        ],
      },
      {
        type: 'warning',
        text: 'Never mix DDR4 and DDR5 sticks — motherboards only support one generation. Physically, they have different notch positions to prevent incorrect installation, but double-check the spec sheet.',
      },
    ],
  },

  'core1-cloud': {
    title: 'Virtualization & Cloud Computing for A+ Core 1',
    trackLabel: 'CompTIA A+ Core 1 — Domain 4.0',
    contributor: 'Cohort Member — RTT-23',
    cohort: '2026-RTT-23',
    tags: ['cloud', 'virtualization', 'IaaS', 'SaaS'],
    content: [
      {
        type: 'intro',
        text: 'Cloud computing and virtualization concepts tested on the 220-1201 — IaaS/PaaS/SaaS distinctions, hypervisor types, and cloud deployment models.',
      },
      { type: 'heading', text: 'Service Models Compared' },
      {
        type: 'table',
        headers: ['Model', 'You Manage', 'Provider Manages', 'Example'],
        rows: [
          ['IaaS', 'OS, Runtime, App', 'Hardware, Network', 'AWS EC2, Azure VM'],
          ['PaaS', 'Application, Data', 'OS, Runtime, Infra', 'Google App Engine'],
          ['SaaS', 'Data only', 'Everything else', 'Gmail, Microsoft 365'],
        ],
      },
      { type: 'heading', text: 'Hypervisor Types' },
      {
        type: 'steps',
        items: [
          'Type 1 (Bare-metal): Runs directly on hardware — VMware ESXi, Microsoft Hyper-V. Used in data centers.',
          'Type 2 (Hosted): Runs inside an OS — VirtualBox, VMware Workstation. Used on desktops for testing.',
          'Key exam distinction: Type 1 = better performance, enterprise use. Type 2 = easier setup, personal use.',
        ],
      },
      {
        type: 'tip',
        text: 'Remember: "Private cloud = your own hardware", "Public cloud = provider hardware", "Hybrid = both". The A+ exam loves asking which model a scenario maps to.',
      },
    ],
  },

  'core1-mobile': {
    title: 'Mobile Devices: Laptops, Tablets & MDM Configuration',
    trackLabel: 'CompTIA A+ Core 1 — Domain 1.0',
    contributor: 'Cohort Member — RTT-23',
    cohort: '2026-RTT-23',
    tags: ['mobile', 'laptop', 'MDM', 'connectivity'],
    content: [
      {
        type: 'intro',
        text: 'Covers laptop hardware teardown, display technology comparisons, mobile connectivity standards, and enterprise MDM deployment — all mapped to Domain 1.0 exam objectives.',
      },
      { type: 'heading', text: 'Display Technology Comparison' },
      {
        type: 'table',
        headers: ['Technology', 'Backlight', 'Pros', 'Cons'],
        rows: [
          ['TN LCD', 'CCFL/LED', 'Fast response, cheap', 'Poor viewing angles, color'],
          ['IPS LCD', 'LED', 'Excellent color, angles', 'Slight backlight bleed'],
          ['OLED', 'Self-lit pixels', 'Perfect blacks, vivid', 'Burn-in risk, costly'],
          ['Mini-LED', 'Local dimming LEDs', 'High brightness, HDR', 'Expensive'],
        ],
      },
      {
        type: 'warning',
        text: 'On MDM configurations: always enable full-disk encryption BEFORE enrolling a device in MDM. If encryption is enabled after enrollment, some MDM platforms will flag the device as non-compliant during the transition window.',
      },
    ],
  },

  // ── Core 2 ───────────────────────────────────────────────
  'core2-os': {
    title: 'Cross-Platform OS Installation Guidelines & macOS Boot Camp Failures',
    trackLabel: 'CompTIA A+ Core 2 — Domain 1.0',
    contributor: 'Cohort Member — RTT-23',
    cohort: '2026-RTT-23',
    tags: ['operating-systems', 'windows', 'macOS', 'boot-camp', 'installation'],
    content: [
      {
        type: 'intro',
        text: 'A comprehensive guide to OS installation across Windows, macOS, and Linux — with special focus on Boot Camp failures, partition errors, and cross-platform gotchas that trip up students in healthcare IT lab environments.',
      },
      { type: 'heading', text: '1. Windows 11 Clean Installation Checklist' },
      {
        type: 'steps',
        items: [
          'Verify TPM 2.0 is enabled in BIOS/UEFI (Security → TPM Device Selection → Firmware TPM).',
          'Confirm Secure Boot is enabled — required for Windows 11 upgrade path.',
          'Boot from USB: F11 or F12 for boot menu (varies by OEM — Dell=F12, HP=F9, Lenovo=F12).',
          'Select "Custom Install" → delete all partitions on target drive → let installer create fresh GPT partitions.',
          'If "Windows cannot be installed to this disk" error: disk is MBR. Open CMD during install → diskpart → convert gpt.',
        ],
      },
      { type: 'heading', text: '2. Boot Camp Troubleshooting on Intel Macs' },
      {
        type: 'warning',
        text: 'Boot Camp Assistant is ONLY available on Intel-based Macs (pre-2020). Apple Silicon (M1/M2/M3) Macs do NOT support Boot Camp — use Parallels Desktop or UTM instead.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `# Verify Mac architecture before advising Boot Camp:
uname -m
# Returns: x86_64 = Intel (Boot Camp supported)
#          arm64  = Apple Silicon (Boot Camp NOT supported)

# If Boot Camp partition won't create ("disk cannot be partitioned"):
# Step 1: Repair disk in Recovery Mode
diskutil repairVolume /
# Step 2: Disable Time Machine backups temporarily
# Step 3: Free up at least 64GB before partitioning`,
      },
      { type: 'heading', text: '3. Common Boot Camp Failures & Fixes' },
      {
        type: 'table',
        headers: ['Error', 'Cause', 'Fix'],
        rows: [
          ['Bootcamp partition greyed out', 'Disk fragmentation / Time Machine', 'Repair disk via Disk Utility or Terminal'],
          ['"No bootable device found"', 'Missing boot loader after Windows install', 'Hold Option on boot, select Windows EFI partition'],
          ['Windows keyboard/trackpad unresponsive', 'Boot Camp drivers not installed', 'Run BootCamp.exe from the support folder in Windows'],
          ['Clock skew between macOS and Windows', 'Different time zone standards', 'Run: reg add HKLM\\SYSTEM\\CurrentControlSet\\Control\\TimeZoneInformation /v RealTimeIsUniversal /t REG_QWORD /d 1'],
        ],
      },
      {
        type: 'tip',
        text: 'Exam shortcut: On Core 2 Domain 1.0 questions, if the scenario involves macOS → Windows switching issues, the answer is almost always "Boot Camp drivers" or "Windows support software" that needs to be installed.',
      },
    ],
  },

  'core2-security': {
    title: 'Security Threats, Malware Removal & Windows Security Hardening',
    trackLabel: 'CompTIA A+ Core 2 — Domain 2.0',
    contributor: 'Cohort Member — RTT-23',
    cohort: '2026-RTT-23',
    tags: ['security', 'malware', 'threats', 'hardening', 'windows'],
    content: [
      {
        type: 'intro',
        text: 'The highest-weighted domain on Core 2. Covers the 8-step malware removal process, threat categories, and Windows-specific security controls you must know cold for the 220-1202 exam.',
      },
      { type: 'heading', text: 'The CompTIA 8-Step Malware Removal Process' },
      {
        type: 'steps',
        items: [
          '1. Investigate and verify malware symptoms.',
          '2. Quarantine the infected system (disconnect from network immediately).',
          '3. Disable System Restore (prevents malware from hiding in restore points).',
          '4. Remediate the infected system using updated anti-malware definitions.',
          '5. Schedule scans and run updates.',
          '6. Enable System Restore and create a new restore point.',
          '7. Educate the end user on how the infection occurred.',
          '8. Document findings, process, and lessons learned.',
        ],
      },
      {
        type: 'warning',
        text: 'Step 3 is the most commonly missed on the exam: disabling System Restore BEFORE running a scan. If you scan first, malware can retreat into a restore point and re-infect the system after reboot.',
      },
      { type: 'heading', text: 'Malware Type Quick Reference' },
      {
        type: 'table',
        headers: ['Type', 'Behavior', 'Removal Complexity'],
        rows: [
          ['Virus', 'Attaches to files, spreads on execution', 'Moderate'],
          ['Worm', 'Self-replicates across network without user action', 'High'],
          ['Trojan', 'Masquerades as legitimate software', 'Moderate'],
          ['Ransomware', 'Encrypts files, demands payment', 'Very High (restore from backup)'],
          ['Rootkit', 'Hides in OS kernel — very hard to detect', 'Extreme (often requires OS reinstall)'],
          ['Spyware', 'Silently collects data', 'Moderate'],
          ['Keylogger', 'Records keystrokes, steals credentials', 'Moderate'],
        ],
      },
    ],
  },

  'core2-operations': {
    title: 'Documentation, Ticketing & Change Management Procedures',
    trackLabel: 'CompTIA A+ Core 2 — Domain 4.0',
    contributor: 'Cohort Member — RTT-23',
    cohort: '2026-RTT-23',
    tags: ['operations', 'documentation', 'ticketing', 'change-management'],
    content: [
      {
        type: 'intro',
        text: 'Operational procedures are the backbone of professional IT support. This guide covers ticketing best practices, change management workflows, and documentation standards aligned to Domain 4.0.',
      },
      { type: 'heading', text: 'Change Management Workflow' },
      {
        type: 'steps',
        items: [
          'Request: Document the proposed change — what, why, when, affected systems.',
          'Assessment: Risk analysis — impact on production, rollback plan required.',
          'Approval: Change Advisory Board (CAB) review; emergency changes bypass CAB but must be documented retroactively within 24 hours.',
          'Implementation: Execute change during approved maintenance window.',
          'Verification: Confirm success with stakeholders and monitor for 30 minutes.',
          'Documentation: Update knowledge base, asset management, and configuration records.',
        ],
      },
      {
        type: 'code',
        lang: 'powershell',
        code: `# PowerShell: Create a timestamped change log entry
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$change = "Applied Windows Update KB5034441 to WS-CLINIC-07"
$technician = $env:USERNAME

Add-Content -Path "C:\IT_Logs\change_log.txt" \`
  -Value "$timestamp | $technician | $change"

Write-Host "Change logged at $timestamp" -ForegroundColor Green`,
      },
    ],
  },

  // ── Healthcare IT ────────────────────────────────────────
  'healthcare-ehr': {
    title: 'EHR Integration Blueprints & Data Privacy Standards',
    trackLabel: 'Advanced Healthcare IT — EHR Architecture',
    contributor: 'Cohort Member — RTT-23',
    cohort: '2026-RTT-23',
    tags: ['EHR', 'HL7', 'FHIR', 'integration', 'healthcare'],
    content: [
      {
        type: 'intro',
        text: 'This blueprint covers the architecture of modern Electronic Health Record (EHR) systems, interoperability standards (HL7 v2, HL7 FHIR), integration patterns, and data privacy requirements specific to healthcare IT environments.',
      },
      { type: 'heading', text: '1. EHR System Architecture Overview' },
      {
        type: 'paragraph',
        text: 'Modern EHR systems follow a three-tier architecture: Presentation Layer (clinical workstations, web portals, mobile apps), Application Layer (EHR engine, clinical decision support, workflow automation), and Data Layer (patient records database, DICOM imaging store, audit log store).',
      },
      { type: 'heading', text: '2. HL7 v2 Message Structure' },
      {
        type: 'code',
        lang: 'hl7',
        code: `MSH|^~\\&|LAB_SYS|HOSPITAL|EHR|CLINIC|20240301120000||ORU^R01|MSG00001|P|2.5.1
PID|1||MR123456^^^HOSPITAL^MR||SMITH^JOHN^A||19850315|M
OBR|1|ORD-001|LAB-001|85025^CBC^LN|||20240301||||||
OBX|1|NM|6690-2^WBC^LN||7.2|10*3/uL|4.5-11.0|N|||F`,
      },
      {
        type: 'tip',
        text: 'HL7 v2 uses the pipe "|" as a field separator and "^" as a component separator. The MSH segment is always the first segment. On exam questions, look for these delimiters to identify HL7 messages.',
      },
      { type: 'heading', text: '3. FHIR REST API Pattern' },
      {
        type: 'code',
        lang: 'bash',
        code: `# FHIR R4 Patient lookup (REST)
GET /fhir/Patient/12345
Authorization: Bearer <token>
Accept: application/fhir+json

# Search patients by name
GET /fhir/Patient?family=Smith&birthdate=1985-03-15

# Create an Observation resource
POST /fhir/Observation
Content-Type: application/fhir+json`,
      },
      {
        type: 'warning',
        text: 'All FHIR endpoints in production MUST enforce OAuth 2.0 / SMART on FHIR authentication. Never expose a FHIR API without authentication in a healthcare environment — this is a HIPAA violation.',
      },
      { type: 'heading', text: '4. Integration Pattern Decision Matrix' },
      {
        type: 'table',
        headers: ['Scenario', 'Recommended Standard', 'Notes'],
        rows: [
          ['Lab results → EHR', 'HL7 v2 ORU^R01', 'Industry standard for lab interop'],
          ['Patient scheduling', 'HL7 v2 SIU^S12', 'Scheduling information unsolicited update'],
          ['Mobile app → EHR', 'FHIR R4 REST', 'Modern, JSON-based, OAuth 2.0'],
          ['Medical imaging', 'DICOM over TCP/104', 'Radiology-specific protocol'],
          ['Public health reporting', 'HL7 v2 or CDA', 'State/CDC reporting requirements'],
        ],
      },
    ],
  },

  'healthcare-hipaa': {
    title: 'HIPAA Security Rule: Technical Safeguards & Incident Response',
    trackLabel: 'Advanced Healthcare IT — HIPAA Data Security',
    contributor: 'Cohort Member — RTT-23',
    cohort: '2026-RTT-23',
    tags: ['HIPAA', 'security', 'compliance', 'PHI', 'encryption'],
    content: [
      {
        type: 'intro',
        text: 'A practical guide to HIPAA Technical Safeguards — access controls, audit controls, integrity, and transmission security — with real-world implementation patterns for healthcare IT teams.',
      },
      { type: 'heading', text: 'HIPAA Technical Safeguard Categories' },
      {
        type: 'table',
        headers: ['Safeguard', 'Type', 'Implementation Example'],
        rows: [
          ['Access Control', 'Required', 'Role-based access, unique user IDs, auto-logoff'],
          ['Audit Controls', 'Required', 'Log all PHI access, immutable audit trails'],
          ['Integrity Controls', 'Addressable', 'Checksums, digital signatures on ePHI'],
          ['Transmission Security', 'Addressable', 'TLS 1.2+ for all PHI in transit'],
          ['Authentication', 'Required', 'MFA for all remote access to PHI systems'],
        ],
      },
      {
        type: 'warning',
        text: '"Addressable" does NOT mean optional. Addressable safeguards must be implemented unless you document a valid reason why a reasonable alternative was chosen. Skipping them without documentation IS a violation.',
      },
      { type: 'heading', text: 'Breach Notification Timeline' },
      {
        type: 'steps',
        items: [
          'Day 0: Incident detected — isolate affected system immediately.',
          'Day 0–2: Initial forensic investigation — scope, affected records, PHI involved.',
          'Day 0–3: Notify Privacy Officer and Legal team.',
          'Within 60 days: Notify affected individuals (written notice).',
          'Within 60 days: If >500 individuals affected in a state → notify prominent media outlets in that state.',
          'Within 60 days: Notify HHS (Department of Health & Human Services).',
          '< 500 individuals: Log in HHS annual breach log — submit by March 1 of following year.',
        ],
      },
    ],
  },

  'healthcare-clinical': {
    title: 'Clinical IT Operations: Lab Devices, Downtime & Telemedicine',
    trackLabel: 'Advanced Healthcare IT — Clinical IT Operations',
    contributor: 'Cohort Member — RTT-23',
    cohort: '2026-RTT-23',
    tags: ['clinical-it', 'downtime', 'telemedicine', 'devices', 'healthcare-lab'],
    content: [
      {
        type: 'intro',
        text: 'The operational reality of healthcare IT — handling unplanned downtime, troubleshooting clinical lab devices, and configuring telemedicine infrastructure in HIPAA-compliant ways.',
      },
      { type: 'heading', text: '1. Downtime Procedure Activation Checklist' },
      {
        type: 'steps',
        items: [
          'Alert Charge Nurse and Department Head within 5 minutes of confirmed EHR outage.',
          'Activate printed Downtime Order Sets — every nursing unit should have 4-hour supply.',
          'Switch medication administration to paper MAR (Medication Administration Record).',
          'Lab results: call direct to unit rather than EHR notification.',
          'Imaging: radiologists dictate to paper reports; clinicians call radiology directly.',
          'Log all paper documentation with exact timestamps for later EHR reconciliation.',
          'On system restoration: reconcile paper records within 2 hours per Joint Commission standards.',
        ],
      },
      {
        type: 'warning',
        text: 'Never let a downtime exceed 4 hours without escalating to the CMIO (Chief Medical Information Officer) and activating the full Downtime Response Team. Unmanaged EHR downtime is a patient safety event.',
      },
      { type: 'heading', text: '2. Lab Device Troubleshooting Quick Reference' },
      {
        type: 'table',
        headers: ['Symptom', 'First Check', 'Escalation Path'],
        rows: [
          ['Device not transmitting results', 'Network cable & IP config', 'Middleware vendor support'],
          ['Interface engine errors (HL7)', 'Check ACK/NACK in logs', 'Interface team + application vendor'],
          ['Analyzer offline in LIS', 'Ping device IP from middleware', 'Field service engineer if hardware fault'],
          ['Clock drift causing message rejection', 'Sync NTP on device', 'Re-register device with middleware after sync'],
        ],
      },
      {
        type: 'code',
        lang: 'bash',
        code: `# Test HL7 connectivity from middleware server to lab analyzer
telnet 192.168.10.45 2575
# Port 2575 is the standard HL7 MLLP port

# If telnet succeeds but messages fail:
# Check firewall rules for bidirectional traffic on 2575
# Verify MLLP wrapper: messages must start with 0x0B and end with 0x1C 0x0D`,
      },
    ],
  },

  // ── Generic fallbacks for sub-pages ─────────────────────
  'core1-networking/osi-tcpip': {
    title: 'OSI Model & TCP/IP Deep Dive',
    trackLabel: 'CompTIA A+ Core 1 — Domain 2.0 — Networking',
    contributor: 'Cohort Member — RTT-23',
    cohort: '2026-RTT-23',
    tags: ['networking', 'OSI', 'TCP/IP'],
    content: [
      {
        type: 'intro',
        text: 'Master the OSI model and TCP/IP stack for the 220-1201 exam. This is the single most tested networking topic.',
      },
      {
        type: 'tip',
        text: 'Bottom-to-top: "Please Do Not Throw Sausage Pizza Away" — Physical, Data Link, Network, Transport, Session, Presentation, Application.',
      },
      { type: 'heading', text: 'TCP vs UDP' },
      {
        type: 'table',
        headers: ['Feature', 'TCP', 'UDP'],
        rows: [
          ['Connection', 'Connection-oriented (3-way handshake)', 'Connectionless'],
          ['Reliability', 'Guaranteed delivery, retransmission', 'Best-effort, no retransmit'],
          ['Speed', 'Slower (overhead)', 'Faster (minimal overhead)'],
          ['Use Case', 'HTTP, FTP, email, SSH', 'DNS, VoIP, video streaming, gaming'],
        ],
      },
    ],
  },

  'core2-os/windows-bootcamp': {
    title: 'Windows Installation & macOS Boot Camp Failures',
    trackLabel: 'CompTIA A+ Core 2 — Domain 1.0',
    contributor: 'Cohort Member — RTT-23',
    cohort: '2026-RTT-23',
    tags: ['windows', 'macOS', 'boot-camp', 'installation'],
    content: [
      {
        type: 'intro',
        text: 'Hands-on guide to Windows installations and Boot Camp troubleshooting for Intel Macs — critical for healthcare IT students working in mixed OS environments.',
      },
      {
        type: 'warning',
        text: 'Apple Silicon Macs (M1/M2/M3) do NOT support Boot Camp. Use Parallels Desktop 18+ or UTM for virtualization on Apple Silicon.',
      },
    ],
  },

  'healthcare-ehr/integration': {
    title: 'EHR Integration Blueprints & Data Privacy Standards',
    trackLabel: 'Advanced Healthcare IT — EHR Architecture',
    contributor: 'Cohort Member — RTT-23',
    cohort: '2026-RTT-23',
    tags: ['EHR', 'integration', 'HL7', 'FHIR'],
    content: [
      {
        type: 'intro',
        text: 'Deep-dive into EHR integration patterns, HL7 messaging, FHIR REST APIs, and privacy safeguards for healthcare data exchange.',
      },
    ],
  },
};

export default contentMap;

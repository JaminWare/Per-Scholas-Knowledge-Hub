export interface LocalArticle {
  title: string;
  trackLabel: string;
  contributor: string;
  contributorRole: string;
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

  // ─────────────────────────────────────────────────────────
  // TRACK A — CompTIA A+ Core 1 (220-1201)
  // ─────────────────────────────────────────────────────────

  'core1-mobile': {
    title: 'Enterprise Mobile Device Management (MDM) & Enrollment Profiles',
    trackLabel: 'CompTIA A+ Core 1 (220-1201) — Domain 1.0 Mobile Devices',
    contributor: 'Cohort Lead',
    contributorRole: 'Core 1 Expert',
    cohort: '2026-RTT-23',
    tags: ['MDM', 'mobile', 'enrollment', 'iOS', 'Android', 'BYOD'],
    content: [
      {
        type: 'intro',
        text: 'Enterprise MDM is the backbone of modern endpoint management in both corporate and healthcare IT environments. This guide covers enrollment profiles, BYOD policy enforcement, and remote wipe procedures tested on the 220-1201 exam.',
      },
      { type: 'heading', text: '1. MDM Enrollment Methods' },
      {
        type: 'table',
        headers: ['Method', 'Platform', 'Who Initiates', 'Best For'],
        rows: [
          ['Apple DEP / ADE', 'iOS / macOS', 'IT Admin (zero-touch)', 'Corporate-owned devices'],
          ['Android Zero-Touch', 'Android Enterprise', 'IT Admin (zero-touch)', 'Corporate-owned Android fleet'],
          ['User Enrollment', 'iOS 13+', 'End user (self-service)', 'BYOD — keeps personal data separate'],
          ['BYOD OTA Profile', 'iOS / Android', 'End user via email link', 'Mixed-ownership environments'],
          ['Windows Autopilot', 'Windows 10/11', 'IT Admin (cloud provisioning)', 'Enterprise Windows rollouts'],
        ],
      },
      { type: 'heading', text: '2. Enrollment Profile Key Settings' },
      {
        type: 'steps',
        items: [
          'Configuration Profile (.mobileconfig): Carries Wi-Fi, VPN, email, cert, and restrictions payloads.',
          'Supervision Mode (Apple): Enables deeper management controls — required for app lock, web filtering, and remote screen viewing.',
          'Work Profile (Android): Creates a cryptographically isolated container; personal apps cannot read work data.',
          'Certificate Authority: MDM server must trust the org CA; devices receive client certs for 802.1X Wi-Fi.',
          'Compliance Policy: Enforce PIN length ≥ 6, biometric auth, OS version minimums, jailbreak/root detection.',
        ],
      },
      {
        type: 'warning',
        text: 'Never enroll a device into MDM without user consent documentation in BYOD scenarios. HIPAA requires that employees acknowledge that IT can remotely wipe a device registered for corporate email — even if it\'s personally owned.',
      },
      { type: 'heading', text: '3. Remote Wipe vs. Selective Wipe' },
      {
        type: 'table',
        headers: ['Action', 'What It Erases', 'When to Use'],
        rows: [
          ['Full Remote Wipe', 'Entire device — factory reset', 'Device lost/stolen or employee termination (corporate device)'],
          ['Selective Wipe', 'Work profile / managed apps only', 'Employee resignation (BYOD — preserves personal data)'],
          ['Account Remove', 'MDM profile + managed apps + settings', 'Device retirement with data confirmation'],
        ],
      },
      {
        type: 'code',
        lang: 'powershell',
        code: `# Microsoft Intune — Initiate a selective wipe via PowerShell
Connect-MgGraph -Scopes "DeviceManagementManagedDevices.ReadWrite.All"

$device = Get-MgDeviceManagementManagedDevice -Filter "userPrincipalName eq 'jdoe@clinic.org'"
Invoke-MgRetireManagedDeviceManagementManagedDevice -ManagedDeviceId $device.Id

Write-Host "Selective wipe initiated for device: $($device.DeviceName)" -ForegroundColor Yellow`,
      },
      {
        type: 'tip',
        text: 'Exam tip: "Remote wipe" = full factory reset (corporate). "Selective wipe" = remove only managed data (BYOD). The distinction appears on virtually every A+ Domain 1.0 question set.',
      },
    ],
  },

  'core1-networking': {
    title: 'Subnetting Cheatsheets & Common Network Port Quick References',
    trackLabel: 'CompTIA A+ Core 1 (220-1201) — Domain 2.0 Networking',
    contributor: 'NetSec Expert',
    contributorRole: 'Core 1 Expert',
    cohort: '2026-RTT-23',
    tags: ['networking', 'subnetting', 'ports', 'protocols', 'CIDR', 'OSI'],
    content: [
      {
        type: 'intro',
        text: 'Networking is the highest-weighted domain across both A+ exams. Master subnetting, port numbers, and OSI mappings here — these concepts appear in every PBQ simulation on the 220-1201.',
      },
      { type: 'heading', text: '1. CIDR Subnetting Quick Reference' },
      {
        type: 'table',
        headers: ['CIDR', 'Subnet Mask', 'Total Hosts', 'Usable Hosts', 'Block Size'],
        rows: [
          ['/24', '255.255.255.0', '256', '254', '256'],
          ['/25', '255.255.255.128', '128', '126', '128'],
          ['/26', '255.255.255.192', '64', '62', '64'],
          ['/27', '255.255.255.224', '32', '30', '32'],
          ['/28', '255.255.255.240', '16', '14', '16'],
          ['/29', '255.255.255.248', '8', '6', '8'],
          ['/30', '255.255.255.252', '4', '2', '4'],
        ],
      },
      {
        type: 'tip',
        text: 'The "Magic Number" trick: Subtract the last octet of the mask from 256 to get block size. /26 → 256-192 = 64. Networks start at 0, 64, 128, 192.',
      },
      { type: 'heading', text: '2. Critical Port Numbers (Memorize These)' },
      {
        type: 'code',
        lang: 'text',
        code: `╔══════╦══════════╦═══════╦════════════════════════════════════╗
║ Port ║ Protocol ║ Layer ║ Service                            ║
╠══════╬══════════╬═══════╬════════════════════════════════════╣
║  20  ║ TCP      ║  App  ║ FTP Data Transfer                  ║
║  21  ║ TCP      ║  App  ║ FTP Control                        ║
║  22  ║ TCP      ║  App  ║ SSH / SFTP                         ║
║  23  ║ TCP      ║  App  ║ Telnet (INSECURE — avoid!)         ║
║  25  ║ TCP      ║  App  ║ SMTP (email sending)               ║
║  53  ║ TCP/UDP  ║  App  ║ DNS                                ║
║  67  ║ UDP      ║  App  ║ DHCP Server                        ║
║  68  ║ UDP      ║  App  ║ DHCP Client                        ║
║  80  ║ TCP      ║  App  ║ HTTP                               ║
║ 110  ║ TCP      ║  App  ║ POP3                               ║
║ 143  ║ TCP      ║  App  ║ IMAP                               ║
║ 443  ║ TCP      ║  App  ║ HTTPS (TLS)                        ║
║ 445  ║ TCP      ║  App  ║ SMB / Windows File Sharing         ║
║ 3389 ║ TCP      ║  App  ║ RDP (Remote Desktop)               ║
╚══════╩══════════╩═══════╩════════════════════════════════════╝`,
      },
      { type: 'heading', text: '3. OSI Model with Protocol Mapping' },
      {
        type: 'table',
        headers: ['Layer', 'Name', 'Protocols / Devices', 'PDU Name'],
        rows: [
          ['7', 'Application', 'HTTP, FTP, DNS, SMTP, SNMP', 'Data'],
          ['6', 'Presentation', 'TLS/SSL, JPEG, ASCII', 'Data'],
          ['5', 'Session', 'NetBIOS, RPC, SOCKS', 'Data'],
          ['4', 'Transport', 'TCP, UDP', 'Segment'],
          ['3', 'Network', 'IP, ICMP, Router, L3 Switch', 'Packet'],
          ['2', 'Data Link', 'Ethernet, MAC, Switch, Bridge', 'Frame'],
          ['1', 'Physical', 'Cables, Hubs, Repeaters, NIC', 'Bits'],
        ],
      },
      {
        type: 'warning',
        text: 'On PBQ "drag to layer" questions: Switches operate at Layer 2 (by MAC address). Routers operate at Layer 3 (by IP). A Layer 3 switch does both. Hubs are always Layer 1.',
      },
    ],
  },

  'core1-hardware': {
    title: 'DDR Speed Matching, Form Factors, & NVMe PCIe Lane Allocation',
    trackLabel: 'CompTIA A+ Core 1 (220-1201) — Domain 3.0 Hardware',
    contributor: 'Tech Specialist',
    contributorRole: 'Core 1 Expert',
    cohort: '2026-RTT-23',
    tags: ['RAM', 'DDR', 'NVMe', 'PCIe', 'hardware', 'storage', 'form-factors'],
    content: [
      {
        type: 'intro',
        text: 'Hardware questions dominate the 220-1201 practical simulations. This guide covers DDR generation compatibility, memory channel configurations, NVMe PCIe lane budgets, and form factor rules you need to know cold.',
      },
      { type: 'heading', text: '1. DDR Generation Comparison' },
      {
        type: 'table',
        headers: ['Generation', 'Speed Range', 'Voltage', 'Notch Position', 'Max Module Size'],
        rows: [
          ['DDR3', '800–2133 MT/s', '1.35–1.5V', 'Different from DDR4', '16 GB'],
          ['DDR4', '2133–3200 MT/s', '1.2V', 'Different from DDR3/5', '128 GB'],
          ['DDR5', '4800–8400 MT/s', '1.1V', 'Different from DDR4', '128 GB+'],
          ['LPDDR5 (Mobile)', '6400 MT/s', '0.5V', 'Soldered (no slot)', '32 GB'],
        ],
      },
      {
        type: 'warning',
        text: 'DDR3, DDR4, and DDR5 are physically incompatible — different notch positions prevent wrong-generation installation. A motherboard that supports DDR4 will never accept DDR5 sticks. Always check the motherboard QVL (Qualified Vendor List) before purchasing RAM.',
      },
      { type: 'heading', text: '2. Memory Channel Configuration Rules' },
      {
        type: 'steps',
        items: [
          'Single-channel: Any one DIMM in any slot. Slowest performance.',
          'Dual-channel: Populate matching slots (usually same color). Doubles memory bandwidth.',
          'Quad-channel: Used in HEDT/server platforms (X299, TRX50). Requires 4 matched DIMMs.',
          'Always match: capacity, speed, and timings across channel pairs for stable XMP/EXPO profiles.',
          'If installing 2 of 4 slots: use slots A2 and B2 (skip A1/B1) for dual-channel on most ATX boards.',
        ],
      },
      { type: 'heading', text: '3. NVMe PCIe Lane Budget' },
      {
        type: 'table',
        headers: ['Interface', 'PCIe Version', 'Bandwidth', 'Typical Slot', 'Backward Compatible?'],
        rows: [
          ['NVMe Gen 3 x4', 'PCIe 3.0', '~3.5 GB/s', 'M.2 2280 (M-key)', 'Yes (slower)'],
          ['NVMe Gen 4 x4', 'PCIe 4.0', '~7 GB/s', 'M.2 2280 (M-key)', 'Yes (runs at Gen 3)'],
          ['NVMe Gen 5 x4', 'PCIe 5.0', '~14 GB/s', 'M.2 2280 (M-key)', 'Yes (runs at lower gen)'],
          ['SATA SSD', 'SATA III', '~550 MB/s', 'M.2 2280 (B+M-key) or 2.5"', 'Yes'],
        ],
      },
      {
        type: 'code',
        lang: 'powershell',
        code: `# Identify NVMe drive spec in Windows
Get-PhysicalDisk | Select FriendlyName, MediaType, BusType, Size

# Check PCIe link speed for NVMe controller
Get-PnpDevice -Class DiskDrive | Where-Object {$_.FriendlyName -match "NVMe"} |
  Get-PnpDeviceProperty -KeyName DEVPKEY_Device_BusNumber`,
      },
      {
        type: 'tip',
        text: 'Exam shortcut: M.2 form factor ≠ NVMe protocol. An M.2 slot can carry SATA or NVMe. Check the key notch: B-key = SATA/some NVMe. M-key = NVMe Gen 3/4/5. B+M key = usually SATA.',
      },
    ],
  },

  'core1-cloud': {
    title: 'Type 1 vs Type 2 Hypervisor Setups & Cloud Infrastructure Models',
    trackLabel: 'CompTIA A+ Core 1 (220-1201) — Domain 4.0 Virtualization & Cloud',
    contributor: 'Cloud Architect',
    contributorRole: 'Core 1 Expert',
    cohort: '2026-RTT-23',
    tags: ['cloud', 'virtualization', 'hypervisor', 'IaaS', 'SaaS', 'PaaS', 'VDI'],
    content: [
      {
        type: 'intro',
        text: 'Cloud and virtualization account for a meaningful question block on 220-1201. Master hypervisor types, cloud service models, and deployment architectures with this comprehensive breakdown.',
      },
      { type: 'heading', text: '1. Hypervisor Types Compared' },
      {
        type: 'table',
        headers: ['Type', 'Runs On', 'Examples', 'Use Case', 'Performance'],
        rows: [
          ['Type 1 (Bare-Metal)', 'Directly on hardware', 'VMware ESXi, MS Hyper-V, KVM, Proxmox', 'Data centers, enterprise', 'Excellent'],
          ['Type 2 (Hosted)', 'On top of a host OS', 'VirtualBox, VMware Workstation, Parallels', 'Developer workstations, testing', 'Good (overhead from host OS)'],
        ],
      },
      {
        type: 'tip',
        text: 'Key exam rule: If the scenario says "runs directly on hardware with no OS underneath" → Type 1. If it says "runs as an application inside Windows or macOS" → Type 2. Never guess based on product name alone.',
      },
      { type: 'heading', text: '2. Cloud Service Models' },
      {
        type: 'table',
        headers: ['Model', 'Customer Manages', 'Provider Manages', 'Healthcare Example'],
        rows: [
          ['IaaS', 'OS, runtime, middleware, data, apps', 'Servers, storage, networking', 'Azure VMs hosting EHR application'],
          ['PaaS', 'Application code, data', 'OS, runtime, infra, scaling', 'Azure App Service for patient portal'],
          ['SaaS', 'Data configuration only', 'Everything', 'Epic Hyperdrive web client, Microsoft 365'],
          ['DaaS (VDI)', 'User profile, documents', 'Virtual desktop infrastructure', 'Citrix clinical workstations'],
        ],
      },
      { type: 'heading', text: '3. Cloud Deployment Models' },
      {
        type: 'steps',
        items: [
          'Public Cloud: Resources hosted by third-party provider (AWS, Azure, GCP). Multi-tenant, pay-as-you-go.',
          'Private Cloud: Dedicated infrastructure for one organization. On-premises or hosted. Higher cost, maximum control.',
          'Hybrid Cloud: Mix of public and private. Sensitive PHI stays on-premises; burst workloads go public.',
          'Community Cloud: Shared by organizations with common compliance needs (e.g., multiple hospitals sharing HIPAA-compliant infrastructure).',
        ],
      },
      {
        type: 'warning',
        text: 'In healthcare, private or hybrid cloud deployments are standard for systems processing PHI. Public cloud SaaS is acceptable when the vendor has a signed BAA (Business Associate Agreement) — required by HIPAA.',
      },
      { type: 'heading', text: '4. Resource Allocation Concepts' },
      {
        type: 'code',
        lang: 'bash',
        code: `# VMware ESXi — Check VM resource allocation via ESXi Shell
esxcli vm process list          # List running VMs
vim-cmd vmsvc/getallvms         # Full VM inventory with ID

# Allocate CPU/RAM via vim-cmd (example: VM ID 42)
vim-cmd vmsvc/power.off 42
# Edit .vmx file to change numvcpus and memSize
vim-cmd vmsvc/power.on 42`,
      },
    ],
  },

  'core1-troubleshooting': {
    title: 'Interactive Motherboard Troubleshooting & Master PBQ Analysis',
    trackLabel: 'CompTIA A+ Core 1 (220-1201) — Domain 5.0 Hardware & Network Troubleshooting',
    contributor: 'Jamin Ware',
    contributorRole: 'Core 1 Expert',
    cohort: '2026-RTT-23',
    tags: ['hardware', 'motherboard', 'troubleshooting', 'PBQ', 'POST', 'beep-codes'],
    content: [
      {
        type: 'intro',
        text: 'Performance-Based Questions (PBQs) on Domain 5.0 are the hardest part of the 220-1201. This guide by Jamin Ware walks through every POST failure scenario, beep code interpretation, and network fault isolation methodology used in real-world tech support.',
      },
      { type: 'heading', text: '1. POST Beep Code Reference' },
      {
        type: 'table',
        headers: ['BIOS Vendor', 'Beep Pattern', 'Meaning'],
        rows: [
          ['AMI BIOS', '1 short', 'POST passed — no errors'],
          ['AMI BIOS', '1 long + 2 short', 'Video card failure'],
          ['AMI BIOS', '2 short', 'Memory parity error'],
          ['AMI BIOS', 'Continuous beep', 'RAM not seated / completely missing'],
          ['Award BIOS', '1 long + 2 short', 'Video error'],
          ['Award BIOS', '1 long + 3 short', 'Video memory error'],
          ['Phoenix BIOS', '3-3-4 (beep-beep-beep pause…)', 'Video card not detected'],
        ],
      },
      { type: 'heading', text: '2. Systematic Hardware Fault Isolation' },
      {
        type: 'steps',
        items: [
          'Step 1 — Establish a baseline: Document last known working state. What changed?',
          'Step 2 — Check PSU: Test with a PSU tester or swap a known-good unit. A dead PSU is the #1 "no power" culprit.',
          'Step 3 — Minimal boot config: Remove all non-essential hardware (GPU, extra RAM, HDDs). Boot with CPU + 1 DIMM only.',
          'Step 4 — Interpret POST codes: Use the onboard diagnostic LED or LCD POST code reader if available.',
          'Step 5 — Reseat all components: RAM, GPU, CPU cooler retention bracket.',
          'Step 6 — CMOS reset: Clear NVRAM by removing CR2032 battery for 30 seconds, or use the CLR_CMOS jumper.',
          'Step 7 — Component swap: Swap GPU, RAM sticks one at a time using known-good spares to isolate the fault.',
          'Step 8 — Document and escalate: If the motherboard is suspected faulty, escalate with component swap log.',
        ],
      },
      {
        type: 'warning',
        text: 'Never diagnose a motherboard as faulty without first testing with known-good RAM, GPU, and PSU. Misdiagnosing a PSU fault as a motherboard failure is the #1 avoidable hardware return in IT support.',
      },
      { type: 'heading', text: '3. Network Troubleshooting Methodology' },
      {
        type: 'code',
        lang: 'cmd',
        code: `:: Windows network diagnostic runbook (run as Admin)
:: Step 1: Check physical link
ipconfig /all                    :: Verify adapter has IP, subnet, gateway, DNS

:: Step 2: Test loopback
ping 127.0.0.1                   :: Verifies TCP/IP stack is loaded

:: Step 3: Test default gateway
ping 192.168.1.1                 :: Verifies Layer 2/3 local connectivity

:: Step 4: Test DNS resolution
nslookup google.com              :: Verifies DNS is responding
ping google.com                  :: Confirms DNS + internet routing

:: Step 5: Flush and renew
ipconfig /release
ipconfig /flushdns
ipconfig /renew                  :: Get fresh DHCP lease

:: Step 6: Trace routing path
tracert 8.8.8.8                  :: Identify where packets stop`,
      },
      {
        type: 'tip',
        text: 'PBQ strategy: Always work OSI bottom-up (Physical → Data Link → Network → Application). The exam rewards methodical escalation. Skipping steps = wrong answer.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // TRACK B — CompTIA A+ Core 2 (220-1202)
  // ─────────────────────────────────────────────────────────

  'core2-os': {
    title: 'Cross-Platform OS Installation Guidelines & Upgrade Path Matrix',
    trackLabel: 'CompTIA A+ Core 2 (220-1202) — Domain 1.0 Operating Systems',
    contributor: 'SysAdmin Pro',
    contributorRole: 'Core 2 Expert',
    cohort: '2026-RTT-23',
    tags: ['OS', 'Windows', 'macOS', 'Linux', 'installation', 'upgrade', 'boot-camp'],
    content: [
      {
        type: 'intro',
        text: 'Domain 1.0 covers the widest breadth of any Core 2 section — Windows 10/11 installations, upgrade constraints, macOS/Linux basics, and the dreaded Boot Camp scenarios. SysAdmin Pro compiled this complete playbook.',
      },
      { type: 'heading', text: '1. Windows 11 Minimum Requirements' },
      {
        type: 'table',
        headers: ['Component', 'Minimum Spec', 'Common Gotcha'],
        rows: [
          ['CPU', '1 GHz, 2+ cores, 64-bit', 'Intel 7th gen (Kaby Lake) mostly excluded'],
          ['RAM', '4 GB', 'TPM check fails before RAM check — misleading error'],
          ['Storage', '64 GB', 'OS partition only; full install needs ~30 GB free'],
          ['TPM', 'TPM 2.0', 'Enable via BIOS → Security → PTT (Intel) / fTPM (AMD)'],
          ['Secure Boot', 'Required', 'Legacy BIOS / CSM mode must be DISABLED'],
          ['Display', '720p, 9" diagonal', 'Tablets under 9" may fail'],
        ],
      },
      { type: 'heading', text: '2. Windows Upgrade Path Rules' },
      {
        type: 'steps',
        items: [
          'In-place upgrade: Same architecture (64-bit → 64-bit) ONLY. Cannot upgrade 32-bit to 64-bit in-place.',
          'Edition lock: Cannot upgrade Windows 11 Home → Pro in-place without a license key. Use Settings → Activation.',
          'Windows 10 → 11: Supported in-place via Windows Update or Media Creation Tool (if hardware qualifies).',
          'Windows 7/8.1 → 11: NOT a direct in-place upgrade path. Must be clean install. Migrate user data separately.',
          'Rollback window: After an in-place upgrade, a 10-day rollback window exists (Settings → Recovery → Go Back).',
        ],
      },
      {
        type: 'warning',
        text: 'Apple Silicon Macs (M1/M2/M3/M4) do NOT support Boot Camp. Use Parallels Desktop 18+ or UTM for Windows VMs on Apple Silicon. This distinction appears repeatedly on the exam and in clinical IT environments.',
      },
      { type: 'heading', text: '3. Boot Camp: Intel Mac Troubleshooting Matrix' },
      {
        type: 'table',
        headers: ['Symptom', 'Root Cause', 'Fix'],
        rows: [
          ['Partition fails to create', 'Time Machine running / fragmented APFS', 'Disable Time Machine → run diskutil repairVolume /'],
          ['"No bootable device" after install', 'Missing EFI entry', 'Hold Option key → select Windows (EFI) from boot picker'],
          ['Keyboard / trackpad dead in Windows', 'Boot Camp support drivers missing', 'Run BootCamp.exe from mounted support drive'],
          ['Clock wrong when switching OS', 'Windows uses local time; macOS uses UTC', 'Add UTC registry key to Windows (see code block)'],
          ['Audio not working in Windows', 'Realtek driver conflict', 'Reinstall Boot Camp audio via Device Manager'],
        ],
      },
      {
        type: 'code',
        lang: 'powershell',
        code: `# Fix clock skew between macOS and Windows Boot Camp
# Run in elevated PowerShell on the Windows partition:
Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\TimeZoneInformation" \`
  -Name RealTimeIsUniversal -Value 1 -Type DWord
Write-Host "Windows will now read hardware clock as UTC — clock sync fixed." -ForegroundColor Green

# Verify macOS architecture (run in macOS Terminal FIRST):
# uname -m → x86_64 = Intel (Boot Camp OK)
# uname -m → arm64  = Apple Silicon (Boot Camp NOT available)`,
      },
    ],
  },

  'core2-security': {
    title: 'Malware Remediation Best Practices & Social Engineering Defenses',
    trackLabel: 'CompTIA A+ Core 2 (220-1202) — Domain 2.0 Security',
    contributor: 'SecOps Lead',
    contributorRole: 'Core 2 Expert',
    cohort: '2026-RTT-23',
    tags: ['security', 'malware', 'social-engineering', 'remediation', 'CompTIA'],
    content: [
      {
        type: 'intro',
        text: 'Security is the highest-weighted domain on Core 2. This guide covers the mandated 8-step malware removal process, threat taxonomy, social engineering attack types, and Windows security hardening — all exam-critical topics.',
      },
      { type: 'heading', text: '1. The CompTIA 8-Step Malware Removal Process' },
      {
        type: 'steps',
        items: [
          '1. Investigate and verify malware symptoms (slow performance, pop-ups, unknown processes).',
          '2. Quarantine the infected system — disconnect from all networks immediately.',
          '3. Disable System Restore — prevents malware from sheltering in restore points.',
          '4. Remediate — run updated anti-malware in Safe Mode; use bootable rescue disk for rootkits.',
          '5. Schedule scans and run full system updates (Windows Update, definitions).',
          '6. Enable System Restore and create a clean restore point.',
          '7. Educate the end user: phishing awareness, safe browsing, password hygiene.',
          '8. Document: ticket the incident, root cause, remediation steps, and lessons learned.',
        ],
      },
      {
        type: 'warning',
        text: 'Step 3 is the most commonly missed in both the exam and real life. If you scan BEFORE disabling System Restore, the malware can restore itself from a shadow copy after reboot. Always disable System Restore first.',
      },
      { type: 'heading', text: '2. Malware Type Quick Reference' },
      {
        type: 'table',
        headers: ['Type', 'Propagation', 'Payload', 'Removal Difficulty'],
        rows: [
          ['Virus', 'Attaches to executable files', 'Data corruption, system damage', 'Moderate'],
          ['Worm', 'Self-replicates via network without user action', 'Network congestion, backdoors', 'High'],
          ['Trojan', 'Disguised as legitimate software', 'Remote access, data theft', 'Moderate'],
          ['Ransomware', 'Email, RDP, web exploits', 'Encrypts files, demands payment', 'Very High (restore from backup)'],
          ['Rootkit', 'Kernel-level injection', 'Hides malware, intercepts OS calls', 'Extreme (often requires OS reinstall)'],
          ['Spyware / Keylogger', 'Drive-by download, PUPS', 'Credential theft, surveillance', 'Moderate'],
          ['Cryptominer', 'Watering hole, pirated software', 'CPU/GPU hijack for crypto mining', 'Moderate'],
        ],
      },
      { type: 'heading', text: '3. Social Engineering Attack Types' },
      {
        type: 'table',
        headers: ['Attack', 'Method', 'Defense'],
        rows: [
          ['Phishing', 'Bulk email mimicking trusted sender', 'Email filtering, security awareness training'],
          ['Spear Phishing', 'Targeted email using personal info', 'Verify sender via second channel before clicking'],
          ['Vishing', 'Phone call impersonating IT/bank', 'Never give creds over phone; call back on official number'],
          ['Smishing', 'SMS with malicious link', 'Never click unsolicited SMS links'],
          ['Tailgating', 'Physical: follow authorized person through secured door', 'Mantrap / badge enforcement / security culture'],
          ['Pretexting', 'Fabricated scenario to extract info', 'Verify identity before sharing any data'],
        ],
      },
    ],
  },

  'core2-software': {
    title: 'Windows BSOD Log Analysis & Critical SFC/DISM Repair Runbooks',
    trackLabel: 'CompTIA A+ Core 2 (220-1202) — Domain 3.0 Software Troubleshooting',
    contributor: 'Support Tier 2',
    contributorRole: 'Core 2 Expert',
    cohort: '2026-RTT-23',
    tags: ['BSOD', 'SFC', 'DISM', 'Windows', 'troubleshooting', 'WinRE'],
    content: [
      {
        type: 'intro',
        text: 'Blue Screen of Death (BSOD) analysis and Windows image repair are core Tier 2 support skills. This runbook from the Support Tier 2 contributor covers stop code interpretation, WinDbg basics, and the SFC/DISM repair sequence.',
      },
      { type: 'heading', text: '1. Critical BSOD Stop Codes' },
      {
        type: 'table',
        headers: ['Stop Code', 'Hex Code', 'Most Likely Cause'],
        rows: [
          ['IRQL_NOT_LESS_OR_EQUAL', '0x0000000A', 'Driver accessing memory at wrong IRQL — update or rollback drivers'],
          ['PAGE_FAULT_IN_NONPAGED_AREA', '0x00000050', 'Faulty RAM or corrupt driver accessing invalid memory'],
          ['SYSTEM_SERVICE_EXCEPTION', '0x0000003B', 'Corrupt or incompatible system driver'],
          ['CRITICAL_PROCESS_DIED', '0x000000EF', 'Core system process terminated — often malware or corrupt OS'],
          ['MEMORY_MANAGEMENT', '0x0000001A', 'RAM hardware failure — run MemTest86'],
          ['NTFS_FILE_SYSTEM', '0x00000024', 'NTFS volume error — run chkdsk /f /r'],
          ['DRIVER_IRQL_NOT_LESS_OR_EQUAL', '0x000000D1', 'Network adapter or graphics driver issue'],
        ],
      },
      { type: 'heading', text: '2. SFC + DISM Repair Sequence (Always Run in This Order)' },
      {
        type: 'code',
        lang: 'cmd',
        code: `:: Run ALL commands from elevated Command Prompt or PowerShell

:: STEP 1 — Repair the Windows component store (online)
DISM /Online /Cleanup-Image /RestoreHealth
:: Wait for 100% completion — may take 15-30 minutes

:: STEP 2 — Run System File Checker after DISM completes
sfc /scannow
:: "Windows Resource Protection found corrupt files and repaired them" = success
:: "...could not repair..." = run DISM from bootable WinPE and retry

:: STEP 3 — Check disk for file system errors
chkdsk C: /f /r /x
:: /f = fix errors  /r = recover readable info  /x = dismount first
:: Will schedule on next reboot if C: is the system drive

:: STEP 4 — Verify image health post-repair
DISM /Online /Cleanup-Image /CheckHealth`,
      },
      {
        type: 'warning',
        text: 'Never run SFC before DISM. SFC can silently mark corrupt system files as "repaired" using the broken component store, masking the real problem. Always DISM first to heal the store, then SFC to restore individual files.',
      },
      { type: 'heading', text: '3. Reading a Minidump in WinDbg (Quick Method)' },
      {
        type: 'code',
        lang: 'powershell',
        code: `# Locate minidump files
Get-ChildItem C:\Windows\Minidump | Sort-Object LastWriteTime -Descending | Select -First 5

# Quick BSOD analysis without WinDbg — read event log
Get-WinEvent -LogName System | Where-Object {$_.Id -eq 41 -or $_.Id -eq 1001} |
  Select TimeCreated, Message | Format-List | Out-File $env:TEMP\bsod_log.txt

notepad $env:TEMP\bsod_log.txt`,
      },
    ],
  },

  'core2-operations': {
    title: 'ESD Safety Protocols & Professional Cohort Documentation Standards',
    trackLabel: 'CompTIA A+ Core 2 (220-1202) — Domain 4.0 Operational Procedures',
    contributor: 'Operations Lead',
    contributorRole: 'Core 2 Expert',
    cohort: '2026-RTT-23',
    tags: ['ESD', 'documentation', 'change-management', 'safety', 'operations'],
    content: [
      {
        type: 'intro',
        text: 'Operational procedures are often underestimated — they account for a significant question block on 220-1202 and directly translate to professional IT practice. This guide covers ESD safety, documentation standards, and the change management lifecycle.',
      },
      { type: 'heading', text: '1. ESD Safety Protocols' },
      {
        type: 'steps',
        items: [
          'Use an anti-static wrist strap connected to an unpainted metal chassis — not a painted surface or plastic.',
          'ESD-safe mat: Place components on anti-static mat, not bare table or carpet.',
          'Anti-static bags: Store components in pink or silver anti-static bags; never on top of the bag (only works from inside).',
          'Environment: Maintain 40–60% relative humidity. Dry air below 20% RH dramatically increases ESD risk.',
          'Clothing: Avoid synthetic fabrics (polyester, wool). Natural cotton is safer in ESD-sensitive areas.',
          'Self-grounding: Before touching any component, touch an exposed metal part of the chassis with the system unplugged.',
        ],
      },
      {
        type: 'warning',
        text: 'A typical ESD event is 1,000–35,000 volts — but humans cannot feel discharges below ~3,500V. Components can be permanently damaged by ESD you never felt. Treat ESD prevention as non-negotiable, not optional.',
      },
      { type: 'heading', text: '2. Change Management Lifecycle' },
      {
        type: 'table',
        headers: ['Phase', 'Key Activity', 'Output Document'],
        rows: [
          ['Request', 'Document proposed change, affected systems, business justification', 'RFC (Request for Change)'],
          ['Assessment', 'Risk analysis, rollback plan, resource requirements', 'Risk Assessment Matrix'],
          ['Approval', 'CAB (Change Advisory Board) review and sign-off', 'Approved Change Order'],
          ['Implementation', 'Execute during approved maintenance window', 'Change Log with timestamps'],
          ['Verification', 'Test functionality, confirm success with stakeholders', 'Post-Implementation Review'],
          ['Documentation', 'Update CMDB, knowledge base, and asset management', 'Updated Configuration Records'],
        ],
      },
      { type: 'heading', text: '3. Professional Ticket Documentation Template' },
      {
        type: 'code',
        lang: 'text',
        code: `────────────────────────────────────────────────
INCIDENT TICKET — COHORT 2026-RTT-23 STANDARD
────────────────────────────────────────────────
Ticket ID    : INC-2026-XXXX
Date/Time    : YYYY-MM-DD HH:MM (24hr format)
Technician   : [Your Name / Badge]
Affected User: [Full Name, Department, Ext.]
Device ID    : [Asset Tag / Serial Number]
Priority     : P1-Critical / P2-High / P3-Medium / P4-Low

SYMPTOM DESCRIPTION:
  [Exact user-reported issue in their own words]

INVESTIGATION STEPS:
  1. [What you checked first]
  2. [Commands run / diagnostics performed]
  3. [Findings at each step]

ROOT CAUSE:
  [Identified cause — be specific, not vague]

RESOLUTION:
  [Exact steps taken to resolve; include KB article if used]

VERIFICATION:
  [How you confirmed the issue was resolved — tested by user?]

FOLLOW-UP REQUIRED: Yes / No
────────────────────────────────────────────────`,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // TRACK C — Advanced Healthcare IT
  // ─────────────────────────────────────────────────────────

  'healthcare-ehr': {
    title: 'HL7 Messaging Schemas & Epic/Cerner EHR Integration Blueprints',
    trackLabel: 'Advanced Healthcare IT — EHR Architecture',
    contributor: 'HealthIT Architect',
    contributorRole: 'HealthIT Specialist',
    cohort: '2026-RTT-23',
    tags: ['EHR', 'HL7', 'FHIR', 'Epic', 'Cerner', 'integration', 'middleware'],
    content: [
      {
        type: 'intro',
        text: 'Modern healthcare IT relies on robust EHR integration. This blueprint by HealthIT Architect covers HL7 v2 message structures, FHIR REST patterns, and the interface architecture patterns used in Epic and Cerner deployments.',
      },
      { type: 'heading', text: '1. HL7 v2 Message Anatomy' },
      {
        type: 'code',
        lang: 'hl7',
        code: `MSH|^~\\&|LAB_SYS|GENERAL_HOSP|EHR_ENGINE|CLINIC_A|20260626120000||ORU^R01|MSG20260001|P|2.5.1
PID|1||MR-789456^^^GH^MR||DOE^JANE^M||19901215|F|||123 Main St^^Chicago^IL^60601
PV1|1|I|CARDIO-4W^4012^A|||^SMITH^JAMES^MD^DR|||CAR
OBR|1|ORD-2026-001|LAB-2026-001|85025^CBC WITH DIFF^LN|||20260626||
OBX|1|NM|6690-2^WBC^LN||8.4|10*3/uL|4.5-11.0|N|||F|||20260626110000
OBX|2|NM|718-7^HGB^LN||13.2|g/dL|12.0-16.0|N|||F|||20260626110000`,
      },
      {
        type: 'tip',
        text: 'HL7 v2 key delimiters: | = field separator, ^ = component separator, & = sub-component, ~ = repetition. The MSH segment always comes first and defines the delimiters for the entire message.',
      },
      { type: 'heading', text: '2. Integration Architecture: Epic & Cerner' },
      {
        type: 'table',
        headers: ['Component', 'Epic Term', 'Cerner Term', 'Function'],
        rows: [
          ['Interface Engine', 'Epic Bridges', 'Cerner Millennium Interface Engine', 'Routes HL7 messages between systems'],
          ['Middleware', 'InterSystems HealthShare / Rhapsody', 'Mirth Connect / Rhapsody', 'Message transformation and routing'],
          ['Lab Interface', 'Epic Bridges → LIS', 'Cerner PathNet → LIS', 'Bidirectional lab orders/results'],
          ['ADT Feed', 'Epic ADT (A01/A08/A03)', 'Cerner Registration (A01/A08)', 'Patient admit/discharge/transfer events'],
          ['FHIR API Layer', 'Epic FHIR R4', 'Cerner SMART on FHIR', 'Modern REST access for third-party apps'],
        ],
      },
      { type: 'heading', text: '3. FHIR R4 REST API Patterns' },
      {
        type: 'code',
        lang: 'bash',
        code: `# Epic FHIR R4 — Get patient by MRN
GET https://fhir.epic.org/interconnect-fhir-oauth/api/FHIR/R4/Patient?identifier=MR-789456
Authorization: Bearer <SMART_token>
Accept: application/fhir+json

# Cerner FHIR — Search observations by patient + code
GET https://fhir-ehr.cerner.com/r4/TENANT_ID/Observation?patient=12345&code=http://loinc.org|6690-2

# Create a MedicationRequest (new order)
POST https://fhir.epic.org/.../MedicationRequest
Content-Type: application/fhir+json
{
  "resourceType": "MedicationRequest",
  "status": "active",
  "intent": "order",
  "subject": { "reference": "Patient/12345" }
}`,
      },
      {
        type: 'warning',
        text: 'All FHIR endpoints accessing PHI MUST enforce SMART on FHIR (OAuth 2.0). Exposing an unauthenticated FHIR endpoint containing PHI is a HIPAA violation and a reportable breach event.',
      },
    ],
  },

  'healthcare-hipaa': {
    title: 'PHI Encryption Standards, Access Control Matrices, & Audit Log Requirements',
    trackLabel: 'Advanced Healthcare IT — HIPAA Data Security',
    contributor: 'Compliance Officer',
    contributorRole: 'HealthIT Specialist',
    cohort: '2026-RTT-23',
    tags: ['HIPAA', 'PHI', 'encryption', 'access-control', 'audit-logs', 'compliance'],
    content: [
      {
        type: 'intro',
        text: 'HIPAA compliance is not optional — it is federal law. This comprehensive reference by the Compliance Officer covers encryption standards for PHI at rest and in transit, access control matrix design, and audit log requirements that survive a CMS audit.',
      },
      { type: 'heading', text: '1. PHI Encryption Standards' },
      {
        type: 'table',
        headers: ['Data State', 'Minimum Standard', 'Recommended', 'Common Tool'],
        rows: [
          ['At Rest (Database)', 'AES-128', 'AES-256', 'SQL TDE, FileVault, BitLocker'],
          ['At Rest (Workstation)', 'AES-128', 'AES-256 + TPM 2.0', 'BitLocker (Windows), FileVault (Mac)'],
          ['In Transit', 'TLS 1.2', 'TLS 1.3', 'HTTPS, SFTP, STARTTLS'],
          ['Backup Media', 'AES-256', 'AES-256 + offline key escrow', 'Veeam, Commvault with encryption'],
          ['Email with PHI', 'TLS + Message-level encryption', 'S/MIME or PGP', 'ProofPoint, Zix, Microsoft Purview'],
        ],
      },
      {
        type: 'warning',
        text: 'TLS 1.0 and TLS 1.1 are DEPRECATED and must not be used for PHI transmission. Any system still running TLS 1.0 is out of HIPAA compliance and must be remediated immediately. Run SSLScan or Qualys SSL Labs to audit.',
      },
      { type: 'heading', text: '2. Role-Based Access Control Matrix (Sample)' },
      {
        type: 'table',
        headers: ['Role', 'Demographics', 'Clinical Notes', 'Billing', 'PHI Export', 'Admin'],
        rows: [
          ['Physician', 'R/W', 'R/W', 'R', 'Limited', 'None'],
          ['Nurse', 'R/W', 'R/W', 'None', 'None', 'None'],
          ['Medical Coder', 'R', 'R (dx only)', 'R/W', 'None', 'None'],
          ['IT Support (Tier 1)', 'R (last 4 SSN only)', 'None', 'None', 'None', 'System only'],
          ['Privacy Officer', 'R', 'R (audit mode)', 'R', 'Audit only', 'Policy only'],
          ['Administrator', 'Full', 'Full', 'Full', 'Full', 'Full'],
        ],
      },
      { type: 'heading', text: '3. Audit Log Requirements' },
      {
        type: 'steps',
        items: [
          'Required events: All PHI access (read/write/delete), failed login attempts, privilege escalation, configuration changes.',
          'Retention: Minimum 6 years from the date of creation or last effective date (HIPAA Security Rule §164.316).',
          'Integrity: Logs must be tamper-evident — use WORM storage, cryptographic signing, or centralized SIEM.',
          'Review cadence: Logs must be reviewed regularly — most auditors expect weekly automated alerting + monthly human review.',
          'Monitoring alerts: Trigger on: access outside normal hours, bulk exports, access to VIP patient records, repeated failed auth.',
        ],
      },
      {
        type: 'code',
        lang: 'sql',
        code: `-- Sample audit log query: Who accessed patient 789456 in the last 30 days?
SELECT
  a.access_timestamp,
  u.user_display_name,
  u.department,
  a.access_type,        -- READ, WRITE, DELETE, EXPORT
  a.resource_accessed,
  a.ip_address,
  a.workstation_id
FROM phi_audit_log a
  JOIN system_users u ON a.user_id = u.user_id
WHERE
  a.patient_mrn = 'MR-789456'
  AND a.access_timestamp >= NOW() - INTERVAL '30 days'
ORDER BY a.access_timestamp DESC;`,
      },
    ],
  },

  'healthcare-clinical': {
    title: 'Computerized Physician Order Entry (CPOE) Optimization & Order Set Workflows',
    trackLabel: 'Advanced Healthcare IT — Clinical Workflows',
    contributor: 'Clinical Analyst',
    contributorRole: 'HealthIT Specialist',
    cohort: '2026-RTT-23',
    tags: ['CPOE', 'clinical-workflows', 'order-sets', 'downtime', 'healthcare-it'],
    content: [
      {
        type: 'intro',
        text: 'CPOE (Computerized Physician Order Entry) is the digital backbone of clinical care delivery. This guide from our Clinical Analyst covers order set optimization, interface error handling, and the downtime protocols that keep hospitals running when the EHR goes dark.',
      },
      { type: 'heading', text: '1. CPOE Order Set Optimization Principles' },
      {
        type: 'steps',
        items: [
          'Standardize defaults: Pre-populate order sets with evidence-based defaults (e.g., sepsis bundle, AMI protocol) to reduce cognitive load at point of care.',
          'Decision support alerts: CDS (Clinical Decision Support) rules fire for drug-allergy, drug-drug interactions, and duplicate orders — calibrate sensitivity to reduce alert fatigue.',
          'Order set versioning: All order set changes require physician and pharmacy sign-off. Use version control in the EHR build environment.',
          'Naming convention: Use "DEPT — CONDITION — AGE GROUP" format (e.g., "CARD — Acute MI — Adult") for searchability.',
          'Favorite lists: Train physicians to build personal order favorites for their top 10 recurring orders — reduces clicks by 40-60%.',
        ],
      },
      { type: 'heading', text: '2. CPOE Interface Error Handling' },
      {
        type: 'table',
        headers: ['Error Type', 'Likely Cause', 'Immediate Action'],
        rows: [
          ['Order stuck in "Transmitting"', 'HL7 interface engine down', 'Alert interface team; manually fax order to pharmacy'],
          ['"Patient not found" in pharmacy', 'ADT not synced to pharmacy system', 'Check A01 message in interface engine logs; resend'],
          ['Lab orders not received by LIS', 'MLLP listener down on LIS server', 'Ping LIS server on port 2575; alert lab and IT'],
          ['Duplicate medication alert not firing', 'Order set missing duplicate check flag', 'Escalate to EHR build team for CDS rule review'],
          ['eMAR not updating', 'Medication administration interface lag', 'Verify interface heartbeat; manual paper MAR as backup'],
        ],
      },
      {
        type: 'warning',
        text: 'When a CPOE-to-pharmacy interface fails, NEVER let a critical medication order wait more than 15 minutes. Activate verbal/phone order protocol immediately and document the downtime event in the incident log.',
      },
      { type: 'heading', text: '3. Downtime Activation Checklist' },
      {
        type: 'steps',
        items: [
          'T+0 min: Confirm EHR outage with help desk and system admin. Verify it is a true outage, not a local workstation issue.',
          'T+5 min: Notify charge nurses on all units and department heads. Activate downtime binders (kept at each nursing station).',
          'T+10 min: Switch to paper CPOE forms. Medications via paper MAR. Lab via paper requisitions.',
          'T+30 min: Brief all attending physicians; activate verbal order protocol.',
          'T+60 min: Escalate to CMIO and hospital administration if outage persists.',
          'On restoration: Reconcile all paper orders into EHR within 2 hours per Joint Commission standard.',
          'Post-event: Complete downtime report within 48 hours. RCA within 7 days.',
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // Sub-page fallbacks (keep previous ones working)
  // ─────────────────────────────────────────────────────────
  'core1-networking/osi-tcpip': {
    title: 'OSI Model & TCP/IP Deep Dive',
    trackLabel: 'CompTIA A+ Core 1 — Domain 2.0 Networking',
    contributor: 'NetSec Expert',
    contributorRole: 'Core 1 Expert',
    cohort: '2026-RTT-23',
    tags: ['OSI', 'TCP/IP', 'networking'],
    content: [
      { type: 'intro', text: 'Master the OSI model and TCP/IP stack. Bottom-to-top mnemonic: "Please Do Not Throw Sausage Pizza Away".' },
      { type: 'heading', text: 'TCP vs UDP' },
      { type: 'table', headers: ['Feature', 'TCP', 'UDP'], rows: [
        ['Connection', 'Connection-oriented (3-way handshake)', 'Connectionless'],
        ['Reliability', 'Guaranteed delivery', 'Best-effort'],
        ['Use Case', 'HTTP, FTP, SSH, email', 'DNS, VoIP, gaming, streaming'],
      ]},
    ],
  },

  'core2-os/windows-bootcamp': {
    title: 'Windows Installation & macOS Boot Camp Failures',
    trackLabel: 'CompTIA A+ Core 2 — Domain 1.0 Operating Systems',
    contributor: 'SysAdmin Pro',
    contributorRole: 'Core 2 Expert',
    cohort: '2026-RTT-23',
    tags: ['windows', 'macOS', 'boot-camp', 'installation'],
    content: [
      { type: 'intro', text: 'Hands-on guide to Windows installations and Boot Camp troubleshooting for Intel Macs.' },
      { type: 'warning', text: 'Apple Silicon Macs (M1/M2/M3/M4) do NOT support Boot Camp. Use Parallels Desktop 18+ or UTM.' },
    ],
  },

  'healthcare-ehr/integration': {
    title: 'HL7 Messaging Schemas & EHR Integration Blueprints',
    trackLabel: 'Advanced Healthcare IT — EHR Architecture',
    contributor: 'HealthIT Architect',
    contributorRole: 'HealthIT Specialist',
    cohort: '2026-RTT-23',
    tags: ['EHR', 'HL7', 'integration'],
    content: [
      { type: 'intro', text: 'Deep-dive into HL7 v2 messaging and FHIR REST API patterns for EHR integration.' },
    ],
  },

  'healthcare-clinical/cpoe': {
    title: 'CPOE Optimization & Order Set Workflows',
    trackLabel: 'Advanced Healthcare IT — Clinical Workflows',
    contributor: 'Clinical Analyst',
    contributorRole: 'HealthIT Specialist',
    cohort: '2026-RTT-23',
    tags: ['CPOE', 'clinical', 'order-sets'],
    content: [
      { type: 'intro', text: 'CPOE order set optimization and interface error handling for clinical IT teams.' },
    ],
  },
};

export default contentMap;

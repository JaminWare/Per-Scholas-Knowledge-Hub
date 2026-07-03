export interface LocalArticle {
  title: string;
  trackLabel: string;
  contributor: string;
  contributorRole: string;
  cohort: string;
  tags: string[];
  studyCategory?: string;
  isFeatured?: boolean;
  date?: string;
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
          'Compliance Policy: Enforce PIN length \u2265 6, biometric auth, OS version minimums, jailbreak/root detection.',
        ],
      },
      {
        type: 'warning',
        text: 'Never enroll a device into MDM without user consent documentation in BYOD scenarios. HIPAA requires that employees acknowledge that IT can remotely wipe a device registered for corporate email \u2014 even if it\'s personally owned.',
      },
      { type: 'heading', text: '3. Remote Wipe vs. Selective Wipe' },
      {
        type: 'table',
        headers: ['Action', 'What It Erases', 'When to Use'],
        rows: [
          ['Full Remote Wipe', 'Entire device \u2014 factory reset', 'Device lost/stolen or employee termination (corporate device)'],
          ['Selective Wipe', 'Work profile / managed apps only', 'Employee resignation (BYOD \u2014 preserves personal data)'],
          ['Account Remove', 'MDM profile + managed apps + settings', 'Device retirement with data confirmation'],
        ],
      },
      {
        type: 'code',
        lang: 'powershell',
        code: `# Microsoft Intune \u2014 Initiate a selective wipe via PowerShell
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

  'core1-troubleshooting': {
    title: 'Interactive Motherboard Troubleshooting & Master PBQ Analysis',
    trackLabel: 'CompTIA A+ Core 1 (220-1201) \u2014 Domain 5.0 Hardware & Network Troubleshooting',
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
          ['AMI BIOS', '1 short', 'POST passed \u2014 no errors'],
          ['AMI BIOS', '1 long + 2 short', 'Video card failure'],
          ['AMI BIOS', '2 short', 'Memory parity error'],
          ['AMI BIOS', 'Continuous beep', 'RAM not seated / completely missing'],
          ['Award BIOS', '1 long + 2 short', 'Video error'],
          ['Award BIOS', '1 long + 3 short', 'Video memory error'],
          ['Phoenix BIOS', '3-3-4 (beep-beep-beep pause\u2026)', 'Video card not detected'],
        ],
      },
      { type: 'heading', text: '2. Systematic Hardware Fault Isolation' },
      {
        type: 'steps',
        items: [
          'Step 1 \u2014 Establish a baseline: Document last known working state. What changed?',
          'Step 2 \u2014 Check PSU: Test with a PSU tester or swap a known-good unit. A dead PSU is the #1 "no power" culprit.',
          'Step 3 \u2014 Minimal boot config: Remove all non-essential hardware (GPU, extra RAM, HDDs). Boot with CPU + 1 DIMM only.',
          'Step 4 \u2014 Interpret POST codes: Use the onboard diagnostic LED or LCD POST code reader if available.',
          'Step 5 \u2014 Reseat all components: RAM, GPU, CPU cooler retention bracket.',
          'Step 6 \u2014 CMOS reset: Clear NVRAM by removing CR2032 battery for 30 seconds, or use the CLR_CMOS jumper.',
          'Step 7 \u2014 Component swap: Swap GPU, RAM sticks one at a time using known-good spares to isolate the fault.',
          'Step 8 \u2014 Document and escalate: If the motherboard is suspected faulty, escalate with component swap log.',
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
        text: 'PBQ strategy: Always work OSI bottom-up (Physical \u2192 Data Link \u2192 Network \u2192 Application). The exam rewards methodical escalation. Skipping steps = wrong answer.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // TRACK B — CompTIA A+ Core 2 (220-1202)
  // ─────────────────────────────────────────────────────────

  'core2-os/cli-runbook': {
    title: 'Essential CLI Command Runbook \u2014 Windows & Linux',
    trackLabel: 'CompTIA A+ Core 2 (220-1202) \u2014 Domain 1.0 Operating Systems',
    contributor: 'Jamin Ware',
    contributorRole: 'Reference Author',
    cohort: '2026-RTT-23',
    tags: ['CLI', 'commands', 'Windows', 'Linux', 'PowerShell', 'terminal', 'quick-reference'],
    studyCategory: '1.2 Command-Line Tools',
    content: [
      {
        type: 'intro',
        text: 'This command-line runbook covers every CLI tool tested on CompTIA A+ Core 2 (220-1202). Organized by operating system with real-world usage scenarios, syntax patterns, and critical flags. These commands appear in both multiple-choice questions and hands-on PBQ simulations.',
      },
      { type: 'heading', text: '1. Windows Network Diagnostics' },
      {
        type: 'table',
        headers: ['Command', 'Purpose', 'Key Flags', 'Exam Use Case'],
        rows: [
          ['ipconfig', 'View/manage IP configuration', '/all /release /renew /flushdns', 'Verify adapter settings, reset DHCP lease'],
          ['ping', 'Test connectivity to a host', '-t (continuous) -n (count)', 'Verify host reachability, test DNS resolution'],
          ['tracert', 'Trace route to destination', '-d (no DNS lookup)', 'Identify where packets are being dropped'],
          ['nslookup', 'Query DNS records', 'server <dns-ip>, set type=MX', 'Verify DNS resolution, check specific records'],
          ['netstat', 'Show active connections', '-a -n -o -b', 'Find which process is using a port'],
          ['pathping', 'Combines ping + tracert', 'No critical flags', 'Long-running latency analysis per hop'],
          ['nbtstat', 'NetBIOS over TCP/IP stats', '-n (local names) -R (purge)', 'Troubleshoot Windows name resolution'],
        ],
      },
      { type: 'heading', text: '2. Windows System Repair & Management' },
      {
        type: 'code',
        lang: 'cmd',
        code: `:: \u2500\u2500 SYSTEM FILE CHECKER (SFC) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
:: Must run AFTER DISM. Repairs individual Windows system files.
sfc /scannow
:: Output: "found corrupt files and successfully repaired them"

:: \u2500\u2500 DISM (Deployment Image Servicing) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
:: Repairs the Windows component store. Run BEFORE sfc.
DISM /Online /Cleanup-Image /CheckHealth     :: Quick status check
DISM /Online /Cleanup-Image /ScanHealth      :: Deep scan (slower)
DISM /Online /Cleanup-Image /RestoreHealth   :: Repair from Windows Update

:: \u2500\u2500 CHKDSK (Check Disk) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
chkdsk C: /f /r /x
:: /f = fix errors, /r = recover readable info, /x = dismount first

:: \u2500\u2500 GPUPDATE (Group Policy) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
gpupdate /force          :: Force immediate policy refresh
gpresult /R              :: Show applied policies for current user

:: \u2500\u2500 SHUTDOWN & RESTART \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
shutdown /s /t 0         :: Immediate shutdown
shutdown /r /t 0         :: Immediate restart
shutdown /r /o           :: Restart to Advanced Boot Options`,
      },
      {
        type: 'warning',
        text: 'CRITICAL EXAM RULE: Always run DISM /RestoreHealth BEFORE sfc /scannow. SFC relies on the component store to repair files \u2014 if the store is corrupted, SFC will silently use bad data. This ordering question appears on virtually every Core 2 exam.',
      },
      { type: 'heading', text: '3. Windows Disk & Partition Management' },
      {
        type: 'table',
        headers: ['Command', 'Purpose', 'Common Usage'],
        rows: [
          ['diskpart', 'Interactive disk partition manager', 'list disk \u2192 select disk \u2192 clean \u2192 create partition primary'],
          ['format', 'Format a volume', 'format F: /FS:NTFS /Q (quick format)'],
          ['convert', 'Convert disk type', 'convert G: /FS:NTFS (FAT32 \u2192 NTFS, one-way)'],
          ['defrag', 'Defragment HDD', 'defrag C: /O (optimize \u2014 SSD trim or HDD defrag)'],
          ['robocopy', 'Robust file copy', 'robocopy src dest /MIR /MT:8 (mirror, 8 threads)'],
          ['xcopy', 'Extended copy', 'xcopy src dest /E /H /K (subdirs, hidden, attributes)'],
        ],
      },
      { type: 'heading', text: '4. Linux Essential Commands' },
      {
        type: 'table',
        headers: ['Command', 'Purpose', 'Key Flags / Examples'],
        rows: [
          ['ls', 'List directory contents', '-la (all, long format), -lh (human-readable sizes)'],
          ['cd', 'Change directory', 'cd ~ (home), cd .. (parent), cd / (root)'],
          ['pwd', 'Print working directory', 'Shows absolute path of current location'],
          ['cp', 'Copy files/directories', '-r (recursive for dirs), -p (preserve attributes)'],
          ['mv', 'Move or rename', 'mv old.txt new.txt (rename), mv file /dest/ (move)'],
          ['rm', 'Remove files/directories', '-r (recursive), -f (force), -i (interactive confirm)'],
          ['mkdir', 'Create directory', '-p (create parent dirs if needed)'],
          ['chmod', 'Change permissions', 'chmod 755 file (rwxr-xr-x), chmod u+x script.sh'],
          ['chown', 'Change ownership', 'chown user:group file, -R for recursive'],
          ['grep', 'Search text patterns', '-r (recursive), -i (case-insensitive), -n (line numbers)'],
          ['find', 'Find files by criteria', 'find / -name "*.log" -mtime -7 (logs modified in 7 days)'],
          ['cat', 'Display file contents', 'cat file.txt, cat file1 file2 > combined.txt'],
          ['nano / vi', 'Text editors', 'nano = beginner-friendly, vi = modal (exam favorite)'],
        ],
      },
      { type: 'heading', text: '5. Linux System Administration' },
      {
        type: 'code',
        lang: 'bash',
        code: `# \u2500\u2500 SERVICE MANAGEMENT (systemd) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
sudo systemctl start nginx        # Start a service
sudo systemctl stop nginx         # Stop a service
sudo systemctl restart nginx      # Restart (stop + start)
sudo systemctl enable nginx       # Auto-start at boot
sudo systemctl status nginx       # Check service health

# \u2500\u2500 PACKAGE MANAGEMENT \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
# Debian/Ubuntu (apt):
sudo apt update && sudo apt upgrade -y
sudo apt install <package>
sudo apt remove <package>

# Red Hat/CentOS (dnf/yum):
sudo dnf update
sudo dnf install <package>
sudo dnf remove <package>

# \u2500\u2500 USER & PERMISSION MANAGEMENT \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
sudo useradd -m -s /bin/bash newuser    # Create user with home dir
sudo passwd newuser                      # Set password
sudo usermod -aG sudo newuser            # Add to sudo group
sudo userdel -r olduser                  # Delete user + home dir

# \u2500\u2500 NETWORK DIAGNOSTICS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
ip addr show                    # View IP configuration (replaces ifconfig)
ip route show                   # View routing table
ss -tulnp                       # Show listening ports (replaces netstat)
dig google.com                  # DNS lookup (detailed)
curl -I https://example.com     # Test HTTP response headers`,
      },
      { type: 'heading', text: '6. Linux Permissions Reference' },
      {
        type: 'table',
        headers: ['Numeric', 'Symbolic', 'Meaning', 'Use Case'],
        rows: [
          ['7', 'rwx', 'Read + Write + Execute', 'Owner of scripts, binaries'],
          ['6', 'rw-', 'Read + Write', 'Owner of data files'],
          ['5', 'r-x', 'Read + Execute', 'Group access to scripts'],
          ['4', 'r--', 'Read only', 'Public config files'],
          ['0', '---', 'No access', 'Deny all to others'],
          ['755', 'rwxr-xr-x', 'Owner full, others read+exec', 'Standard for executables'],
          ['644', 'rw-r--r--', 'Owner read/write, others read', 'Standard for data files'],
          ['700', 'rwx------', 'Owner only', 'Private scripts, SSH keys'],
        ],
      },
      {
        type: 'tip',
        text: 'Exam shortcut for chmod: Read=4, Write=2, Execute=1. Add them up for each position (Owner-Group-Others). "chmod 754" = Owner(rwx=7), Group(r-x=5), Others(r--=4). PBQ simulations require setting exact permissions.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // TRACK C — Advanced Healthcare IT
  // ─────────────────────────────────────────────────────────

  'healthcare-ehr': {
    title: 'HL7 Messaging Schemas & Epic/Cerner EHR Integration Blueprints',
    trackLabel: 'Advanced Healthcare IT \u2014 EHR Architecture',
    contributor: 'Jamin Ware',
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
          ['Lab Interface', 'Epic Bridges \u2192 LIS', 'Cerner PathNet \u2192 LIS', 'Bidirectional lab orders/results'],
          ['ADT Feed', 'Epic ADT (A01/A08/A03)', 'Cerner Registration (A01/A08)', 'Patient admit/discharge/transfer events'],
          ['FHIR API Layer', 'Epic FHIR R4', 'Cerner SMART on FHIR', 'Modern REST access for third-party apps'],
        ],
      },
      { type: 'heading', text: '3. FHIR R4 REST API Patterns' },
      {
        type: 'code',
        lang: 'bash',
        code: `# Epic FHIR R4 \u2014 Get patient by MRN
GET https://fhir.epic.org/interconnect-fhir-oauth/api/FHIR/R4/Patient?identifier=MR-789456
Authorization: Bearer <SMART_token>
Accept: application/fhir+json

# Cerner FHIR \u2014 Search observations by patient + code
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

  // ─────────────────────────────────────────────────────────
  // Sub-page fallbacks (keep previous ones working)
  // ─────────────────────────────────────────────────────────

  'healthcare-ehr/integration': {
    title: 'HL7 Messaging Schemas & EHR Integration Blueprints',
    trackLabel: 'Advanced Healthcare IT \u2014 EHR Architecture',
    contributor: 'Jamin Ware',
    contributorRole: 'HealthIT Specialist',
    cohort: '2026-RTT-23',
    tags: ['EHR', 'HL7', 'integration'],
    content: [
      { type: 'intro', text: 'Deep-dive into HL7 v2 messaging and FHIR REST API patterns for EHR integration.' },
    ],
  },

  'healthcare-clinical/cpoe': {
    title: 'CPOE Optimization & Order Set Workflows',
    trackLabel: 'Advanced Healthcare IT \u2014 Clinical Workflows',
    contributor: 'Jamin Ware',
    contributorRole: 'HealthIT Specialist',
    cohort: '2026-RTT-23',
    tags: ['CPOE', 'clinical', 'order-sets'],
    content: [
      { type: 'intro', text: 'CPOE order set optimization and interface error handling for clinical IT teams.' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // STUDY TIPS — Overview pages (re-routed to Core 1)
  // ─────────────────────────────────────────────────────────

  'study-tips/core1-overview': {
    title: 'CompTIA A+ Core 1 (220-1201) \u2014 Complete Study Guide Overview',
    trackLabel: 'CompTIA A+ Core 1 \u2014 Study Guide Overview',
    contributor: 'Cohort Lead',
    contributorRole: 'Core 1 Expert',
    cohort: '2026-RTT-23',
    tags: ['study-tips', 'core1', 'overview', 'CompTIA'],
    content: [
      { type: 'intro', text: 'Your master index for CompTIA A+ Core 1 (220-1201). This overview maps every domain to its highest-yield study resources and PBQ simulation guides in this knowledge base.' },
      { type: 'heading', text: 'Domain Weight Distribution' },
      { type: 'table', headers: ['Domain', 'Topic', 'Exam Weight'], rows: [
        ['1.0', 'Mobile Devices', '15%'],
        ['2.0', 'Networking', '20%'],
        ['3.0', 'Hardware', '25%'],
        ['4.0', 'Virtualization & Cloud', '11%'],
        ['5.0', 'Hardware & Network Troubleshooting', '29%'],
      ]},
      { type: 'tip', text: 'Domain 5.0 is the highest-weighted domain at 29%. Prioritize motherboard troubleshooting PBQs and the 8-step diagnostic methodology. Domain 3.0 Hardware at 25% is second \u2014 focus on DDR generations, PCIe lanes, and form factors.' },
      { type: 'heading', text: 'Critical Study Priorities' },
      { type: 'steps', items: [
        'Domain 5.0: Master POST beep codes (AMI, Award, Phoenix) \u2014 they appear in every PBQ simulation.',
        'Domain 2.0: Memorize port numbers cold \u2014 20/21 FTP, 22 SSH, 53 DNS, 80/443 HTTP/HTTPS, 3389 RDP.',
        'Domain 3.0: Know every DDR generation (3/4/5) voltage, speed, and notch position.',
        'Domain 1.0: Understand MDM enrollment types (DEP/ADE vs. User Enrollment) and remote wipe vs. selective wipe.',
        'Domain 4.0: Type 1 vs. Type 2 hypervisors; IaaS/PaaS/SaaS service model distinctions.',
      ]},
      { type: 'warning', text: 'The 220-1201 exam contains PBQ (Performance-Based Questions) that are drag-and-drop simulations, not multiple choice. You cannot skip them \u2014 they are scored at the beginning of the exam. Practice PBQs weekly.' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // PBQ SIMULATION PROMPTS (re-routed to Core 1 Networking)
  // ─────────────────────────────────────────────────────────

  'core1-networking/pbq-prompts': {
    title: 'Core 1 PBQ Simulation Prompts for Canvas Class AI',
    trackLabel: 'CompTIA A+ Core 1 \u2014 PBQ Simulations',
    contributor: 'Cohort Lead',
    contributorRole: 'AI Prompt Engineer',
    cohort: '2026-RTT-23',
    tags: ['prompts', 'PBQ', 'AI', 'core1', 'simulation', 'Canvas'],
    content: [
      { type: 'intro', text: 'Ready-to-use prompt frameworks engineered for Canvas Class AI to generate realistic Performance-Based Question (PBQ) simulations for CompTIA A+ Core 1. Copy these prompts directly into the AI interface.' },
      { type: 'heading', text: 'Motherboard Troubleshooting PBQ Simulator' },
      { type: 'code', lang: 'text', code: `PROMPT: Canvas Class AI \u2014 Motherboard Troubleshooting PBQ

You are a CompTIA A+ 220-1201 exam simulator. Generate a realistic
Performance-Based Question in the following format:

SCENARIO: A technician powers on a desktop PC. The system fails to
POST. The CPU fan spins for 3 seconds then stops. No beep codes are
heard. The front panel LED shows power for 1 second then turns off.

TASK: Drag the correct diagnostic steps from the left column to the
"Correct Order" box on the right, in the exact sequence a certified
technician should follow:

Available Steps:
[ ] Check PSU output voltages with multimeter
[ ] Reseat RAM in slots A2/B2 for dual-channel
[ ] Clear CMOS via jumper or battery removal
[ ] Test with known-good PSU
[ ] Verify CPU cooler contact and thermal paste
[ ] Check 24-pin and EPS 8-pin power connections
[ ] Inspect for bent CPU socket pins

After the user arranges the steps, provide:
1. The correct order with explanation
2. Which step most technicians miss and why
3. What the symptom most likely indicates` },
      { type: 'heading', text: 'Network Configuration PBQ Prompt' },
      { type: 'code', lang: 'text', code: `PROMPT: Canvas Class AI \u2014 Network Subnetting PBQ

Generate a subnetting Performance-Based Question:

SCENARIO: You are configuring a new office network at a medical clinic.
The clinic has been assigned the 192.168.10.0/26 network.

TASKS:
1. Calculate and fill in the subnet table:
   - Network Address: ___
   - First Usable Host: ___
   - Last Usable Host: ___
   - Broadcast Address: ___
   - Total Usable Hosts: ___
   - Subnet Mask: ___

2. Identify which of these IPs are VALID hosts in this subnet:
   [ ] 192.168.10.0    [ ] 192.168.10.45
   [ ] 192.168.10.63   [ ] 192.168.10.60
   [ ] 192.168.10.64

After user submits, show full solution with the "magic number" method
and explain why each answer is correct or incorrect.` },
      { type: 'tip', text: 'Canvas Class AI works best with explicit output format instructions. Always specify: the scenario, the task format, and what the AI should do AFTER the user responds. This creates a genuine interactive drill experience.' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // QUICK REFERENCES (re-routed to Core 1)
  // ─────────────────────────────────────────────────────────

  'study-tips/acronyms': {
    title: 'Healthcare IT & CompTIA Acronym Master Directory',
    trackLabel: 'CompTIA A+ Core 1 \u2014 Acronym Reference',
    contributor: 'Cohort Lead',
    contributorRole: 'Reference Author',
    cohort: '2026-RTT-23',
    tags: ['acronyms', 'healthcare-IT', 'CompTIA', 'HIPAA', 'networking', 'quick-reference'],
    content: [
      {
        type: 'intro',
        text: 'This master acronym directory covers every abbreviation tested on CompTIA A+ (Core 1 & Core 2) plus Healthcare IT certifications. Organized by domain with definitions and context. Bookmark this page \u2014 acronym questions appear in every section of both exams.',
      },
      { type: 'heading', text: '1. Networking & Protocols (Core 1 Domain 2.0)' },
      {
        type: 'table',
        headers: ['Acronym', 'Full Term', 'Definition / Context'],
        rows: [
          ['TCP', 'Transmission Control Protocol', 'Connection-oriented, reliable delivery with 3-way handshake'],
          ['UDP', 'User Datagram Protocol', 'Connectionless, best-effort delivery \u2014 used for DNS, VoIP, streaming'],
          ['IP', 'Internet Protocol', 'Layer 3 addressing and routing (IPv4 = 32-bit, IPv6 = 128-bit)'],
          ['DNS', 'Domain Name System', 'Resolves hostnames to IP addresses (Port 53)'],
          ['DHCP', 'Dynamic Host Configuration Protocol', 'Auto-assigns IP, subnet, gateway, DNS to clients (Ports 67/68)'],
          ['NAT', 'Network Address Translation', 'Maps private IPs to public IPs for internet access'],
          ['VLAN', 'Virtual Local Area Network', 'Logical network segmentation within a physical switch'],
          ['VPN', 'Virtual Private Network', 'Encrypted tunnel over public network for secure remote access'],
          ['SSID', 'Service Set Identifier', 'The broadcast name of a wireless network'],
          ['MAC', 'Media Access Control', 'Layer 2 hardware address (48-bit, e.g., AA:BB:CC:DD:EE:FF)'],
          ['ARP', 'Address Resolution Protocol', 'Maps IP addresses to MAC addresses on a local subnet'],
          ['ICMP', 'Internet Control Message Protocol', 'Used by ping and traceroute for connectivity testing'],
          ['SNMP', 'Simple Network Management Protocol', 'Monitor and manage network devices (Port 161/162)'],
          ['NTP', 'Network Time Protocol', 'Synchronizes clocks across network devices (Port 123)'],
          ['STP', 'Spanning Tree Protocol', 'Prevents switching loops in redundant L2 topologies'],
        ],
      },
      { type: 'heading', text: '2. Security & Encryption (Core 2 Domain 2.0)' },
      {
        type: 'table',
        headers: ['Acronym', 'Full Term', 'Definition / Context'],
        rows: [
          ['TLS', 'Transport Layer Security', 'Encrypts data in transit (HTTPS = HTTP + TLS). Replaces SSL.'],
          ['SSL', 'Secure Sockets Layer', 'DEPRECATED predecessor to TLS \u2014 never use SSL 2.0/3.0'],
          ['AES', 'Advanced Encryption Standard', 'Symmetric encryption \u2014 128/192/256-bit. Gold standard for data at rest.'],
          ['RSA', 'Rivest-Shamir-Adleman', 'Asymmetric encryption \u2014 public/private key pair for key exchange'],
          ['MFA', 'Multi-Factor Authentication', 'Requires 2+ factors: something you know/have/are'],
          ['2FA', 'Two-Factor Authentication', 'Subset of MFA using exactly two factors'],
          ['PKI', 'Public Key Infrastructure', 'Framework for managing digital certificates and CAs'],
          ['CA', 'Certificate Authority', 'Trusted entity that issues and signs digital certificates'],
          ['ACL', 'Access Control List', 'Ordered rules on routers/firewalls defining allow/deny traffic'],
          ['IDS', 'Intrusion Detection System', 'Monitors traffic and alerts on suspicious patterns (passive)'],
          ['IPS', 'Intrusion Prevention System', 'Monitors AND blocks malicious traffic (active)'],
          ['TPM', 'Trusted Platform Module', 'Hardware security chip for encryption keys \u2014 required for Win 11'],
          ['BitLocker', 'BitLocker Drive Encryption', 'Windows full-disk encryption using TPM + PIN/key'],
          ['EFS', 'Encrypting File System', 'Windows per-file/folder encryption using user certificates'],
          ['UAC', 'User Account Control', 'Windows elevation prompt preventing unauthorized admin actions'],
        ],
      },
      { type: 'heading', text: '3. Hardware & Storage (Core 1 Domain 3.0)' },
      {
        type: 'table',
        headers: ['Acronym', 'Full Term', 'Definition / Context'],
        rows: [
          ['RAM', 'Random Access Memory', 'Volatile working memory \u2014 DDR4/DDR5 in modern systems'],
          ['ROM', 'Read-Only Memory', 'Non-volatile memory storing firmware (BIOS/UEFI)'],
          ['NVMe', 'Non-Volatile Memory Express', 'High-speed storage protocol over PCIe (replaces SATA for SSDs)'],
          ['SATA', 'Serial Advanced Technology Attachment', 'Storage interface \u2014 6 Gb/s max (SATA III)'],
          ['PCIe', 'Peripheral Component Interconnect Express', 'High-speed serial expansion bus for GPU, NVMe, NICs'],
          ['BIOS', 'Basic Input/Output System', 'Legacy firmware interface \u2014 being replaced by UEFI'],
          ['UEFI', 'Unified Extensible Firmware Interface', 'Modern firmware with GUI, Secure Boot, GPT support'],
          ['POST', 'Power-On Self-Test', 'Hardware diagnostic routine run before OS boot'],
          ['GPU', 'Graphics Processing Unit', 'Dedicated video processing \u2014 PCIe x16 slot'],
          ['PSU', 'Power Supply Unit', 'Converts AC to DC \u2014 provides 3.3V, 5V, 12V rails'],
          ['RAID', 'Redundant Array of Independent Disks', '0=stripe, 1=mirror, 5=parity, 10=stripe+mirror'],
          ['ESD', 'Electrostatic Discharge', 'Static electricity that can destroy components'],
          ['DIMM', 'Dual Inline Memory Module', 'Standard desktop RAM form factor (288-pin DDR4)'],
          ['SO-DIMM', 'Small Outline DIMM', 'Laptop RAM form factor (260-pin DDR4)'],
        ],
      },
      { type: 'heading', text: '4. Healthcare IT & HIPAA' },
      {
        type: 'table',
        headers: ['Acronym', 'Full Term', 'Definition / Context'],
        rows: [
          ['HIPAA', 'Health Insurance Portability and Accountability Act', 'Federal law protecting patient health information'],
          ['PHI', 'Protected Health Information', 'Any individually identifiable health data (18 identifiers)'],
          ['ePHI', 'Electronic Protected Health Information', 'PHI stored or transmitted electronically'],
          ['EHR', 'Electronic Health Record', 'Digital patient chart (Epic, Cerner, MEDITECH)'],
          ['EMR', 'Electronic Medical Record', 'Single-practice digital record (subset of EHR)'],
          ['HL7', 'Health Level Seven', 'Messaging standard for healthcare data exchange'],
          ['FHIR', 'Fast Healthcare Interoperability Resources', 'Modern REST API standard for health data (HL7 FHIR R4)'],
          ['CPOE', 'Computerized Physician Order Entry', 'Electronic system for entering medication/lab orders'],
          ['LIS', 'Laboratory Information System', 'Manages lab test orders, results, and reporting'],
          ['RIS', 'Radiology Information System', 'Manages imaging orders and radiology workflows'],
          ['PACS', 'Picture Archiving and Communication System', 'Stores and retrieves medical images (DICOM format)'],
          ['DICOM', 'Digital Imaging and Communications in Medicine', 'Standard format for medical imaging files'],
          ['ADT', 'Admit-Discharge-Transfer', 'HL7 message type for patient movement tracking'],
          ['BAA', 'Business Associate Agreement', 'Required contract when sharing PHI with third parties'],
          ['CMS', 'Centers for Medicare & Medicaid Services', 'Federal agency overseeing healthcare compliance'],
          ['HITECH', 'Health Information Technology for Economic and Clinical Health Act', 'Extended HIPAA breach notification requirements'],
        ],
      },
      {
        type: 'warning',
        text: 'HIPAA defines 18 identifiers that make health data "PHI": name, DOB, SSN, MRN, phone, email, address, dates of service, photos, biometrics, device IDs, URLs, IP addresses, account numbers, certificate numbers, VINs, and any unique number or code. If even ONE identifier is present alongside health data, it is PHI.',
      },
      { type: 'heading', text: '5. Operating Systems & Virtualization (Core 1 Domain 4.0)' },
      {
        type: 'table',
        headers: ['Acronym', 'Full Term', 'Definition / Context'],
        rows: [
          ['OS', 'Operating System', 'Core software managing hardware/software resources'],
          ['VM', 'Virtual Machine', 'Software-emulated computer running inside a hypervisor'],
          ['VDI', 'Virtual Desktop Infrastructure', 'Centrally hosted virtual desktops delivered to thin clients'],
          ['IaaS', 'Infrastructure as a Service', 'Cloud-hosted VMs, storage, networking (AWS EC2, Azure VMs)'],
          ['PaaS', 'Platform as a Service', 'Cloud-hosted runtime + middleware (Azure App Service, Heroku)'],
          ['SaaS', 'Software as a Service', 'Cloud-hosted applications (Microsoft 365, Epic Hyperdrive)'],
          ['DaaS', 'Desktop as a Service', 'Cloud-hosted virtual desktops (Amazon WorkSpaces, Citrix)'],
          ['NTFS', 'New Technology File System', 'Windows default \u2014 supports permissions, encryption, journaling'],
          ['GPT', 'GUID Partition Table', 'Modern partition scheme \u2014 supports 128 partitions, 18 EB max disk'],
          ['MBR', 'Master Boot Record', 'Legacy partition scheme \u2014 4 primary partitions, 2 TB max disk'],
          ['CLI', 'Command-Line Interface', 'Text-based interface for executing system commands'],
          ['GUI', 'Graphical User Interface', 'Visual interface with windows, icons, menus, pointers'],
        ],
      },
      {
        type: 'tip',
        text: 'Exam trick: IaaS vs PaaS vs SaaS \u2014 "Who manages what?" IaaS: YOU manage OS and up. PaaS: YOU manage only code and data. SaaS: YOU manage nothing (just use it). The more the provider manages, the further right you are on the service spectrum.',
      },
      { type: 'heading', text: '6. Troubleshooting Tools & Utilities' },
      {
        type: 'table',
        headers: ['Acronym', 'Full Term', 'Definition / Context'],
        rows: [
          ['SFC', 'System File Checker', 'Windows tool to verify and repair system files (sfc /scannow)'],
          ['DISM', 'Deployment Image Servicing and Management', 'Repairs Windows component store (run BEFORE SFC)'],
          ['BSOD', 'Blue Screen of Death', 'Windows critical stop error \u2014 requires driver/hardware diagnosis'],
          ['WinRE', 'Windows Recovery Environment', 'Boot-time repair console for non-bootable systems'],
          ['PXE', 'Preboot Execution Environment', 'Network boot \u2014 pulls OS image from server via TFTP/HTTP'],
          ['RDP', 'Remote Desktop Protocol', 'Windows built-in remote access (Port 3389)'],
          ['MMC', 'Microsoft Management Console', 'Framework for snap-in admin tools (compmgmt.msc, etc.)'],
          ['MSCONFIG', 'Microsoft System Configuration', 'Boot options, service control, startup management'],
          ['KVM', 'Keyboard Video Mouse (switch)', 'Hardware switch for controlling multiple PCs from one console'],
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LEARNER EXPERIENCE & FAQs
  // ─────────────────────────────────────────────────────────

  'learner-experience/navigation': {
    title: 'Navigating the Hub: Search, Domains & Filtering',
    trackLabel: 'Learner Experience & FAQs \u2014 Onboarding',
    contributor: 'Jamin Ware',
    contributorRole: 'Core 1 Expert',
    cohort: '2026-RTT-23',
    tags: ['onboarding', 'navigation', 'faq'],
    isFeatured: true,
    date: '2026-07-02T12:00:00Z',
    content: [
      {
        type: 'intro',
        text: 'This guide walks you through the three primary ways to find content inside the Cohort Survival Guide: the global search bar, the domain-structured sidebar, and the resource-type filter tabs. Master these three patterns and you will never lose track of a study resource again.',
      },
      { type: 'heading', text: '1. Global Search (Ctrl + K)' },
      {
        type: 'steps',
        items: [
          'Press Ctrl + K (or Cmd + K on Mac) from any page to open the global search overlay.',
          'Start typing a keyword \u2014 results appear in real time as you type. Matches are pulled from article titles, tags, and content.',
          'Click a result to navigate directly to that article. Press Escape to close the search overlay without navigating.',
          'Pro tip: search by tag keywords like "ports", "HIPAA", or "subnetting" to surface all related resources across every domain.',
        ],
      },
      { type: 'heading', text: '2. The Sidebar \u2014 Domain Dashboard Structure' },
      {
        type: 'paragraph',
        text: 'The left-hand sidebar organizes every resource by CompTIA exam domain and healthcare track. Each collapsible section maps directly to an official exam objective area.',
      },
      {
        type: 'table',
        headers: ['Sidebar Section', 'What It Contains', 'When to Use'],
        rows: [
          ['CompTIA A+ Core 1 (220-1201)', 'Domains 1.0\u20135.0: Mobile, Networking, Hardware, Cloud, Troubleshooting', 'Primary study track \u2014 start here for exam prep'],
          ['CompTIA A+ Core 2 (220-1202)', 'Domains 1.0\u20134.0: OS, Security, Software Troubleshooting, SOPs', 'Second exam track \u2014 tackle after Core 1 foundations'],
          ['Advanced Healthcare IT', 'EHR Architecture, HIPAA Data Security, Clinical Workflows', 'Specialized modules for healthcare IT career prep'],
        ],
      },
      {
        type: 'tip',
        text: 'Each domain page has its own "Add Intel" button. If you submit a resource from within a domain page, the system automatically tags it to that domain \u2014 no manual categorization needed.',
      },
      { type: 'heading', text: '3. Resource-Type Filter Tabs' },
      {
        type: 'paragraph',
        text: 'Inside each domain dashboard, a filter tab bar lets you narrow down resources by type. This is especially useful when a domain has many contributions.',
      },
      {
        type: 'table',
        headers: ['Tab', 'Shows', 'Best For'],
        rows: [
          ['All', 'Every verified peer contribution (excluding open slots)', 'Browsing everything available in a domain'],
          ['Study Tips', 'Articles, study guides, and written tips', 'Reading detailed explanations and exam strategies'],
          ['Diagrams', 'Visual diagrams and annotated blueprints', 'Visual learners and quick reference during labs'],
          ['Prompt Playbook', 'Canvas Class AI prompt templates', 'Generating practice questions and PBQ simulations'],
          ['Quick References', 'Concise reference tables and resource links', 'Fast lookups during study sessions or labs'],
        ],
      },
      { type: 'heading', text: '4. Objective-Level Filtering' },
      {
        type: 'paragraph',
        text: 'Domain pages that map to CompTIA exam objectives also display an "Objectives" pill bar at the top. Click any specific objective (e.g., "3.1 \u2014 Troubleshoot common issues with motherboards") to filter the grid to only resources tagged for that exam objective.',
      },
      {
        type: 'warning',
        text: 'If you navigate to a domain and see only [OPEN SLOT] placeholders, it means no peers have submitted content for that area yet. Be the first \u2014 hit "Add Intel" and pioneer that module!',
      },
    ],
  },

  'learner-experience/adding-intel': {
    title: 'Adding Intel: How to Submit Your Field Notes',
    trackLabel: 'Learner Experience & FAQs \u2014 Onboarding',
    contributor: 'Jamin Ware',
    contributorRole: 'Core 1 Expert',
    cohort: '2026-RTT-23',
    tags: ['contribution', 'adding-intel', 'faq'],
    isFeatured: true,
    date: '2026-07-02T12:00:00Z',
    content: [
      {
        type: 'intro',
        text: 'Every member of the 2026-RTT-23 cohort can contribute resources to the knowledge base. This guide walks you through the submission process from clicking "Add Intel" to seeing your contribution appear on the Cohort Recognition Wall.',
      },
      { type: 'heading', text: '1. Opening the Submission Modal' },
      {
        type: 'steps',
        items: [
          'Click the "Add Intel" button. You will find it in the right sidebar on the Home page, or at the top-right of any domain dashboard page.',
          'The submission form opens as a modal overlay \u2014 you do not leave your current page.',
          'Choose your Submission Type first (Article, Diagram, Study Tip, Resource Link, or Prompt Playbook). The form adapts to your selection.',
        ],
      },
      { type: 'heading', text: '2. The Smart Author Name Autocomplete' },
      {
        type: 'paragraph',
        text: 'The "Full Name / Discord Handle" field includes a smart autocomplete feature. After your first contribution is approved and your name enters the system, it will appear in the dropdown for all future submissions.',
      },
      {
        type: 'steps',
        items: [
          'Begin typing your name \u2014 after 1 or more characters, a dropdown appears showing matching names already in the system.',
          'If your name appears in the dropdown, click it to auto-fill. This ensures consistent attribution across all your contributions.',
          'If this is your very first contribution and your name does not appear, simply type it in full. It will be available in the autocomplete for your next submission.',
          'The autocomplete is case-insensitive \u2014 typing "jam" will match "Jamin Ware" just as well as "Jam".',
        ],
      },
      {
        type: 'tip',
        text: 'Consistency matters! Always use the same name or handle for every submission. The Recognition Wall groups your contributions by exact name match. If you submit as "Jane S" once and "Jane Smith" next time, they will appear as two different contributors.',
      },
      { type: 'heading', text: '3. Filling Out the Form' },
      {
        type: 'table',
        headers: ['Field', 'Required?', 'Guidance'],
        rows: [
          ['Full Name / Discord Handle', 'Yes', 'Your display name on the Recognition Wall'],
          ['Submission Type', 'Yes', 'Determines how your resource is categorized and displayed'],
          ['Title', 'Yes', 'A clear, descriptive title (shown on cards and in search)'],
          ['Category / Domain', 'Yes', 'Which exam domain or track your resource belongs to'],
          ['Content / URL', 'Yes', 'The actual resource \u2014 markdown text, a diagram, or a link'],
          ['Tags', 'Optional', 'Comma-separated keywords to improve discoverability'],
        ],
      },
      { type: 'heading', text: '4. What Happens After You Submit' },
      {
        type: 'steps',
        items: [
          'Your submission enters the moderation queue. The Cohort Lead reviews it for quality and accuracy.',
          'Once approved, your contribution appears on its domain dashboard as a verified peer resource card.',
          'Your name and contribution count are automatically updated on the Cohort Recognition Wall.',
          'A success toast notification confirms your submission was received. You can submit multiple resources in a single session.',
        ],
      },
      { type: 'heading', text: '5. The Recognition Wall' },
      {
        type: 'paragraph',
        text: 'Navigate to the "Cohort Recognition" page (accessible from the sidebar) to see every contributor ranked by total contributions. Each contributor card shows their name, badge tier, submission count, and a list of their published resources. The more you contribute, the higher your badge tier climbs.',
      },
      {
        type: 'table',
        headers: ['Badge Tier', 'Threshold', 'Meaning'],
        rows: [
          ['Community Contributor', '1+ submissions', 'You have entered the arena'],
          ['Knowledge Pioneer', '3+ submissions', 'Consistent contributor with demonstrated expertise'],
          ['Cohort Architect', '6+ submissions', 'A pillar of the cohort knowledge base'],
        ],
      },
      {
        type: 'warning',
        text: 'Submissions that contain incorrect technical information, plagiarized content, or inappropriate material will be rejected during moderation. Always verify your facts before submitting \u2014 cite sources where possible.',
      },
    ],
  },

};

export default contentMap;

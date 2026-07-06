import Fuse from 'fuse.js';

export interface AutoCategoryResult {
  masterCategory: string;
  track: string;
  compObjective?: string;
  lxStage?: string;
  submissionType?: 'Diagram' | 'Prompt Playbook';
}

interface SearchableEntry {
  keyword: string;
  masterCategory: string;
  track: string;
  compObjective?: string;
  lxStage?: string;
}

interface LessonMapping {
  lessonNumber: string;
  masterCategory: string;
  track: string;
  compObjective?: string;
}

const LX_TRACK = 'Learner Experience & FAQs';

const MINIMUM_CONFIDENCE_SCORE = 2;

const RULE_DATA: {
  keywords: string[];
  lessonNumbers?: string[];
  masterCategory: string;
  track: string;
  compObjective?: string;
  lxStage?: string;
}[] = [
  {
    keywords: [
      'imposter syndrome', 'mental health', 'time management', 'give up',
      'hard time', 'falling behind', 'cant focus', 'no motivation',
      'feeling stuck', 'want to quit',
      'imposter', 'burnout', 'slump', 'motivation', 'stress', 'overwhelm',
      'exhaust', 'doubt', 'confidence', 'discipline', 'distract', 'drown',
      'struggle', 'tired', 'anxiety', 'behind',
    ],
    masterCategory: LX_TRACK,
    track: LX_TRACK,
    compObjective: 'The Mid-Program Slump',
    lxStage: 'slump',
  },
  {
    keywords: [
      'password reset', 'account setup', 'first week', 'getting started',
      'canvas', 'lms', 'onboarding', 'enrollment', 'orientation', 'login',
      'setup', 'access',
    ],
    masterCategory: LX_TRACK,
    track: LX_TRACK,
    compObjective: 'Onboarding Hurdles',
    lxStage: 'onboarding',
  },
  {
    keywords: [
      'job hunt', 'test day', 'cert prep', 'cover letter', 'exam prep',
      'test strategy', 'practice exam', 'passing score', 'test anxiety',
      'study plan', 'comptia prep',
      'resume', 'interview', 'exam', 'linkedin', 'salary', 'helpdesk',
      'certification', 'career', 'job',
    ],
    masterCategory: LX_TRACK,
    track: LX_TRACK,
    compObjective: 'Job Hunt Triage',
    lxStage: 'job',
  },
  {
    keywords: [
      'software install', 'wifi issue', 'hardware setup', 'not working',
      'wont load', 'wont start',
      'git', 'github', 'vscode', 'virtualbox', 'ide', 'vpn', 'monitor',
      'webcam', 'headset', 'peripheral', 'broken', 'error', 'crash',
      'bug', 'glitch', 'stuck', 'freeze',
    ],
    masterCategory: LX_TRACK,
    track: LX_TRACK,
    compObjective: 'Tech Solutions',
    lxStage: 'labs',
  },
  // === Core 1 Domain 1.0 (Mobile Devices) ===
  {
    keywords: ['laptop', 'docking station', 'port replicator', 'laptop battery', 'laptop keyboard', 'trackpad', 'mobile', 'smartphone', 'phone', 'tablet', 'mobile device', 'handheld', 'portable device', 'wearable', 'ipad', 'android', 'ios', 'gadget', 'on the go'],
    lessonNumbers: ['130'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 1.0 (Mobile Devices)',
    compObjective: '1.1 Laptop Hardware',
  },
  {
    keywords: ['mobile display', 'lcd', 'oled', 'digitizer', 'touchscreen', 'inverter', 'backlight'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 1.0 (Mobile Devices)',
    compObjective: '1.2 Mobile Displays',
  },
  {
    keywords: ['lightning', 'usb-c', 'micro usb', 'stylus', 'pogo pin', 'nfc payment', 'portable charger'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 1.0 (Mobile Devices)',
    compObjective: '1.3 Accessories & Ports',
  },
  {
    keywords: ['mobile hotspot', 'cellular', 'tethering', 'airplane mode', 'imei', 'sim card', 'esim', 'prl', 'mobile', 'smartphone', 'phone', 'tablet', 'portable'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 1.0 (Mobile Devices)',
    compObjective: '1.4 Network Connectivity',
  },
  // === Core 1 Domain 2.0 (Networking) ===
  {
    keywords: ['tcp', 'udp', 'port', 'protocol', 'dns', 'dhcp', 'ssh', 'ftp', 'rdp'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 2.0 (Networking)',
    compObjective: '2.1 Ports & Protocols',
  },
  {
    keywords: ['router', 'switch', 'firewall', 'gateway', 'patch panel', 'poe', 'hub'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 2.0 (Networking)',
    compObjective: '2.2 Network Equipment',
  },
  {
    keywords: ['wifi', 'wireless', '802.11', '802.11ac', '802.11n', '802.11ax', 'bluetooth', 'rfid', 'nfc'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 2.0 (Networking)',
    compObjective: '2.3 Wireless Protocols',
  },
  {
    keywords: ['dhcp server', 'dns server', 'proxy', 'vpn', 'vlan', 'nat'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 2.0 (Networking)',
    compObjective: '2.4 Network Services',
  },
  {
    keywords: ['ip address', 'subnet', 'ipv4', 'ipv6', 'mac address', 'cidr'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 2.0 (Networking)',
    compObjective: '2.5 IP Addressing',
  },
  {
    keywords: ['soho', 'home router', 'port forwarding', 'qos', 'ssid'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 2.0 (Networking)',
    compObjective: '2.6 SOHO Networks',
  },
  {
    keywords: ['ethernet', 'lan', 'wan', 'packet', 'osi', 'networking', 'network', 'internet', 'connectivity', 'connection', 'telecom', 'bandwidth', 'data transfer', 'topology', 'infrastructure'],
    lessonNumbers: ['133'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 2.0 (Networking)',
    compObjective: '2.7 Network Configs',
  },
  // === Core 1 Domain 3.0 (Hardware) ===
  {
    keywords: ['cable', 'connector', 'usb', 'hdmi', 'displayport', 'vga', 'dvi', 'thunderbolt', 'sata', 'adapter'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 3.0 (Hardware)',
    compObjective: '3.1 Cables & Connectors',
  },
  {
    keywords: ['ram', 'memory', 'dimm', 'sodimm', 'ddr', 'ddr4', 'ddr5', 'ecc'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 3.0 (Hardware)',
    compObjective: '3.2 RAM',
  },
  {
    keywords: ['storage', 'hdd', 'ssd', 'nvme', 'm.2', 'raid', 'flash drive'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 3.0 (Hardware)',
    compObjective: '3.3 Storage Devices',
  },
  {
    keywords: ['motherboard', 'cpu', 'processor', 'socket', 'chipset', 'pcie', 'bios', 'uefi', 'heatsink', 'cmos'],
    lessonNumbers: ['132'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 3.0 (Hardware)',
    compObjective: '3.4 Motherboards & CPUs',
  },
  {
    keywords: ['power supply', 'psu', 'wattage', 'atx', 'modular'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 3.0 (Hardware)',
    compObjective: '3.5 Power Supplies',
  },
  {
    keywords: ['custom pc', 'gaming pc', 'workstation', 'htpc', 'thin client', 'thick client', 'hardware', 'pc build', 'configuration', 'config', 'computer parts', 'components', 'device', 'equipment', 'peripheral', 'desktop', 'tower', 'form factor', 'computer'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 3.0 (Hardware)',
    compObjective: '3.6 Custom PC Configurations',
  },
  {
    keywords: ['printer', 'laser', 'inkjet', 'thermal', 'impact', 'spooler', '3d printer'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 3.0 (Hardware)',
    compObjective: '3.7 Printers',
  },
  // === Core 1 Domain 4.0 (Cloud) ===
  {
    keywords: ['cloud', 'iaas', 'paas', 'saas', 'aws', 'azure', 'cloud computing', 'public cloud', 'private cloud', 'hybrid cloud', 'as a service', 'web services', 'remote server', 'hosted', 'scalable', 'on demand', 'gcp', 'google cloud', 'serverless', 'multicloud'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 4.0 (Cloud)',
    compObjective: '4.1 Cloud Computing Concepts',
  },
  {
    keywords: ['virtual machine', 'virtualization', 'hypervisor', 'vmware', 'hyper-v', 'container', 'docker', 'vm', 'vdi', 'sandbox'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 4.0 (Cloud)',
    compObjective: '4.2 Client-Side Virtualization',
  },
  // === Core 1 Domain 5.0 (Troubleshooting) ===
  {
    keywords: ['troubleshooting methodology', 'identify the problem', 'theory of probable cause', 'plan of action', 'verify functionality', 'document findings', 'troubleshooting', 'troubleshoot', 'diagnose', 'repair', 'fix', 'resolve', 'debug', 'root cause', 'symptom', 'issue', 'malfunction', 'broken'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',
    compObjective: '5.1 Troubleshooting Methodology',
  },
  {
    keywords: ['blue screen', 'bsod', 'no post', 'beep code', 'boot failure', 'overheating', 'overheat', 'thermal paste'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',
    compObjective: '5.2 Motherboard/RAM/CPU Issues',
  },
  {
    keywords: ['disk failure', 'bad sector', 'chkdsk', 'slow boot', 'read write error', 'drive not recognized', 'clicking noise'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',
    compObjective: '5.3 Storage Issues',
  },
  {
    keywords: ['no display', 'black screen', 'artifact', 'dead pixel', 'flickering', 'gpu issue', 'resolution problem'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',
    compObjective: '5.4 Video/Display Issues',
  },
  {
    keywords: ['battery drain', 'frozen screen', 'swollen battery', 'no signal', 'overheating phone', 'gps issue'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',
    compObjective: '5.5 Mobile Device Issues',
  },
  {
    keywords: ['paper jam', 'print queue', 'faded print', 'streaks', 'spooler error', 'toner', 'drum'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',
    compObjective: '5.6 Printer Issues',
  },
  {
    keywords: ['no connectivity', 'intermittent', 'packet loss', 'high latency', 'limited connectivity', 'ip conflict'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',
    compObjective: '5.7 Network Issues',
  },
  // === Core 2 Domain 1.0 (Operating Systems) ===
  {
    keywords: ['windows home', 'windows pro', 'windows enterprise', 'windows edition', 'workgroup', 'domain join'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.1 Windows Editions',
  },
  {
    keywords: ['command line', 'cli', 'powershell', 'cmd', 'terminal', 'ipconfig', 'netstat', 'nslookup', 'ping', 'tracert', 'sfc'],
    lessonNumbers: ['134', '135'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.2 Command-Line Tools',
  },
  {
    keywords: ['cortana', 'task view', 'virtual desktop', 'action center', 'windows store', 'windows 10'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.3 Windows 10 Features',
  },
  {
    keywords: ['control panel', 'device manager', 'disk management', 'msconfig', 'services.msc', 'defragment', 'task manager'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.4 Control Panel Utilities',
  },
  {
    keywords: ['windows settings', 'display settings', 'network settings', 'personalization', 'privacy settings', 'update settings'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.5 Windows Settings',
  },
  {
    keywords: ['network share', 'mapped drive', 'net use', 'file sharing', 'windows networking'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.6 Windows Networking',
  },
  {
    keywords: ['msi', 'exe installer', 'app store', 'sideload', 'group policy', 'gpo'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.7 App Installation/Config',
  },
  {
    keywords: ['operating system', 'file system', 'ntfs', 'ext4', 'apfs', 'fat32', 'partition', 'os', 'platform', 'system software', 'sys admin', 'desktop environment', 'kernel', 'driver', 'system update'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.8 OS Types & Purposes',
  },
  {
    keywords: ['clean install', 'upgrade install', 'boot media', 'usb boot', 'pxe boot', 'unattended install', 'image deploy', 'boot'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.9 OS Installations/Upgrades',
  },
  {
    keywords: ['macos', 'mac', 'finder', 'time machine', 'spotlight', 'keychain', 'mission control'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.10 macOS Features/Tools',
  },
  {
    keywords: ['linux', 'bash', 'apt', 'yum', 'chmod', 'grep', 'sudo', 'nano', 'cron'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.11 Linux Features/Tools',
  },
  // === Core 2 Domain 2.0 (Security) ===
  {
    keywords: ['two-factor', 'mfa', 'authentication', 'biometric', 'smart card', 'token', 'access control list', 'security', 'cybersecurity', 'firewall', 'protection', 'defense', 'hardening', 'threat', 'attack', 'exploit', 'vulnerability', 'infosec', 'encryption'],
    lessonNumbers: ['136'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 2.0 (Security)',
    compObjective: '2.1 Security Measures',
  },
  {
    keywords: ['wpa', 'wpa2', 'wpa3', 'wep', 'tkip', 'aes', 'wireless security', 'war driving'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 2.0 (Security)',
    compObjective: '2.2 Wireless Security',
  },
  {
    keywords: ['malware', 'antivirus', 'ransomware', 'spyware', 'trojan', 'rootkit', 'worm', 'virus'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 2.0 (Security)',
    compObjective: '2.3 Malware Detection',
  },
  {
    keywords: ['social engineering', 'phishing', 'tailgating', 'shoulder surfing', 'dumpster diving', 'vishing', 'smishing'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 2.0 (Security)',
    compObjective: '2.4 Social Engineering',
  },
  {
    keywords: ['uac', 'bitlocker', 'efs', 'windows defender', 'firewall rule', 'group policy security'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 2.0 (Security)',
    compObjective: '2.5 Windows Security Settings',
  },
  {
    keywords: ['screen lock', 'password policy', 'login attempt', 'disable guest', 'usb lock', 'bios password'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 2.0 (Security)',
    compObjective: '2.6 Workstation Security',
  },
  {
    keywords: ['mdm', 'remote wipe', 'device encryption', 'byod', 'geofencing', 'mobile device security'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 2.0 (Security)',
    compObjective: '2.7 Mobile Device Security',
  },
  {
    keywords: ['data destruction', 'degauss', 'shred', 'low level format', 'secure erase', 'data sanitization'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 2.0 (Security)',
    compObjective: '2.8 Data Destruction',
  },
  {
    keywords: ['soho security', 'home firewall', 'change default password', 'disable ssid broadcast', 'mac filtering'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 2.0 (Security)',
    compObjective: '2.9 SOHO Network Security',
  },
  {
    keywords: ['browser security', 'popup blocker', 'certificate', 'https', 'private browsing', 'clear cache', 'extension security'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 2.0 (Security)',
    compObjective: '2.10 Browser Security',
  },
  // === Core 2 Domain 3.0 (Software Troubleshooting) ===
  {
    keywords: ['app crash', 'slow performance', 'startup repair', 'safe mode', 'update failure', 'system restore', 'windows', 'registry', 'software', 'application', 'program', 'install', 'uninstall', 'compatibility', 'patch', 'service pack', 'driver issue', 'performance'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 3.0 (Software Troubleshooting)',
    compObjective: '3.1 Windows OS Issues',
  },
  {
    keywords: ['browser redirect', 'pop up', 'rogue software', 'unauthorized access', 'security alert'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 3.0 (Software Troubleshooting)',
    compObjective: '3.2 PC Security Issues',
  },
  {
    keywords: ['malware removal', 'quarantine', 'remediate', 'enable system protection', 'scan'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 3.0 (Software Troubleshooting)',
    compObjective: '3.3 Malware Removal Best Practices',
  },
  {
    keywords: ['app not loading', 'force stop', 'clear app cache', 'os update issue', 'factory reset'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 3.0 (Software Troubleshooting)',
    compObjective: '3.4 Mobile OS/App Issues',
  },
  {
    keywords: ['leaked data', 'unauthorized root', 'jailbreak', 'unintended connection', 'developer mode'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 3.0 (Software Troubleshooting)',
    compObjective: '3.5 Mobile Security Issues',
  },
  // === Core 2 Domain 4.0 (Operational Procedures) ===
  {
    keywords: ['documentation', 'ticketing', 'knowledge base', 'asset management', 'inventory', 'network diagram', 'operations', 'procedure', 'operational', 'it ops', 'best practice', 'policy', 'workflow', 'sop', 'standard operating procedure', 'itil'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
    compObjective: '4.1 IT Documentation',
  },
  {
    keywords: ['change management', 'change board', 'rollback plan', 'approval process', 'risk analysis'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
    compObjective: '4.2 Change Management',
  },
  {
    keywords: ['disaster recovery', 'backup', 'restore', 'redundancy', 'failover', 'business continuity'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
    compObjective: '4.3 Disaster Recovery',
  },
  {
    keywords: ['safety', 'esd', 'anti static', 'lifting', 'electrical safety', 'msds'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
    compObjective: '4.4 Safety Procedures',
  },
  {
    keywords: ['recycling', 'proper disposal', 'battery disposal', 'toner disposal', 'e-waste', 'green it'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
    compObjective: '4.5 Environmental Impacts',
  },
  {
    keywords: ['pii', 'gdpr', 'license', 'open source', 'eula', 'drm', 'copyright'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
    compObjective: '4.6 Privacy & Licensing',
  },
  {
    keywords: ['professionalism', 'communication', 'customer service', 'active listening', 'escalation'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
    compObjective: '4.7 Professionalism & Comms',
  },
  {
    keywords: ['scripting', 'script', 'batch file', 'powershell script', 'python', 'javascript', 'automation'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
    compObjective: '4.8 Scripting Basics',
  },
  {
    keywords: ['remote desktop', 'vnc', 'ssh remote', 'teamviewer', 'vpn remote', 'remote access'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
    compObjective: '4.9 Remote Access Tech',
  },
  // === Healthcare IT: EHR Architecture ===
  {
    keywords: ['ehr', 'emr', 'epic', 'cerner', 'electronic health record', 'electronic medical record', 'patient portal', 'ehr sandbox', 'health record', 'medical record', 'charting', 'clinical system', 'health information system', 'his', 'meditech', 'allscripts'],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT EHR Architecture',
    compObjective: 'EHR Integrations & Sandboxes',
  },
  {
    keywords: ['fhir', 'hl7', 'interoperability', 'health information exchange', 'hie', 'ccda', 'api integration'],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT EHR Architecture',
    compObjective: 'Data Interoperability (HL7/FHIR)',
  },
  {
    keywords: ['clinical database', 'data warehouse', 'sql health', 'data migration', 'data integrity', 'health record database'],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT EHR Architecture',
    compObjective: 'Database Management',
  },
  {
    keywords: ['downtime', 'system outage', 'paper charting', 'backup procedure', 'disaster recovery ehr'],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT EHR Architecture',
    compObjective: 'System Downtime Procedures',
  },
  // === Healthcare IT: HIPAA Data Security ===
  {
    keywords: ['phi', 'protected health information', 'hipaa', 'minimum necessary', 'de-identification', 'privacy', 'health data security', 'patient privacy', 'data protection', 'confidentiality', 'regulation', 'hipaa compliance', 'breach', 'hitech'],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT HIPAA Data Security',
    compObjective: 'PHI Protection Strategies',
  },
  {
    keywords: ['access control', 'audit', 'audit trail', 'role based access', 'authentication health', 'baa'],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT HIPAA Data Security',
    compObjective: 'Access Controls & Auditing',
  },
  {
    keywords: ['cybersecurity', 'vulnerability', 'threat', 'data breach', 'breach notification', 'penetration test', 'ids', 'ips'],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT HIPAA Data Security',
    compObjective: 'Threat Detection & Response',
  },
  {
    keywords: ['compliance', 'risk assessment', 'security rule', 'privacy rule', 'safeguard', 'security policy', 'nist'],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT HIPAA Data Security',
    compObjective: 'Compliance Documentation',
  },
  // === Healthcare IT: Clinical Workflows ===
  {
    keywords: ['patient', 'admission', 'discharge', 'nursing', 'clinical workflow', 'patient flow', 'clinical', 'healthcare', 'health it', 'hospital', 'clinic', 'medical', 'doctor', 'provider', 'care coordination', 'treatment', 'diagnosis'],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT Clinical Workflows',
    compObjective: 'Patient Admission to Discharge',
  },
  {
    keywords: ['cpoe', 'lab order', 'lab result', 'medication order', 'pharmacy', 'medication'],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT Clinical Workflows',
    compObjective: 'Order Entry Systems (CPOE)',
  },
  {
    keywords: ['telehealth', 'telemedicine', 'virtual visit', 'remote patient', 'video consult', 'remote monitoring'],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT Clinical Workflows',
    compObjective: 'Telehealth Integrations',
  },
  {
    keywords: ['medical iot', 'medical device', 'pacs', 'dicom', 'imaging', 'radiology', 'biomedical', 'infusion pump'],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT Clinical Workflows',
    compObjective: 'Medical IoT Troubleshooting',
  },
];

const SEARCHABLE_ENTRIES: SearchableEntry[] = RULE_DATA.flatMap((rule) =>
  rule.keywords.map((keyword) => ({
    keyword,
    masterCategory: rule.masterCategory,
    track: rule.track,
    compObjective: rule.compObjective,
    lxStage: rule.lxStage,
  })),
);

const LESSON_MAPPINGS: LessonMapping[] = RULE_DATA
  .filter((r) => r.lessonNumbers)
  .flatMap((r) =>
    r.lessonNumbers!.map((ln) => ({
      lessonNumber: ln,
      masterCategory: r.masterCategory,
      track: r.track,
      compObjective: r.compObjective,
    })),
  );

const DIAGRAM_KEYWORDS = ['architecture map', 'mermaid', 'flowchart', 'topology', 'diagram', 'blueprint'];
const PROMPT_KEYWORDS = ['canvas class ai', 'system message', 'prompt', 'llm', 'chatgpt', 'ai role'];

export function autoCategorizeSubmission(
  title: string,
  content: string,
): AutoCategoryResult | null {
  if (!title?.trim() && !content?.trim()) return null;

  const combined = `${title} ${content}`.toLowerCase();

  let submissionType: 'Diagram' | 'Prompt Playbook' | undefined;
  if (DIAGRAM_KEYWORDS.some((kw) => combined.includes(kw))) {
    submissionType = 'Diagram';
  } else if (PROMPT_KEYWORDS.some((kw) => combined.includes(kw))) {
    submissionType = 'Prompt Playbook';
  }

  // Lesson number exact-match pass (no fuzzy)
  for (const mapping of LESSON_MAPPINGS) {
    if (combined.includes(mapping.lessonNumber)) {
      return {
        masterCategory: mapping.masterCategory,
        track: mapping.track,
        compObjective: mapping.compObjective,
        submissionType,
      };
    }
  }

  // IT-safe punctuation sanitization: preserve internal dots/hyphens (802.11, m.2, Hyper-V)
  let sanitizedText = combined.replace(/[,!?;:()[\]"'{}]/g, ' ');
  sanitizedText = sanitizedText.replace(/[.-](?=\s|$)/g, ' ');
  sanitizedText = sanitizedText.replace(/\s+/g, ' ').trim();
  if (!sanitizedText) return null;
  const paddedText = ' ' + sanitizedText + ' ';

  // Phase 1: Exact substring matching with space-padded boundaries
  const objectiveScores = new Map<string, { points: number; entry: SearchableEntry }>();

  for (const entry of SEARCHABLE_ENTRIES) {
    const isPhrase = entry.keyword.includes(' ');
    const matched = isPhrase
      ? sanitizedText.includes(entry.keyword)
      : paddedText.includes(' ' + entry.keyword + ' ');

    if (matched) {
      const points = isPhrase ? 3 : 2;
      const key = entry.track + '||' + (entry.compObjective ?? '');
      const existing = objectiveScores.get(key);
      if (existing) {
        existing.points += points;
      } else {
        objectiveScores.set(key, { points, entry });
      }
    }
  }

  let bestMatch: { points: number; entry: SearchableEntry } | null = null;
  for (const candidate of objectiveScores.values()) {
    if (!bestMatch || candidate.points > bestMatch.points) {
      bestMatch = candidate;
    }
  }

  if (bestMatch && bestMatch.points >= MINIMUM_CONFIDENCE_SCORE) {
    return {
      masterCategory: bestMatch.entry.masterCategory,
      track: bestMatch.entry.track,
      compObjective: bestMatch.entry.compObjective,
      lxStage: bestMatch.entry.lxStage,
      submissionType,
    };
  }

  // Phase 2: Typo fallback -- tokenized Fuse (only runs if Phase 1 fails)
  const tokens = sanitizedText.split(/\s+/).filter((t) => t.length >= 4);
  const fuse = new Fuse(SEARCHABLE_ENTRIES, {
    keys: ['keyword'],
    threshold: 0.3,
  });

  const fallbackScores = new Map<string, { points: number; entry: SearchableEntry }>();

  for (const token of tokens) {
    const results = fuse.search(token);
    if (results.length > 0) {
      const hit = results[0].item;
      const key = hit.track + '||' + (hit.compObjective ?? '');
      const existing = fallbackScores.get(key);
      if (existing) {
        existing.points += 2;
      } else {
        fallbackScores.set(key, { points: 2, entry: hit });
      }
    }
  }

  let fallbackBest: { points: number; entry: SearchableEntry } | null = null;
  for (const candidate of fallbackScores.values()) {
    if (!fallbackBest || candidate.points > fallbackBest.points) {
      fallbackBest = candidate;
    }
  }

  if (fallbackBest && fallbackBest.points >= MINIMUM_CONFIDENCE_SCORE) {
    return {
      masterCategory: fallbackBest.entry.masterCategory,
      track: fallbackBest.entry.track,
      compObjective: fallbackBest.entry.compObjective,
      lxStage: fallbackBest.entry.lxStage,
      submissionType,
    };
  }

  if (submissionType) {
    return { masterCategory: '', track: '', submissionType };
  }
  return null;
}

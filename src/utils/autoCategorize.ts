import Fuse from 'fuse.js';
import { COMPTIA_OBJECTIVES } from '../lib/domainObjectives';

export interface AutoCategoryResult {
  masterCategory: string;
  track: string;
  compObjective?: string;
  lxStage?: string;
  submissionType?: 'Diagram' | 'Study Tip';
}

interface WeightedKeyword {
  term: string;
  weight: 1 | 3 | 5;
}

interface SearchableEntry {
  keyword: string;
  weight: 1 | 3 | 5;
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

const MINIMUM_CONFIDENCE_SCORE = 4;

interface RuleEntry {
  keywords: WeightedKeyword[];
  lessonNumbers?: string[];
  masterCategory: string;
  track: string;
  compObjective?: string;
  lxStage?: string;
}

function kw(terms: string[], weight: 1 | 3 | 5): WeightedKeyword[] {
  return terms.map((term) => ({ term, weight }));
}

const RULE_DATA: RuleEntry[] = [
  // ════════════════════════════════════════════════════════════════════
  // LEARNER EXPERIENCE & FAQs
  // ════════════════════════════════════════════════════════════════════
  {
    keywords: [
      ...kw(['imposter syndrome', 'mental health', 'time management', 'give up', 'hard time', 'falling behind', 'cant focus', 'no motivation', 'feeling stuck', 'want to quit'], 5),
      ...kw(['imposter', 'burnout', 'slump', 'motivation', 'stress', 'overwhelm', 'exhaust', 'doubt', 'confidence', 'discipline', 'distract', 'drown', 'struggle', 'tired', 'anxiety', 'behind'], 3),
    ],
    masterCategory: LX_TRACK,
    track: LX_TRACK,
    compObjective: 'The Mid Program Slump',
    lxStage: 'slump',
  },
  {
    keywords: [
      ...kw(['password reset', 'account setup', 'first week', 'getting started'], 5),
      ...kw(['canvas', 'lms', 'onboarding', 'enrollment', 'orientation', 'login', 'setup', 'access'], 3),
    ],
    masterCategory: LX_TRACK,
    track: LX_TRACK,
    compObjective: 'Onboarding Hurdles',
    lxStage: 'onboarding',
  },
  {
    keywords: [
      ...kw(['job hunt', 'test day', 'cert prep', 'cover letter', 'exam prep', 'test strategy', 'practice exam', 'passing score', 'test anxiety', 'study plan', 'comptia prep'], 5),
      ...kw(['resume', 'interview', 'exam', 'linkedin', 'salary', 'helpdesk', 'certification', 'career', 'job'], 3),
    ],
    masterCategory: LX_TRACK,
    track: LX_TRACK,
    compObjective: 'Job Hunt Triage',
    lxStage: 'job',
  },
  {
    keywords: [
      ...kw(['software install', 'wifi issue', 'hardware setup', 'not working', 'wont load', 'wont start'], 5),
      ...kw(['git', 'github', 'vscode', 'virtualbox', 'ide', 'vpn', 'monitor', 'webcam', 'headset', 'peripheral', 'broken', 'error', 'crash', 'bug', 'glitch', 'stuck', 'freeze'], 3),
    ],
    masterCategory: LX_TRACK,
    track: LX_TRACK,
    compObjective: 'Tech Solutions',
    lxStage: 'labs',
  },

  // ════════════════════════════════════════════════════════════════════
  // DESKOLAS TECH SOLUTIONS
  // ════════════════════════════════════════════════════════════════════
  {
    keywords: [
      ...kw(['monitor not working', 'webcam issue', 'mic not detected', 'headset audio', 'display flickering', 'usb not recognized', 'hdmi no signal', 'external monitor', 'second screen', 'dual monitor', 'audio crackling', 'speaker no sound', 'keyboard layout', 'mouse lag', 'bluetooth pairing', 'docking station issue'], 5),
      ...kw(['monitor', 'webcam', 'mic', 'headset', 'display', 'peripheral', 'audio output', 'screen share', 'projector'], 3),
    ],
    masterCategory: 'Deskolas Tech Solutions',
    track: 'Learner Experience Tech Solutions',
    compObjective: 'Hardware & AV Setup',
    lxStage: 'labs',
  },
  {
    keywords: [
      ...kw(['wifi not working', 'vpn not connecting', 'internet disconnecting', 'proxy error', 'firewall blocked', 'dns not resolving', 'ip conflict', 'network timeout', 'wifi dropping', 'cant access website', 'connection refused', 'bandwidth throttle', 'slow internet', 'tethering issue', 'campus wifi'], 5),
      ...kw(['hotspot', 'network drive', 'remote desktop lag'], 3),
    ],
    masterCategory: 'Deskolas Tech Solutions',
    track: 'Learner Experience Tech Solutions',
    compObjective: 'Network & Access',
    lxStage: 'labs',
  },
  {
    keywords: [
      ...kw(['vscode crash', 'extension error', 'vscode not opening', 'terminal not working', 'virtualbox error', 'vm not starting', 'install failed', 'software update stuck', 'permission denied install', 'dependency missing', 'node version', 'npm error', 'python path', 'java version', 'compiler error', 'ide freeze', 'dark mode vscode', 'settings sync', 'workspace config'], 5),
    ],
    masterCategory: 'Deskolas Tech Solutions',
    track: 'Learner Experience Tech Solutions',
    compObjective: 'Software & IDEs',
    lxStage: 'labs',
  },
  {
    keywords: [
      ...kw(['git push rejected', 'merge conflict resolution', 'git clone failed', 'branch not found', 'commit message', 'git pull error', 'detached head', 'git reset', 'github authentication', 'ssh key github', 'permission denied git', 'remote origin', 'git stash', 'rebase conflict', 'fork sync', 'pull request', 'github pages', 'git ignore not working'], 5),
    ],
    masterCategory: 'Deskolas Tech Solutions',
    track: 'Learner Experience Tech Solutions',
    compObjective: 'Git & GitHub',
    lxStage: 'labs',
  },
  {
    keywords: [
      ...kw(['canvas locked', 'coursera module', 'enrollment issue', 'login failed', 'password reset link', 'mfa not working', '2fa lost', 'account locked out', 'email verification', 'student portal', 'canvas submission', 'quiz timer', 'gradebook error', 'assignment upload', 'discussion board', 'zoom link expired', 'teams meeting', 'slack invite'], 5),
    ],
    masterCategory: 'Deskolas Tech Solutions',
    track: 'Learner Experience Tech Solutions',
    compObjective: 'Accounts & LMS',
    lxStage: 'labs',
  },

  // ════════════════════════════════════════════════════════════════════
  // CORE 1 DOMAIN 1.0 (MOBILE DEVICES)
  // ════════════════════════════════════════════════════════════════════
  {
    keywords: [
      ...kw(['laptop hardware', 'docking station', 'port replicator', 'laptop battery', 'laptop keyboard', 'trackpad', 'laptop display'], 5),
      ...kw(['laptop', 'mobile device', 'handheld', 'portable device', 'wearable'], 3),
      ...kw(['mobile', 'smartphone', 'phone', 'tablet', 'ipad', 'android', 'ios'], 1),
    ],
    lessonNumbers: ['130'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 1.0 (Mobile Devices)',
    compObjective: '1.1 Laptop Hardware',
  },
  {
    keywords: [
      ...kw(['mobile display', 'lcd screen', 'oled screen', 'digitizer', 'touchscreen calibration', 'inverter board', 'backlight bleed', 'screen replacement'], 5),
      ...kw(['lcd', 'oled', 'digitizer', 'touchscreen', 'inverter', 'backlight'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 1.0 (Mobile Devices)',
    compObjective: '1.2 Mobile Displays',
  },
  {
    keywords: [
      ...kw(['lightning connector', 'usb-c port', 'micro usb', 'pogo pin', 'nfc payment', 'portable charger', 'wireless charging pad'], 5),
      ...kw(['lightning', 'usb-c', 'stylus', 'nfc', 'airdrop'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 1.0 (Mobile Devices)',
    compObjective: '1.3 Accessories & Ports',
  },
  {
    keywords: [
      ...kw(['mobile hotspot', 'cellular network', 'tethering', 'airplane mode', 'imei', 'iccid', 'sim card', 'esim', 'prl update', 'wi-fi calling', 'mobile os update'], 5),
      ...kw(['cellular', 'hotspot', 'bluetooth', 'sync'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 1.0 (Mobile Devices)',
    compObjective: '1.4 Network Connectivity',
  },

  // ════════════════════════════════════════════════════════════════════
  // CORE 1 DOMAIN 2.0 (NETWORKING)
  // ════════════════════════════════════════════════════════════════════
  {
    keywords: [
      ...kw(['port 80', 'port 443', 'port 21', 'port 22', 'port 23', 'port 25', 'port 53', 'port 3389', 'port 110', 'port 143', 'port 445', 'tcp/ip port', 'well-known port'], 5),
      ...kw(['tcp', 'udp', 'protocol', 'dns', 'dhcp', 'ssh', 'ftp', 'rdp', 'smtp', 'imap', 'pop3', 'telnet', 'snmp', 'http', 'https'], 3),
      ...kw(['port'], 1),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 2.0 (Networking)',
    compObjective: '2.1 Ports & Protocols',
  },
  {
    keywords: [
      ...kw(['managed switch', 'unmanaged switch', 'layer 2 switch', 'layer 3 switch', 'patch panel', 'power over ethernet', 'network hub', 'access point', 'wireless access point'], 5),
      ...kw(['router', 'switch', 'firewall', 'gateway', 'poe', 'hub', 'modem', 'bridge', 'repeater'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 2.0 (Networking)',
    compObjective: '2.2 Network Equipment',
  },
  {
    keywords: [
      ...kw(['802.11ac', '802.11n', '802.11ax', '802.11a', '802.11b', '802.11g', 'wi-fi 6', 'wi-fi 5', 'wifi standards', 'wireless encryption', 'mimo', 'mu-mimo', 'beamforming'], 5),
      ...kw(['wifi', 'wireless', '802.11', 'bluetooth', 'rfid', 'nfc', 'ssid', 'wi-fi'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 2.0 (Networking)',
    compObjective: '2.3 Wireless Protocols',
  },
  {
    keywords: [
      ...kw(['dhcp server', 'dns server', 'proxy server', 'vpn concentrator', 'vlan tagging', 'nat translation', 'snat', 'dnat', 'port address translation'], 5),
      ...kw(['dhcp', 'vpn', 'vlan', 'nat', 'proxy'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 2.0 (Networking)',
    compObjective: '2.4 Network Services',
  },
  {
    keywords: [
      ...kw(['ip address', 'subnet mask', 'default gateway', 'ipv4 address', 'ipv6 address', 'cidr notation', 'apipa', '169.254', 'loopback address', '127.0.0.1'], 5),
      ...kw(['subnet', 'ipv4', 'ipv6', 'mac address', 'cidr', 'ip'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 2.0 (Networking)',
    compObjective: '2.5 IP Addressing',
  },
  {
    keywords: [
      ...kw(['soho router', 'home router', 'port forwarding', 'qos settings', 'ssid broadcast', 'dmz', 'upnp', 'guest network'], 5),
      ...kw(['soho', 'qos', 'port forwarding'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 2.0 (Networking)',
    compObjective: '2.6 SOHO Networks',
  },
  {
    keywords: [
      ...kw(['ethernet cable', 'cat5e', 'cat6', 'cat6a', 'coaxial cable', 'fiber optic', 'rj45', 'network drop', 'patch cable', 'crossover cable', 'straight-through', 'tia-568a', 'tia-568b', 'cable tester', 'tone generator'], 5),
      ...kw(['ethernet', 'lan', 'wan', 'osi model', 'osi layer', 'topology', 'star topology', 'mesh topology', 'bus topology'], 3),
      ...kw(['network', 'networking', 'internet', 'connectivity', 'bandwidth'], 1),
    ],
    lessonNumbers: ['133'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 2.0 (Networking)',
    compObjective: '2.7 Network Configs',
  },

  // ════════════════════════════════════════════════════════════════════
  // CORE 1 DOMAIN 3.0 (HARDWARE)
  // ════════════════════════════════════════════════════════════════════
  {
    keywords: [
      ...kw(['hdmi cable', 'displayport cable', 'vga cable', 'dvi cable', 'usb 3.0', 'usb 2.0', 'usb-c cable', 'thunderbolt cable', 'sata cable', 'molex connector', 'lightning cable', 'serial cable', 'cat5', 'cat6', 'coax cable', 'fiber cable'], 5),
      ...kw(['cable', 'connector', 'usb', 'hdmi', 'displayport', 'vga', 'dvi', 'thunderbolt', 'sata', 'adapter'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 3.0 (Hardware)',
    compObjective: '3.1 Cables & Connectors',
  },
  {
    keywords: [
      ...kw(['ddr3 ram', 'ddr4 ram', 'ddr5 ram', 'dimm slot', 'sodimm module', 'ecc memory', 'dual channel', 'memory timing', 'cas latency', 'ram speed', 'memory upgrade'], 5),
      ...kw(['ram', 'memory', 'dimm', 'sodimm', 'ddr', 'ddr3', 'ddr4', 'ddr5', 'ecc'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 3.0 (Hardware)',
    compObjective: '3.2 RAM',
  },
  {
    keywords: [
      ...kw(['nvme drive', 'm.2 slot', 'sata ssd', '2.5 inch drive', '3.5 inch drive', 'raid 0', 'raid 1', 'raid 5', 'raid 10', 'hot swappable', 'nas storage'], 5),
      ...kw(['storage', 'hdd', 'ssd', 'nvme', 'm.2', 'raid', 'flash drive'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 3.0 (Hardware)',
    compObjective: '3.3 Storage Devices',
  },
  {
    keywords: [
      ...kw(['motherboard form factor', 'atx motherboard', 'micro-atx', 'mini-itx', 'cpu socket', 'lga 1700', 'am5 socket', 'chipset', 'pcie slot', 'pcie x16', 'bios setup', 'uefi firmware', 'post beep', 'cmos battery', 'thermal paste', 'cpu cooler', 'heatsink fan'], 5),
      ...kw(['motherboard', 'cpu', 'processor', 'socket', 'chipset', 'pcie', 'bios', 'uefi', 'heatsink', 'cmos', 'atx', 'microatx'], 3),
    ],
    lessonNumbers: ['132'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 3.0 (Hardware)',
    compObjective: '3.4 Motherboards & CPUs',
  },
  {
    keywords: [
      ...kw(['power supply unit', 'psu wattage', 'modular psu', '24-pin connector', '8-pin connector', 'atx power', 'psu efficiency', '80 plus'], 5),
      ...kw(['power supply', 'psu', 'wattage', 'modular'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 3.0 (Hardware)',
    compObjective: '3.5 Power Supplies',
  },
  {
    keywords: [
      ...kw(['custom pc build', 'gaming pc', 'cad workstation', 'htpc build', 'thin client', 'thick client', 'virtualization workstation', 'audio video workstation'], 5),
      ...kw(['custom pc', 'workstation', 'pc build', 'form factor', 'desktop', 'tower'], 3),
      ...kw(['hardware', 'computer', 'components', 'device', 'equipment', 'peripheral'], 1),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 3.0 (Hardware)',
    compObjective: '3.6 Custom PC Configurations',
  },
  {
    keywords: [
      ...kw(['laser printer', 'inkjet printer', 'thermal printer', 'impact printer', '3d printer', 'print spooler', 'fuser assembly', 'imaging drum', 'toner cartridge', 'print head'], 5),
      ...kw(['printer', 'laser', 'inkjet', 'thermal', 'impact', 'spooler', '3d printer'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 3.0 (Hardware)',
    compObjective: '3.7 Printers',
  },

  // ════════════════════════════════════════════════════════════════════
  // CORE 1 DOMAIN 4.0 (VIRTUALIZATION & CLOUD)
  // ════════════════════════════════════════════════════════════════════
  {
    keywords: [
      ...kw(['cloud computing', 'public cloud', 'private cloud', 'hybrid cloud', 'community cloud', 'iaas', 'paas', 'saas', 'daas', 'cloud storage', 'cloud deployment', 'metered service', 'rapid elasticity', 'resource pooling'], 5),
      ...kw(['cloud', 'aws', 'azure', 'gcp', 'google cloud', 'serverless', 'multicloud', 'on demand', 'scalable', 'hosted'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 4.0 (Cloud)',
    compObjective: '4.1 Cloud Computing Concepts',
  },
  {
    keywords: [
      ...kw(['virtual machine', 'type 1 hypervisor', 'type 2 hypervisor', 'vmware workstation', 'hyper-v', 'virtualbox', 'client-side virtualization', 'vm snapshot', 'virtual disk', 'resource allocation', 'vdi desktop'], 5),
      ...kw(['virtualization', 'hypervisor', 'vmware', 'container', 'docker', 'vm', 'vdi', 'sandbox', 'snapshot'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 4.0 (Cloud)',
    compObjective: '4.2 Client-Side Virtualization',
  },

  // ════════════════════════════════════════════════════════════════════
  // CORE 1 DOMAIN 5.0 (HARDWARE & NETWORK TROUBLESHOOTING)
  // ════════════════════════════════════════════════════════════════════
  {
    keywords: [
      ...kw(['troubleshooting methodology', 'identify the problem', 'theory of probable cause', 'plan of action', 'verify functionality', 'document findings', 'establish a theory', 'test the theory'], 5),
      ...kw(['troubleshooting', 'troubleshoot', 'diagnose', 'root cause', 'symptom', 'methodology'], 3),
      ...kw(['repair', 'fix', 'resolve', 'debug', 'issue', 'malfunction'], 1),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',
    compObjective: '5.1 Troubleshooting Methodology',
  },
  {
    keywords: [
      ...kw(['blue screen of death', 'bsod error', 'no post', 'beep code', 'boot failure', 'overheating cpu', 'swollen capacitor', 'distended capacitor', 'burning smell motherboard', 'no power'], 5),
      ...kw(['blue screen', 'bsod', 'no post', 'beep code', 'boot failure', 'overheating', 'overheat', 'thermal paste'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',
    compObjective: '5.2 Motherboard/RAM/CPU Issues',
  },
  {
    keywords: [
      ...kw(['disk failure', 'bad sector', 'chkdsk command', 'slow boot drive', 'read write error', 'drive not recognized', 'clicking noise drive', 'smart error', 'drive degradation'], 5),
      ...kw(['bad sector', 'chkdsk', 'slow boot', 'drive failure', 'clicking noise'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',
    compObjective: '5.3 Storage Issues',
  },
  {
    keywords: [
      ...kw(['no display output', 'black screen boot', 'gpu artifact', 'dead pixel', 'screen flickering', 'resolution problem', 'incorrect color', 'dim display', 'projector issue'], 5),
      ...kw(['no display', 'black screen', 'artifact', 'dead pixel', 'flickering', 'gpu issue'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',
    compObjective: '5.4 Video/Display Issues',
  },
  {
    keywords: [
      ...kw(['battery drain fast', 'frozen phone screen', 'swollen battery phone', 'no cell signal', 'overheating phone', 'gps not working', 'touchscreen unresponsive'], 5),
      ...kw(['battery drain', 'frozen screen', 'swollen battery', 'no signal', 'gps issue'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',
    compObjective: '5.5 Mobile Device Issues',
  },
  {
    keywords: [
      ...kw(['paper jam printer', 'print queue stuck', 'faded print output', 'streaks on page', 'spooler error', 'ghost image print', 'toner not fusing', 'printer offline', 'printer grinding noise'], 5),
      ...kw(['paper jam', 'print queue', 'faded print', 'streaks', 'spooler error', 'toner', 'drum'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',
    compObjective: '5.6 Printer Issues',
  },
  {
    keywords: [
      ...kw(['no network connectivity', 'intermittent connection', 'packet loss', 'high latency', 'limited connectivity', 'ip conflict network', 'slow wifi speed', 'network drop', 'loopback plug', 'cable tester', 'multimeter network'], 5),
      ...kw(['no connectivity', 'intermittent', 'packet loss', 'high latency', 'limited connectivity', 'ip conflict'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',
    compObjective: '5.7 Network Issues',
  },

  // ════════════════════════════════════════════════════════════════════
  // CORE 2 DOMAIN 1.0 (OPERATING SYSTEMS)
  // ════════════════════════════════════════════════════════════════════
  {
    keywords: [
      ...kw(['windows home', 'windows pro', 'windows enterprise', 'windows education', 'windows edition', 'workgroup vs domain', 'domain join', 'bitlocker pro', 'remote desktop pro'], 5),
      ...kw(['windows edition', 'workgroup', 'domain join'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.1 Windows Editions',
  },
  {
    keywords: [
      ...kw(['ipconfig /all', 'ipconfig /release', 'ipconfig /renew', 'netstat -an', 'nslookup command', 'ping command', 'tracert command', 'sfc /scannow', 'chkdsk /f', 'diskpart', 'robocopy', 'gpupdate', 'shutdown /r'], 5),
      ...kw(['command line', 'cli', 'powershell', 'cmd', 'terminal', 'ipconfig', 'netstat', 'nslookup', 'ping', 'tracert', 'sfc'], 3),
    ],
    lessonNumbers: ['134', '135'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.2 Command-Line Tools',
  },
  {
    keywords: [
      ...kw(['cortana assistant', 'task view windows', 'virtual desktop windows', 'action center', 'windows store app', 'windows 10 feature'], 5),
      ...kw(['cortana', 'task view', 'virtual desktop', 'action center', 'windows store', 'windows 10'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.3 Windows 10 Features',
  },
  {
    keywords: [
      ...kw(['control panel applet', 'device manager utility', 'disk management console', 'msconfig utility', 'services.msc', 'defragment tool', 'task manager process', 'event viewer logs', 'performance monitor', 'computer management'], 5),
      ...kw(['control panel', 'device manager', 'disk management', 'msconfig', 'defragment', 'task manager', 'event viewer'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.4 Control Panel Utilities',
  },
  {
    keywords: [
      ...kw(['windows settings app', 'display settings windows', 'network settings windows', 'personalization settings', 'privacy settings windows', 'update settings windows', 'windows update'], 5),
      ...kw(['windows settings', 'display settings', 'network settings', 'personalization', 'privacy settings', 'update settings'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.5 Windows Settings',
  },
  {
    keywords: [
      ...kw(['network share folder', 'mapped drive letter', 'net use command', 'file sharing smb', 'windows networking share', 'unc path', 'homegroup'], 5),
      ...kw(['network share', 'mapped drive', 'net use', 'file sharing', 'windows networking'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.6 Windows Networking',
  },
  {
    keywords: [
      ...kw(['msi installer', 'exe installer', 'microsoft store', 'sideload app', 'group policy gpo', 'software deployment gpo', '32-bit vs 64-bit'], 5),
      ...kw(['msi', 'exe installer', 'app store', 'sideload', 'group policy', 'gpo'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.7 App Installation/Config',
  },
  {
    keywords: [
      ...kw(['ntfs file system', 'fat32 file system', 'exfat format', 'ext4 linux', 'apfs apple', 'gpt partition', 'mbr partition', 'file system comparison', 'swap partition'], 5),
      ...kw(['operating system', 'file system', 'ntfs', 'ext4', 'apfs', 'fat32', 'exfat', 'partition'], 3),
      ...kw(['os', 'platform', 'kernel', 'driver', 'system update'], 1),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.8 OS Types & Purposes',
  },
  {
    keywords: [
      ...kw(['clean install windows', 'upgrade install', 'boot media creation', 'usb boot drive', 'pxe boot network', 'unattended install', 'image deployment', 'wds deployment', 'recovery partition'], 5),
      ...kw(['clean install', 'upgrade install', 'boot media', 'usb boot', 'pxe boot', 'unattended install', 'image deploy', 'boot order'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.9 OS Installations/Upgrades',
  },
  {
    keywords: [
      ...kw(['macos finder', 'time machine backup', 'spotlight search', 'keychain access', 'mission control mac', 'force quit mac', 'disk utility mac', 'filevault'], 5),
      ...kw(['macos', 'mac', 'finder', 'time machine', 'spotlight', 'keychain', 'mission control'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.10 macOS Features/Tools',
  },
  {
    keywords: [
      ...kw(['linux terminal', 'bash shell', 'apt-get install', 'yum install', 'chmod permissions', 'grep command', 'sudo command', 'nano editor', 'cron job', 'systemctl', 'journalctl'], 5),
      ...kw(['linux', 'bash', 'apt', 'yum', 'chmod', 'grep', 'sudo', 'nano', 'cron'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.11 Linux Features/Tools',
  },

  // ════════════════════════════════════════════════════════════════════
  // CORE 2 DOMAIN 2.0 (SECURITY)
  // ════════════════════════════════════════════════════════════════════
  {
    keywords: [
      ...kw(['two-factor authentication', 'multi-factor authentication', 'biometric scan', 'smart card reader', 'security token', 'access control list', 'something you know', 'something you have', 'something you are'], 5),
      ...kw(['two-factor', 'mfa', '2fa', 'authentication', 'biometric', 'smart card', 'token', 'access control list'], 3),
      ...kw(['security', 'protection', 'defense', 'hardening', 'encryption'], 1),
    ],
    lessonNumbers: ['136'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 2.0 (Security)',
    compObjective: '2.1 Security Measures',
  },
  {
    keywords: [
      ...kw(['wpa2 personal', 'wpa2 enterprise', 'wpa3 protocol', 'wep vulnerability', 'tkip encryption', 'aes encryption', 'wireless security protocol', 'war driving attack', 'evil twin', 'rogue access point'], 5),
      ...kw(['wpa', 'wpa2', 'wpa3', 'wep', 'tkip', 'aes', 'wireless security', 'war driving'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 2.0 (Security)',
    compObjective: '2.2 Wireless Security',
  },
  {
    keywords: [
      ...kw(['malware detection', 'antivirus software', 'ransomware attack', 'spyware removal', 'trojan horse', 'rootkit detection', 'worm infection', 'virus signature', 'keylogger', 'adware', 'cryptominer'], 5),
      ...kw(['malware', 'antivirus', 'ransomware', 'spyware', 'trojan', 'rootkit', 'worm', 'virus'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 2.0 (Security)',
    compObjective: '2.3 Malware Detection',
  },
  {
    keywords: [
      ...kw(['social engineering attack', 'phishing email', 'spear phishing', 'tailgating entry', 'shoulder surfing', 'dumpster diving', 'vishing call', 'smishing text', 'pretexting', 'whaling'], 5),
      ...kw(['social engineering', 'phishing', 'tailgating', 'shoulder surfing', 'dumpster diving', 'vishing', 'smishing'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 2.0 (Security)',
    compObjective: '2.4 Social Engineering',
  },
  {
    keywords: [
      ...kw(['user account control', 'bitlocker drive', 'encrypting file system', 'windows defender firewall', 'firewall rule windows', 'group policy security', 'windows security center'], 5),
      ...kw(['uac', 'bitlocker', 'efs', 'windows defender', 'firewall rule', 'group policy security'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 2.0 (Security)',
    compObjective: '2.5 Windows Security Settings',
  },
  {
    keywords: [
      ...kw(['screen lock policy', 'password policy setting', 'failed login attempt', 'disable guest account', 'usb port lock', 'bios password set', 'autorun disable', 'autoplay disable'], 5),
      ...kw(['screen lock', 'password policy', 'login attempt', 'disable guest', 'usb lock', 'bios password', 'account lockout'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 2.0 (Security)',
    compObjective: '2.6 Workstation Security',
  },
  {
    keywords: [
      ...kw(['mobile device management', 'remote wipe device', 'device encryption mobile', 'byod policy', 'geofencing location', 'containerization mobile', 'full device encryption'], 5),
      ...kw(['mdm', 'remote wipe', 'device encryption', 'byod', 'geofencing', 'mobile device security'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 2.0 (Security)',
    compObjective: '2.7 Mobile Device Security',
  },
  {
    keywords: [
      ...kw(['data destruction method', 'degaussing drive', 'shred documents', 'low level format', 'secure erase command', 'data sanitization', 'physical destruction', 'certificate of destruction'], 5),
      ...kw(['data destruction', 'degauss', 'shred', 'low level format', 'secure erase', 'data sanitization'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 2.0 (Security)',
    compObjective: '2.8 Data Destruction',
  },
  {
    keywords: [
      ...kw(['soho security setup', 'home firewall config', 'change default password', 'disable ssid broadcast', 'mac address filtering', 'firmware update router', 'content filtering'], 5),
      ...kw(['soho security', 'home firewall', 'change default password', 'disable ssid broadcast', 'mac filtering'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 2.0 (Security)',
    compObjective: '2.9 SOHO Network Security',
  },
  {
    keywords: [
      ...kw(['browser security setting', 'popup blocker', 'ssl certificate', 'https protocol', 'private browsing mode', 'clear browser cache', 'extension security risk', 'certificate error'], 5),
      ...kw(['browser security', 'popup blocker', 'certificate', 'https', 'private browsing', 'clear cache', 'extension security'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 2.0 (Security)',
    compObjective: '2.10 Browser Security',
  },

  // ════════════════════════════════════════════════════════════════════
  // CORE 2 DOMAIN 3.0 (SOFTWARE TROUBLESHOOTING)
  // ════════════════════════════════════════════════════════════════════
  {
    keywords: [
      ...kw(['application crash windows', 'slow performance pc', 'startup repair windows', 'safe mode boot', 'windows update failure', 'system restore point', 'registry corruption', 'service pack install', 'driver conflict', 'stop error', 'missing dll'], 5),
      ...kw(['app crash', 'slow performance', 'startup repair', 'safe mode', 'update failure', 'system restore', 'registry', 'compatibility', 'patch', 'driver issue', 'event viewer', 'error code', 'freezing'], 3),
      ...kw(['software', 'application', 'program', 'install', 'uninstall', 'performance'], 1),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 3.0 (Software Troubleshooting)',
    compObjective: '3.1 Windows OS Issues',
  },
  {
    keywords: [
      ...kw(['browser redirect virus', 'popup malware', 'rogue antivirus', 'unauthorized remote access', 'security alert popup', 'fake security warning', 'browser hijacker'], 5),
      ...kw(['browser redirect', 'pop up', 'rogue software', 'unauthorized access', 'security alert'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 3.0 (Software Troubleshooting)',
    compObjective: '3.2 PC Security Issues',
  },
  {
    keywords: [
      ...kw(['malware removal steps', 'quarantine malware', 'remediate infection', 'enable system protection', 'boot to safe mode scan', 'disconnect from network', 'identify malware type'], 5),
      ...kw(['malware removal', 'quarantine', 'remediate', 'enable system protection', 'scan'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 3.0 (Software Troubleshooting)',
    compObjective: '3.3 Malware Removal Best Practices',
  },
  {
    keywords: [
      ...kw(['app not loading mobile', 'force stop app', 'clear app cache', 'mobile os update issue', 'factory reset phone', 'mobile app freeze', 'app permission issue'], 5),
      ...kw(['app not loading', 'force stop', 'clear app cache', 'os update issue', 'factory reset'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 3.0 (Software Troubleshooting)',
    compObjective: '3.4 Mobile OS/App Issues',
  },
  {
    keywords: [
      ...kw(['leaked data mobile', 'unauthorized root access', 'jailbreak risk', 'unintended wireless connection', 'developer mode risk', 'unauthorized camera access', 'location tracking risk'], 5),
      ...kw(['leaked data', 'unauthorized root', 'jailbreak', 'unintended connection', 'developer mode'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 3.0 (Software Troubleshooting)',
    compObjective: '3.5 Mobile Security Issues',
  },

  // ════════════════════════════════════════════════════════════════════
  // CORE 2 DOMAIN 4.0 (OPERATIONAL PROCEDURES)
  // ════════════════════════════════════════════════════════════════════
  {
    keywords: [
      ...kw(['it documentation', 'ticketing system', 'knowledge base article', 'asset management system', 'network diagram', 'acceptable use policy', 'standard operating procedure'], 5),
      ...kw(['documentation', 'ticketing', 'knowledge base', 'asset management', 'inventory', 'network diagram', 'sop'], 3),
      ...kw(['operations', 'procedure', 'operational', 'policy', 'workflow'], 1),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
    compObjective: '4.1 IT Documentation',
  },
  {
    keywords: [
      ...kw(['change management process', 'change advisory board', 'rollback plan', 'approval process change', 'risk analysis change', 'change request form', 'impact assessment'], 5),
      ...kw(['change management', 'change board', 'rollback plan', 'approval process', 'risk analysis'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
    compObjective: '4.2 Change Management',
  },
  {
    keywords: [
      ...kw(['disaster recovery plan', 'backup strategy', 'full backup', 'incremental backup', 'differential backup', 'failover cluster', 'business continuity plan', 'rpo', 'rto', '3-2-1 backup'], 5),
      ...kw(['disaster recovery', 'backup', 'restore', 'redundancy', 'failover', 'business continuity'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
    compObjective: '4.3 Disaster Recovery',
  },
  {
    keywords: [
      ...kw(['esd precaution', 'anti-static wrist strap', 'proper lifting technique', 'electrical safety procedure', 'msds sheet', 'esd mat', 'equipment grounding'], 5),
      ...kw(['safety', 'esd', 'anti static', 'lifting', 'electrical safety', 'msds'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
    compObjective: '4.4 Safety Procedures',
  },
  {
    keywords: [
      ...kw(['e-waste recycling', 'proper disposal method', 'battery disposal', 'toner disposal', 'crt disposal', 'green it practice', 'energy star'], 5),
      ...kw(['recycling', 'proper disposal', 'battery disposal', 'toner disposal', 'e-waste', 'green it'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
    compObjective: '4.5 Environmental Impacts',
  },
  {
    keywords: [
      ...kw(['personally identifiable information', 'gdpr compliance', 'software license agreement', 'open source license', 'end user license agreement', 'digital rights management', 'copyright infringement'], 5),
      ...kw(['pii', 'gdpr', 'license', 'open source', 'eula', 'drm', 'copyright', 'compliance', 'privacy'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
    compObjective: '4.6 Privacy & Licensing',
  },
  {
    keywords: [
      ...kw(['professional communication', 'customer service skills', 'active listening technique', 'escalation procedure', 'dealing with difficult customer', 'setting expectations'], 5),
      ...kw(['professionalism', 'communication', 'customer service', 'active listening', 'escalation', 'onboarding', 'offboarding'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
    compObjective: '4.7 Professionalism & Comms',
  },
  {
    keywords: [
      ...kw(['batch file script', 'powershell script', 'python script', 'bash script', 'automation script', 'vbs script', 'javascript automation', 'environment variable', 'script execution policy'], 5),
      ...kw(['scripting', 'script', 'batch file', 'powershell script', 'python', 'javascript', 'automation'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
    compObjective: '4.8 Scripting Basics',
  },
  {
    keywords: [
      ...kw(['remote desktop protocol', 'vnc connection', 'ssh remote access', 'teamviewer remote', 'vpn remote worker', 'remote monitoring management', 'screen sharing'], 5),
      ...kw(['remote desktop', 'vnc', 'ssh remote', 'teamviewer', 'vpn remote', 'remote access'], 3),
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
    compObjective: '4.9 Remote Access Tech',
  },

  // ════════════════════════════════════════════════════════════════════
  // HEALTHCARE IT: EHR ARCHITECTURE
  // ════════════════════════════════════════════════════════════════════
  {
    keywords: [
      ...kw(['electronic health record', 'electronic medical record', 'epic system', 'cerner system', 'meditech system', 'allscripts system', 'patient portal', 'ehr sandbox', 'health information system', 'charting system', 'workstation on wheels'], 5),
      ...kw(['ehr', 'emr', 'epic', 'cerner', 'meditech', 'allscripts', 'charting', 'clinical system', 'his'], 3),
      ...kw(['health record', 'medical record'], 1),
    ],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT EHR Architecture',
    compObjective: 'EHR Integrations & Sandboxes',
  },
  {
    keywords: [
      ...kw(['fhir api', 'hl7 message', 'health information exchange', 'ccda document', 'interoperability standard', 'adt message', 'oru message', 'orm message'], 5),
      ...kw(['fhir', 'hl7', 'interoperability', 'hie', 'ccda', 'api integration'], 3),
    ],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT EHR Architecture',
    compObjective: 'Data Interoperability (HL7/FHIR)',
  },
  {
    keywords: [
      ...kw(['clinical database', 'health data warehouse', 'data migration health', 'data integrity check', 'health record database', 'database normalization health'], 5),
      ...kw(['clinical database', 'data warehouse', 'sql health', 'data migration', 'data integrity'], 3),
    ],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT EHR Architecture',
    compObjective: 'Database Management',
  },
  {
    keywords: [
      ...kw(['ehr downtime', 'system outage hospital', 'paper charting procedure', 'downtime workstation', 'disaster recovery ehr', 'clinical downtime'], 5),
      ...kw(['downtime', 'system outage', 'paper charting', 'backup procedure'], 3),
    ],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT EHR Architecture',
    compObjective: 'System Downtime Procedures',
  },

  // ════════════════════════════════════════════════════════════════════
  // HEALTHCARE IT: HIPAA DATA SECURITY
  // ════════════════════════════════════════════════════════════════════
  {
    keywords: [
      ...kw(['protected health information', 'phi disclosure', 'minimum necessary standard', 'de-identification method', 'hipaa privacy rule', 'patient privacy breach', 'hitech act'], 5),
      ...kw(['phi', 'hipaa', 'minimum necessary', 'de-identification', 'privacy', 'health data security', 'patient privacy', 'confidentiality', 'hipaa compliance', 'breach', 'hitech'], 3),
      ...kw(['regulation', 'data protection'], 1),
    ],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT HIPAA Data Security',
    compObjective: 'PHI Protection Strategies',
  },
  {
    keywords: [
      ...kw(['role-based access control', 'audit trail review', 'break-the-glass procedure', 'business associate agreement', 'access control health', 'authentication healthcare', 'security group clinical'], 5),
      ...kw(['access control', 'audit', 'audit trail', 'role based access', 'authentication health', 'baa', 'break-the-glass'], 3),
    ],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT HIPAA Data Security',
    compObjective: 'Access Controls & Auditing',
  },
  {
    keywords: [
      ...kw(['healthcare cybersecurity', 'vulnerability scan health', 'data breach notification', 'penetration test health', 'intrusion detection health', 'intrusion prevention health', 'threat detection healthcare'], 5),
      ...kw(['cybersecurity', 'vulnerability', 'threat', 'data breach', 'breach notification', 'penetration test', 'ids', 'ips'], 3),
    ],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT HIPAA Data Security',
    compObjective: 'Threat Detection & Response',
  },
  {
    keywords: [
      ...kw(['hipaa compliance documentation', 'risk assessment health', 'security rule hipaa', 'privacy rule hipaa', 'administrative safeguard', 'technical safeguard', 'physical safeguard', 'nist framework health'], 5),
      ...kw(['compliance', 'risk assessment', 'security rule', 'privacy rule', 'safeguard', 'security policy', 'nist'], 3),
    ],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT HIPAA Data Security',
    compObjective: 'Compliance Documentation',
  },

  // ════════════════════════════════════════════════════════════════════
  // HEALTHCARE IT: CLINICAL WORKFLOWS
  // ════════════════════════════════════════════════════════════════════
  {
    keywords: [
      ...kw(['patient admission', 'discharge process', 'nursing workflow', 'clinical workflow', 'patient flow', 'care coordination', 'clinical documentation', 'rounding workflow', 'care plan', 'clinical decision support'], 5),
      ...kw(['patient', 'admission', 'discharge', 'nursing', 'patient flow', 'provider workflow'], 3),
      ...kw(['clinical', 'healthcare', 'hospital', 'clinic', 'medical', 'doctor', 'provider'], 1),
    ],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT Clinical Workflows',
    compObjective: 'Patient Admission to Discharge',
  },
  {
    keywords: [
      ...kw(['cpoe order entry', 'lab order system', 'lab result review', 'medication order entry', 'pharmacy system', 'computerized physician order', 'order verification'], 5),
      ...kw(['cpoe', 'lab order', 'lab result', 'medication order', 'pharmacy', 'medication'], 3),
    ],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT Clinical Workflows',
    compObjective: 'Order Entry Systems (CPOE)',
  },
  {
    keywords: [
      ...kw(['telehealth visit', 'telemedicine platform', 'virtual visit setup', 'remote patient monitoring', 'video consult', 'remote monitoring device', 'telehealth workflow'], 5),
      ...kw(['telehealth', 'telemedicine', 'virtual visit', 'remote patient', 'video consult', 'remote monitoring'], 3),
    ],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT Clinical Workflows',
    compObjective: 'Telehealth Integrations',
  },
  {
    keywords: [
      ...kw(['medical iot device', 'pacs imaging', 'dicom standard', 'radiology system', 'biomedical device', 'infusion pump network', 'medical device integration', 'vitals machine'], 5),
      ...kw(['medical iot', 'medical device', 'pacs', 'dicom', 'imaging', 'radiology', 'biomedical', 'infusion pump'], 3),
    ],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT Clinical Workflows',
    compObjective: 'Medical IoT Troubleshooting',
  },
  {
    keywords: [
      ...kw(['medication administration record', 'barcode scanning medication', 'wristband scan', 'medication verification', 'five rights medication', 'med pass workflow', 'dispensing cabinet', 'pyxis machine', 'omnicell cabinet'], 5),
      ...kw(['mar', 'barcode scanning', 'wristband', 'five rights', 'med pass', 'pyxis', 'omnicell'], 3),
    ],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT Clinical Workflows',
    compObjective: 'Medication Administration',
  },
  {
    keywords: [
      ...kw(['zebra scanner clinical', 'barcode scanner hospital', 'vitals machine setup', 'bp cuff digital', 'label printer clinical', 'workstation on wheels', 'wow cart', 'device pairing clinical', 'clinical device calibration'], 5),
      ...kw(['zebra scanner', 'barcode scanner', 'vitals machine', 'bp cuff', 'label printer', 'wow', 'device pairing', 'calibration'], 3),
    ],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT Clinical Workflows',
    compObjective: 'Device Integration',
  },
  {
    keywords: [
      ...kw(['provider access request', 'nurse access setup', 'role change clinical', 'permission denied ehr', 'account provisioning health', 'clinical role assignment', 'security group assignment', 'access escalation'], 5),
      ...kw(['provider access', 'nurse access', 'role change', 'permission denied', 'account provisioning', 'clinical role', 'security group'], 3),
    ],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT HIPAA Data Security',
    compObjective: 'Access & Permissions',
  },
];

// ═══════════════════════════════════════════════════════════════════════
// ENGINE: Build searchable entries and scoring logic
// ═══════════════════════════════════════════════════════════════════════

const SEARCHABLE_ENTRIES: SearchableEntry[] = RULE_DATA.flatMap((rule) =>
  rule.keywords.map((kw) => ({
    keyword: kw.term,
    weight: kw.weight,
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

function getObjectiveIndex(track: string, objective: string): number {
  for (const [key, objectives] of Object.entries(COMPTIA_OBJECTIVES)) {
    if (track.includes(key) || key.includes(track)) {
      const idx = objectives.indexOf(objective);
      if (idx >= 0) return idx;
    }
  }
  const directList = COMPTIA_OBJECTIVES[track];
  if (directList) {
    const idx = directList.indexOf(objective);
    if (idx >= 0) return idx;
  }
  return 9999;
}

export function autoCategorizeSubmission(
  title: string,
  content: string,
): AutoCategoryResult | null {
  if (!title?.trim() && !content?.trim()) return null;

  const combined = `${title} ${content}`.toLowerCase();

  let submissionType: 'Diagram' | 'Study Tip' | undefined;
  if (DIAGRAM_KEYWORDS.some((kw) => combined.includes(kw))) {
    submissionType = 'Diagram';
  }

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

  let sanitizedText = combined.replace(/[,!?;:()[\]"'{}]/g, ' ');
  sanitizedText = sanitizedText.replace(/[.-](?=\s|$)/g, ' ');
  sanitizedText = sanitizedText.replace(/\s+/g, ' ').trim();
  if (!sanitizedText) return null;
  const paddedText = ' ' + sanitizedText + ' ';

  // Phase 1: Weighted exact substring matching
  const objectiveScores = new Map<string, { points: number; entry: SearchableEntry }>();

  for (const entry of SEARCHABLE_ENTRIES) {
    const isPhrase = entry.keyword.includes(' ');
    const matched = isPhrase
      ? sanitizedText.includes(entry.keyword)
      : paddedText.includes(' ' + entry.keyword + ' ');

    if (matched) {
      const points = entry.weight * (isPhrase ? 2 : 1);
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
    } else if (candidate.points === bestMatch.points) {
      const candIdx = getObjectiveIndex(candidate.entry.track, candidate.entry.compObjective ?? '');
      const bestIdx = getObjectiveIndex(bestMatch.entry.track, bestMatch.entry.compObjective ?? '');
      if (candIdx < bestIdx) {
        bestMatch = candidate;
      }
    }
  }

  if (bestMatch && bestMatch.points >= MINIMUM_CONFIDENCE_SCORE) {
    const resolvedType = bestMatch.entry.masterCategory === 'Deskolas Tech Solutions'
      ? 'Study Tip' : submissionType;
    return {
      masterCategory: bestMatch.entry.masterCategory,
      track: bestMatch.entry.track,
      compObjective: bestMatch.entry.compObjective,
      lxStage: bestMatch.entry.lxStage,
      submissionType: resolvedType,
    };
  }

  // Phase 2: Typo-tolerant fallback via Fuse.js (only if Phase 1 fails)
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
      const points = hit.weight;
      const key = hit.track + '||' + (hit.compObjective ?? '');
      const existing = fallbackScores.get(key);
      if (existing) {
        existing.points += points;
      } else {
        fallbackScores.set(key, { points, entry: hit });
      }
    }
  }

  let fallbackBest: { points: number; entry: SearchableEntry } | null = null;
  for (const candidate of fallbackScores.values()) {
    if (!fallbackBest || candidate.points > fallbackBest.points) {
      fallbackBest = candidate;
    } else if (candidate.points === fallbackBest.points) {
      const candIdx = getObjectiveIndex(candidate.entry.track, candidate.entry.compObjective ?? '');
      const bestIdx = getObjectiveIndex(fallbackBest.entry.track, fallbackBest.entry.compObjective ?? '');
      if (candIdx < bestIdx) {
        fallbackBest = candidate;
      }
    }
  }

  if (fallbackBest && fallbackBest.points >= MINIMUM_CONFIDENCE_SCORE) {
    const resolvedType = fallbackBest.entry.masterCategory === 'Deskolas Tech Solutions'
      ? 'Study Tip' : submissionType;
    return {
      masterCategory: fallbackBest.entry.masterCategory,
      track: fallbackBest.entry.track,
      compObjective: fallbackBest.entry.compObjective,
      lxStage: fallbackBest.entry.lxStage,
      submissionType: resolvedType,
    };
  }

  if (submissionType) {
    return { masterCategory: '', track: '', submissionType };
  }
  return null;
}

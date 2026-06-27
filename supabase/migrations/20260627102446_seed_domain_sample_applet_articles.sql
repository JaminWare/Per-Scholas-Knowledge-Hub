-- Seed one sample applet article for every domain.
-- Uses subqueries to resolve section_id by slug, avoiding hardcoded UUIDs.
INSERT INTO articles (slug, title, excerpt, section_id, content, is_sample, contributor_id, tags, is_featured)
VALUES
  -- Core 1 Domain 1.0 — Mobile Devices
  (
    'core1-mobile/sample-mdm',
    '[Sample] Enterprise Mobile Device Management (MDM) & Enrollment Profiles',
    'Covers MDM policy deployment, enrollment profile configuration, and corporate device management across iOS and Android platforms.',
    (SELECT id FROM sections WHERE slug = 'core1-mobile'),
    'This is a sample placeholder applet. Submit your research to claim this slot.',
    true, NULL, ARRAY['mobile','mdm','core1'], false
  ),
  -- Core 1 Domain 2.0 — Networking
  (
    'core1-networking/sample-protocols',
    '[Sample] Core Networking Protocols & TCP/IP Port Customization',
    'Deep-dive into TCP/IP, UDP, ICMP, and port-range customization for enterprise and healthcare network environments.',
    (SELECT id FROM sections WHERE slug = 'core1-networking'),
    'This is a sample placeholder applet. Submit your research to claim this slot.',
    true, NULL, ARRAY['networking','tcp-ip','ports','core1'], false
  ),
  -- Core 1 Domain 3.0 — Hardware
  (
    'core1-hardware/sample-diagnostics',
    '[Sample] Advanced Component Diagnostics & RAM Multi-Channel Architecture',
    'Hands-on guide to diagnosing RAM failures, multi-channel memory configurations, and PCIe slot compatibility.',
    (SELECT id FROM sections WHERE slug = 'core1-hardware'),
    'This is a sample placeholder applet. Submit your research to claim this slot.',
    true, NULL, ARRAY['hardware','ram','diagnostics','core1'], false
  ),
  -- Core 1 Domain 4.0 — Virtualization & Cloud
  (
    'core1-cloud/sample-hypervisor',
    '[Sample] Hypervisor Deployments & Elastic Cloud Service Models',
    'Comparing Type-1 vs Type-2 hypervisors, VM snapshot strategies, and IaaS/PaaS/SaaS deployment models.',
    (SELECT id FROM sections WHERE slug = 'core1-cloud'),
    'This is a sample placeholder applet. Submit your research to claim this slot.',
    true, NULL, ARRAY['cloud','virtualization','hypervisor','core1'], false
  ),
  -- Core 1 Domain 5.0 — HW & Network Troubleshooting
  (
    'core1-troubleshooting/sample-telemetry',
    '[Sample] Network Telemetry Interpretation & POST Failure Isolation',
    'Using ping, tracert, and netstat telemetry to isolate network faults, alongside POST beep-code analysis for hardware triage.',
    (SELECT id FROM sections WHERE slug = 'core1-troubleshooting'),
    'This is a sample placeholder applet. Submit your research to claim this slot.',
    true, NULL, ARRAY['troubleshooting','post','telemetry','core1'], false
  ),
  -- Core 2 Domain 1.0 — Operating Systems
  (
    'core2-os/sample-install-matrix',
    '[Sample] OS Installation Matrix & File System Permissions',
    'Comparison of Windows, macOS, and Linux installation paths, partition schemes, and NTFS/ext4/APFS permission models.',
    (SELECT id FROM sections WHERE slug = 'core2-os'),
    'This is a sample placeholder applet. Submit your research to claim this slot.',
    true, NULL, ARRAY['os','windows','linux','permissions','core2'], false
  ),
  -- Core 2 Domain 2.0 — Security
  (
    'core2-security/sample-physical-security',
    '[Sample] Physical Security Controls & Active Directory Lockouts',
    'Badge access, cable locks, and surveillance integration alongside AD account lockout policy and audit logging.',
    (SELECT id FROM sections WHERE slug = 'core2-security'),
    'This is a sample placeholder applet. Submit your research to claim this slot.',
    true, NULL, ARRAY['security','active-directory','physical-security','core2'], false
  ),
  -- Core 2 Domain 3.0 — Software Troubleshooting
  (
    'core2-software/sample-malware',
    '[Sample] Malware Remediation Best Practices & OS Recovery Environment',
    'Step-by-step malware removal process, WinRE/Recovery Console usage, and SFC/DISM repair commands.',
    (SELECT id FROM sections WHERE slug = 'core2-software'),
    'This is a sample placeholder applet. Submit your research to claim this slot.',
    true, NULL, ARRAY['malware','recovery','troubleshooting','core2'], false
  ),
  -- Core 2 Domain 4.0 — Operational Procedures
  (
    'core2-operations/sample-change-mgmt',
    '[Sample] Change Management Workflows & Documentation Standards',
    'RFC templates, change advisory board (CAB) procedures, and incident documentation standards for healthcare IT environments.',
    (SELECT id FROM sections WHERE slug = 'core2-operations'),
    'This is a sample placeholder applet. Submit your research to claim this slot.',
    true, NULL, ARRAY['change-management','documentation','operations','core2'], false
  ),
  -- Healthcare — EHR Architecture
  (
    'healthcare-ehr/sample-hl7',
    '[Sample] HL7 Data Integration',
    'Overview of HL7 v2/v3 and FHIR message structures, ADT event triggers, and EHR interoperability standards.',
    (SELECT id FROM sections WHERE slug = 'healthcare-ehr'),
    'This is a sample placeholder applet. Submit your research to claim this slot.',
    true, NULL, ARRAY['hl7','fhir','ehr','healthcare'], false
  ),
  -- Healthcare — HIPAA Data Security
  (
    'healthcare-hipaa/sample-admin-safeguards',
    '[Sample] Administrative Safeguards',
    'HIPAA Security Rule administrative controls: workforce training, access management policies, and risk analysis requirements.',
    (SELECT id FROM sections WHERE slug = 'healthcare-hipaa'),
    'This is a sample placeholder applet. Submit your research to claim this slot.',
    true, NULL, ARRAY['hipaa','administrative','safeguards','healthcare'], false
  ),
  -- Healthcare — Clinical Workflows
  (
    'healthcare-clinical/sample-wows',
    '[Sample] Workstations on Wheels (WOWs) Deployment',
    'Hardware selection, network configuration, and infection-control considerations for mobile clinical workstation deployments.',
    (SELECT id FROM sections WHERE slug = 'healthcare-clinical'),
    'This is a sample placeholder applet. Submit your research to claim this slot.',
    true, NULL, ARRAY['clinical','wows','deployment','healthcare'], false
  )
ON CONFLICT (slug) DO NOTHING;

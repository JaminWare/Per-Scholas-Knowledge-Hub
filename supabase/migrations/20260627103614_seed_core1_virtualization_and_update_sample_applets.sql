-- 1. Add the core1-virtualization section (new slug explicitly required by spec)
INSERT INTO sections (slug, title, order_index)
VALUES ('core1-virtualization', 'Domain 4.0 — Virtualization & Cloud', 40)
ON CONFLICT (slug) DO NOTHING;

-- 2. Seed the hypervisor applet under core1-virtualization
INSERT INTO articles (slug, title, excerpt, section_id, content, is_sample, contributor_id, tags, is_featured)
VALUES (
  'core1-virtualization/sample-hypervisor',
  '[Sample] Hypervisor Deployments & Elastic Cloud Service Models',
  'A practice lab architecture layout comparing Type 1 vs Type 2 hypervisors and IaaS/PaaS/SaaS healthcare endpoints.',
  (SELECT id FROM sections WHERE slug = 'core1-virtualization'),
  'This is a sample placeholder applet. Submit your research to claim this slot.',
  true, NULL, ARRAY['cloud','virtualization','hypervisor','core1'], false
)
ON CONFLICT (slug) DO NOTHING;

-- 3. Update all existing sample applets to verbatim titles and excerpts from spec
UPDATE articles SET
  title   = '[Sample] Enterprise Mobile Device Management (MDM) & Enrollment Profiles',
  excerpt = 'A conceptual guide exploring corporate smartphone provisioning, MDM profiles, and remote wipe security policies.'
WHERE slug = 'core1-mobile/sample-mdm';

UPDATE articles SET
  title   = '[Sample] Core Networking Protocols & TCP/IP Port Customization',
  excerpt = 'An open reference framework outlining foundational network routing behaviors, subnetting, and port allocations.'
WHERE slug = 'core1-networking/sample-protocols';

UPDATE articles SET
  title   = '[Sample] Advanced Component Diagnostics & RAM Multi-Channel Architecture',
  excerpt = 'A walkthrough mapping out motherboard component interconnections, form factors, and volatile memory speeds.'
WHERE slug = 'core1-hardware/sample-diagnostics';

UPDATE articles SET
  title   = '[Sample] Network Telemetry Interpretation & POST Failure Isolation',
  excerpt = 'A master structural methodology guide covering command-line diagnostic outputs and motherboard beep codes.'
WHERE slug = 'core1-troubleshooting/sample-telemetry';

UPDATE articles SET
  title   = '[Sample] OS Installation Matrix & File System Permissions',
  excerpt = 'A placeholder dashboard layout reviewing clean installations, upgrades, and NTFS vs. share-level permissions.'
WHERE slug = 'core2-os/sample-install-matrix';

UPDATE articles SET
  title   = '[Sample] Physical Security Controls & Active Directory Lockouts',
  excerpt = 'A layout reviewing access badges, social engineering defense, and configuring strict domain password policies.'
WHERE slug = 'core2-security/sample-physical-security';

UPDATE articles SET
  title   = '[Sample] Malware Remediation Best Practices & OS Recovery Environment',
  excerpt = 'An open framework mapping out the CompTIA 7-step malware removal procedure and Bootrec command sequences.'
WHERE slug = 'core2-software/sample-malware';

UPDATE articles SET
  title   = '[Sample] Change Management Workflows & Documentation Standards',
  excerpt = 'A placeholder guide on standard operating procedures, ticketing lifecycles, and safety protocols in enterprise server rooms.'
WHERE slug = 'core2-operations/sample-change-mgmt';

UPDATE articles SET
  title   = '[Sample] Administrative Safeguards & PHI Breach Notification Workflows',
  excerpt = 'A sample model outlining institutional data policy compliance frameworks under federal privacy laws.'
WHERE slug = 'healthcare-hipaa/sample-admin-safeguards';

UPDATE articles SET
  title   = '[Sample] HL7 Data Integration & EHR Interoperability Standards',
  excerpt = 'An applet layout mapping out clinical database queries, patient chart indexing, and server-side data flows.'
WHERE slug = 'healthcare-ehr/sample-hl7';

UPDATE articles SET
  title   = '[Sample] Workstations on Wheels (WOWs) Deployment & Sanitization Protocol',
  excerpt = 'A baseline template guide reviewing technical endpoints inside intensive care units and active operating rooms.'
WHERE slug = 'healthcare-clinical/sample-wows';

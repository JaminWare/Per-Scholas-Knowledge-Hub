import firewallContent from '../content/firewall-basics.md?raw';
import cliContent from '../content/command-documentation.md?raw';
import mmcContent from '../content/snap-in.md?raw';
import introHitContent from '../content/intro-healthcare-it-security.md?raw';
import cloudHealthcareContent from '../content/cloud-computing-healthcare.md?raw';
import aiPromptContent from '../content/ai-prompt-engineering-healthcare.md?raw';

export const articleContentMap: Record<string, string> = {
  'core1-networking/firewall-basics': firewallContent,
  'core1-troubleshooting/command-documentation': cliContent,
  'core2-os/snap-in': mmcContent,
  'healthcare-hipaa/intro-healthcare-it-security': introHitContent,
  'healthcare-ehr/cloud-computing-healthcare': cloudHealthcareContent,
  'ai-prompt-engineering-healthcare': aiPromptContent,
};

import firewallContent from '../content/firewall-basics.md?raw';
import cliContent from '../content/command-documentation.md?raw';
import mmcContent from '../content/snap-in.md?raw';

export const articleContentMap: Record<string, string> = {
  'firewall-basics': firewallContent,
  'command-documentation': cliContent,
  'snap-in': mmcContent,
};

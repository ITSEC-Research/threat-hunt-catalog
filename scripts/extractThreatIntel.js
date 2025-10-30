import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SIGMA_DIR = join(__dirname, '..', 'sigma');

// Extract threat intelligence from Sigma rule
function extractThreatIntel(sigmaYaml, filename) {
  const threatIntel = {
    aptGroups: [],
    malwareFamilies: [],
    cves: [],
    threatActors: []
  };

  const text = `${sigmaYaml.title || ''} ${sigmaYaml.description || ''} ${JSON.stringify(sigmaYaml.references || [])} ${filename}`.toLowerCase();

  // APT Groups - Common naming patterns
  const aptPatterns = [
    /apt[- ]?\d+/gi,
    /apt[- ]?(cozy bear|fancy bear|lazarus|kimsuky|axiom|putter panda|stone panda|viking panda)/gi,
    /diamond[- ]sleet/gi,
    /forest[- ]blizzard/gi,
    /onyx[- ]sleet/gi,
    /ember[- ]bear/gi,
    /charming[- ]kitten/gi,
    /turla/gi,
    /equation[- ]group/gi,
    /carbanak/gi,
    /dragonfly/gi,
    /energetic[- ]bear/gi,
    /sandworm/gi,
    /oilrig/gi,
    /muddywater/gi,
    /fin\d+/gi,
    /ta\d+/gi,
    /g\d{4}/gi
  ];

  // Malware Families
  const malwarePatterns = [
    /cobalt[- ]?strike/gi,
    /mimikatz/gi,
    /emotet/gi,
    /trickbot/gi,
    /qbot|qakbot/gi,
    /ransomware/gi,
    /wannacry/gi,
    /notpetya/gi,
    /ryuk/gi,
    /conti/gi,
    /lockbit/gi,
    /revil/gi,
    /maze/gi,
    /ragnar[- ]?locker/gi,
    /dridex/gi,
    /icedid/gi,
    /bumblebee/gi,
    /gozi/gi,
    /ursnif/gi,
    /hancitor/gi,
    /darkside/gi,
    /blackmatter/gi,
    /metasploit/gi,
    /powershell[- ]empire/gi,
    /bloodhound/gi,
    /sharphound/gi,
    /rubeus/gi,
    /certify/gi,
    /sliver/gi,
    /brute[- ]?ratel/gi,
    /njrat/gi,
    /asyncrat/gi,
    /remcos/gi,
    /nanocore/gi,
    /quasar[- ]?rat/gi,
    /meterpreter/gi,
    /webshell/gi,
    /backdoor/gi,
    /trojan/gi,
    /rootkit/gi
  ];

  // CVE patterns
  const cvePattern = /cve[- ]?\d{4}[- ]?\d{4,7}/gi;

  // Threat Actor groups (from title/description)
  const threatActorPatterns = [
    /north[- ]korean/gi,
    /russian/gi,
    /chinese/gi,
    /iranian/gi,
    /nation[- ]state/gi,
    /state[- ]sponsored/gi
  ];

  // Extract APT groups
  aptPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const normalized = match.trim().toLowerCase().replace(/[- ]/g, ' ');
        if (!threatIntel.aptGroups.some(apt => apt.toLowerCase() === normalized)) {
          threatIntel.aptGroups.push(match.trim());
        }
      });
    }
  });

  // Extract malware families
  malwarePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const normalized = match.trim().toLowerCase().replace(/[- ]/g, ' ');
        if (!threatIntel.malwareFamilies.some(m => m.toLowerCase().replace(/[- ]/g, ' ') === normalized)) {
          threatIntel.malwareFamilies.push(match.trim());
        }
      });
    }
  });

  // Extract CVEs
  const cveMatches = text.match(cvePattern);
  if (cveMatches) {
    cveMatches.forEach(match => {
      const normalized = match.trim().toUpperCase().replace(/[- ]/g, '-');
      if (!threatIntel.cves.includes(normalized)) {
        threatIntel.cves.push(normalized);
      }
    });
  }

  // Extract threat actors
  threatActorPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const normalized = match.trim().toLowerCase();
        if (!threatIntel.threatActors.some(ta => ta.toLowerCase() === normalized)) {
          threatIntel.threatActors.push(match.trim());
        }
      });
    }
  });

  return threatIntel;
}

// Main analysis
console.log('Analyzing Sigma rules for threat intelligence...\n');

const files = readdirSync(SIGMA_DIR).filter(f => f.endsWith('.yml'));
const stats = {
  totalRules: files.length,
  withAPT: 0,
  withMalware: 0,
  withCVE: 0,
  withThreatActor: 0,
  aptGroups: new Set(),
  malwareFamilies: new Set(),
  cves: new Set(),
  threatActors: new Set()
};

const sampleRules = [];

files.forEach(file => {
  const filePath = join(SIGMA_DIR, file);
  const content = readFileSync(filePath, 'utf8');
  const sigmaYaml = yaml.load(content);
  const intel = extractThreatIntel(sigmaYaml, file);

  if (intel.aptGroups.length > 0) {
    stats.withAPT++;
    intel.aptGroups.forEach(apt => stats.aptGroups.add(apt.toUpperCase()));
    if (sampleRules.length < 5) {
      sampleRules.push({ title: sigmaYaml.title, intel });
    }
  }

  if (intel.malwareFamilies.length > 0) {
    stats.withMalware++;
    intel.malwareFamilies.forEach(m => stats.malwareFamilies.add(m.toLowerCase()));
  }

  if (intel.cves.length > 0) {
    stats.withCVE++;
    intel.cves.forEach(cve => stats.cves.add(cve));
  }

  if (intel.threatActors.length > 0) {
    stats.withThreatActor++;
    intel.threatActors.forEach(ta => stats.threatActors.add(ta.toLowerCase()));
  }
});

console.log('Statistics:');
console.log(`Total rules: ${stats.totalRules}`);
console.log(`Rules with APT groups: ${stats.withAPT}`);
console.log(`Rules with malware families: ${stats.withMalware}`);
console.log(`Rules with CVEs: ${stats.withCVE}`);
console.log(`Rules with threat actors: ${stats.withThreatActor}`);
console.log(`\nUnique APT groups found: ${stats.aptGroups.size}`);
console.log(Array.from(stats.aptGroups).sort().slice(0, 20).join(', '));
console.log(`\nUnique malware families found: ${stats.malwareFamilies.size}`);
console.log(Array.from(stats.malwareFamilies).sort().slice(0, 20).join(', '));
console.log(`\nUnique CVEs found: ${stats.cves.size}`);
console.log(Array.from(stats.cves).sort().slice(0, 20).join(', '));
console.log(`\nSample rules with threat intel:`);
console.log(JSON.stringify(sampleRules, null, 2));

#!/usr/bin/env node

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import yaml from 'yaml';
import { config } from 'dotenv';
import { ensureBackend, stopBackend } from './startBackend.js';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use environment variables with defaults
const SIGMA_DIR = join(__dirname, '..', process.env.VITE_SIGMA_DIR || 'sigma');
const OUTPUT_FILE = join(__dirname, '..', process.env.VITE_OUTPUT_FILE || 'src/detectionRulesData.js');
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:8080';
const SIGMA_TARGET = process.env.VITE_SIGMA_TARGET || 'opensearch_lucene';
const SIGMA_FORMAT = process.env.VITE_SIGMA_FORMAT || 'dsl_lucene';
const SIGMA_PIPELINE = process.env.VITE_SIGMA_PIPELINE ? process.env.VITE_SIGMA_PIPELINE.split(',').map(p => p.trim()) : [];

/**
 * Convert Sigma rule to OpenSearch DSL using backend API
 */
async function convertSigmaToOpenSearch(sigmaYaml) {
  try {
    // Encode rule as base64
    const ruleBase64 = Buffer.from(sigmaYaml).toString('base64');

    const response = await axios.post(`${BACKEND_URL}/api/v1/convert`, {
      rule: ruleBase64,
      target: SIGMA_TARGET,
      format: SIGMA_FORMAT,
      pipeline: SIGMA_PIPELINE
    });

    return response.data;
  } catch (error) {
    console.error('Conversion error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Map Sigma level to app severity
 */
function mapSeverity(level) {
  const mapping = {
    'critical': 'critical',
    'high': 'high',
    'medium': 'medium',
    'low': 'low',
    'informational': 'informational'
  };
  return mapping[level?.toLowerCase()] || 'medium';
}

/**
 * Extract platform from logsource
 */
function extractPlatform(logsource) {
  const product = logsource?.product?.toLowerCase();
  if (product === 'windows') return 'Windows';
  if (product === 'linux') return 'Linux';
  if (product === 'macos') return 'macOS';
  if (product === 'python' || product === 'sql') return 'Application';
  return 'Cross-Platform';
}

/**
 * Extract event type from logsource category
 * Dynamically converts category to human-readable format
 */
function extractEventType(logsource) {
  const category = logsource?.category;

  // Return 'Other' if no category is found
  if (!category) return 'Other';

  // Convert category to title case with spaces
  // Examples:
  //   'network_connection' -> 'Network Connection'
  //   'process_creation' -> 'Process Creation'
  //   'dns_query' -> 'Dns Query'
  //   'PowerShell' -> 'Powershell'
  const eventType = category
    .replace(/[-_]/g, ' ')  // Replace hyphens and underscores with spaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return eventType;
}

/**
 * Extract malware tags from rule tags
 */
function extractMalwareTags(tags) {
  if (!Array.isArray(tags)) return [];

  const malwarePatterns = [
    'mimikatz', 'cobalt', 'empire', 'metasploit', 'apt', 'ransomware',
    'emotet', 'trickbot', 'ryuk', 'wannacry', 'petya', 'notpetya',
    'revil', 'darkside', 'conti', 'lockbit'
  ];

  const malwareTags = [];
  tags.forEach(tag => {
    const tagLower = tag.toLowerCase();
    malwarePatterns.forEach(pattern => {
      if (tagLower.includes(pattern)) {
        // Capitalize first letter
        const malwareName = pattern.charAt(0).toUpperCase() + pattern.slice(1);
        if (!malwareTags.includes(malwareName)) {
          malwareTags.push(malwareName);
        }
      }
    });
  });

  return malwareTags;
}

/**
 * Extract MITRE ATT&CK and other relevant tags
 */
function extractRelevantTags(tags) {
  if (!Array.isArray(tags)) return [];

  return tags
    .filter(tag => {
      const tagLower = tag.toLowerCase();
      // Include MITRE ATT&CK tags and general security tags
      return tagLower.startsWith('attack.') ||
        ['detection', 'defense-evasion', 'persistence', 'privilege-escalation',
         'credential-access', 'lateral-movement', 'execution', 'initial-access'].includes(tagLower);
    })
    .map(tag => tag.replace('attack.', ''));
}

/**
 * Extract threat intelligence metadata from Sigma rule
 */
function extractThreatIntel(sigmaRule, filename) {
  const threatIntel = {
    aptGroups: [],
    malwareFamilies: [],
    cves: [],
    threatActors: []
  };

  const text = `${sigmaRule.title || ''} ${sigmaRule.description || ''} ${JSON.stringify(sigmaRule.references || [])} ${filename}`.toLowerCase();

  // APT Groups - Common naming patterns
  const aptPatterns = [
    /apt[- ]?\d+/gi,
    /diamond[- ]sleet/gi,
    /forest[- ]blizzard/gi,
    /onyx[- ]sleet/gi,
    /ember[- ]bear/gi,
    /cozy[- ]bear/gi,
    /fancy[- ]bear/gi,
    /charming[- ]kitten/gi,
    /turla/gi,
    /equation[- ]group/gi,
    /carbanak/gi,
    /dragonfly/gi,
    /energetic[- ]bear/gi,
    /sandworm/gi,
    /oilrig/gi,
    /muddywater/gi,
    /lazarus/gi,
    /kimsuky/gi,
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
    /ransomware/gi
  ];

  // CVE patterns
  const cvePattern = /cve[- ]?\d{4}[- ]?\d{4,7}/gi;

  // Extract APT groups
  aptPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const normalized = match.trim().toUpperCase().replace(/[- ]/g, ' ');
        if (!threatIntel.aptGroups.some(apt => apt.toUpperCase().replace(/[- ]/g, ' ') === normalized)) {
          // Capitalize properly
          const formatted = match.trim().split(/[- ]/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          threatIntel.aptGroups.push(formatted);
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
          // Capitalize properly
          const formatted = match.trim().split(/[- ]/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          threatIntel.malwareFamilies.push(formatted);
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

  return threatIntel;
}

/**
 * Generate dummy hunt results for demonstration
 */
function generateDummyResults(ruleId, severity, logsource) {
  const platform = extractPlatform(logsource);
  const eventType = extractEventType(logsource);

  // Generate 1-3 dummy results
  const numResults = Math.floor(Math.random() * 3) + 1;
  const hits = [];

  for (let i = 0; i < numResults; i++) {
    // Random timestamp within last 7 days
    const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();

    const hit = {
      _index: 'logs-2024.01',
      _id: `${ruleId}-${i}`,
      _source: {
        '@timestamp': timestamp,
        event: {
          code: Math.floor(Math.random() * 10000),
          id: Math.floor(Math.random() * 10000)
        },
        host: {
          name: `HOST-${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`
        }
      }
    };

    // Add platform-specific fields
    if (platform === 'Windows') {
      hit._source.process = {
        name: 'suspicious.exe',
        executable: 'C:\\\\Windows\\\\Temp\\\\suspicious.exe',
        pid: Math.floor(Math.random() * 10000)
      };
    } else if (platform === 'Application') {
      hit._source.message = 'Application error occurred';
      hit._source.log = {
        level: 'error'
      };
    }

    hits.push(hit);
  }

  return {
    took: Math.floor(Math.random() * 100),
    hits: {
      total: { value: numResults },
      hits: hits
    }
  };
}

/**
 * Process a single Sigma rule file
 */
async function processSigmaRule(filePath, sigmaYaml) {
  try {
    // Parse YAML
    const sigmaRule = yaml.parse(sigmaYaml);

    // Convert to OpenSearch
    const opensearchQuery = await convertSigmaToOpenSearch(sigmaYaml);

    // Extract threat intelligence
    const threatIntel = extractThreatIntel(sigmaRule, filePath);

    // Build rule object
    const rule = {
      id: sigmaRule.id || `rule-${Date.now()}`,
      title: sigmaRule.title || 'Untitled Rule',
      description: sigmaRule.description || 'No description available',
      category: sigmaRule.logsource?.category || 'General',
      severity: mapSeverity(sigmaRule.level),
      platform: extractPlatform(sigmaRule.logsource),
      eventType: extractEventType(sigmaRule.logsource),
      tags: extractRelevantTags(sigmaRule.tags),
      malwareTags: extractMalwareTags(sigmaRule.tags),
      threatIntel: threatIntel,
      sigma: sigmaYaml,
      opensearch: typeof opensearchQuery === 'string'
        ? opensearchQuery
        : JSON.stringify(opensearchQuery, null, 2),
      huntResults: generateDummyResults(sigmaRule.id, mapSeverity(sigmaRule.level), sigmaRule.logsource)
    };

    return { success: true, rule };
  } catch (error) {
    return { success: false, error: error.message, filePath };
  }
}

/**
 * Load all Sigma rules from directory
 */
async function loadSigmaRules(cliProgress) {
  try {
    const files = await readdir(SIGMA_DIR);
    const yamlFiles = files.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

    console.log(`Found ${yamlFiles.length} Sigma rule(s)\n`);

    // Create progress bar
    const progressBar = new cliProgress.SingleBar({
      format: 'Processing |{bar}| {percentage}% | {value}/{total} rules | {status}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    progressBar.start(yamlFiles.length, 0, { status: 'Starting...' });

    const rules = [];
    const errors = [];

    for (let i = 0; i < yamlFiles.length; i++) {
      const file = yamlFiles[i];
      const filePath = join(SIGMA_DIR, file);
      const content = await readFile(filePath, 'utf-8');

      const result = await processSigmaRule(file, content);

      if (result.success) {
        rules.push(result.rule);
        progressBar.update(i + 1, { status: `✓ ${result.rule.title.substring(0, 40)}...` });
      } else {
        errors.push(result);
        progressBar.update(i + 1, { status: `✗ ${file}` });
      }
    }

    progressBar.stop();

    // Show errors if any
    if (errors.length > 0) {
      console.log(`\n⚠ ${errors.length} rule(s) failed to process:`);
      errors.forEach(err => {
        console.log(`  ✗ ${err.filePath}: ${err.error}`);
      });
    }

    console.log(`\n✓ Successfully processed ${rules.length}/${yamlFiles.length} rule(s)`);

    return rules;
  } catch (error) {
    console.error('Error loading Sigma rules:', error.message);
    throw error;
  }
}

/**
 * Generate JavaScript file with detection rules
 */
async function generateRulesFile(rules) {
  const fileContent = `// Detection Rules Data - Auto-generated from Sigma rules
// DO NOT EDIT THIS FILE MANUALLY - it will be overwritten
// To update rules, add/modify .yml files in the sigma/ directory and run: npm run load-sigma

export const detectionRules = ${JSON.stringify(rules, null, 2)};
`;

  await writeFile(OUTPUT_FILE, fileContent, 'utf-8');
  console.log(`✓ Generated ${OUTPUT_FILE} with ${rules.length} rule(s)`);
}

/**
 * Main execution
 */
async function main(cliProgress) {
  let backendProcess = null;

  try {
    console.log('=== Sigma Rule Loader ===\n');

    // Ensure backend is running
    backendProcess = await ensureBackend();

    // Load and process rules
    const rules = await loadSigmaRules(cliProgress);

    if (rules.length === 0) {
      console.warn('⚠ No rules were processed successfully');
      process.exit(1);
    }

    // Generate output file
    await generateRulesFile(rules);

    console.log('\n✓ Done!\n');
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    process.exit(1);
  } finally {
    // Stop backend if we started it
    if (backendProcess) {
      stopBackend(backendProcess);
    }
  }
}

// Install required packages first
console.log('Note: This script requires "yaml" and "cli-progress" packages. Installing...\n');
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

try {
  await execAsync('npm install yaml cli-progress');
  console.log('✓ Dependencies ready\n');
} catch (error) {
  console.error('Failed to install required packages:', error.message);
  process.exit(1);
}

// Dynamically import cli-progress after installation
const cliProgress = await import('cli-progress');

// Run main
main(cliProgress.default);

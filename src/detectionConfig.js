// Detection Config - Field mappings for relevant fields per rule
export const getRelevantFields = (ruleId) => {
  const fieldMap = {
    'rule-001': ['process.executable', 'network.direction', 'event.code'],
    'rule-002': ['process.executable', 'process.pe.original_file_name', 'event.code'],
    'rule-003': ['registry.path', 'event.code'],
    'rule-004': ['file.path', 'file.extension', 'event.code'],
    'rule-005': ['process.executable', 'process.command_line', 'event.code'],
    'rule-006': ['wmi.consumer.type', 'event.code', 'event.action'],
    'rule-007': ['dns.question.name', 'event.code'],
    'rule-008': ['process.target.executable', 'process.access.granted', 'event.code'],
    'rule-009': ['process.command_line', 'event.code'],
    'rule-010': ['process.executable', 'process.command_line', 'event.code']
  };
  return fieldMap[ruleId] || [];
};
import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, ChevronRight, ArrowLeft, Copy, Check, Play, X, AlertTriangle, Clock, ChevronDown, ChevronUp, CheckSquare, Square, Calendar, Trash2, List, SlidersHorizontal, Server, CheckCircle2, Loader2 } from 'lucide-react';
import { detectionRules } from './detectionRulesData';
import { getRelevantFields } from './detectionConfig';

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-2 ${
      type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' :
      type === 'error' ? 'bg-red-50 border-red-500 text-red-900' :
      'bg-blue-50 border-blue-500 text-blue-900'
    }`}>
      <CheckCircle2 className="w-5 h-5" />
      <span className="flex-1 font-medium">{message}</span>
      <button onClick={onClose} className="hover:opacity-70">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Elapsed Time Component
const ElapsedTime = ({ startTime }) => {
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [startTime]);

  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return (
    <span className="text-sm font-mono text-slate-300">
      {minutes}:{remainingSeconds.toString().padStart(2, '0')}
    </span>
  );
};

// Code Block Component with Prism.js Syntax Highlighting
const CodeBlock = ({ code, language }) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef(null);
  
  useEffect(() => {
    // Load Prism.js CSS and JS from CDN
    if (!document.getElementById('prism-css')) {
      const link = document.createElement('link');
      link.id = 'prism-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css';
      document.head.appendChild(link);
    }
    
    if (!window.Prism) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
      script.onload = () => {
        // Load JSON language support
        const jsonScript = document.createElement('script');
        jsonScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js';
        jsonScript.onload = () => {
          if (codeRef.current && window.Prism) {
            window.Prism.highlightElement(codeRef.current);
          }
        };
        document.head.appendChild(jsonScript);
      };
      document.head.appendChild(script);
    } else {
      // Prism already loaded, just highlight
      if (codeRef.current) {
        window.Prism.highlightElement(codeRef.current);
      }
    }
  }, [code, language]);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors text-xs font-medium shadow-lg"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="bg-slate-900 rounded-lg overflow-hidden border-2 border-slate-700">
        <div className="flex">
          {/* Line numbers */}
          <div className="bg-slate-800 px-4 py-4 text-slate-500 font-mono text-sm select-none border-r-2 border-slate-700">
            {lines.map((_, i) => (
              <div key={i} className="leading-6 text-right font-semibold">
                {i + 1}
              </div>
            ))}
          </div>
          {/* Code content with Prism highlighting */}
          <pre className="flex-1 px-4 py-4 overflow-x-auto m-0" style={{ background: 'transparent' }}>
            <code ref={codeRef} className={`language-${language}`} style={{ background: 'transparent' }}>
              {code}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [currentPage, setCurrentPage] = useState('list');
  const [activeTab, setActiveTab] = useState('library');
  const [selectedRule, setSelectedRule] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState([]);
  const [selectedEventType, setSelectedEventType] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState([]);
  const [selectedMalwareTags, setSelectedMalwareTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedAPTGroups, setSelectedAPTGroups] = useState([]);
  const [selectedMalwareFamilies, setSelectedMalwareFamilies] = useState([]);
  const [selectedCVEs, setSelectedCVEs] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isHunting, setIsHunting] = useState(false);
  const [malwareTagFilter, setMalwareTagFilter] = useState('');
  const [expandedResults, setExpandedResults] = useState({});
  const [selectedRules, setSelectedRules] = useState([]);
  const [huntSessions, setHuntSessions] = useState([]);
  const [huntResults, setHuntResults] = useState([]);
  const [timeWindow, setTimeWindow] = useState(import.meta.env.VITE_DEFAULT_TIME_WINDOW || '1d');
  const [showTimeWindow, setShowTimeWindow] = useState(false);
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showWorkbench, setShowWorkbench] = useState(false);
  const [selectedEndpoints, setSelectedEndpoints] = useState([]);
  const [showEndpointSelector, setShowEndpointSelector] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [opensearchHealth, setOpensearchHealth] = useState('unknown'); // 'connected', 'disconnected', 'unknown'
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [cancelHunt, setCancelHunt] = useState(false);
  const [huntStartTime, setHuntStartTime] = useState(null);
  const [severityFilterCollapsed, setSeverityFilterCollapsed] = useState(false);
  const [platformFilterCollapsed, setPlatformFilterCollapsed] = useState(false);
  const [eventTypeFilterCollapsed, setEventTypeFilterCollapsed] = useState(false);
  const rulesPerPage = parseInt(import.meta.env.VITE_RULES_PER_PAGE || '10');
  const showEndpointsFilter = import.meta.env.VITE_SHOW_ENDPOINTS_FILTER === 'true';

  // OpenSearch configuration from environment variables
  const opensearchUrl = import.meta.env.VITE_OPENSEARCH_URL || 'http://localhost:9200';
  const opensearchUsername = import.meta.env.VITE_OPENSEARCH_USERNAME || '';
  const opensearchPassword = import.meta.env.VITE_OPENSEARCH_PASSWORD || '';

  // Check URL parameters for direct rule navigation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ruleId = params.get('rule');

    if (ruleId) {
      const rule = detectionRules.find(r => r.id === ruleId);
      if (rule) {
        setSelectedRule(rule);
        setCurrentPage('detail');
      }
    }
  }, []);

  // Test OpenSearch connection on mount (silently)
  useEffect(() => {
    const silentTest = async () => {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (opensearchUsername && opensearchPassword) {
          const auth = btoa(`${opensearchUsername}:${opensearchPassword}`);
          headers['Authorization'] = `Basic ${auth}`;
        }
        const response = await fetch('/api/opensearch/_cluster/health', {
          method: 'GET',
          headers
        });
        if (response.ok) {
          setOpensearchHealth('connected');
        } else {
          setOpensearchHealth('disconnected');
        }
      } catch (error) {
        setOpensearchHealth('disconnected');
      }
    };
    silentTest();
  }, []);


  // Parse time window options from environment variables
  const timeWindowOptions = (() => {
    const envWindows = import.meta.env.VITE_TIME_WINDOWS;
    if (envWindows) {
      return envWindows.split(',').map(opt => {
        const [value, label] = opt.split(':');
        return { value: value.trim(), label: label.trim() };
      });
    }
    // Default if not set
    return [
      { value: '6h', label: '6 Hours' },
      { value: '1d', label: '1 Day' },
      { value: '3d', label: '3 Days' },
      { value: '1w', label: '1 Week' },
      { value: '1m', label: '1 Month' }
    ];
  })();

  const severityColors = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-blue-100 text-blue-800 border-blue-300'
  };

  const severityBadgeColors = {
    critical: 'bg-red-600 text-white',
    high: 'bg-orange-600 text-white',
    medium: 'bg-yellow-600 text-white',
    low: 'bg-blue-600 text-white'
  };

  // Mock endpoints data
  const mockEndpoints = [
    { id: 'ep-001', name: 'DC-PRIMARY', type: 'Domain Controller', os: 'Windows Server 2019', status: 'online' },
    { id: 'ep-002', name: 'DC-SECONDARY', type: 'Domain Controller', os: 'Windows Server 2019', status: 'online' },
    { id: 'ep-003', name: 'WEB-SERVER-01', type: 'Web Server', os: 'Ubuntu 20.04', status: 'online' },
    { id: 'ep-004', name: 'WEB-SERVER-02', type: 'Web Server', os: 'Ubuntu 20.04', status: 'online' },
    { id: 'ep-005', name: 'DB-SERVER-01', type: 'Database Server', os: 'RHEL 8', status: 'online' },
    { id: 'ep-006', name: 'DB-SERVER-02', type: 'Database Server', os: 'RHEL 8', status: 'online' },
    { id: 'ep-007', name: 'FILE-SERVER-01', type: 'File Server', os: 'Windows Server 2022', status: 'online' },
    { id: 'ep-008', name: 'APP-SERVER-01', type: 'Application Server', os: 'Windows Server 2019', status: 'online' },
    { id: 'ep-009', name: 'APP-SERVER-02', type: 'Application Server', os: 'Ubuntu 22.04', status: 'offline' },
    { id: 'ep-010', name: 'WORKSTATION-001', type: 'Workstation', os: 'Windows 11', status: 'online' },
    { id: 'ep-011', name: 'WORKSTATION-002', type: 'Workstation', os: 'Windows 10', status: 'online' },
    { id: 'ep-012', name: 'MAIL-SERVER-01', type: 'Mail Server', os: 'Exchange 2019', status: 'online' },
  ];

  // Extract unique values for filters
  const uniqueSeverities = [...new Set(detectionRules.map(r => r.severity))];
  const uniquePlatforms = [...new Set(detectionRules.map(r => r.platform))];
  const uniqueEventTypes = [...new Set(detectionRules.map(r => r.eventType))];
  const uniqueCategories = [...new Set(detectionRules.map(r => r.category))];
  const uniqueMalwareTags = [...new Set(detectionRules.flatMap(r => r.malwareTags))].filter(Boolean);
  const uniqueTags = [...new Set(detectionRules.flatMap(r => r.tags))].filter(Boolean);
  const uniqueAPTGroups = [...new Set(detectionRules.flatMap(r => r.threatIntel?.aptGroups || []))].filter(Boolean).sort();
  const uniqueMalwareFamilies = [...new Set(detectionRules.flatMap(r => r.threatIntel?.malwareFamilies || []))].filter(Boolean).sort();
  const uniqueCVEs = [...new Set(detectionRules.flatMap(r => r.threatIntel?.cves || []))].filter(Boolean).sort();

  // Add toast notification
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // Advanced filtering logic
  const filteredRules = detectionRules.filter(rule => {
    const matchesSearch = rule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = selectedSeverity.length === 0 || selectedSeverity.includes(rule.severity);
    const matchesPlatform = selectedPlatform.length === 0 || selectedPlatform.includes(rule.platform);
    const matchesEventType = selectedEventType.length === 0 || selectedEventType.includes(rule.eventType);
    const matchesCategory = selectedCategory.length === 0 || selectedCategory.includes(rule.category);
    const matchesMalwareTags = selectedMalwareTags.length === 0 ||
                                selectedMalwareTags.some(tag => rule.malwareTags.includes(tag));
    const matchesTags = selectedTags.length === 0 ||
                        selectedTags.some(tag => rule.tags.includes(tag));
    const matchesAPTGroups = selectedAPTGroups.length === 0 ||
                             selectedAPTGroups.some(apt => rule.threatIntel?.aptGroups?.includes(apt));
    const matchesMalwareFamilies = selectedMalwareFamilies.length === 0 ||
                                   selectedMalwareFamilies.some(malware => rule.threatIntel?.malwareFamilies?.includes(malware));
    const matchesCVEs = selectedCVEs.length === 0 ||
                        selectedCVEs.some(cve => rule.threatIntel?.cves?.includes(cve));

    return matchesSearch && matchesSeverity && matchesPlatform && matchesEventType &&
           matchesCategory && matchesMalwareTags && matchesTags && matchesAPTGroups &&
           matchesMalwareFamilies && matchesCVEs;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredRules.length / rulesPerPage);
  const startIndex = (currentPageNum - 1) * rulesPerPage;
  const endIndex = startIndex + rulesPerPage;
  const paginatedRules = filteredRules.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPageNum(1);
  }, [searchTerm, selectedSeverity, selectedPlatform, selectedEventType, selectedCategory, selectedMalwareTags, selectedTags, selectedAPTGroups, selectedMalwareFamilies, selectedCVEs]);

  const toggleRuleSelection = (ruleId) => {
    setSelectedRules(prev => {
      if (prev.includes(ruleId)) {
        return prev.filter(id => id !== ruleId);
      } else {
        return [...prev, ruleId];
      }
    });
  };

  const toggleSelectAll = () => {
    // Check if all FILTERED rules are selected (not just current page)
    const allFilteredRuleIds = filteredRules.map(rule => rule.id);
    const allFilteredSelected = allFilteredRuleIds.every(id => selectedRules.includes(id));

    if (allFilteredSelected) {
      // Deselect all filtered rules
      setSelectedRules(prev => prev.filter(id => !allFilteredRuleIds.includes(id)));
    } else {
      // Select all filtered rules
      setSelectedRules(prev => {
        const newSelected = [...prev];
        allFilteredRuleIds.forEach(id => {
          if (!newSelected.includes(id)) {
            newSelected.push(id);
          }
        });
        return newSelected;
      });
    }
  };

  const viewRuleDetail = (rule) => {
    setSelectedRule(rule);
    setCurrentPage('detail');
    // Update URL to allow opening in new tab
    const url = new URL(window.location);
    url.searchParams.set('rule', rule.id);
    window.history.pushState({}, '', url);
  };

  const handleMultiHunt = async () => {
    if (selectedRules.length === 0) return;

    // Check if OpenSearch is configured
    if (!opensearchUrl) {
      addToast('Please configure OpenSearch connection in settings first', 'error');
      return;
    }

    setShowTimeWindow(false);
    setShowEndpointSelector(false);
    setIsHunting(true);
    setCancelHunt(false);
    setHuntStartTime(Date.now());

    // Create new hunt session
    const sessionId = `hunt-${Date.now()}`;

    // Calculate time range
    let startTime, endTime;
    if (timeWindow === 'custom') {
      startTime = new Date(customStartDate).toISOString();
      endTime = new Date(customEndDate).toISOString();
    } else {
      endTime = new Date().toISOString();
      const timeWindowMs = parseTimeWindow(timeWindow);
      startTime = new Date(Date.now() - timeWindowMs).toISOString();
    }

    const newSession = {
      id: sessionId,
      ruleCount: selectedRules.length,
      ruleIds: [...selectedRules],
      endpointCount: selectedEndpoints.length || mockEndpoints.filter(e => e.status === 'online').length,
      timeWindow: timeWindow === 'custom'
        ? `${new Date(customStartDate).toLocaleString()} - ${new Date(customEndDate).toLocaleString()}`
        : timeWindowOptions.find(opt => opt.value === timeWindow)?.label,
      status: 'running',
      progress: 0,
      startTime: new Date().toISOString(),
      results: []
    };

    setHuntSessions(prev => [newSession, ...prev]);
    setActiveTab('results');

    try {
      // Execute queries for all selected rules
      const allResults = [];
      let completedRules = 0;

      for (const ruleId of selectedRules) {
        // Check if hunt was cancelled
        if (cancelHunt) {
          throw new Error('Hunt cancelled by user');
        }

        const rule = detectionRules.find(r => r.id === ruleId);
        if (!rule) continue;

        try {
          // Execute OpenSearch query
          const queryResult = await executeOpenSearchQuery(rule, startTime, endTime);

          // Process results
          if (queryResult.hits && queryResult.hits.hits) {
            queryResult.hits.hits.forEach(hit => {
              allResults.push({
                ...hit,
                ruleName: rule.title,
                ruleId: rule.id,
                severity: rule.severity,
                sessionId: sessionId
              });
            });
          }
        } catch (error) {
          console.error(`Error executing rule "${rule.title}":`, error);
          // Continue with other rules even if one fails
        }

        // Update progress
        completedRules++;
        const progress = (completedRules / selectedRules.length) * 100;
        setHuntSessions(prev => prev.map(session => {
          if (session.id === sessionId) {
            return { ...session, progress };
          }
          return session;
        }));
      }

      // Sort by timestamp
      allResults.sort((a, b) =>
        new Date(b._source['@timestamp']) - new Date(a._source['@timestamp'])
      );

      // Update session with results
      setHuntSessions(prev => prev.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            status: 'completed',
            progress: 100,
            endTime: new Date().toISOString(),
            results: allResults,
            threatCount: allResults.length
          };
        }
        return session;
      }));

      addToast(
        `Hunt completed: ${allResults.length} threat${allResults.length !== 1 ? 's' : ''} found across ${selectedRules.length} rule${selectedRules.length !== 1 ? 's' : ''}`,
        'success'
      );
    } catch (error) {
      console.error('Hunt failed:', error);

      // Update session status to failed
      setHuntSessions(prev => prev.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            status: 'failed',
            progress: 0,
            endTime: new Date().toISOString(),
            error: error.message
          };
        }
        return session;
      }));

      addToast(`Hunt failed: ${error.message}`, 'error');
    } finally {
      setIsHunting(false);
      setHuntStartTime(null);
      setCancelHunt(false);
    }
  };

  const handleCancelHunt = () => {
    setCancelHunt(true);
    addToast('Cancelling hunt...', 'info');
  };

  const toggleResultExpansion = (resultId) => {
    setExpandedResults(prev => ({
      ...prev,
      [resultId]: !prev[resultId]
    }));
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const getFieldValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj) || 'N/A';
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Parse time window to milliseconds
  const parseTimeWindow = (timeWindowStr) => {
    const match = timeWindowStr.match(/^(\d+)(h|d|w|m)$/);
    if (!match) return 86400000; // Default 1 day

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers = {
      'h': 3600000,        // hours
      'd': 86400000,       // days
      'w': 604800000,      // weeks
      'm': 2592000000      // ~30 days
    };

    return value * (multipliers[unit] || 86400000);
  };

  // Execute OpenSearch query for a single rule
  const executeOpenSearchQuery = async (rule, startTime, endTime) => {
    try {
      // Parse the OpenSearch query from the rule
      const queryObj = JSON.parse(rule.opensearch);

      // Add time range filter
      if (!queryObj.query.bool.filter) {
        queryObj.query.bool.filter = [];
      }

      queryObj.query.bool.filter.push({
        range: {
          '@timestamp': {
            gte: startTime,
            lte: endTime,
            format: 'strict_date_optional_time'
          }
        }
      });

      // Build headers
      const headers = {
        'Content-Type': 'application/json'
      };

      if (opensearchUsername && opensearchPassword) {
        const auth = btoa(`${opensearchUsername}:${opensearchPassword}`);
        headers['Authorization'] = `Basic ${auth}`;
      }

      // Execute query against all indices using vite proxy
      const response = await fetch('/api/opensearch/*/_search', {
        method: 'POST',
        headers,
        body: JSON.stringify(queryObj)
      });

      if (!response.ok) {
        throw new Error(`OpenSearch query failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`Error executing query for rule "${rule.title}":`, error);
      throw error;
    }
  };

  const testConnection = async () => {
    setConnectionStatus('Testing connection...');
    setIsTestingConnection(true);
    try {
      // Build headers
      const headers = {
        'Content-Type': 'application/json'
      };

      // Add authorization if credentials provided
      if (opensearchUsername && opensearchPassword) {
        const auth = btoa(`${opensearchUsername}:${opensearchPassword}`);
        headers['Authorization'] = `Basic ${auth}`;
      }

      // Use vite proxy endpoint
      const response = await fetch('/api/opensearch/_cluster/health', {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setConnectionStatus(`✓ Connection successful! Cluster: ${data.cluster_name || 'Unknown'}, Status: ${data.status || 'Unknown'}`);
        setOpensearchHealth('connected');
        addToast('OpenSearch connection successful', 'success');
      } else {
        // Try to get error details from response body
        let errorDetails = `${response.status} ${response.statusText}`;
        try {
          const errorBody = await response.text();
          if (errorBody) {
            const errorJson = JSON.parse(errorBody);
            if (errorJson.error) {
              errorDetails += ` - ${errorJson.error.type || ''}: ${errorJson.error.reason || ''}`;
            }
          }
        } catch (e) {
          // If parsing fails, use basic error
        }

        setConnectionStatus(`✗ Connection failed: ${errorDetails}`);
        setOpensearchHealth('disconnected');
        addToast(`Connection failed: ${errorDetails}`, 'error');
      }
    } catch (error) {
      // More detailed error messages
      let errorMsg = error.message;

      if (error.message.includes('Failed to fetch')) {
        errorMsg = 'Network error - Check if OpenSearch URL is correct in .env file';
      } else if (error.message.includes('NetworkError')) {
        errorMsg = 'Network error - OpenSearch server may be unreachable';
      }

      setConnectionStatus(`✗ Connection failed: ${errorMsg}`);
      setOpensearchHealth('disconnected');
      addToast(`Connection error: ${errorMsg}`, 'error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  if (currentPage === 'detail' && selectedRule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
        {/* Toast Container */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            />
          ))}
        </div>
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <button
              onClick={() => {
                setCurrentPage('list');
                // Clear URL parameter when going back
                const url = new URL(window.location);
                url.searchParams.delete('rule');
                window.history.pushState({}, '', url);
              }}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors mb-3"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Rules</span>
            </button>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">{selectedRule.title}</h1>
                <p className="text-slate-300 mt-2">{selectedRule.description}</p>
              </div>
              <span className={`px-4 py-2 rounded-lg border font-semibold text-sm ${severityColors[selectedRule.severity]}`}>
                {selectedRule.severity.toUpperCase()}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {/* Regular tags */}
              {selectedRule.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                  {tag}
                </span>
              ))}
              {/* Malware tags */}
              {selectedRule.malwareTags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-medium border border-rose-200">
                  🦠 {tag}
                </span>
              ))}
              {/* Threat Intel - APT Groups */}
              {selectedRule.threatIntel?.aptGroups.map(apt => (
                <span key={apt} className="px-3 py-1.5 bg-red-600 text-white rounded-full text-sm font-bold border-2 border-red-800 shadow-md">
                  🎯 {apt}
                </span>
              ))}
              {/* Threat Intel - Malware Families */}
              {selectedRule.threatIntel?.malwareFamilies.map(malware => (
                <span key={malware} className="px-3 py-1.5 bg-orange-600 text-white rounded-full text-sm font-bold border-2 border-orange-800 shadow-md">
                  ⚠️ {malware}
                </span>
              ))}
              {/* Threat Intel - CVEs */}
              {selectedRule.threatIntel?.cves.map(cve => (
                <span key={cve} className="px-3 py-1.5 bg-purple-600 text-white rounded-full text-sm font-bold border-2 border-purple-800 shadow-md">
                  🔒 {cve}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Side by side comparison */}
        <div className="max-w-7xl mx-auto px-6 py-8 flex-grow">
          <div className="grid grid-cols-2 gap-6">
            {/* Sigma Rule */}
            <div className="bg-slate-800 rounded-xl shadow-md border border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Sigma Detection Rule</h2>
                <button
                  onClick={() => copyToClipboard(selectedRule.sigma)}
                  className="p-2 hover:bg-indigo-500 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="p-6">
                <pre className="text-sm text-slate-200 font-mono whitespace-pre-wrap bg-slate-900 p-4 rounded-lg border border-slate-700 overflow-x-auto">
                  {selectedRule.sigma}
                </pre>
              </div>
            </div>

            {/* OpenSearch Query */}
            <div className="bg-slate-800 rounded-xl shadow-md border border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
                <h2 className="text-xl font-bold text-white">OpenSearch Query</h2>
              </div>
              <div className="p-6">
                <CodeBlock code={selectedRule.opensearch} language="json" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-slate-800 to-slate-900 border-t border-slate-700 mt-8">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <p className="text-center text-slate-300 text-sm font-medium">Made by RND Team</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          />
        ))}
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <img src="/logo-ib.svg" alt="Logo" className="h-12" />
              <h1 className="text-2xl font-bold text-white tracking-wide bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Threat Hunt Catalog
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-indigo-300 rounded-lg border border-slate-600">
                <span className="font-semibold text-sm">Total Rules:</span>
                <span className="font-bold text-lg">{detectionRules.length}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-emerald-300 rounded-lg border border-slate-600">
                <span className="font-semibold text-sm">Filtered:</span>
                <span className="font-bold text-lg">{filteredRules.length}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* OpenSearch Connection Indicator */}
                <div
                  className="relative group"
                  title={
                    opensearchHealth === 'connected'
                      ? 'OpenSearch Connected'
                      : opensearchHealth === 'disconnected'
                      ? 'OpenSearch Disconnected'
                      : 'OpenSearch Status Unknown'
                  }
                >
                  <div className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 ${
                    opensearchHealth === 'connected'
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                      : opensearchHealth === 'disconnected'
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/50'
                      : 'bg-gray-500 text-white shadow-lg shadow-gray-500/50'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      opensearchHealth === 'connected' ? 'bg-white' : 'bg-white/70'
                    }`} />
                    {opensearchHealth === 'connected' ? 'LIVE' : 'NO CONNECTION'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6 border-b border-slate-600">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-4 py-2 font-semibold transition-all border-b-2 ${
                activeTab === 'library'
                  ? 'border-indigo-400 text-indigo-300'
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              Rule Library
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 font-semibold transition-all border-b-2 ${
                activeTab === 'results'
                  ? 'border-indigo-400 text-indigo-300'
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              Hunt Results {huntResults.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-indigo-600 text-white rounded-full text-xs font-bold">
                  {huntResults.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Workbench Panel */}
      {showWorkbench && (
        <div className="bg-slate-800 border-b border-slate-700 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <List className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl font-bold text-white">Selected Rules Workbench</h2>
                <span className="px-2 py-1 bg-amber-900 text-amber-200 rounded-lg text-sm font-semibold border border-amber-700">
                  {selectedRules.length} rule{selectedRules.length !== 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={() => setSelectedRules([])}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-900 text-red-200 rounded-lg hover:bg-red-800 transition-colors font-medium text-sm border border-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>
            {selectedRules.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">No rules selected. Select rules from the library below.</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedRules.map(ruleId => {
                    const rule = detectionRules.find(r => r.id === ruleId);
                    if (!rule) return null;
                    return (
                      <div key={rule.id} className="bg-slate-700 rounded-lg border-2 border-amber-600 p-3 hover:border-amber-500 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                rule.severity === 'critical' ? 'bg-red-600 text-white' :
                                rule.severity === 'high' ? 'bg-orange-600 text-white' :
                                rule.severity === 'medium' ? 'bg-yellow-600 text-white' :
                                'bg-blue-600 text-white'
                              }`}>
                                {rule.severity.toUpperCase()}
                              </span>
                              <span className="text-xs text-slate-300 font-medium">{rule.platform}</span>
                            </div>
                            <h3 className="font-semibold text-sm text-white line-clamp-2 mb-1">{rule.title}</h3>
                            <p className="text-xs text-slate-300 line-clamp-2 mb-1">{rule.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {rule.threatIntel?.aptGroups.slice(0, 1).map(apt => (
                                <span key={apt} className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-[10px] font-bold border border-red-300">
                                  🎯 {apt}
                                </span>
                              ))}
                              {rule.threatIntel?.malwareFamilies.slice(0, 1).map(malware => (
                                <span key={malware} className="px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded text-[10px] font-medium border border-orange-300">
                                  ⚠️ {malware}
                                </span>
                              ))}
                              {rule.threatIntel?.cves.slice(0, 1).map(cve => (
                                <span key={cve} className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-[10px] font-medium border border-purple-300">
                                  🔒 {cve}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => toggleRuleSelection(rule.id)}
                            className="flex-shrink-0 p-1 hover:bg-red-100 rounded transition-colors"
                            title="Remove from workbench"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex-grow">
        {/* Library Tab */}
        {activeTab === 'library' && (
          <div className="flex gap-6">
            {/* Left Sidebar */}
            <div className="w-80 flex-shrink-0 space-y-4">
              {/* Hunt Controls Section */}
              <div className="bg-slate-800 rounded-xl shadow-md border border-slate-700 p-4 space-y-3">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Hunt Controls
                </h3>

                {/* Workbench Button */}
                <button
                  onClick={() => setShowWorkbench(!showWorkbench)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-semibold transition-all ${
                    selectedRules.length > 0
                      ? 'bg-amber-900 text-amber-200 border-2 border-amber-600 hover:bg-amber-800'
                      : 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <List className="w-5 h-5" />
                    <span>Workbench</span>
                  </div>
                  {selectedRules.length > 0 && (
                    <span className="px-2 py-0.5 bg-amber-600 text-white rounded-full text-xs font-bold">
                      {selectedRules.length}
                    </span>
                  )}
                </button>

                {/* Endpoint Selector */}
                {showEndpointsFilter && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowEndpointSelector(!showEndpointSelector);
                      setShowTimeWindow(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all ${
                      selectedEndpoints.length > 0
                        ? 'bg-cyan-900 text-cyan-200 border-2 border-cyan-600 hover:bg-cyan-800'
                        : 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Server className="w-5 h-5" />
                      <span className="text-sm">
                        {selectedEndpoints.length > 0
                          ? `${selectedEndpoints.length} Endpoint${selectedEndpoints.length > 1 ? 's' : ''}`
                          : 'All Endpoints'}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showEndpointSelector && (
                    <div className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-20 max-h-96 overflow-y-auto">
                      <div className="px-4 py-2 border-b border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-900 text-sm">Select Endpoints</span>
                          <button
                            onClick={() => setSelectedEndpoints([])}
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            Clear All
                          </button>
                        </div>
                        <p className="text-xs text-slate-600">Leave empty for all</p>
                      </div>
                      {mockEndpoints.map(endpoint => (
                        <button
                          key={endpoint.id}
                          onClick={() => {
                            setSelectedEndpoints(prev =>
                              prev.includes(endpoint.id)
                                ? prev.filter(id => id !== endpoint.id)
                                : [...prev, endpoint.id]
                            );
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors ${
                            selectedEndpoints.includes(endpoint.id) ? 'bg-cyan-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                              selectedEndpoints.includes(endpoint.id)
                                ? 'bg-cyan-600 border-cyan-600'
                                : 'border-slate-300'
                            }`}>
                              {selectedEndpoints.includes(endpoint.id) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-slate-900">{endpoint.name}</span>
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                  endpoint.status === 'online'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {endpoint.status}
                                </span>
                              </div>
                              <div className="text-xs text-slate-600">{endpoint.type}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                )}

                {/* Time Window Selector */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowTimeWindow(!showTimeWindow);
                      setShowEndpointSelector(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg transition-colors font-medium text-slate-300"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      <span className="text-sm">
                        {timeWindow === 'custom'
                          ? 'Custom Range'
                          : timeWindowOptions.find(opt => opt.value === timeWindow)?.label || 'Select Time'}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showTimeWindow && (
                    <div className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-20">
                      {timeWindowOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setTimeWindow(option.value);
                            setCustomStartDate('');
                            setCustomEndDate('');
                            setShowTimeWindow(false);
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors ${
                            timeWindow === option.value ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-slate-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                      <div className="border-t border-slate-200 mt-2 pt-2 px-4">
                        <div className="text-xs font-semibold text-slate-700 mb-2">Custom Date Range</div>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs text-slate-600 block mb-1">Start Date/Time</label>
                            <input
                              type="datetime-local"
                              value={customStartDate}
                              onChange={(e) => setCustomStartDate(e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-600 block mb-1">End Date/Time</label>
                            <input
                              type="datetime-local"
                              value={customEndDate}
                              onChange={(e) => setCustomEndDate(e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                            />
                          </div>
                          <button
                            onClick={() => {
                              if (customStartDate && customEndDate) {
                                setTimeWindow('custom');
                                setShowTimeWindow(false);
                              }
                            }}
                            disabled={!customStartDate || !customEndDate}
                            className="w-full px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                          >
                            Apply Custom Range
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hunt Button */}
                <button
                  onClick={handleMultiHunt}
                  disabled={isHunting || selectedRules.length === 0}
                  className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg font-semibold text-white transition-all shadow-lg ${
                    isHunting || selectedRules.length === 0
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl'
                  }`}
                >
                  <Play className="w-5 h-5" />
                  {isHunting ? 'Hunting...' : 'Start Hunt'}
                </button>
              </div>

              {/* Filters Section */}
              <div className="bg-slate-800 rounded-xl shadow-md border border-slate-700 p-4 space-y-3">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </h3>

                {/* Severity Filter */}
                <div>
                  <button
                    onClick={() => setSeverityFilterCollapsed(!severityFilterCollapsed)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 mb-2 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      Severity {selectedSeverity.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-purple-600 text-white rounded-full text-xs">
                          {selectedSeverity.length}
                        </span>
                      )}
                    </span>
                    {severityFilterCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  {!severityFilterCollapsed && (
                    <div className="space-y-1.5">
                      {['critical', 'high', 'medium', 'low'].map(severity => (
                        <label key={severity} className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedSeverity.includes(severity)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSeverity([...selectedSeverity, severity]);
                              } else {
                                setSelectedSeverity(selectedSeverity.filter(s => s !== severity));
                              }
                            }}
                            className="w-4 h-4 text-purple-600 border-slate-500 rounded focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="text-sm text-slate-200 capitalize">{severity}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Platform Filter */}
                <div>
                  <button
                    onClick={() => setPlatformFilterCollapsed(!platformFilterCollapsed)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 mb-2 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      Platform {selectedPlatform.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-purple-600 text-white rounded-full text-xs">
                          {selectedPlatform.length}
                        </span>
                      )}
                    </span>
                    {platformFilterCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  {!platformFilterCollapsed && (
                    <div className="space-y-1.5">
                      {['Windows', 'Linux', 'macOS', 'Cross-Platform'].map(platform => (
                        <label key={platform} className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedPlatform.includes(platform)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPlatform([...selectedPlatform, platform]);
                              } else {
                                setSelectedPlatform(selectedPlatform.filter(p => p !== platform));
                              }
                            }}
                            className="w-4 h-4 text-purple-600 border-slate-500 rounded focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="text-sm text-slate-200">{platform}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Event Type Filter */}
                <div>
                  <button
                    onClick={() => setEventTypeFilterCollapsed(!eventTypeFilterCollapsed)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 mb-2 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      Event Type {selectedEventType.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-purple-600 text-white rounded-full text-xs">
                          {selectedEventType.length}
                        </span>
                      )}
                    </span>
                    {eventTypeFilterCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  {!eventTypeFilterCollapsed && (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {['Network Connection', 'Process Creation', 'File Creation', 'Registry', 'PowerShell', 'WMI', 'DNS Query', 'Application Log', 'Web Server', 'Other'].map(eventType => (
                        <label key={eventType} className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedEventType.includes(eventType)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEventType([...selectedEventType, eventType]);
                              } else {
                                setSelectedEventType(selectedEventType.filter(t => t !== eventType));
                              }
                            }}
                            className="w-4 h-4 text-purple-600 border-slate-500 rounded focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="text-sm text-slate-200">{eventType}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Threat Intel Filters Toggle */}
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-indigo-900 text-indigo-200 rounded-lg hover:bg-indigo-800 transition-colors font-medium border border-indigo-700"
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5" />
                    <span className="text-sm">Threat Intel</span>
                  </div>
                  {(selectedAPTGroups.length + selectedMalwareFamilies.length + selectedCVEs.length) > 0 && (
                    <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-full text-xs font-bold">
                      {selectedAPTGroups.length + selectedMalwareFamilies.length + selectedCVEs.length}
                    </span>
                  )}
                </button>

                {/* Threat Intelligence Filters */}
                {showAdvancedFilters && (
                  <div className="border-t border-slate-700 pt-3 mt-3 space-y-3">
                    {/* APT Groups Filter */}
                    {uniqueAPTGroups.length > 0 && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-200 mb-2 flex items-center gap-2">
                          <span className="text-red-400">🎯</span> APT Groups ({selectedAPTGroups.length}/{uniqueAPTGroups.length})
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-slate-600 rounded-lg p-2 bg-slate-700">
                          {uniqueAPTGroups.map(apt => (
                            <label key={apt} className="flex items-center gap-2 py-1 hover:bg-slate-600 px-2 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedAPTGroups.includes(apt)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAPTGroups([...selectedAPTGroups, apt]);
                                  } else {
                                    setSelectedAPTGroups(selectedAPTGroups.filter(a => a !== apt));
                                  }
                                }}
                                className="w-4 h-4 text-red-600 rounded"
                              />
                              <span className="text-xs text-slate-200">{apt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Malware Families Filter */}
                    {uniqueMalwareFamilies.length > 0 && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-200 mb-2 flex items-center gap-2">
                          <span className="text-orange-400">⚠️</span> Malware Families ({selectedMalwareFamilies.length}/{uniqueMalwareFamilies.length})
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-slate-600 rounded-lg p-2 bg-slate-700">
                          {uniqueMalwareFamilies.map(malware => (
                            <label key={malware} className="flex items-center gap-2 py-1 hover:bg-slate-600 px-2 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedMalwareFamilies.includes(malware)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedMalwareFamilies([...selectedMalwareFamilies, malware]);
                                  } else {
                                    setSelectedMalwareFamilies(selectedMalwareFamilies.filter(m => m !== malware));
                                  }
                                }}
                                className="w-4 h-4 text-orange-600 rounded"
                              />
                              <span className="text-xs text-slate-200">{malware}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CVEs Filter */}
                    {uniqueCVEs.length > 0 && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-200 mb-2 flex items-center gap-2">
                          <span className="text-purple-400">🔒</span> CVE References ({selectedCVEs.length}/{uniqueCVEs.length})
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-slate-600 rounded-lg p-2 bg-slate-700">
                          {uniqueCVEs.map(cve => (
                            <label key={cve} className="flex items-center gap-2 py-1 hover:bg-slate-600 px-2 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedCVEs.includes(cve)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCVEs([...selectedCVEs, cve]);
                                  } else {
                                    setSelectedCVEs(selectedCVEs.filter(c => c !== cve));
                                  }
                                }}
                                className="w-4 h-4 text-purple-600 rounded"
                              />
                              <span className="text-xs text-slate-200 font-mono">{cve}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clear All Threat Intel Filters Button */}
                    {(selectedAPTGroups.length + selectedMalwareFamilies.length + selectedCVEs.length) > 0 && (
                      <button
                        onClick={() => {
                          setSelectedAPTGroups([]);
                          setSelectedMalwareFamilies([]);
                          setSelectedCVEs([]);
                        }}
                        className="w-full px-3 py-2 bg-red-900 text-red-200 rounded-lg hover:bg-red-800 transition-colors font-medium text-xs border border-red-700"
                      >
                        Clear Threat Intel
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 min-w-0">
              {/* Search Bar */}
              <div className="bg-slate-800 rounded-xl shadow-md border border-slate-700 p-4 mb-6">
                <div className="flex gap-4 items-center">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search detection rules..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Selection Controls */}
            {filteredRules.length > 0 && (
              <div className="flex items-center justify-between mb-4 px-2">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  {filteredRules.every(rule => selectedRules.includes(rule.id)) ? (
                    <>
                      <CheckSquare className="w-5 h-5" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="w-5 h-5" />
                      Select All
                    </>
                  )}
                </button>
                <span className="text-slate-300 text-sm">
                  {selectedRules.length} rule{selectedRules.length !== 1 ? 's' : ''} selected
                </span>
              </div>
            )}

            {/* Compact Rules List */}
            <div className="space-y-3 min-h-[600px]">
              {paginatedRules.map(rule => (
                <div
                  key={rule.id}
                  className={`bg-slate-800 rounded-lg shadow border-2 transition-all hover:shadow-md ${
                    selectedRules.includes(rule.id)
                      ? 'border-indigo-500 bg-slate-700'
                      : 'border-slate-700 hover:border-indigo-600'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                        <button
                          onClick={() => toggleRuleSelection(rule.id)}
                          className="w-5 h-5 flex items-center justify-center border-2 rounded transition-all hover:scale-110"
                          style={{
                            borderColor: selectedRules.includes(rule.id) ? '#4f46e5' : '#cbd5e1',
                            backgroundColor: selectedRules.includes(rule.id) ? '#4f46e5' : 'white'
                          }}
                        >
                          {selectedRules.includes(rule.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <a
                            href={`?rule=${rule.id}`}
                            onClick={(e) => { e.preventDefault(); viewRuleDetail(rule); }}
                            className="text-lg font-bold text-white hover:text-indigo-400 hover:underline cursor-pointer transition-colors"
                          >
                            {rule.title}
                          </a>
                          <span className={`px-2 py-1 rounded border text-xs font-bold ml-2 flex-shrink-0 ${severityColors[rule.severity]}`}>
                            {rule.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm mb-2">{rule.description}</p>
                        <div className="flex items-center gap-4 mb-2 text-xs text-slate-400">
                          <span>
                            <span className="font-medium">Platform:</span> {rule.platform}
                          </span>
                          <span>•</span>
                          <span>
                            <span className="font-medium">Event:</span> {rule.eventType}
                          </span>
                          <span>•</span>
                          <span>
                            <span className="font-medium">Category:</span> {rule.category}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {rule.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                          {rule.malwareTags.slice(0, 2).map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-xs font-medium border border-rose-200">
                              🦠 {tag}
                            </span>
                          ))}
                          {rule.threatIntel?.aptGroups.slice(0, 2).map(apt => (
                            <span key={apt} className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-bold border border-red-300">
                              🎯 {apt}
                            </span>
                          ))}
                          {rule.threatIntel?.malwareFamilies.slice(0, 2).map(malware => (
                            <span key={malware} className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-medium border border-orange-300">
                              ⚠️ {malware}
                            </span>
                          ))}
                          {rule.threatIntel?.cves.slice(0, 1).map(cve => (
                            <span key={cve} className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium border border-purple-300">
                              🔒 {cve}
                            </span>
                          ))}
                        </div>
                      </div>
                      <a
                        href={`?rule=${rule.id}`}
                        onClick={(e) => { e.preventDefault(); viewRuleDetail(rule); }}
                        className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm flex-shrink-0 cursor-pointer"
                      >
                        Details
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {filteredRules.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 px-2">
                <div className="text-sm text-slate-300">
                  Showing <span className="font-semibold">{startIndex + 1}</span> to{' '}
                  <span className="font-semibold">{Math.min(endIndex, filteredRules.length)}</span> of{' '}
                  <span className="font-semibold">{filteredRules.length}</span> rules
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPageNum(prev => Math.max(1, prev - 1))}
                    disabled={currentPageNum === 1}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPageNum === 1
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600'
                        : 'bg-slate-700 border border-slate-600 text-slate-200 hover:bg-slate-600'
                    }`}
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, idx) => {
                      const pageNum = idx + 1;
                      // Show first page, last page, current page, and pages around current
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPageNum - 1 && pageNum <= currentPageNum + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPageNum(pageNum)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              currentPageNum === pageNum
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-700 border border-slate-600 text-slate-200 hover:bg-slate-600'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        pageNum === currentPageNum - 2 ||
                        pageNum === currentPageNum + 2
                      ) {
                        return (
                          <span key={pageNum} className="px-2 text-slate-500">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPageNum(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPageNum === totalPages}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPageNum === totalPages
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600'
                        : 'bg-slate-700 border border-slate-600 text-slate-200 hover:bg-slate-600'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

              {filteredRules.length === 0 && (
                <div className="bg-slate-800 rounded-xl shadow-md border border-slate-700 p-12 text-center">
                  <p className="text-slate-400 text-lg">No detection rules found matching your criteria</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="space-y-4 min-h-[600px]">
            {huntSessions.length === 0 ? (
              <div className="bg-slate-800 rounded-xl shadow-md border border-slate-700 p-12 text-center">
                <AlertTriangle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-300 text-lg font-medium mb-2">No hunt sessions yet</p>
                <p className="text-slate-400">Select rules from the Library tab and click "Start Hunt" to begin threat hunting</p>
              </div>
            ) : (
              huntSessions.map((session) => (
                <div key={session.id} className="bg-slate-800 rounded-xl shadow-md border border-slate-700 overflow-hidden">
                  {/* Session Header */}
                  <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {session.status === 'running' ? (
                          <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                        ) : (
                          <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                        )}
                        <h2 className="text-2xl font-bold text-white">
                          {session.status === 'running' ? 'Hunt In Progress' : 'Hunt Completed'}
                        </h2>
                      </div>
                      <div className="flex items-center gap-6 text-white">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{session.ruleCount} Rule{session.ruleCount !== 1 ? 's' : ''}</span>
                        </div>
                        {showEndpointsFilter && (
                          <div className="flex items-center gap-2">
                            <Server className="w-5 h-5 text-cyan-400" />
                            <span className="font-semibold">{session.endpointCount} Endpoint{session.endpointCount !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-blue-400" />
                          <span className="font-semibold">{session.timeWindow}</span>
                        </div>
                        {session.status === 'completed' && (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-400" />
                            <span className="font-semibold">{session.threatCount || 0} Threat{session.threatCount !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  {session.status === 'running' && (
                    <div className="px-6 py-6 bg-slate-900 border-b border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Circular Spinner */}
                          <div className="relative w-12 h-12">
                            <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white mb-1">Executing queries...</div>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <ElapsedTime startTime={huntStartTime} />
                              </div>
                              <span>•</span>
                              <span>{Math.round(session.progress)}% Complete</span>
                            </div>
                          </div>
                        </div>
                        {/* Cancel Button */}
                        <button
                          onClick={handleCancelHunt}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          <X className="w-4 h-4" />
                          Cancel Hunt
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Results Table */}
                  {session.status === 'completed' && session.results && session.results.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-900 border-b-2 border-slate-600">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider w-12"></th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">#</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Timestamp</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Severity</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Sigma Rule</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Hostname</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Event ID</th>
                          </tr>
                        </thead>
                        <tbody className="bg-slate-800 divide-y divide-slate-700">
                          {session.results.map((result, index) => {
                            const isExpanded = expandedResults[result._id];
                            const eventId = result._source.event?.code || result._source.event?.id || 'N/A';

                            return (
                              <React.Fragment key={result._id}>
                                <tr className={`hover:bg-slate-700 transition-colors ${isExpanded ? 'bg-slate-700' : ''}`}>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <button
                                      onClick={() => toggleResultExpansion(result._id)}
                                      className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                                      title={isExpanded ? 'Collapse details' : 'Expand details'}
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="w-5 h-5 text-slate-300" />
                                      ) : (
                                        <ChevronDown className="w-5 h-5 text-slate-300" />
                                      )}
                                    </button>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="flex items-center justify-center w-7 h-7 bg-slate-600 text-white rounded-full text-xs font-bold">
                                      {index + 1}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="text-sm font-mono text-slate-200">
                                      {formatTimestamp(result._source['@timestamp'])}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${severityBadgeColors[result.severity]}`}>
                                      {result.severity.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 max-w-xs">
                                    <a
                                      href={`?rule=${result.ruleId}`}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        const rule = detectionRules.find(r => r.id === result.ruleId);
                                        if (rule) viewRuleDetail(rule);
                                      }}
                                      className="text-sm font-semibold text-slate-300 hover:text-white hover:underline cursor-pointer break-words transition-colors"
                                    >
                                      {result.ruleName}
                                    </a>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="text-sm font-semibold text-slate-200">
                                      {getFieldValue(result._source, 'host.name')}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="text-sm font-mono font-semibold text-amber-400">
                                      {eventId}
                                    </span>
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr>
                                    <td colSpan="7" className="px-4 py-4 bg-slate-900">
                                      <div className="w-full overflow-hidden">
                                        <div className="mb-2">
                                          <h4 className="text-sm font-bold text-slate-200">Event Details (JSON)</h4>
                                        </div>
                                        <div className="w-full overflow-x-auto">
                                          <CodeBlock code={JSON.stringify(result, null, 2)} language="json" />
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* No Results Message */}
                  {session.status === 'completed' && (!session.results || session.results.length === 0) && (
                    <div className="p-8 text-center text-slate-400">
                      <p className="font-medium">No threats detected in this hunt</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-800 to-slate-900 border-t border-slate-700 mt-8">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <p className="text-center text-slate-300 text-sm font-medium">Made by RND Team</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

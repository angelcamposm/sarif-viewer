import { Run, PropertyBag } from '../types/sarif';
import { ApplicationMetadata } from '../types/viewer';

/**
 * Extracts Application Metadata & Labels from SARIF run and tool properties (matching Image 3 specification).
 * Sourced directly from SARIF properties and automation details.
 */
export function extractApplicationMetadata(run?: Run, globalProperties?: PropertyBag): ApplicationMetadata {
  const runProps = run?.properties || {};
  const toolProps = run?.tool?.driver?.properties || {};
  const automationProps = run?.automationDetails?.properties || {};
  const combinedProps: PropertyBag = {
    ...globalProperties,
    ...toolProps,
    ...runProps,
    ...automationProps,
  };

  // Helper to extract case-insensitive property
  const findProp = (keys: string[]): string | undefined => {
    for (const key of keys) {
      if (combinedProps[key] !== undefined && combinedProps[key] !== null) {
        return String(combinedProps[key]);
      }
      // Check lowercase match
      const foundEntry = Object.entries(combinedProps).find(
        ([k]) => k.toLowerCase() === key.toLowerCase()
      );
      if (foundEntry && foundEntry[1] !== undefined && foundEntry[1] !== null) {
        return String(foundEntry[1]);
      }
    }
    return undefined;
  };

  const businessCriticality = findProp([
    'businessCriticality',
    'criticality',
    'business_criticality',
    'appCriticality',
    'tier',
  ]);

  const businessCriticalityDescription = findProp([
    'businessCriticalityDescription',
    'criticalityDescription',
  ]) || (businessCriticality ? 'Business criticality level' : undefined);

  const language = findProp(['language', 'targetLanguage', 'sourceLanguage']) || run?.language;
  const framework = findProp(['framework', 'targetFramework', 'appFramework']);
  const team = findProp(['team', 'owner', 'maintainer', 'author']);
  const businessDomain = findProp(['businessDomain', 'domain', 'businessUnit', 'business_domain']);
  const lifecycle = findProp(['lifecycle', 'lifecycleStage', 'stage', 'status']);

  // Extract all other key-values as custom metadata labels
  const knownKeys = new Set([
    'businesscriticality',
    'criticality',
    'business_criticality',
    'appcriticality',
    'tier',
    'businesscriticalitydescription',
    'criticalitydescription',
    'language',
    'targetlanguage',
    'sourcelanguage',
    'framework',
    'targetframework',
    'appframework',
    'team',
    'owner',
    'maintainer',
    'author',
    'businessdomain',
    'domain',
    'businessunit',
    'business_domain',
    'lifecycle',
    'lifecyclestage',
    'stage',
    'status',
  ]);

  const customLabels: Array<{ key: string; value: string }> = [];

  for (const [k, v] of Object.entries(combinedProps)) {
    if (!knownKeys.has(k.toLowerCase()) && v !== undefined && v !== null) {
      const formattedValue = typeof v === 'object' ? JSON.stringify(v) : String(v);
      // Format camelCase or snake_case key to clean title
      const formattedKey = k
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
      customLabels.push({ key: formattedKey, value: formattedValue });
    }
  }

  // Also include tool info if available
  if (run?.tool?.driver?.name && !customLabels.some((l) => l.key.toLowerCase() === 'scanner tool')) {
    customLabels.push({
      key: 'Scanner Tool',
      value: `${run.tool.driver.name}${run.tool.driver.version ? ` v${run.tool.driver.version}` : ''}`,
    });
  }

  return {
    businessCriticality,
    businessCriticalityDescription,
    language,
    framework,
    team,
    businessDomain,
    lifecycle,
    customLabels,
  };
}

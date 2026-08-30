import { Run, PropertyBag, ToolComponent } from '../types/sarif';
import { ApplicationMetadata } from '../types/viewer';

const KNOWN_METADATA_KEYS = new Set([
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

/**
 * Searches a property bag for the first matching key (case-insensitive).
 */
function findPropertyCaseInsensitive(props: PropertyBag, keys: string[]): string | undefined {
  for (const key of keys) {
    if (props[key] !== undefined && props[key] !== null) {
      return String(props[key]);
    }
    const lowerTarget = key.toLowerCase();
    const entry = Object.entries(props).find(([k]) => k.toLowerCase() === lowerTarget);
    if (entry && entry[1] !== undefined && entry[1] !== null) {
      return String(entry[1]);
    }
  }
  return undefined;
}

/**
 * Formats camelCase or snake_case key to clean title.
 */
function formatCustomPropertyKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replaceAll('_', ' ')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Extracts non-standard custom labels from combined properties.
 */
function extractCustomLabels(
  combinedProps: PropertyBag,
  toolDriver?: ToolComponent
): Array<{ key: string; value: string }> {
  const customLabels: Array<{ key: string; value: string }> = [];

  for (const [k, v] of Object.entries(combinedProps)) {
    if (!KNOWN_METADATA_KEYS.has(k.toLowerCase()) && v !== undefined && v !== null) {
      const formattedValue = typeof v === 'object' ? JSON.stringify(v) : String(v);
      const formattedKey = formatCustomPropertyKey(k);
      customLabels.push({ key: formattedKey, value: formattedValue });
    }
  }

  if (toolDriver?.name && !customLabels.some((l) => l.key.toLowerCase() === 'scanner tool')) {
    const versionStr = toolDriver.version ? ` v${toolDriver.version}` : '';
    customLabels.push({
      key: 'Scanner Tool',
      value: `${toolDriver.name}${versionStr}`,
    });
  }

  return customLabels;
}

/**
 * Extracts Application Metadata & Labels from SARIF run and tool properties.
 */
export function extractApplicationMetadata(run?: Run, globalProperties?: PropertyBag): ApplicationMetadata {
  const combinedProps: PropertyBag = {
    ...globalProperties,
    ...run?.tool?.driver?.properties,
    ...run?.properties,
    ...run?.automationDetails?.properties,
  };

  const businessCriticality = findPropertyCaseInsensitive(combinedProps, [
    'businessCriticality',
    'criticality',
    'business_criticality',
    'appCriticality',
    'tier',
  ]);

  const businessCriticalityDescription = findPropertyCaseInsensitive(combinedProps, [
    'businessCriticalityDescription',
    'criticalityDescription',
  ]) || (businessCriticality ? 'Business criticality level' : undefined);

  const language = findPropertyCaseInsensitive(combinedProps, ['language', 'targetLanguage', 'sourceLanguage']) || run?.language;
  const framework = findPropertyCaseInsensitive(combinedProps, ['framework', 'targetFramework', 'appFramework']);
  const team = findPropertyCaseInsensitive(combinedProps, ['team', 'owner', 'maintainer', 'author']);
  const businessDomain = findPropertyCaseInsensitive(combinedProps, ['businessDomain', 'domain', 'businessUnit', 'business_domain']);
  const lifecycle = findPropertyCaseInsensitive(combinedProps, ['lifecycle', 'lifecycleStage', 'stage', 'status']);

  const customLabels = extractCustomLabels(combinedProps, run?.tool?.driver);

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

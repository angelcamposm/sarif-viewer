import { ToolComponent, ReportingDescriptorReference } from '../types/sarif';
import { NormalizedTaxonomyReference } from '../types/viewer';

type CatalogMap = Map<string, { taxonName: string; taxa: Map<string, string> }>;

const CWE_REGEX = /^CWE[-:\s]?(\d+)/i;
const OWASP_REGEX = /^(?:OWASP[-:\s]?)?(A\d{2}[:\-\s]?\d{4}|A\d{2})/i;
const DIGITS_REGEX = /\d+/;

/**
 * Formats standard external taxonomy reference links (CWE, OWASP, NIST).
 */
function formatTaxonomyLink(taxonomyName: string, id: string): { canonicalId: string; url?: string } {
  const upperTax = taxonomyName.toUpperCase();
  const rawClean = id.trim();

  if (upperTax.includes('CWE') || rawClean.toUpperCase().startsWith('CWE')) {
    const match = DIGITS_REGEX.exec(rawClean);
    if (match) {
      const num = match[0];
      return {
        canonicalId: `CWE-${num}`,
        url: `https://cwe.mitre.org/data/definitions/${num}.html`,
      };
    }
    return { canonicalId: rawClean };
  }

  if (upperTax.includes('OWASP') || rawClean.toUpperCase().startsWith('A0') || rawClean.toUpperCase().startsWith('A1')) {
    return {
      canonicalId: rawClean,
      url: 'https://owasp.org/Top10/',
    };
  }

  if (upperTax.includes('NIST')) {
    return {
      canonicalId: rawClean,
      url: 'https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final',
    };
  }

  return { canonicalId: rawClean };
}

/**
 * Builds a catalog lookup map indexing taxon definitions by taxonomy name.
 */
export function buildTaxonomyCatalogMap(taxonomiesCatalog: ToolComponent[] = []): CatalogMap {
  const catalogMap: CatalogMap = new Map();

  taxonomiesCatalog.forEach((taxCat) => {
    const catName = taxCat.name || 'Security Taxonomy';
    const taxonDefinitions = new Map<string, string>();

    if (Array.isArray(taxCat.taxa)) {
      taxCat.taxa.forEach((taxon) => {
        if (taxon.id) {
          const name = taxon.name || taxon.shortDescription?.text || taxon.fullDescription?.text || '';
          taxonDefinitions.set(taxon.id.toUpperCase(), name);
        }
      });
    }
    catalogMap.set(catName.toLowerCase(), { taxonName: catName, taxa: taxonDefinitions });
  });

  return catalogMap;
}

/**
 * Infers taxonomy name from reference attributes.
 */
function inferTaxonomyName(taxRef: ReportingDescriptorReference, upperId: string): string {
  if (taxRef.toolComponent?.name) {
    return taxRef.toolComponent.name;
  }
  if (upperId.startsWith('CWE-') || /^\d+$/.test(upperId)) {
    return 'CWE';
  }
  if (upperId.startsWith('A0') || upperId.startsWith('A1') || upperId.includes('OWASP')) {
    return 'OWASP';
  }
  return 'Standard';
}

/**
 * Resolves direct result.taxa references.
 */
function resolveTaxaReferences(
  taxaRefs: ReportingDescriptorReference[],
  catalogMap: CatalogMap,
  resolvedMap: Map<string, NormalizedTaxonomyReference>
): void {
  taxaRefs.forEach((taxRef) => {
    if (!taxRef.id) return;
    const rawId = taxRef.id.trim();
    const upperId = rawId.toUpperCase();

    const taxonomyName = inferTaxonomyName(taxRef, upperId);
    let taxonDescription: string | undefined;

    if (taxRef.toolComponent?.name) {
      const cat = catalogMap.get(taxRef.toolComponent.name.toLowerCase());
      taxonDescription = cat?.taxa.get(upperId);
    }

    const { canonicalId, url } = formatTaxonomyLink(taxonomyName, rawId);
    const key = `${taxonomyName}:${canonicalId}`;

    if (!resolvedMap.has(key)) {
      resolvedMap.set(key, {
        taxonomyName,
        id: canonicalId,
        name: taxonDescription,
        url,
      });
    }
  });
}

/**
 * Resolves rule.relationships referencing taxonomies.
 */
function resolveRuleRelationships(
  ruleRelationships: any[],
  resolvedMap: Map<string, NormalizedTaxonomyReference>
): void {
  ruleRelationships.forEach((rel) => {
    if (!rel.target?.id) return;
    const rawId = String(rel.target.id).trim();
    const taxonomyName = rel.target.toolComponent?.name || (rawId.toUpperCase().startsWith('CWE') ? 'CWE' : 'Taxonomy');
    const { canonicalId, url } = formatTaxonomyLink(taxonomyName, rawId);
    const key = `${taxonomyName}:${canonicalId}`;

    if (!resolvedMap.has(key)) {
      resolvedMap.set(key, {
        taxonomyName,
        id: canonicalId,
        name: rel.description?.text,
        url,
      });
    }
  });
}

/**
 * Fallback: parses taxonomy identifiers from tag tokens (e.g. CWE-89, OWASP-A03).
 */
function resolveTaxonomiesFromTags(
  tags: string[],
  resolvedMap: Map<string, NormalizedTaxonomyReference>
): void {
  tags.forEach((tag) => {
    const trimmed = tag.trim();
    const upper = trimmed.toUpperCase();

    // Match CWE patterns: "cwe-89", "CWE:89", "cwe-79: cross-site scripting"
    const cweMatch = CWE_REGEX.exec(upper);
    if (cweMatch) {
      const cweNumber = cweMatch[1];
      const canonicalId = `CWE-${cweNumber}`;
      const key = `CWE:${canonicalId}`;
      if (!resolvedMap.has(key)) {
        resolvedMap.set(key, {
          taxonomyName: 'CWE',
          id: canonicalId,
          url: `https://cwe.mitre.org/data/definitions/${cweNumber}.html`,
        });
      }
    }

    // Match OWASP patterns: "OWASP-A01:2021", "A03-2021", "owasp-top-10"
    const owaspMatch = OWASP_REGEX.exec(upper);
    if (owaspMatch) {
      const canonicalId = owaspMatch[1].replaceAll('-', ':').replaceAll('_', ':');
      const key = `OWASP:${canonicalId}`;
      if (!resolvedMap.has(key)) {
        resolvedMap.set(key, {
          taxonomyName: 'OWASP',
          id: canonicalId,
          url: 'https://owasp.org/Top10/',
        });
      }
    }
  });
}

/**
 * Resolves standard security taxonomies (CWE, OWASP Top 10, NIST, PCI-DSS)
 * from SARIF run taxonomies, result taxa, rule relationships, and tags.
 */
export function resolveTaxonomies(
  taxaRefs: ReportingDescriptorReference[] = [],
  taxonomiesCatalog: ToolComponent[] = [],
  ruleRelationships: any[] = [],
  tags: string[] = [],
  precomputedCatalogMap?: CatalogMap
): NormalizedTaxonomyReference[] {
  const resolvedMap = new Map<string, NormalizedTaxonomyReference>();
  const catalogMap = precomputedCatalogMap || buildTaxonomyCatalogMap(taxonomiesCatalog);

  resolveTaxaReferences(taxaRefs, catalogMap, resolvedMap);
  resolveRuleRelationships(ruleRelationships, resolvedMap);
  resolveTaxonomiesFromTags(tags, resolvedMap);

  return Array.from(resolvedMap.values());
}

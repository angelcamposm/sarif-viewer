import { ToolComponent, ReportingDescriptorReference } from '../types/sarif';
import { NormalizedTaxonomyReference } from '../types/viewer';

/**
 * Resolves standard security taxonomies (CWE, OWASP Top 10, NIST, PCI-DSS)
 * from SARIF run taxonomies, result taxa, rule relationships, and tags.
 */
export function resolveTaxonomies(
  taxaRefs: ReportingDescriptorReference[] = [],
  taxonomiesCatalog: ToolComponent[] = [],
  ruleRelationships: any[] = [],
  tags: string[] = []
): NormalizedTaxonomyReference[] {
  const resolvedMap = new Map<string, NormalizedTaxonomyReference>();

  // 1. Build a lookup map of catalog taxonomies
  const catalogMap = new Map<string, { taxonName: string; taxa: Map<string, string> }>();
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

  // 2. Resolve result.taxa references
  taxaRefs.forEach((taxRef) => {
    if (!taxRef.id) return;
    const rawId = taxRef.id.trim();
    const upperId = rawId.toUpperCase();

    // Check if matching taxonomy catalog is known
    let taxonomyName = 'Standard';
    let taxonDescription: string | undefined;

    if (taxRef.toolComponent?.name) {
      taxonomyName = taxRef.toolComponent.name;
      const cat = catalogMap.get(taxRef.toolComponent.name.toLowerCase());
      if (cat) {
        taxonDescription = cat.taxa.get(upperId);
      }
    } else if (upperId.startsWith('CWE-') || /^\d+$/.test(upperId)) {
      taxonomyName = 'CWE';
    } else if (upperId.startsWith('A0') || upperId.startsWith('A1') || upperId.includes('OWASP')) {
      taxonomyName = 'OWASP';
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

  // 3. Resolve rule.relationships referencing taxonomies
  ruleRelationships.forEach((rel) => {
    if (rel.target?.id) {
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
    }
  });

  // 4. Fallback: Parse common taxonomy identifiers from tags (e.g., 'cwe-89', 'CWE-79', 'OWASP-A03')
  tags.forEach((tag) => {
    const trimmed = tag.trim();
    const upper = trimmed.toUpperCase();

    // Match CWE patterns: "cwe-89", "CWE:89", "cwe-79: cross-site scripting"
    const cweMatch = upper.match(/^CWE[-:\s]?(\d+)/i);
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
    const owaspMatch = upper.match(/^(?:OWASP[-:\s]?)?(A\d{2}[:\-\s]?\d{4}|A\d{2})/i);
    if (owaspMatch) {
      const canonicalId = owaspMatch[1].replace(/[-_]/g, ':');
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

  return Array.from(resolvedMap.values());
}

/**
 * Formats standard external taxonomy reference links
 */
function formatTaxonomyLink(taxonomyName: string, id: string): { canonicalId: string; url?: string } {
  const upperTax = taxonomyName.toUpperCase();
  const rawClean = id.trim();

  if (upperTax.includes('CWE') || rawClean.toUpperCase().startsWith('CWE')) {
    const match = rawClean.match(/\d+/);
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

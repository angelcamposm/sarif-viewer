import { describe, it, expect } from 'vitest';
import { resolveTaxonomies } from '../taxonomyResolver';

describe('Taxonomy Resolver Service', () => {
  it('resolves CWE references from taxa and tags with canonical URLs', () => {
    const taxaRefs = [{ id: 'CWE-89' }];
    const tags = ['security', 'cwe-79', 'database'];

    const resolved = resolveTaxonomies(taxaRefs, [], [], tags);
    expect(resolved.length).toBe(2);

    const cwe89 = resolved.find((t) => t.id === 'CWE-89');
    expect(cwe89).toBeDefined();
    expect(cwe89?.url).toBe('https://cwe.mitre.org/data/definitions/89.html');

    const cwe79 = resolved.find((t) => t.id === 'CWE-79');
    expect(cwe79).toBeDefined();
    expect(cwe79?.url).toBe('https://cwe.mitre.org/data/definitions/79.html');
  });

  it('resolves OWASP Top 10 references', () => {
    const taxaRefs = [{ id: 'A03:2021' }];
    const tags = ['owasp-a01:2021'];

    const resolved = resolveTaxonomies(taxaRefs, [], [], tags);
    expect(resolved.some((t) => t.id === 'A03:2021')).toBe(true);
    expect(resolved.some((t) => t.id === 'A01:2021')).toBe(true);
  });

  it('resolves taxonomy catalog definitions from run.taxonomies', () => {
    const catalog: any[] = [
      {
        name: 'CWE',
        taxa: [
          {
            id: 'CWE-89',
            name: 'Improper Neutralization of Special Elements used in an SQL Command',
          },
        ],
      },
    ];

    const taxaRefs = [{ id: 'CWE-89', toolComponent: { name: 'CWE' } }];
    const resolved = resolveTaxonomies(taxaRefs, catalog, [], []);

    expect(resolved.length).toBe(1);
    expect(resolved[0].name).toBe('Improper Neutralization of Special Elements used in an SQL Command');
  });
});

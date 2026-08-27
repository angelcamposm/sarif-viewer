import { SarifLog } from '../types/sarif';

export const SAMPLE_REPORTS: Array<{ name: string; description: string; filename: string; data: SarifLog }> = [
  {
    name: 'Standard Benchmark (Sample from Screenshots)',
    description: 'Matches the reference UI with 7 findings, 2 runs, SEC/STYLE/DEP rules and Application Details.',
    filename: 'sarif_viewer_test_sample.sarif',
    data: {
      $schema: 'https://docs.oasis-open.org/sarif/sarif/v2.1.0/os/schemas/sarif-schema-2.1.0.json',
      version: '2.1.0',
      properties: {
        businessCriticality: 'Mission-critical',
        businessCriticalityDescription: 'Business criticality level',
        language: 'Java 17',
        framework: 'Spring Framework 3',
        team: 'Leslie Hills',
        businessDomain: 'Strategy & Governance / Risk',
        lifecycle: 'Obsolete',
        scanTarget: 'repo://corp/core-banking-service',
        environment: 'Production Gateway',
      },
      runs: [
        {
          tool: {
            driver: {
              name: 'Contoso Static Analyzer',
              version: '3.4.1',
              informationUri: 'https://analyzer.contoso.com',
              rules: [
                {
                  id: 'SEC001',
                  name: 'HardcodedCredential',
                  shortDescription: { text: 'Potential hardcoded secret or API key found.' },
                  fullDescription: { text: 'Detects hardcoded API keys, bearer tokens, or password strings stored in plain text source code. Always use a dedicated secrets manager or environment variables.' },
                  helpUri: 'https://cwe.mitre.org/data/definitions/798.html',
                  defaultConfiguration: { level: 'warning' },
                  properties: {
                    tags: ['security', 'cwe-798'],
                    category: 'Security',
                  },
                },
                {
                  id: 'SEC002',
                  name: 'WeakHashingAlgorithm',
                  shortDescription: { text: 'MD5 is referenced for integrity checking; verify that this is intentional.' },
                  fullDescription: { text: 'MD5 is cryptographically broken and prone to collision attacks. Use SHA-256 or SHA-3 for integrity checks, and Argon2id or bcrypt for passwords.' },
                  helpUri: 'https://cwe.mitre.org/data/definitions/327.html',
                  defaultConfiguration: { level: 'warning' },
                  properties: {
                    tags: ['crypto', 'cwe-327'],
                  },
                },
                {
                  id: 'STYLE101',
                  name: 'UnusedVariable',
                  shortDescription: { text: 'A local variable is declared but not used.' },
                  fullDescription: { text: 'A local variable is declared but never referenced in subsequent instructions. Remove unused declarations to improve maintainability and avoid accidental dead code.' },
                  helpUri: 'https://docs.contoso.com/rules/STYLE101',
                  defaultConfiguration: { level: 'note' },
                  properties: {
                    tags: ['maintainability', 'code-quality', 'NOTE'],
                  },
                },
              ],
            },
          },
          results: [
            {
              ruleId: 'SEC001',
              ruleIndex: 0,
              level: 'warning', // baseline is warning, but tag CRITICAL will override to error!
              message: {
                text: 'Potential hardcoded API key found in configuration assignment.',
                markdown: 'Potential **hardcoded API key** found in configuration assignment. Move `apiKey = "ak_live_9941a87b..."` to secret vault.',
              },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: 'src/ConfigService.cs' },
                    region: {
                      startLine: 42,
                      startColumn: 16,
                      endLine: 42,
                      endColumn: 68,
                      snippet: { text: 'private string apiKey = "ak_live_891734bc10928aef019284729102";' },
                    },
                  },
                },
              ],
              properties: {
                tags: ['security', 'CRITICAL', 'cwe-798', 'owasp-a02'],
                precision: 'very-high',
              },
            },
            {
              ruleId: 'SEC002',
              ruleIndex: 1,
              level: 'warning',
              message: {
                text: 'MD5 is referenced for integrity checking; verify that this is intentional.',
                markdown: 'MD5 is referenced for integrity checking; verify that this is intentional.',
              },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: 'src/HashHelper.cs' },
                    region: {
                      startLine: 17,
                      startColumn: 12,
                      endLine: 17,
                      endColumn: 38,
                      snippet: { text: 'using var md5 = MD5.Create();' },
                    },
                  },
                },
              ],
              properties: {
                tags: ['security', 'cryptography', 'WARNING'],
              },
            },
            {
              ruleId: 'STYLE101',
              ruleIndex: 2,
              level: 'note',
              message: {
                text: 'Variable "temporaryResult" is assigned but never used.',
                markdown: 'Variable `temporaryResult` is assigned but never used.',
              },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: 'src/ReportBuilder.cs' },
                    region: {
                      startLine: 88,
                      startColumn: 9,
                      endLine: 88,
                      endColumn: 24,
                      snippet: { text: 'var temporaryResult = GenerateIntermediateSummary();' },
                    },
                  },
                },
              ],
              properties: {
                tags: ['style', 'cleanup', 'NOTE'],
              },
            },
            {
              ruleId: 'SEC001',
              ruleIndex: 0,
              level: 'warning',
              message: {
                text: 'Suspicious credential-like text found. Value contains commas, quotes "like this", and a line break.\nThis is intentional test data for CSV escaping.',
                markdown: 'Suspicious credential-like text found. Value contains commas, quotes `"like this"`, and a line break.\nThis is intentional test data for CSV escaping.',
              },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: 'tests/TestData.cs' },
                    region: {
                      startLine: 12,
                      startColumn: 1,
                      snippet: { text: 'public static string MockJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6...";' },
                    },
                  },
                },
              ],
              properties: {
                tags: ['test-data', 'security', 'WARNING'],
              },
            },
            {
              ruleId: 'SEC002',
              ruleIndex: 1,
              level: 'none',
              message: {
                text: "Informational record with SARIF level 'none' and no source location.",
              },
              properties: {
                tags: ['informational', 'NONE'],
              },
            },
          ],
        },
        {
          tool: {
            driver: {
              name: 'Dependency Vulnerability Auditor',
              version: '2.0.4',
              informationUri: 'https://security.audit.org',
              rules: [
                {
                  id: 'DEP100',
                  name: 'OutdatedPackageReview',
                  shortDescription: { text: 'Package Example.Library 2.1.0 was flagged by the source tool for review.' },
                  fullDescription: { text: 'A referenced third-party package has known vulnerabilities or has reached End of Life (EOL). Upgrade to a supported patch release.' },
                  helpUri: 'https://nvd.nist.gov/vuln',
                  defaultConfiguration: { level: 'warning' },
                },
                {
                  id: 'DEP200',
                  name: 'UnpinnedPackageVersion',
                  shortDescription: { text: 'This finding intentionally has a file URI but no line or column.' },
                  fullDescription: { text: 'Central package management file contains dynamic range version specs without strict lockfile pin.' },
                  helpUri: 'https://docs.microsoft.com/nuget/consume-packages/Central-Package-Management',
                  defaultConfiguration: { level: 'note' },
                },
              ],
            },
          },
          results: [
            {
              ruleId: 'DEP100',
              ruleIndex: 0,
              level: 'warning',
              message: {
                text: 'Package Example.Library 2.1.0 was flagged by the source tool for review.',
              },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: 'src/SarifViewer.csproj' },
                  },
                },
              ],
              properties: {
                tags: ['supply-chain', 'dependencies', 'WARNING'],
              },
            },
            {
              ruleId: 'DEP200',
              ruleIndex: 1,
              level: 'note',
              message: {
                text: 'This finding intentionally has a file URI but no line or column.',
              },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: 'Directory.Packages.props' },
                  },
                },
              ],
              properties: {
                tags: ['nuget', 'build-system', 'NOTE'],
              },
            },
          ],
        },
      ],
    },
  },
  {
    name: 'Enterprise AppSec Full Scan (Semgrep & Trivy)',
    description: 'Comprehensive static scan with SQL Injection, SSRF, Hardcoded JWT, Open S3 Buckets, and CWE tags.',
    filename: 'enterprise_appsec_audit.sarif',
    data: {
      $schema: 'https://docs.oasis-open.org/sarif/sarif/v2.1.0/os/schemas/sarif-schema-2.1.0.json',
      version: '2.1.0',
      properties: {
        businessCriticality: 'High',
        businessCriticalityDescription: 'Core Banking API & Payments Processing',
        language: 'TypeScript / Node.js 20',
        framework: 'Express / Next.js',
        team: 'AppSec & Payments Engineering',
        businessDomain: 'FinTech / Payment Rails',
        lifecycle: 'Active Production',
      },
      runs: [
        {
          tool: {
            driver: {
              name: 'Semgrep Enterprise',
              version: '1.64.0',
              rules: [
                {
                  id: 'TS-SEC-001',
                  name: 'SqlInjectionRawQuery',
                  shortDescription: { text: 'Direct string interpolation in SQL query execution.' },
                  fullDescription: { text: 'Untrusted user input is directly concatenated into a SQL statement without parameterized placeholders, enabling full database compromise (CWE-89).' },
                  helpUri: 'https://owasp.org/www-community/attacks/SQL_Injection',
                  defaultConfiguration: { level: 'error' },
                  properties: { tags: ['security', 'cwe-89', 'CRITICAL', 'owasp-top-10'] },
                },
                {
                  id: 'TS-SEC-002',
                  name: 'ServerSideRequestForgery',
                  shortDescription: { text: 'User-controlled URL passed to HTTP client request.' },
                  fullDescription: { text: 'A URL derived from user input is fetched directly by the backend without strict domain allowlisting or private IP blocking (CWE-918).' },
                  helpUri: 'https://owasp.org/www-community/attacks/Server_Side_Request_Forgery',
                  defaultConfiguration: { level: 'warning' },
                  properties: { tags: ['security', 'cwe-918', 'HIGH', 'network'] },
                },
                {
                  id: 'TS-SEC-003',
                  name: 'PermissiveCorsWildcard',
                  shortDescription: { text: 'CORS header Access-Control-Allow-Origin set to wildcard with credentials.' },
                  fullDescription: { text: 'Allowing all origins (*) while allowing credentials enables cross-origin credential harvesting.' },
                  helpUri: 'https://portswigger.net/web-security/cors',
                  defaultConfiguration: { level: 'warning' },
                  properties: { tags: ['security', 'cors', 'MEDIUM'] },
                },
                {
                  id: 'TS-LINT-004',
                  name: 'NoAsyncWithoutAwait',
                  shortDescription: { text: 'Function is marked async but contains no await expressions.' },
                  fullDescription: { text: 'Declaring functions async unnecessarily introduces microtask overhead.' },
                  defaultConfiguration: { level: 'note' },
                  properties: { tags: ['performance', 'clean-code', 'LOW'] },
                },
              ],
            },
          },
          results: [
            {
              ruleId: 'TS-SEC-001',
              ruleIndex: 0,
              level: 'warning', // baseline warning, tag CRITICAL overrides to error!
              message: {
                text: 'SQL query built using direct string concatenation from req.query.userId.',
                markdown: 'SQL query built using direct string concatenation from `req.query.userId`. Use parameterized queries `$1` or ORM binding.',
              },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: 'src/controllers/userController.ts' },
                    region: {
                      startLine: 74,
                      startColumn: 18,
                      endLine: 74,
                      endColumn: 82,
                      snippet: { text: 'const user = await db.query(`SELECT * FROM users WHERE id = \'${req.query.userId}\'`);' },
                    },
                  },
                },
              ],
              properties: {
                tags: ['security', 'cwe-89', 'CRITICAL', 'owasp-a03'],
              },
            },
            {
              ruleId: 'TS-SEC-002',
              ruleIndex: 1,
              level: 'warning',
              message: {
                text: 'SSRF vulnerability: fetch() called with untrusted webhookUrl parameter.',
                markdown: 'SSRF vulnerability: `fetch()` called with untrusted `webhookUrl` parameter without validating against loopback (127.0.0.1) or internal cloud metadata IP (169.254.169.254).',
              },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: 'src/services/webhookDispatcher.ts' },
                    region: {
                      startLine: 118,
                      startColumn: 5,
                      snippet: { text: 'const res = await axios.post(payload.targetWebhookUrl, payload.data);' },
                    },
                  },
                },
              ],
              properties: {
                tags: ['ssrf', 'HIGH', 'network'],
              },
            },
            {
              ruleId: 'TS-SEC-003',
              ruleIndex: 2,
              level: 'warning',
              message: {
                text: 'CORS policy reflects any origin and enables credentials.',
              },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: 'src/server.ts' },
                    region: {
                      startLine: 35,
                      startColumn: 1,
                      snippet: { text: 'app.use(cors({ origin: true, credentials: true }));' },
                    },
                  },
                },
              ],
              properties: {
                tags: ['cors', 'MEDIUM'],
              },
            },
            {
              ruleId: 'TS-LINT-004',
              ruleIndex: 3,
              level: 'note',
              message: {
                text: 'Async function processBatch contains no await expression.',
              },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: 'src/workers/batchWorker.ts' },
                    region: {
                      startLine: 52,
                      startColumn: 3,
                      snippet: { text: 'export async function processBatch(items: string[]) { return items.map(clean); }' },
                    },
                  },
                },
              ],
              properties: {
                tags: ['style', 'LOW'],
              },
            },
          ],
        },
      ],
    },
  },
];

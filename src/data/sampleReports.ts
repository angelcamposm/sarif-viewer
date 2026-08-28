import { SarifLog } from '../types/sarif';

export const SAMPLE_REPORTS: Array<{ name: string; description: string; filename: string; data: SarifLog }> = [
  {
    name: 'CodeQL Taint & Dataflow Stepper',
    description: 'Demonstrates end-to-end taint analysis with codeFlows (Source ➔ Sanitizer ➔ Vulnerable Sink), CWE-89 mapping, and parameter state tracking.',
    filename: 'codeql_taint_dataflow_sqli.sarif',
    data: {
      $schema: 'https://docs.oasis-open.org/sarif/sarif/v2.1.0/os/schemas/sarif-schema-2.1.0.json',
      version: '2.1.0',
      properties: {
        businessCriticality: 'Mission-critical',
        language: 'Java 21 / Spring Boot 3',
        framework: 'Spring Web & MyBatis',
        team: 'SecOps & Core Payments',
        businessDomain: 'Payment Processing & Checkout',
        lifecycle: 'Production Active',
      },
      runs: [
        {
          tool: {
            driver: {
              name: 'GitHub CodeQL',
              version: '2.17.4',
              informationUri: 'https://codeql.github.com',
              rules: [
                {
                  id: 'java/sql-injection',
                  name: 'SqlInjection',
                  shortDescription: { text: 'Query built from user-controlled sources without parametrization.' },
                  fullDescription: { text: 'Building a SQL query from untrusted user input without parameterized queries or prepared statements allows an attacker to execute arbitrary SQL commands.' },
                  helpUri: 'https://cwe.mitre.org/data/definitions/89.html',
                  defaultConfiguration: { level: 'error' },
                  properties: {
                    tags: ['security', 'cwe-89', 'owasp-a03:2021', 'CRITICAL'],
                    category: 'Security/Dataflow',
                  },
                },
                {
                  id: 'java/path-injection',
                  name: 'PathInjection',
                  shortDescription: { text: 'Uncontrolled data used in path expression.' },
                  fullDescription: { text: 'Accessing paths based on user input without strict validation allows directory traversal and unauthorized file access.' },
                  helpUri: 'https://cwe.mitre.org/data/definitions/22.html',
                  defaultConfiguration: { level: 'warning' },
                  properties: {
                    tags: ['security', 'cwe-22', 'owasp-a01:2021'],
                  },
                },
              ],
            },
          },
          originalUriBaseIds: {
            SRCROOT: { uri: 'src/main/java/com/corp/payments/' },
          },
          invocations: [
            {
              executionSuccessful: true,
              commandLine: 'codeql database analyze payments-db java-security-extended.qls --format=sarifv2.1.0 --output=codeql-report.sarif',
              startTimeUtc: '2026-08-28T10:14:02Z',
              endTimeUtc: '2026-08-28T10:14:48Z',
              workingDirectory: { uri: '/opt/jenkins/workspace/payments-service' },
            },
          ],
          results: [
            {
              ruleId: 'java/sql-injection',
              ruleIndex: 0,
              level: 'error',
              message: {
                text: 'SQL query built directly from untrusted HTTP parameter "accountId" in UserController.java and executed in AccountRepository.java.',
                markdown: 'This query depends on a [user-provided value](0) that reaches a [database query execution sink](3) without parameterized binding.',
              },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: 'repository/AccountRepository.java', uriBaseId: 'SRCROOT' },
                    region: {
                      startLine: 112,
                      startColumn: 24,
                      endLine: 112,
                      endColumn: 68,
                      snippet: { text: 'ResultSet rs = statement.executeQuery(untrustedQuerySql);' },
                    },
                  },
                  logicalLocations: [
                    { fullyQualifiedName: 'com.corp.payments.repository.AccountRepository.getAccountById', kind: 'method' },
                  ],
                },
              ],
              taxa: [
                { id: 'CWE-89' },
                { id: 'A03:2021' },
              ],
              codeFlows: [
                {
                  message: { text: 'Taint tracking trace from HTTP request parameter to JDBC statement execution' },
                  threadFlows: [
                    {
                      id: 'thread-1',
                      message: { text: 'Main Spring Request Thread' },
                      locations: [
                        {
                          step: 1,
                          importance: 'essential',
                          kinds: ['acquire', 'source'],
                          location: {
                            message: { text: 'Untrusted user input read from HTTP request parameter "accountId"' },
                            physicalLocation: {
                              artifactLocation: { uri: 'controllers/UserController.java', uriBaseId: 'SRCROOT' },
                              region: {
                                startLine: 34,
                                startColumn: 12,
                                endLine: 34,
                                endColumn: 62,
                                snippet: { text: 'String rawAccountId = request.getParameter("accountId");' },
                              },
                            },
                          },
                          properties: {
                            state: { 'rawAccountId': 'request.getParameter("accountId")' },
                          },
                        },
                        {
                          step: 2,
                          importance: 'important',
                          kinds: ['call'],
                          location: {
                            message: { text: 'Tainted value passed into AccountService.fetchBalance(rawAccountId)' },
                            physicalLocation: {
                              artifactLocation: { uri: 'services/AccountService.java', uriBaseId: 'SRCROOT' },
                              region: {
                                startLine: 67,
                                startColumn: 9,
                                endLine: 67,
                                endColumn: 52,
                                snippet: { text: 'return accountRepository.findBalance(rawAccountId);' },
                              },
                            },
                          },
                          properties: {
                            state: { 'paramAccountId': 'rawAccountId' },
                          },
                        },
                        {
                          step: 3,
                          importance: 'important',
                          kinds: ['branch'],
                          location: {
                            message: { text: 'Unsafe string concatenation builds raw SQL command' },
                            physicalLocation: {
                              artifactLocation: { uri: 'repository/AccountRepository.java', uriBaseId: 'SRCROOT' },
                              region: {
                                startLine: 108,
                                startColumn: 9,
                                endLine: 108,
                                endColumn: 88,
                                snippet: { text: 'String untrustedQuerySql = "SELECT * FROM accounts WHERE id = \'" + paramAccountId + "\'";' },
                              },
                            },
                          },
                          properties: {
                            state: { 'untrustedQuerySql': '"SELECT * FROM accounts WHERE id = \'" + paramAccountId + "\'"' },
                          },
                        },
                        {
                          step: 4,
                          importance: 'essential',
                          kinds: ['sink'],
                          location: {
                            message: { text: 'Tainted query executed by JDBC driver (Vulnerable Sink)' },
                            physicalLocation: {
                              artifactLocation: { uri: 'repository/AccountRepository.java', uriBaseId: 'SRCROOT' },
                              region: {
                                startLine: 112,
                                startColumn: 24,
                                endLine: 112,
                                endColumn: 68,
                                snippet: { text: 'ResultSet rs = statement.executeQuery(untrustedQuerySql);' },
                              },
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
              fixes: [
                {
                  description: { text: 'Convert raw SQL concatenation to PreparedStatement with positional parameter' },
                  artifactChanges: [
                    {
                      artifactLocation: { uri: 'repository/AccountRepository.java', uriBaseId: 'SRCROOT' },
                      replacements: [
                        {
                          deletedRegion: { startLine: 108, endLine: 112 },
                          insertedContent: {
                            text: 'PreparedStatement stmt = conn.prepareStatement("SELECT * FROM accounts WHERE id = ?");\nstmt.setString(1, paramAccountId);\nResultSet rs = stmt.executeQuery();',
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              ruleId: 'java/path-injection',
              ruleIndex: 1,
              level: 'warning',
              message: {
                text: 'User-provided file name reaches File constructor without path canonicalization check.',
              },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: 'services/ReceiptService.java', uriBaseId: 'SRCROOT' },
                    region: {
                      startLine: 45,
                      startColumn: 16,
                      endLine: 45,
                      endColumn: 58,
                      snippet: { text: 'File receipt = new File(storageDir, userSuppliedFilename);' },
                    },
                  },
                },
              ],
              taxa: [{ id: 'CWE-22' }, { id: 'A01:2021' }],
            },
          ],
        },
      ],
    },
  },
  {
    name: 'Semgrep Auto-Remediation & Fix Diffs',
    description: 'Demonstrates automated code fixes (diff preview, 1-click patch copy), hardcoded secret detection, secondary location tracking, and embedded snippets.',
    filename: 'semgrep_autofix_remediation.sarif',
    data: {
      $schema: 'https://docs.oasis-open.org/sarif/sarif/v2.1.0/os/schemas/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'Semgrep Pro Engine',
              version: '1.78.0',
              informationUri: 'https://semgrep.dev',
              rules: [
                {
                  id: 'python.lang.security.hardcoded-jwt-secret',
                  name: 'HardcodedJwtSecret',
                  shortDescription: { text: 'Hardcoded JWT signing secret token found in codebase.' },
                  fullDescription: { text: 'A hardcoded cryptographic secret was detected in source code. If leaked, attackers can forge valid authentication tokens.' },
                  helpUri: 'https://cwe.mitre.org/data/definitions/798.html',
                  defaultConfiguration: { level: 'error' },
                  properties: {
                    tags: ['security', 'cwe-798', 'jwt', 'P0', 'CRITICAL'],
                  },
                },
                {
                  id: 'python.cryptography.insecure-hash-md5',
                  name: 'InsecureHashMd5',
                  shortDescription: { text: 'Use of broken MD5 cryptographic hash function.' },
                  fullDescription: { text: 'MD5 is vulnerable to collision attacks and should never be used for security-sensitive hashing.' },
                  helpUri: 'https://cwe.mitre.org/data/definitions/327.html',
                  defaultConfiguration: { level: 'warning' },
                  properties: {
                    tags: ['crypto', 'cwe-327'],
                  },
                },
              ],
            },
          },
          results: [
            {
              ruleId: 'python.lang.security.hardcoded-jwt-secret',
              ruleIndex: 0,
              level: 'error',
              message: {
                text: 'Hardcoded secret "super-secret-production-key-998" passed directly to jwt.encode(). Use os.environ.get("JWT_SECRET_KEY") instead.',
              },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: 'src/auth/token_manager.py' },
                    region: {
                      startLine: 28,
                      startColumn: 9,
                      endLine: 28,
                      endColumn: 74,
                      snippet: { text: 'encoded = jwt.encode(payload, "super-secret-production-key-998", algorithm="HS256")' },
                    },
                  },
                },
              ],
              relatedLocations: [
                {
                  id: 1,
                  message: { text: 'Secondary reference to default fallback secret in settings.py' },
                  physicalLocation: {
                    artifactLocation: { uri: 'src/config/settings.py' },
                    region: {
                      startLine: 14,
                      snippet: { text: 'DEFAULT_SECRET_FALLBACK = "super-secret-production-key-998"' },
                    },
                  },
                },
              ],
              taxa: [{ id: 'CWE-798' }],
              fixes: [
                {
                  description: { text: 'Replace hardcoded secret with environment variable lookup' },
                  artifactChanges: [
                    {
                      artifactLocation: { uri: 'src/auth/token_manager.py' },
                      replacements: [
                        {
                          deletedRegion: { startLine: 28, endLine: 28 },
                          insertedContent: {
                            text: 'jwt_secret = os.environ["JWT_SECRET_KEY"]\nencoded = jwt.encode(payload, jwt_secret, algorithm="HS256")',
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              ruleId: 'python.cryptography.insecure-hash-md5',
              ruleIndex: 1,
              level: 'warning',
              message: {
                text: 'hashlib.md5() is insecure. Replace with hashlib.sha256() for collision resistance.',
              },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: 'src/utils/file_hasher.py' },
                    region: {
                      startLine: 19,
                      endLine: 19,
                      snippet: { text: 'file_hash = hashlib.md5(data).hexdigest()' },
                    },
                  },
                },
              ],
              taxa: [{ id: 'CWE-327' }],
              fixes: [
                {
                  description: { text: 'Upgrade hash algorithm to SHA-256' },
                  artifactChanges: [
                    {
                      artifactLocation: { uri: 'src/utils/file_hasher.py' },
                      replacements: [
                        {
                          deletedRegion: { startLine: 19, endLine: 19 },
                          insertedContent: {
                            text: 'file_hash = hashlib.sha256(data).hexdigest()',
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    name: 'OWASP ZAP DAST & Web Traffic Inspector',
    description: 'Demonstrates dynamic application security testing (DAST) with full HTTP request/response inspection, Reflected XSS, and CORS misconfiguration.',
    filename: 'owasp_zap_dast_report.sarif',
    data: {
      $schema: 'https://docs.oasis-open.org/sarif/sarif/v2.1.0/os/schemas/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'OWASP Zed Attack Proxy (ZAP)',
              version: '2.15.0',
              informationUri: 'https://www.zaproxy.org',
              rules: [
                {
                  id: '40012',
                  name: 'CrossSiteScriptingReflected',
                  shortDescription: { text: 'Cross Site Scripting (Reflected) in search query parameter.' },
                  fullDescription: { text: 'User input from the "q" parameter is reflected directly into HTML output without contextual encoding.' },
                  helpUri: 'https://cwe.mitre.org/data/definitions/79.html',
                  defaultConfiguration: { level: 'error' },
                  properties: {
                    tags: ['dast', 'cwe-79', 'owasp-a03:2021', 'CRITICAL'],
                  },
                },
                {
                  id: '10098',
                  name: 'CrossOriginResourceSharing',
                  shortDescription: { text: 'Overly permissive CORS Access-Control-Allow-Origin header.' },
                  fullDescription: { text: 'The server reflects arbitrary origins with credentials enabled in Access-Control-Allow-Credentials.' },
                  helpUri: 'https://cwe.mitre.org/data/definitions/942.html',
                  defaultConfiguration: { level: 'warning' },
                  properties: {
                    tags: ['dast', 'cwe-942', 'cors'],
                  },
                },
              ],
            },
          },
          results: [
            {
              ruleId: '40012',
              ruleIndex: 0,
              level: 'error',
              message: {
                text: 'Reflected XSS payload "<script>alert(document.domain)</script>" successfully rendered in response body without HTML entity encoding.',
              },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: 'https://target-app.internal/search' },
                    region: {
                      startLine: 1,
                      snippet: { text: '<div class="results">Results for: <script>alert(document.domain)</script></div>' },
                    },
                  },
                },
              ],
              taxa: [{ id: 'CWE-79' }, { id: 'A03:2021' }],
              webRequest: {
                method: 'GET',
                target: 'https://target-app.internal/search?q=%3Cscript%3Ealert(document.domain)%3C%2Fscript%3E',
                protocol: 'HTTP',
                version: '1.1',
                headers: {
                  'Host': 'target-app.internal',
                  'User-Agent': 'Mozilla/5.0 (Security Scanner; OWASP ZAP)',
                  'Accept': 'text/html,application/xhtml+xml',
                  'Cookie': 'session_id=9f847a6b2c1e0d3f',
                },
                parameters: {
                  'q': '<script>alert(document.domain)</script>',
                },
              },
              webResponse: {
                statusCode: 200,
                reasonPhrase: 'OK',
                protocol: 'HTTP/1.1',
                headers: {
                  'Content-Type': 'text/html; charset=utf-8',
                  'Server': 'nginx/1.24.0',
                  'X-XSS-Protection': '0',
                },
                body: {
                  text: '<!DOCTYPE html>\n<html>\n<head><title>Search Results</title></head>\n<body>\n  <div class="results">\n    Results for: <script>alert(document.domain)</script>\n  </div>\n</body>\n</html>',
                },
              },
            },
            {
              ruleId: '10098',
              ruleIndex: 1,
              level: 'warning',
              message: {
                text: 'Arbitrary Origin reflected in Access-Control-Allow-Origin with Access-Control-Allow-Credentials: true.',
              },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: 'https://target-app.internal/api/v1/user/profile' },
                  },
                },
              ],
              taxa: [{ id: 'CWE-942' }],
              webRequest: {
                method: 'OPTIONS',
                target: 'https://target-app.internal/api/v1/user/profile',
                headers: {
                  'Host': 'target-app.internal',
                  'Origin': 'https://attacker.evil.com',
                  'Access-Control-Request-Method': 'GET',
                },
              },
              webResponse: {
                statusCode: 204,
                reasonPhrase: 'No Content',
                headers: {
                  'Access-Control-Allow-Origin': 'https://attacker.evil.com',
                  'Access-Control-Allow-Credentials': 'true',
                  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                },
              },
            },
          ],
        },
      ],
    },
  },
  {
    name: 'Trivy & Bandit (Multi-Run Compliance & In-SARIF Suppressions)',
    description: 'Demonstrates multi-tool aggregation (Trivy Container Scanner + Bandit Python Linter), In-SARIF suppressions, CWE & OWASP catalogs, and tool invocations.',
    filename: 'multi_tool_compliance_audit.sarif',
    data: {
      $schema: 'https://docs.oasis-open.org/sarif/sarif/v2.1.0/os/schemas/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'Aqua Trivy',
              version: '0.52.1',
              informationUri: 'https://trivy.dev',
              rules: [
                {
                  id: 'CVE-2023-44487',
                  name: 'Http2RapidReset',
                  shortDescription: { text: 'HTTP/2 Rapid Reset DDoS vulnerability in net/http.' },
                  helpUri: 'https://cwe.mitre.org/data/definitions/400.html',
                  defaultConfiguration: { level: 'error' },
                  properties: {
                    tags: ['cve', 'cwe-400', 'CRITICAL', 'HIGH'],
                  },
                },
              ],
            },
          },
          results: [
            {
              ruleId: 'CVE-2023-44487',
              level: 'error',
              message: {
                text: 'golang.org/x/net v0.14.0 contains CVE-2023-44487 (HTTP/2 Rapid Reset attack). Upgrade to v0.17.0 or newer.',
              },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: 'go.mod' },
                    region: {
                      startLine: 18,
                      snippet: { text: 'golang.org/x/net v0.14.0' },
                    },
                  },
                },
              ],
              taxa: [{ id: 'CWE-400' }],
              suppressions: [
                {
                  kind: 'external',
                  status: 'accepted',
                  justification: 'Compensating control: Rate limiting & HTTP/2 frame limit enforced at AWS CloudFront reverse proxy.',
                },
              ],
            },
          ],
        },
        {
          tool: {
            driver: {
              name: 'Bandit Security Scanner',
              version: '1.7.9',
              informationUri: 'https://bandit.readthedocs.io',
              rules: [
                {
                  id: 'B104',
                  name: 'HardcodedBindAllInterfaces',
                  shortDescription: { text: 'Binding to all network interfaces (0.0.0.0).' },
                  defaultConfiguration: { level: 'warning' },
                  properties: {
                    tags: ['security', 'cwe-200'],
                  },
                },
              ],
            },
          },
          results: [
            {
              ruleId: 'B104',
              level: 'warning',
              message: {
                text: 'Possible binding to all network interfaces (0.0.0.0) in app.run(). Verify if intended for local development.',
              },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: 'server.py' },
                    region: {
                      startLine: 42,
                      snippet: { text: 'app.run(host="0.0.0.0", port=8080)' },
                    },
                  },
                },
              ],
              taxa: [{ id: 'CWE-200' }],
            },
          ],
        },
      ],
    },
  },
];

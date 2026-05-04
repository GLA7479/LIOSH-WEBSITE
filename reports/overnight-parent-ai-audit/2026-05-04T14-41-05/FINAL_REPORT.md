# FINAL_REPORT — Overnight Parent AI audit

## 1. Overall status

**FAIL**

## 2. Product vs infrastructure

- **Product-oriented failures (estimated):** 0
- **Infrastructure / test-runner failures:** 3
- **Parent AI core scripts passed:** yes (per configured IDs)
- **PDF failures likely infra:** no

## 3. Executive summary (Hebrew)

סיכום לילי אוטומטי (2026-05-04T14-41-05): מצב כולל FAIL.
פקודות שעברו: 33, נכשלו: 3, timeout: 0, דולגו: 0.
כשלי מוצר (משוערים): 0; כשלי תשתית/רנר: 3.

## 4. Failure analysis (all fail/timeout)

[
  {
    "id": "c-4",
    "command": "test:parent-copilot-classifier-edge-matrix",
    "status": "fail",
    "category": "TEST_RUNNER_FAILURE",
    "blocksRelease": false,
    "likelyCause": "See log excerpt",
    "excerpt": "\n> leo-k-kids-site@1.0.0 test:parent-copilot-classifier-edge-matrix\n> tsx scripts/parent-copilot-classifier-edge-matrix-suite.mjs\n\nfile:///C:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/scripts/parent-copilot-classifier-edge-matrix-suite.mjs:3\r\nimport { detectAggregateQuestionClass } from \"../utils/parent-copilot/semantic-question-class.js\";\r\n         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^\r\nSyntaxError: The requested module '../utils/parent-copilot/semantic-question-class.js' does not provide an export named 'detectAggregateQuestionClass'\r\n    at ModuleJob._instantiate (node:internal/modules/esm/module_job:226:21)\r\n    at async ModuleJob.run (node:internal/modules/esm/module_job:335:5)\r\n    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:665:26)\r\n    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:117:5)\r\n\r\nNode.js v22.22.0\r\n",
    "logPath": "logs\\c-4.log",
    "priority": "medium"
  },
  {
    "id": "c-10",
    "command": "test:parent-copilot-async-llm-gate",
    "status": "fail",
    "category": "TEST_RUNNER_FAILURE",
    "blocksRelease": false,
    "likelyCause": "See log excerpt",
    "excerpt": "\n> leo-k-kids-site@1.0.0 test:parent-copilot-async-llm-gate\n> tsx scripts/parent-copilot-async-llm-gate-suite.mjs\n\nfile:///C:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/scripts/parent-copilot-async-llm-gate-suite.mjs:4\r\nimport { getLlmGateDecision } from \"../utils/parent-copilot/rollout-gates.js\";\r\n         ^^^^^^^^^^^^^^^^^^\r\nSyntaxError: The requested module '../utils/parent-copilot/rollout-gates.js' does not provide an export named 'getLlmGateDecision'\r\n    at ModuleJob._instantiate (node:internal/modules/esm/module_job:226:21)\r\n    at async ModuleJob.run (node:internal/modules/esm/module_job:335:5)\r\n    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:665:26)\r\n    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:117:5)\r\n\r\nNode.js v22.22.0\r\n",
    "logPath": "logs\\c-10.log",
    "priority": "medium"
  },
  {
    "id": "h-full",
    "command": "qa:learning-simulator:full",
    "status": "fail",
    "category": "TEST_RUNNER_FAILURE",
    "blocksRelease": false,
    "likelyCause": "See log excerpt",
    "excerpt": ".json\"\n}\n  → exit 0, 3576 ms ✓\n\n▶ Scenario coverage (+ critical deep + profile stress)\n  npm run qa:learning-simulator:scenario-coverage\n\n> leo-k-kids-site@1.0.0 qa:learning-simulator:scenario-coverage\n> tsx scripts/learning-simulator/run-scenario-coverage.mjs\n\nWrote C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\reports\\learning-simulator\\scenario-coverage.json\nWrote C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\reports\\learning-simulator\\scenario-coverage.md\nScenario coverage: OK\n  → exit 0, 837 ms ✓\n\n▶ Render release gate (browser/SSR smoke for learning + parent-report)\n  npm run qa:learning-simulator:render\n\n> leo-k-kids-site@1.0.0 qa:learning-simulator:render\n> tsx scripts/learning-simulator/run-render-release-gate.mjs\n\nRender gate: dev server failed to start\n  → exit 1, 610225 ms ✗\n\nOrchestrator: stopping after failure (renderReleaseGate).\n───────────────────────────────────────────────────────────────\n  Finished: FAIL  |  659852 ms total\n  Summary: C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\reports\\learning-simulator\\orchestrator\\run-summary.json\n───────────────────────────────────────────────────────────────\n\n",
    "logPath": "logs\\h-full.log",
    "priority": "medium"
  }
]

## 5. Command table

| id | command | status | category | ms | log |
|----|---------|--------|----------|-----|-----|
| build | build | pass |  | 24106 | logs\build.log |
| b1 | test:parent-ai-context:consistency | pass |  | 663 | logs\b1.log |
| b2 | test:parent-report-ai:integration | pass |  | 874 | logs\b2.log |
| b3 | test:parent-report-ai:scenario-simulator | pass |  | 738 | logs\b3.log |
| c-0 | test:parent-copilot-phase6 | pass |  | 924 | logs\c-0.log |
| c-1 | test:parent-copilot-observability-contract | pass |  | 844 | logs\c-1.log |
| c-2 | test:parent-copilot-parent-render | pass |  | 853 | logs\c-2.log |
| c-3 | test:parent-copilot-product-behavior | pass |  | 730 | logs\c-3.log |
| c-4 | test:parent-copilot-classifier-edge-matrix | fail | TEST_RUNNER_FAILURE | 650 | logs\c-4.log |
| c-5 | test:parent-copilot-scope-collision | pass |  | 596 | logs\c-5.log |
| c-6 | test:parent-copilot-semantic-nearmiss | pass |  | 557 | logs\c-6.log |
| c-7 | test:parent-copilot-broad-report-routing | pass |  | 818 | logs\c-7.log |
| c-8 | test:parent-copilot-recommendation-semantic | pass |  | 680 | logs\c-8.log |
| c-9 | test:parent-copilot-question-class-behavior | pass |  | 715 | logs\c-9.log |
| c-10 | test:parent-copilot-async-llm-gate | fail | TEST_RUNNER_FAILURE | 553 | logs\c-10.log |
| c-11 | test:parent-copilot-copilot-turn-api | pass |  | 1261 | logs\c-11.log |
| d1 | test:parent-ai-phase-e:external | pass |  | 681 | logs\d1.log |
| d2 | test:parent-ai:simulations | pass |  | 750 | logs\d2.log |
| d3 | test:parent-ai:feedback-aggregate | pass |  | 446 | logs\d3.log |
| d4 | test:parent-ai:assistant-qa | pass |  | 749 | logs\d4.log |
| d5 | test:parent-ai:external-question | pass |  | 673 | logs\d5.log |
| d6 | test:parent-ai:bad-prompt | pass |  | 693 | logs\d6.log |
| d-manual | tsx C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\scripts\parent-ai-manual-qa-matrix.mjs --outDir C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-04T14-41-05\manual-qa-matrix-output | pass |  | 1404 | logs\d-manual.log |
| e-ssr | tsx C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\scripts\parent-report-pages-ssr.mjs | pass |  | 1350 | logs\e-ssr.log |
| e-phase1 | test:parent-report-phase1 | pass |  | 1027 | logs\e-phase1.log |
| f-pdf-export | qa:parent-pdf-export | pass |  | 12525 | logs\f-pdf-export.log |
| f-sample-pdfs | C:\Program Files\nodejs\node.exe C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\scripts\overnight-parent-ai-sample-pdfs.mjs --outDir C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-04T14-41-05\sample-pdfs | pass |  | 28349 | logs\f-sample-pdfs.log |
| f-ls-pdf-export | qa:learning-simulator:pdf-export | pass |  | 15418 | logs\f-ls-pdf-export.log |
| g1 | qa:question-metadata | pass |  | 1574 | logs\g1.log |
| g2 | test:adaptive-planner:artifacts | pass |  | 953 | logs\g2.log |
| g3 | test:adaptive-planner:runtime | pass |  | 863 | logs\g3.log |
| g4 | test:adaptive-planner:recommended-practice | pass |  | 696 | logs\g4.log |
| g5 | test:adaptive-planner:scenario-simulator | pass |  | 874 | logs\g5.log |
| h-quick | qa:learning-simulator:quick | pass |  | 13253 | logs\h-quick.log |
| h-full | qa:learning-simulator:full | fail | TEST_RUNNER_FAILURE | 660613 | logs\h-full.log |
| i-synthetic | tsx C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\scripts\overnight-synthetic-e2e-scenarios.mjs --outDir C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-04T14-41-05\synthetic-e2e | pass |  | 2494 | logs\i-synthetic.log |

## 6. Top actionable issues

[
  {
    "id": "c-4",
    "command": "test:parent-copilot-classifier-edge-matrix",
    "status": "fail",
    "category": "TEST_RUNNER_FAILURE",
    "blocksRelease": false,
    "likelyCause": "See log excerpt",
    "excerpt": "\n> leo-k-kids-site@1.0.0 test:parent-copilot-classifier-edge-matrix\n> tsx scripts/parent-copilot-classifier-edge-matrix-suite.mjs\n\nfile:///C:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/scripts/parent-copilot-classifier-edge-matrix-suite.mjs:3\r\nimport { detectAggregateQuestionClass } from \"../utils/parent-copilot/semantic-question-class.js\";\r\n         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^\r\nSyntaxError: The requested module '../utils/parent-copilot/semantic-question-class.js' does not provide an export named 'detectAggregateQuestionClass'\r\n    at ModuleJob._instantiate (node:internal/modules/esm/module_job:226:21)\r\n    at async ModuleJob.run (node:internal/modules/esm/module_job:335:5)\r\n    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:665:26)\r\n    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:117:5)\r\n\r\nNode.js v22.22.0\r\n",
    "logPath": "logs\\c-4.log",
    "priority": "medium"
  },
  {
    "id": "c-10",
    "command": "test:parent-copilot-async-llm-gate",
    "status": "fail",
    "category": "TEST_RUNNER_FAILURE",
    "blocksRelease": false,
    "likelyCause": "See log excerpt",
    "excerpt": "\n> leo-k-kids-site@1.0.0 test:parent-copilot-async-llm-gate\n> tsx scripts/parent-copilot-async-llm-gate-suite.mjs\n\nfile:///C:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/scripts/parent-copilot-async-llm-gate-suite.mjs:4\r\nimport { getLlmGateDecision } from \"../utils/parent-copilot/rollout-gates.js\";\r\n         ^^^^^^^^^^^^^^^^^^\r\nSyntaxError: The requested module '../utils/parent-copilot/rollout-gates.js' does not provide an export named 'getLlmGateDecision'\r\n    at ModuleJob._instantiate (node:internal/modules/esm/module_job:226:21)\r\n    at async ModuleJob.run (node:internal/modules/esm/module_job:335:5)\r\n    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:665:26)\r\n    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:117:5)\r\n\r\nNode.js v22.22.0\r\n",
    "logPath": "logs\\c-10.log",
    "priority": "medium"
  },
  {
    "id": "h-full",
    "command": "qa:learning-simulator:full",
    "status": "fail",
    "category": "TEST_RUNNER_FAILURE",
    "blocksRelease": false,
    "likelyCause": "See log excerpt",
    "excerpt": ".json\"\n}\n  → exit 0, 3576 ms ✓\n\n▶ Scenario coverage (+ critical deep + profile stress)\n  npm run qa:learning-simulator:scenario-coverage\n\n> leo-k-kids-site@1.0.0 qa:learning-simulator:scenario-coverage\n> tsx scripts/learning-simulator/run-scenario-coverage.mjs\n\nWrote C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\reports\\learning-simulator\\scenario-coverage.json\nWrote C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\reports\\learning-simulator\\scenario-coverage.md\nScenario coverage: OK\n  → exit 0, 837 ms ✓\n\n▶ Render release gate (browser/SSR smoke for learning + parent-report)\n  npm run qa:learning-simulator:render\n\n> leo-k-kids-site@1.0.0 qa:learning-simulator:render\n> tsx scripts/learning-simulator/run-render-release-gate.mjs\n\nRender gate: dev server failed to start\n  → exit 1, 610225 ms ✗\n\nOrchestrator: stopping after failure (renderReleaseGate).\n───────────────────────────────────────────────────────────────\n  Finished: FAIL  |  659852 ms total\n  Summary: C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\reports\\learning-simulator\\orchestrator\\run-summary.json\n───────────────────────────────────────────────────────────────\n\n",
    "logPath": "logs\\h-full.log",
    "priority": "medium"
  }
]

## 7. Recommended next fixes

1. Fix PRODUCT_FAILURE rows—review failing assertion/logic.
2. Fix ESM failures—suites now use `tsx` in package.json; re-run.
3. For DEV_SERVER_FAILURE—ensure port free; orchestrator waits for HTTP 200.
4. For PDF_GATE_FAILURE—set QA_BASE_URL to healthy Next dev before gates.

## 8. Sample PDFs (overnight-parent-ai-sample-pdfs.mjs)

- **Summary file:** `sample-pdfs\sample-pdfs-summary.json` (exists: true)
- **Expected PDF count:** 10
- **Generated PDF count:** 10
- **summary.ok:** true
- **Failed profiles:** (none)
- **Generated files:** strong-stable__parent-report-detailed-full.pdf, strong-stable__parent-report-short.pdf, weak-but-improving__parent-report-detailed-full.pdf, weak-but-improving__parent-report-short.pdf, very-little-data__parent-report-detailed-full.pdf, very-little-data__parent-report-short.pdf, six-subject-mixed__parent-report-detailed-full.pdf, six-subject-mixed__parent-report-short.pdf, external-question-flow-report-surface__parent-report-detailed-full.pdf, external-question-flow-report-surface__parent-report-short.pdf
- **Validation errors:** (none)

## Artifact index
- Output root: `C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-04T14-41-05`
- Logs: `C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-04T14-41-05\logs`
- PDF / sample-pdfs: `pdf/`, `sample-pdfs/`

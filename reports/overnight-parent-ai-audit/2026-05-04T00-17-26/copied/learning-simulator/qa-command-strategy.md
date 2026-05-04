# Learning Simulator — QA command strategy

Generated as tooling documentation (not a QA gate artifact). See **`docs/learning-simulator-qa.md`** for full narrative.

## Three tiers

| Tier | npm script | Orchestrator mode | Heavy steps (browser / PDF / deep / build) |
| ---- | ----------- | ----------------- | ------------------------------------------ |
| **Quick** | `qa:learning-simulator:quick` | `quick` | No |
| **Full** | `qa:learning-simulator` or `qa:learning-simulator:full` | `full` | Yes — render, PDF export, deep, build, release-summary |
| **Release** | `qa:learning-simulator:release` | `full` (same as above) | Yes — identical to full |

## Why `release` exists

`qa:learning-simulator:release` invokes the **same** `tsx … run-orchestrator.mjs full` as the default **`qa:learning-simulator`** command. It exists so CI and docs can name a **pre-production** step without maintaining a second implementation.

## Suggested usage

| When | Command |
| ---- | ------- |
| Daily iteration | `npm run qa:learning-simulator:quick` |
| Optional targeted rerun | Individual `npm run qa:learning-simulator:<stage>` |
| Before merge / after big changes | `npm run qa:learning-simulator` |
| Before production release / tagged build | `npm run qa:learning-simulator:release` (or `qa:learning-simulator` — equivalent) |

## Orchestrator output

All tiers write: `reports/learning-simulator/orchestrator/run-summary.json` and `.md`.

## Release readiness summary (`qa:learning-simulator:release-summary`)

Runs **after** other QA artifacts exist. It reads `orchestrator/run-summary.json` as context: **quick** runs do not include a `build` step — the release-summary script treats a missing build step as **skipped**, not failure. For `buildStatus` in `release-readiness-summary.json`, see `skipped` vs `pass` when the last orchestrator was quick-only.

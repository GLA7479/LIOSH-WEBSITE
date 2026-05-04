# `/api/parent/copilot-turn` — production payload trust

## Behavior

| Environment | Client `body.payload` trusted for Copilot engine? |
|-------------|---------------------------------------------------|
| `NODE_ENV !== 'production'` | Yes, after normal authorization (student session or parent Bearer), or dev-only unauthenticated mode per `PARENT_COPILOT_ALLOW_UNAUTH_LOCAL_PAYLOAD`. |
| `NODE_ENV === 'production'` (default) | **No.** The snapshot is not taken from the client. The handler resolves input via `lib/parent-copilot/copilot-turn-payload.server.js`. Until server-side hydration from Supabase + the same pipeline as `generateDetailedParentReport` is implemented, strict production requests return **422** with `SERVER_SNAPSHOT_UNAVAILABLE`. |
| `NODE_ENV === 'production'` + `PARENT_COPILOT_ALLOW_CLIENT_PAYLOAD_IN_PRODUCTION=true` | **Yes (emergency operator escape).** Restores the previous “authenticated client payload” path. **Do not enable on public sites** — it re-opens trust in a client-crafted blob. |

## Headers

- `X-LIOSH-Parent-Copilot-Auth` — unchanged (`student_session` | `parent_bearer` | `dev_local_unverified`).
- `X-LIOSH-Parent-Copilot-Grounding` — set from payload resolution (e.g. `server_rebuilt_learning_snapshot`, `client_payload_authenticated_session_or_parent`, `client_payload_dev_only_unverified`).

## Client contract (short report server runner)

The short parent report may send `reportPeriod` (`week` \| `month` \| `custom`) and, for custom ranges, `rangeFrom` / `rangeTo` (`YYYY-MM-DD`), plus `studentId` when known — required for strict production resolution once server rebuild ships.

## Related code

- `pages/api/parent/copilot-turn.js`
- `lib/parent-copilot/copilot-turn-payload.server.js`
- `npm run test:parent-copilot-copilot-turn-api`

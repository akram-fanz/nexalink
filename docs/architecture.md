# Architecture (PHASE 2)

Public API stays in `src/index.ts`. Protocol internals will live under `src/protocol/` and are not re-exported.

```
createClient()
    │
    ▼
NexaClientImpl  ── events ──► NexaEventBus
    │
    ├── config (Zod)
    ├── logger (redacting pino wrapper)
    └── errors (typed NexaError subclasses)
```

Connection, authentication, and messaging modules exist as empty directories for later phases. They are unused in 0.1.0.

## Connection state machine (documented, not driven yet)

`idle → connecting → authenticating → connected`

Failure / shutdown: `reconnecting | disconnecting | disconnected | failed`

`connected` must not be emitted before a verified handshake (PHASE 3 rule).

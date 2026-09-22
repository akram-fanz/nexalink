# Changelog

All notable changes to @vibersmoon/nexalink are documented here.

## [0.3.0] — 2026-09-22

### Added

- **Media Engine:** MIME type detection via magic bytes, file validation, temporary file cleanup with automatic removal.
- **Plugin System:** `PluginRegistry` for extensible plugin lifecycle (setup, teardown, error isolation).
- **Directory Services:** `GroupService`, `ContactService`, `ChatService`, `PresenceService` for local metadata storage.
- **Comprehensive Documentation:** Updated README with full API reference, examples, and project structure.
- **Security Policy:** Detailed SECURITY.md with legal disclaimers, threat model, and vulnerability reporting.
- **Type-safe Event Listeners:** All event subscriptions use strict TypeScript inference.

### Changed

- Client core (`NexaClientCore`) now implements `on`, `once`, `off` methods directly.
- Connection manager emits detailed transition metadata (state, previousState, reason).
- All public APIs consolidated in root `src/index.ts` (single import point).
- Logger outputs structured JSON with timestamp, level, and context.

### Fixed

- TypeScript import resolution in `directory/index.ts` (corrected relative paths).
- ESLint unused import warnings in test files.
- Build pipeline now generates both ESM and CommonJS with correct type declarations.

### Verified

- ✅ 82 unit tests passing (14 test files).
- ✅ ESLint clean (no errors).
- ✅ TypeScript `noEmit` clean (no errors).
- ✅ Build output: ESM, CJS, `.d.ts` declarations all present.
- ✅ npm audit: 0 production vulnerabilities.

## [0.2.0] — 2026-09-21

### Added

- **Messaging Foundation:** `MessageService` with normalization, validation, ID generation.
- **Event Model:** Type-safe `NexaEventBus` with `on`, `once`, `off` subscriptions.
- **Connection State Machine:** 8-state FSM (idle, connecting, authenticating, connected, disconnecting, disconnected, error, awaiting-login) with guards.
- **Session Store:** File-based `FileSessionStore` with optional AES-256-CBC encryption.
- **Client Phases:** Phase 2 (stub for testing), Phase 3 (full implementation with connection manager).

### Changed

- Configuration validation now uses Zod for strict schema enforcement.
- Connection manager uses exponential backoff with configurable retry limits.

### Tests

- 38 unit tests covering errors, logger, config, events, client, connection, messaging.

## [0.1.0] — 2026-09-21

### Added

- **Initial Release:** Foundation library with stable module structure.
- **Error System:** Typed error classes (ConnectionError, AuthenticationError, TimeoutError, ValidationError, UnsupportedFeatureError, ProtocolError, MediaError, PermissionError, RetryableError, ConfigurationError).
- **Logger:** Structured logging with secret redaction (passwords, tokens, keys, pairing codes).
- **Configuration:** Zod-backed `NexaClientConfig` with validation and normalization.
- **Connection Manager:** Exponential backoff retry logic, connection state tracking.
- **Event Bus:** Async event system with error isolation.
- **Base Client Types:** `NexaClient` interface, factory function stubs.

### Status

- ✅ 21 unit tests passing.
- ✅ Build pipeline (ESM, CJS, TypeScript declarations).
- ✅ ESLint and Prettier configured.

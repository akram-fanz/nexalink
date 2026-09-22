# Testing

Unit tests live in `tests/unit/` and must not require a WhatsApp session.

```bash
npm test
```

Expected (PHASE 2): all unit tests pass.

Integration tests that talk to WhatsApp are **planned**. They will use mocks first, then an authorized test account in CI only.

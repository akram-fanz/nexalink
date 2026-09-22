# NexaLink

Modular, type-safe WhatsApp automation library for Node.js, built from the ground up with security, correctness, and developer experience in mind.

**⚠️ Important:** This is an independent library. It is **not** affiliated with WhatsApp or Meta. Using it may violate WhatsApp Terms of Service. See [SECURITY.md](./SECURITY.md) for legal and protocol constraints.

## Status

| Area | Status |
| --- | --- |
| Package, errors, logger, config, events | ✅ Stable |
| Connection / authentication | ✅ PHASE 3 complete |
| Messaging / media | ✅ PHASE 5 complete |
| Plugins | ✅ PHASE 6 complete |
| Directory (groups, contacts, chats) | ✅ PHASE 7 complete |
| Full protocol implementation | ⏳ In progress |

**Version:** 0.3.0 — Media, plugins, directory services.

## Requirements

- Node.js 20+ (LTS preferred)
- Linux, Windows, or macOS — no OS-specific dependencies

## Install

```bash
npm install @vibersmoon/nexalink
```

(Not yet published to npm. For development, clone and build locally.)

## Quick Start

```typescript
import { createClient } from '@vibersmoon/nexalink';

const client = await createClient({
  sessionName: 'my-bot',
  authDir: './auth',
  logLevel: 'info',
});

// Listen for messages
client.on('message', async (msg) => {
  console.log(`From ${msg.from}: ${msg.text}`);
  await client.sendMessage(msg.from, { text: 'Got it!' });
});

// Listen for connection updates
client.on('connection.update', (update) => {
  console.log(`State: ${update.state}`);
});

await client.connect();
```

## Configuration

| Field | Default | Notes |
| --- | --- | --- |
| `sessionName` | required | 1–64 characters, unique identifier |
| `authDir` | `~/.nexalink/auth` | Directory to store encrypted sessions |
| `logLevel` | `info` | `silent`, `error`, `warn`, `info`, `debug` |
| `connectionTimeoutMs` | `30000` | WebSocket handshake timeout (ms) |
| `reconnect` | `true` | Auto-reconnect on disconnect |
| `maxReconnectAttempts` | `5` | Maximum reconnection retries |
| `retryBaseDelayMs` | `1000` | Initial exponential backoff delay (ms) |
| `encryption` | disabled | Set `encryption: true` to enable AES-256-CBC session encryption |

## API

### `createClient(config: NexaClientConfig): Promise<NexaClient>`

Factory function to create a new client instance.

### `NexaClient` Interface

#### Methods

- `connect(): Promise<void>` — Establish WebSocket and authenticate
- `disconnect(): Promise<void>` — Close connection gracefully
- `logout(): Promise<void>` — Disconnect and destroy session
- `sendMessage(jid: string, options: SendMessageOptions): Promise<{ id: string }>` — Send message
- `on(event: string, listener): () => void` — Register event listener
- `once(event: string, listener): () => void` — One-time listener
- `off(event: string, listener): void` — Unsubscribe listener

#### Properties

- `state: ConnectionState` — Current connection state
- `config: NexaClientConfig` — Active configuration

### Events

#### `connection.update`

```typescript
client.on('connection.update', (update) => {
  console.log(update.state);        // 'connecting', 'connected', 'disconnected', etc.
  console.log(update.previousState);
  console.log(update.reason);       // 'client.connect', 'websocket.error', etc.
});
```

#### `auth.update`

```typescript
client.on('auth.update', (update) => {
  console.log(update.sessionLoaded);  // boolean
  console.log(update.pairingCode);    // string | undefined
});
```

#### `message`

```typescript
client.on('message', (msg) => {
  console.log(msg.id);         // Message ID
  console.log(msg.from);       // Sender JID (e.g., '628123456789@s.whatsapp.net')
  console.log(msg.text);       // Message text
  console.log(msg.timestamp);  // Unix timestamp (ms)
});
```

### Error Handling

```typescript
import {
  NexaError,
  ConnectionError,
  AuthenticationError,
  TimeoutError,
  ValidationError,
  UnsupportedFeatureError,
} from '@vibersmoon/nexalink';

try {
  await client.connect();
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Auth failed:', error.message);
  } else if (error instanceof ConnectionError) {
    console.error('Connection failed:', error.message);
  }
}
```

### Media Support

```typescript
import { MediaService } from '@vibersmoon/nexalink';

const media = new MediaService({
  mediaDirectory: './media',
  maxBytes: 16 * 1024 * 1024,
  logger: client.logger,
});

const prepared = await media.prepare({
  buffer: imageBuffer,
  filename: 'photo.jpg',
});

console.log(prepared.kind);       // 'image', 'video', 'audio', 'document'
console.log(prepared.mimeType);   // 'image/jpeg'
console.log(prepared.size);       // file size in bytes
```

### Plugins

```typescript
import { definePlugin, PluginRegistry } from '@vibersmoon/nexalink';

const plugin = definePlugin({
  name: 'auto-reply',
  version: '1.0.0',
  setup(host) {
    host.on('message', async (msg) => {
      console.log('Plugin received:', msg.text);
    });
  },
  teardown() {
    console.log('Cleaning up');
  },
});

const registry = new PluginRegistry(client.logger);
await registry.use(plugin, client);

// When done
await registry.teardownAll();
```

### Directory Services

```typescript
import {
  GroupService,
  ContactService,
  ChatService,
  PresenceService,
} from '@vibersmoon/nexalink';

const groups = new GroupService(client.logger);
groups.upsert({
  id: '123-456@g.us',
  subject: 'Team Chat',
  participants: ['628123456789@s.whatsapp.net'],
});

const contacts = new ContactService(client.logger);
contacts.upsert({
  id: '628123456789@s.whatsapp.net',
  name: 'John Doe',
});

const chats = new ChatService(client.logger);
chats.upsert({
  id: '628123456789@s.whatsapp.net',
  unreadCount: 5,
});

const presence = new PresenceService(client.logger);
// Presence updates require active protocol session (PHASE 9+)
```

## Development

### Setup

```bash
git clone https://github.com/akram-fanz/nexalink.git
cd nexalink
npm install
```

### Scripts

```bash
npm test              # Run full test suite
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
npm run build        # Compile ESM, CJS, TypeScript declarations
npm run lint         # ESLint
npm run format       # Prettier
```

### Project Structure

```
nexalink/
├── src/
│   ├── client/          # Client factory and phases
│   ├── connection/      # Connection manager, state machine, transport
│   ├── auth/            # Session store, auth provider
│   ├── messaging/       # Message model, service, validation
│   ├── media/           # MIME detection, file validation
│   ├── plugins/         # Plugin registry and API
│   ├── groups/          # Group service
│   ├── contacts/        # Contact service
│   ├── chats/           # Chat service
│   ├── presence/        # Presence service
│   ├── events/          # Event bus
│   ├── errors/          # Error classes
│   ├── logger.ts        # Logger with secret redaction
│   ├── config.ts        # Configuration validation (Zod)
│   ├── constants/       # Library constants
│   ├── types/           # Type definitions
│   └── index.ts         # Public API exports
├── tests/
│   └── unit/            # Vitest unit tests (82 tests)
├── package.json         # v0.3.0
├── tsconfig.json        # TypeScript configuration
├── vitest.config.ts     # Vitest configuration
├── eslint.config.js     # ESLint configuration
├── prettier.config.js   # Prettier configuration
├── README.md            # This file
├── SECURITY.md          # Security policy
├── CHANGELOG.md         # Version history
└── LICENSE              # MIT

```

## Phase Timeline

- ✅ **PHASE 1 (Research & Planning):** Feasibility, protocol analysis, architecture planning
- ✅ **PHASE 2 (Foundation):** Package, errors, logger, config, events, client stub
- ✅ **PHASE 3 (Connection & Auth):** Connection manager, state machine, session store, WebSocket transport
- ✅ **PHASE 4 (Messaging):** Message model, validation, service, sendMessage API
- ✅ **PHASE 5 (Media):** MIME detection, file validation, temporary file cleanup
- ✅ **PHASE 6 (Plugins):** Plugin registry, lifecycle hooks, extensibility
- ✅ **PHASE 7 (Directory):** Groups, contacts, chats, presence services (local metadata only)
- 🔄 **PHASE 8 (Documentation):** README, API docs, security policy, contribution guide
- ⏳ **PHASE 9 (Release):** GitHub publish, npm publish, CI/CD setup

## License

MIT. See [LICENSE](./LICENSE).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) (coming soon).

## Support

- **Issues:** GitHub Issues: https://github.com/akram-fanz/nexalink/issues
- **Security:** See [SECURITY.md](./SECURITY.md)

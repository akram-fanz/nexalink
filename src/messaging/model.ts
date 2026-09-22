import type { NexaMessage, SendMessageOptions } from './types.js';

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeMessage(
  from: string,
  to: string,
  options: SendMessageOptions,
): NexaMessage {
  return {
    id: generateMessageId(),
    from,
    to,
    timestamp: Date.now(),
    type: options.type ?? 'text',
    text: options.text,
    quoted: options.quoted,
    mentions: options.mentions,
    mediaUrl: options.mediaUrl,
    caption: options.caption,
  };
}

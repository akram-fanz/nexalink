import { z } from 'zod';
import { ValidationError } from '../errors/index.js';
import type { SendMessageOptions } from './types.js';

const PhoneNumberSchema = z.string().regex(/^\d+@s\.whatsapp\.net$|^\d+@g\.us$/);

export const SendMessageOptionsSchema = z.object({
  text: z.string().min(1, 'text is required').max(4096, 'text too long'),
  quoted: z.string().optional(),
  mentions: z.array(PhoneNumberSchema).optional(),
  type: z.enum(['text', 'image', 'video', 'audio', 'document', 'sticker']).optional(),
  mediaUrl: z.string().url().optional(),
  caption: z.string().max(1024).optional(),
});

export function validateSendOptions(options: unknown): SendMessageOptions {
  const result = SendMessageOptionsSchema.safeParse(options);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'options'}: ${issue.message}`)
      .join('; ');
    throw new ValidationError(`Invalid message options: ${issues}`, {
      metadata: { issueCount: result.error.issues.length },
    });
  }
  return result.data;
}

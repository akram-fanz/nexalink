export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker';

export interface NexaMessage {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly timestamp: number;
  readonly type: MessageType;
  readonly text?: string;
  readonly quoted?: string;
  readonly mentions?: ReadonlyArray<string>;
  readonly mediaUrl?: string;
  readonly caption?: string;
}

export interface SendTextOptions {
  readonly text: string;
  readonly quoted?: string;
  readonly mentions?: ReadonlyArray<string>;
}

export interface SendMessageOptions extends SendTextOptions {
  readonly type?: MessageType;
  readonly mediaUrl?: string;
  readonly caption?: string;
}

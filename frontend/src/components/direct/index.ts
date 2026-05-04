/**
 * @fileoverview Barrel export per componenti Direct Messages.
 * 
 * Permette di importare i componenti DM da un unico punto:
 * import { ChatContactList, MessageList, MessageInput } from '@/components/direct';
 * 
 * @module components/direct
 */

export { default as ChatContactList } from './ChatContactList';
export type { ChatContact } from './ChatContactList';

export { default as MessageInput } from './MessageInput';

export { default as MessageList } from './MessageList';
export type { MessageItem } from './MessageList';

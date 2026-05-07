/**
 * @fileoverview Repository per la gestione dei Direct Messages
 *
 * Incapsula tutte le operazioni database relative alle chat e messaggi:
 * - Recupero lista chat dell'utente
 * - Recupero messaggi di una chat
 * - Invio nuovi messaggi
 * - Creazione chat (1-to-1)
 *
 * PATTERN REPOSITORY:
 * Separa la logica di accesso ai dati dalla logica di business,
 * permettendo di testare e modificare l'implementazione in modo indipendente.
 *
 * @module repositories/DirectMessageRepository
 */

import { queryOne, queryAll, execute } from '@/lib/db';

// ============================================================================
// INTERFACCE
// ============================================================================

/**
 * Rappresenta una chat nel database
 */
export interface Chat {
  id: number;
  is_group: boolean;
  name: string | null;
  created_by_profile_id: number | null;
  last_message_at: number | null;
  created_at: string;
  deleted_at: string | null;
}

/**
 * Chat con informazioni sull'ultimo messaggio e l'altro partecipante
 */
export interface ChatWithDetails {
  id: number;
  is_group: boolean;
  name: string | null;
  last_message_at: string | null;
  last_message_text: string | null;
  last_message_sender_id: number | null;
  other_profile_id: number | null;
  other_username: string | null;
  other_full_name: string | null;
  other_profile_image_url: string | null;
}

/**
 * Chat mappata per il frontend
 */
export interface MappedChat {
  id: number | null;
  is_group: boolean;
  name: string | null;
  last_message_at: string | null;
  last_message_text: string | null;
  isFromMe: boolean;
  other_profile_id: number | null;
  other_username: string | null;
  other_full_name: string | null;
  other_profile_image_url: string | null;
}

/**
 * Rappresenta un messaggio nel database
 */
export interface Message {
  id: number;
  chat_id: number;
  sender_profile_id: number;
  text: string;
  created_at: string;
}

/**
 * Messaggio con informazioni sul mittente
 */
export interface MessageWithSender extends Message {
  username: string;
}

/**
 * Contatto potenziale (follower/following senza chat)
 */
export interface PotentialContact {
  id: number;
  username: string;
  full_name: string | null;
  profile_image_url: string | null;
}

// ============================================================================
// REPOSITORY
// ============================================================================

/**
 * Repository per la gestione dei messaggi diretti.
 * Implementa il pattern Repository per centralizzare l'accesso ai dati.
 */
class DirectMessageRepository {
  
  /**
   * Recupera tutte le chat dell'utente con dettagli.
   * Include l'ultimo messaggio e informazioni sull'altro partecipante.
   * 
   * @param profileId - ID del profilo corrente
   * @param limit - Numero massimo di chat da restituire
   * @returns Array di chat con dettagli
   */
  async getChatsWithDetails(profileId: number, limit: number = 50): Promise<ChatWithDetails[]> {
    return queryAll<ChatWithDetails>(
      `SELECT
        c.id, 
        c.is_group, 
        c.name, 
        c.last_message_at,
        (SELECT m.text FROM messages m WHERE m.chat_id = c.id AND m.deleted_at IS NULL ORDER BY m.created_at DESC LIMIT 1) as last_message_text,
        (SELECT m.sender_profile_id FROM messages m WHERE m.chat_id = c.id AND m.deleted_at IS NULL ORDER BY m.created_at DESC LIMIT 1) as last_message_sender_id,
        (SELECT cp2.profile_id FROM chat_participants cp2 WHERE cp2.chat_id = c.id AND cp2.profile_id != ? AND cp2.left_at IS NULL LIMIT 1) as other_profile_id,
        (SELECT p.username FROM chat_participants cp2 JOIN profiles p ON p.id = cp2.profile_id WHERE cp2.chat_id = c.id AND cp2.profile_id != ? AND cp2.left_at IS NULL LIMIT 1) as other_username,
        (SELECT p.full_name FROM chat_participants cp2 JOIN profiles p ON p.id = cp2.profile_id WHERE cp2.chat_id = c.id AND cp2.profile_id != ? AND cp2.left_at IS NULL LIMIT 1) as other_full_name,
        (SELECT p.profile_image_url FROM chat_participants cp2 JOIN profiles p ON p.id = cp2.profile_id WHERE cp2.chat_id = c.id AND cp2.profile_id != ? AND cp2.left_at IS NULL LIMIT 1) as other_profile_image_url
      FROM chats c
      JOIN chat_participants cp ON cp.chat_id = c.id
      WHERE cp.profile_id = ? AND cp.left_at IS NULL AND c.deleted_at IS NULL
      ORDER BY 
        CASE WHEN c.last_message_at IS NULL THEN 1 ELSE 0 END,
        c.last_message_at DESC, 
        c.created_at DESC
      LIMIT ?`,
      [profileId, profileId, profileId, profileId, profileId, limit]
    );
  }

  /**
   * Recupera i follower e following senza chat esistente.
   * Usato per mostrare contatti potenziali nella lista messaggi.
   * 
   * @param profileId - ID del profilo corrente
   * @param limit - Numero massimo di contatti
   * @returns Array di contatti potenziali
   */
  async getFollowersWithoutChat(profileId: number, limit: number = 100): Promise<PotentialContact[]> {
    return queryAll<PotentialContact>(
      `SELECT p.id, p.username, p.full_name, p.profile_image_url
       FROM profiles p
       JOIN follows f ON (
        (f.follower_profile_id = p.id AND f.following_profile_id = ?)
        OR
        (f.following_profile_id = p.id AND f.follower_profile_id = ?)
      )
      WHERE f.status = 'accepted' 
        AND f.deleted_at IS NULL 
        AND p.deleted_at IS NULL
        AND p.id != ?
      ORDER BY p.username
      LIMIT ?`,
      [profileId, profileId, profileId, limit]
    );
  }

  /**
   * Mappa le chat per il formato del frontend.
   * 
   * @param chats - Array di chat con dettagli
   * @param currentProfileId - ID del profilo corrente
   * @returns Array di chat mappate
   */
  mapChatsForFrontend(chats: ChatWithDetails[], currentProfileId: number): MappedChat[] {
    return chats.map(chat => ({
      id: chat.id,
      is_group: Boolean(chat.is_group),
      name: chat.name || chat.other_full_name || chat.other_username,
      last_message_at: chat.last_message_at,
      last_message_text: chat.last_message_text,
      isFromMe: chat.last_message_sender_id === currentProfileId,
      other_profile_id: chat.other_profile_id,
      other_username: chat.other_username,
      other_full_name: chat.other_full_name,
      other_profile_image_url: chat.other_profile_image_url,
    }));
  }

  /**
   * Mappa i contatti potenziali come chat vuote per il frontend.
   * 
   * @param contacts - Array di contatti potenziali
   * @returns Array di chat mappate (senza ID chat)
   */
  mapContactsAsPotentialChats(contacts: PotentialContact[]): MappedChat[] {
    return contacts.map(f => ({
      id: null, // Nessuna chat esistente
      is_group: false,
      name: f.full_name || f.username,
      last_message_at: null,
      last_message_text: null,
      isFromMe: false,
      other_profile_id: f.id,
      other_username: f.username,
      other_full_name: f.full_name,
      other_profile_image_url: f.profile_image_url,
    }));
  }

  /**
   * Verifica se un utente è partecipante attivo di una chat.
   * 
   * @param chatId - ID della chat
   * @param profileId - ID del profilo da verificare
   * @returns true se è partecipante attivo
   */
  async isParticipant(chatId: number, profileId: number): Promise<boolean> {
    const result = await queryOne<{ id: number }>(
      `SELECT 1 as id FROM chat_participants WHERE chat_id = ? AND profile_id = ? AND left_at IS NULL`,
      [chatId, profileId]
    );
    return result !== null;
  }

  /**
   * Recupera i messaggi di una chat.
   * 
   * @param chatId - ID della chat
   * @param limit - Numero massimo di messaggi
   * @returns Array di messaggi con info mittente (ordine DESC)
   */
  async getMessages(chatId: number, limit: number = 100): Promise<MessageWithSender[]> {
    return queryAll<MessageWithSender>(
      `SELECT m.id, m.chat_id, m.sender_profile_id, p.username, m.text, m.created_at
       FROM messages m
       JOIN profiles p ON p.id = m.sender_profile_id
       WHERE m.chat_id = ? AND m.deleted_at IS NULL
       ORDER BY m.created_at DESC
       LIMIT ?`,
      [chatId, limit]
    );
  }

  /**
   * Invia un nuovo messaggio in una chat.
   * Aggiorna anche il timestamp dell'ultimo messaggio sulla chat.
   * 
   * @param chatId - ID della chat
   * @param senderProfileId - ID del profilo mittente
   * @param text - Testo del messaggio
   * @returns ID del messaggio creato
   */
  async sendMessage(chatId: number, senderProfileId: number, text: string): Promise<number> {
    // Inserisci il messaggio
    const result = await execute(
      `INSERT INTO messages (chat_id, sender_profile_id, text) VALUES (?, ?, ?) RETURNING id`,
      [chatId, senderProfileId, text]
    );

    await execute(
      `UPDATE chats SET last_message_at = NOW() WHERE id = ?`,
      [chatId]
    );

    return result.lastID!;
  }

  /**
   * Cerca una chat 1-to-1 esistente tra due profili.
   * 
   * @param profileId1 - ID del primo profilo
   * @param profileId2 - ID del secondo profilo
   * @returns ID della chat se esiste, null altrimenti
   */
  async findExistingChat(profileId1: number, profileId2: number): Promise<number | null> {
    const chat = await queryOne<{ id: number }>(
      `SELECT c.id
       FROM chats c
       WHERE NOT c.is_group
         AND c.deleted_at IS NULL
         AND EXISTS (
           SELECT 1 FROM chat_participants cp1
           WHERE cp1.chat_id = c.id AND cp1.profile_id = ? AND cp1.left_at IS NULL
         )
         AND EXISTS (
           SELECT 1 FROM chat_participants cp2
           WHERE cp2.chat_id = c.id AND cp2.profile_id = ? AND cp2.left_at IS NULL
         )`,
      [profileId1, profileId2]
    );
    return chat?.id ?? null;
  }

  /**
   * Crea una nuova chat 1-to-1 tra due profili.
   * 
   * @param creatorProfileId - ID del profilo che crea la chat
   * @param otherProfileId - ID dell'altro partecipante
   * @returns ID della chat creata
   */
  async createChat(creatorProfileId: number, otherProfileId: number): Promise<number> {
    // Crea la chat
    const chatResult = await execute(
      'INSERT INTO chats (is_group, created_by_profile_id) VALUES (?, ?) RETURNING id',
      [false, creatorProfileId]
    );

    const chatId = chatResult.lastID!;

    // Aggiungi entrambi i partecipanti
    await execute(
      'INSERT INTO chat_participants (chat_id, profile_id, role) VALUES (?, ?, ?)',
      [chatId, creatorProfileId, 'member']
    );

    await execute(
      'INSERT INTO chat_participants (chat_id, profile_id, role) VALUES (?, ?, ?)',
      [chatId, otherProfileId, 'member']
    );

    return chatId;
  }

  /**
   * Trova o crea una chat 1-to-1 tra due profili.
   * Se esiste già una chat, restituisce l'ID esistente.
   * Altrimenti ne crea una nuova.
   * 
   * @param profileId1 - ID del primo profilo (creatore se nuova)
   * @param profileId2 - ID del secondo profilo
   * @returns ID della chat (esistente o nuova)
   */
  async getOrCreateChat(profileId1: number, profileId2: number): Promise<number> {
    const existingChatId = await this.findExistingChat(profileId1, profileId2);
    
    if (existingChatId) {
      return existingChatId;
    }

    return this.createChat(profileId1, profileId2);
  }

  /**
   * Verifica se un profilo esiste e non è eliminato.
   * 
   * @param profileId - ID del profilo
   * @returns true se esiste
   */
  async profileExists(profileId: number): Promise<boolean> {
    const result = await queryOne<{ id: number }>(
      'SELECT id FROM profiles WHERE id = ? AND deleted_at IS NULL',
      [profileId]
    );
    return result !== null;
  }
}

// Singleton instance
export const directMessageRepository = new DirectMessageRepository();

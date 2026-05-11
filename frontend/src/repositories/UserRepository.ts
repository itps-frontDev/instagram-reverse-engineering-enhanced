/**
 * @fileoverview User Repository (Repository Pattern)
 * 
 * Gestisce tutte le operazioni database relative agli utenti.
 * Separa la logica di accesso ai dati dalla logica di business.
 * 
 * PATTERN REPOSITORY:
 * Il Repository Pattern astrae l'accesso ai dati, fornendo un'interfaccia
 * pulita per operazioni CRUD. Vantaggi:
 * 1. Separazione delle responsabilità (Single Responsibility Principle)
 * 2. Facilità di testing (si può mockare il repository)
 * 3. Cambio database trasparente (basta modificare il repository)
 * 4. Query riutilizzabili e centralizzate
 * 
 * @module repositories/UserRepository
 * 
 * @example
 * import { userRepository } from '@/repositories';
 * 
 * // Trova utente per ID
 * const user = await userRepository.findById(1);
 * 
 * // Trova utente per email (per login)
 * const userByEmail = await userRepository.findByEmail('test@example.com');
 * 
 * // Crea nuovo utente
 * const userId = await userRepository.create({
 *   email: 'nuovo@example.com',
 *   password_hash: hashedPassword,
 *   date_of_birth: '1990-01-01'
 * });
 */

import { queryOne, execute } from '@/lib/db';
import type { User, UserWithPassword, UserWithProfile } from '@/types/auth';

// ============================================================================
// TIPI PER LE OPERAZIONI DEL REPOSITORY
// ============================================================================

/**
 * Dati necessari per creare un nuovo utente.
 * Almeno email O phone_number deve essere fornito.
 */
export interface CreateUserData {
  /** Email dell'utente (opzionale se c'è il telefono) */
  email?: string;
  /** Numero di telefono (opzionale se c'è l'email) */
  phone_number?: string;
  /** Hash della password (MAI salvare password in chiaro!) */
  password_hash: string;
  /** Data di nascita in formato ISO (YYYY-MM-DD) */
  date_of_birth: string;
}

/**
 * Dati per aggiornare un utente esistente.
 * Tutti i campi sono opzionali - solo quelli forniti verranno aggiornati.
 * Questo pattern si chiama "Partial Update".
 */
export interface UpdateUserData {
  email?: string;
  phone_number?: string;
  password_hash?: string;
  is_email_verified?: boolean;
  is_phone_verified?: boolean;
  last_login_at?: string;
}

// ============================================================================
// REPOSITORY
// ============================================================================

/**
 * Repository per le operazioni sugli utenti.
 * Esportato come oggetto singleton per un facile utilizzo.
 */
export const userRepository = {
  /**
   * Trova un utente per ID.
   * Esclude automaticamente gli utenti "soft deleted".
   * 
   * @param id - ID dell'utente da cercare
   * @returns L'utente trovato o null se non esiste
   */
  async findById(id: string | number): Promise<User | null> {
    const user = await queryOne<User>(
      `SELECT id, email, phone_number
       FROM users
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return user || null;
  },

  /**
   * Trova un utente per indirizzo email.
   * La ricerca è case-sensitive in SQLite per default.
   * 
   * @param email - Email da cercare
   * @returns L'utente trovato o null
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await queryOne<User>(
      `SELECT id, email, phone_number
       FROM users
       WHERE email = ? AND deleted_at IS NULL`,
      [email.trim().toLowerCase()]
    );
    return user || null;
  },

  /**
   * Trova un utente per numero di telefono.
   * 
   * @param phone - Numero di telefono da cercare
   * @returns L'utente trovato o null
   */
  async findByPhone(phone: string): Promise<User | null> {
    const user = await queryOne<User>(
      `SELECT id, email, phone_number
       FROM users
       WHERE phone_number = ? AND deleted_at IS NULL`,
      [phone.trim().toLowerCase()]
    );
    return user || null;
  },

  /**
   * Trova un utente per credenziali di login (email, telefono, o username).
   * Usato durante l'autenticazione - cerca in tutti i campi identificativi.
   * Include anche l'hash della password per la verifica.
   * 
   * NOTA: Usa LEFT JOIN con profiles perché l'utente potrebbe
   * non avere ancora un profilo associato.
   * 
   * @param identifier - Email, telefono, o username
   * @returns Utente con profilo e password_hash, o null
   */
  async findByCredentials(identifier: string): Promise<UserWithProfile & { password_hash: string } | null> {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const user = await queryOne<UserWithProfile & { password_hash: string }>(
      `SELECT
        u.id,
        u.email,
        u.phone_number,
        u.password_hash,
        p.username,
        p.full_name
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE (u.email = ? OR u.phone_number = ? OR p.username = ?)
        AND u.deleted_at IS NULL
      LIMIT 1`,
      [normalizedIdentifier, normalizedIdentifier, normalizedIdentifier]
    );
    return user || null;
  },

  /**
   * Trova un utente includendo l'hash della password.
   * Usato per operazioni che richiedono verifica password
   * (es. cambio password, conferma azioni sensibili).
   * 
   * @param id - ID dell'utente
   * @returns Utente con password_hash o null
   */
  async findWithPasswordById(id: string | number): Promise<UserWithPassword | null> {
    const user = await queryOne<UserWithPassword>(
      `SELECT id, email, phone_number, password_hash
       FROM users
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return user || null;
  },

  /**
   * Crea un nuovo utente nel database.
   * Restituisce l'ID del nuovo utente (lastID in SQLite).
   * 
   * IMPORTANTE: La password deve essere già hashata prima di chiamare
   * questo metodo. Non passare MAI password in chiaro!
   * 
   * @param data - Dati del nuovo utente
   * @returns ID dell'utente appena creato
   */
  async create(data: CreateUserData): Promise<number> {
    const result = await execute(
      `INSERT INTO users (email, phone_number, password_hash, date_of_birth)
       VALUES (?, ?, ?, ?) RETURNING id`,
      [
        data.email ? data.email.trim().toLowerCase() : null,
        data.phone_number ? data.phone_number.trim().toLowerCase() : null,
        data.password_hash,
        data.date_of_birth
      ]
    );
    return result.lastID;
  },

  /**
   * Aggiorna un utente esistente.
   * Costruisce dinamicamente la query SQL in base ai campi forniti.
   * Questo approccio evita di sovrascrivere campi non specificati.
   * 
   * PATTERN: Query Builder dinamica
   * - Crea array di 'campo = ?' per ogni campo da aggiornare
   * - Costruisce la query concatenando i campi
   * - Aggiunge automaticamente updated_at
   * 
   * @param id - ID dell'utente da aggiornare
   * @param data - Campi da aggiornare (solo quelli specificati)
   * @returns true se l'update ha avuto effetto, false altrimenti
   */
  async update(id: string | number, data: UpdateUserData): Promise<boolean> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email ? data.email.trim().toLowerCase() : null);
    }
    if (data.phone_number !== undefined) {
      fields.push('phone_number = ?');
      values.push(data.phone_number ? data.phone_number.trim().toLowerCase() : null);
    }
    if (data.password_hash !== undefined) {
      fields.push('password_hash = ?');
      values.push(data.password_hash);
    }
    if (data.is_email_verified !== undefined) {
      fields.push('is_email_verified = ?');
      values.push(data.is_email_verified);
    }
    if (data.is_phone_verified !== undefined) {
      fields.push('is_phone_verified = ?');
      values.push(data.is_phone_verified);
    }
    if (data.last_login_at !== undefined) {
      fields.push('last_login_at = ?');
      values.push(data.last_login_at);
    }

    if (fields.length === 0) return false;

    fields.push("updated_at = NOW()");
    values.push(id);

    const result = await execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      values
    );
    return result.changes > 0;
  },

  /**
   * Aggiorna il timestamp dell'ultimo login.
   * Chiamato dopo ogni login riuscito per tracking.
   * 
   * @param id - ID dell'utente
   */
  async updateLastLogin(id: string | number): Promise<void> {
    await execute(
      `UPDATE users SET last_login_at = NOW(), updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
  },

  /**
   * Elimina un utente (soft delete).
   * 
   * SOFT DELETE vs HARD DELETE:
   * - Soft Delete: imposta deleted_at, il record rimane nel DB
   * - Hard Delete: rimuove fisicamente il record (DELETE FROM)
   * 
   * Vantaggi Soft Delete:
   * - Recupero dati possibile
   * - Audit trail mantenuto
   * - Integrità referenziale preservata
   * 
   * @param id - ID dell'utente da eliminare
   * @returns true se l'eliminazione ha avuto effetto
   */
  async softDelete(id: string | number): Promise<boolean> {
    const result = await execute(
      `UPDATE users SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return result.changes > 0;
  },

  /**
   * Verifica se un'email è già in uso.
   * Usato durante registrazione e modifica profilo.
   * 
   * @param email - Email da verificare
   * @param excludeUserId - ID utente da escludere (per update profilo proprio)
   * @returns true se l'email è già usata da un altro utente
   */
  async isEmailTaken(email: string, excludeUserId?: string | number): Promise<boolean> {
    const query = excludeUserId
      ? `SELECT 1 FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL`
      : `SELECT 1 FROM users WHERE email = ? AND deleted_at IS NULL`;
    const params = excludeUserId ? [email, excludeUserId] : [email];
    const result = await queryOne(query, params);
    return !!result;
  },

  /**
   * Verifica se un numero di telefono è già in uso.
   * 
   * @param phone - Numero di telefono da verificare
   * @param excludeUserId - ID utente da escludere (per update profilo proprio)
   * @returns true se il numero è già usato da un altro utente
   */
  async isPhoneTaken(phone: string, excludeUserId?: string | number): Promise<boolean> {
    const query = excludeUserId
      ? `SELECT 1 FROM users WHERE phone_number = ? AND id != ? AND deleted_at IS NULL`
      : `SELECT 1 FROM users WHERE phone_number = ? AND deleted_at IS NULL`;
    const params = excludeUserId ? [phone, excludeUserId] : [phone];
    const result = await queryOne(query, params);
    return !!result;
  },

  /**
   * Aggiorna la data di nascita di un utente.
   * 
   * @param id - ID dell'utente
   * @param dateOfBirth - Data di nascita in formato ISO (YYYY-MM-DD)
   * @returns true se l'update ha avuto effetto
   */
  async updateDateOfBirth(id: string | number, dateOfBirth: string): Promise<boolean> {
    const result = await execute(
      `UPDATE users 
       SET date_of_birth = ?, updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [dateOfBirth, id]
    );
    return result.changes > 0;
  },

  /**
   * Aggiorna l'hash della password di un utente.
   * 
   * @param id - ID dell'utente
   * @param passwordHash - Nuovo hash della password (già hashata con bcrypt)
   * @returns true se l'update ha avuto effetto
   */
  async updatePassword(id: string | number, passwordHash: string): Promise<boolean> {
    const result = await execute(
      `UPDATE users 
       SET password_hash = ?, updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [passwordHash, id]
    );
    return result.changes > 0;
  },

  /**
   * Aggiorna email e/o telefono di un utente.
   * 
   * @param id - ID dell'utente
   * @param email - Nuova email (null per rimuovere)
   * @param phoneNumber - Nuovo telefono (null per rimuovere)
   * @returns true se l'update ha avuto effetto
   */
  async updateContactInfo(
    id: string | number, 
    email: string | null, 
    phoneNumber: string | null
  ): Promise<boolean> {
    const result = await execute(
      `UPDATE users 
       SET email = ?, phone_number = ?, updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [email, phoneNumber, id]
    );
    return result.changes > 0;
  },

  /**
   * Recupera i dati di sicurezza di un utente (email e telefono).
   * Usato nella pagina impostazioni sicurezza.
   * 
   * @param id - ID dell'utente
   * @returns Dati sicurezza o null
   */
  async getSecurityData(id: string | number): Promise<{ id: string | number; email: string | null; phone_number: string | null } | null> {
    const user = await queryOne<{ id: string | number; email: string | null; phone_number: string | null }>(
      `SELECT id, email, phone_number
       FROM users
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return user || null;
  },

  /**
   * Recupera la data di nascita di un utente.
   * Usato nella pagina impostazioni data di nascita.
   * 
   * @param id - ID dell'utente
   * @returns Dati con data di nascita o null
   */
  async getBirthdayData(id: string | number): Promise<{ id: string | number; date_of_birth: string } | null> {
    const user = await queryOne<{ id: string | number; date_of_birth: string }>(
      `SELECT id, date_of_birth
       FROM users
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return user || null;
  },
};

export default userRepository;

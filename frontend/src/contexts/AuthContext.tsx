/**
 * @fileoverview Contesto di autenticazione.
 *
 * Fornisce lo stato di autenticazione e il profilo utente a tutti i componenti.
 * Gestisce login, logout e refresh del profilo tramite API.
 * 
 * FUNZIONALITÀ:
 * - Stato autenticazione globale
 * - Profilo utente corrente
 * - Login con token JWT (cookie HTTP-only)
 * - Logout con pulizia stato
 * - Refresh profilo on-demand
 * 
 * @module contexts/AuthContext
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { MeProfile } from '@/features/profile';
import { logoutAction, getMyProfileAction } from '@/features/auth/actions';

// ============================================================================
// INTERFACCE
// ============================================================================

/**
 * Tipo del contesto di autenticazione.
 * 
 * @interface AuthContextType
 */
interface AuthContextType {
  /** Profilo utente corrente (null se non autenticato) */
  profile: MeProfile | null;
  /** Stato di caricamento iniziale */
  isLoading: boolean;
  /** Se l'utente è autenticato */
  isAuthenticated: boolean;
  /** Funzione per effettuare il login */
  login: () => Promise<void>;
  /** Funzione per effettuare il logout */
  logout: () => Promise<void>;
  /** Funzione per aggiornare il profilo */
  refreshProfile: () => Promise<void>;
}

// ============================================================================
// CONTESTO
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

/**
 * Provider del contesto di autenticazione.
 * 
 * Wrappa l'applicazione per fornire lo stato auth a tutti i componenti.
 * Carica automaticamente il profilo all'avvio se esiste un token valido.
 * 
 * @param children - Componenti figli da wrappare
 * 
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Recupera il profilo utente dall'API.
   * Imposta profile a null se non autenticato o in caso di errore.
   */
  const fetchProfile = async () => {
    try {
      const result = await getMyProfileAction();
      if (!result.success) {
        setProfile(null);
        return;
      }
      console.debug('[AuthContext] profile caricato:', result.data);
      setProfile(result.data);
    } catch (error) {
      console.error('[AuthContext] Errore nel recupero del profilo:', error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Carica il profilo all'avvio
  useEffect(() => {
    fetchProfile();
  }, []);

  /**
   * Effettua il login dell'utente.
   * Il token viene impostato nel cookie HTTP-only dal server.
   * 
   * @param token - Token JWT (gestito dal server)
   */
  const login = async () => {
    await fetchProfile();
  };

  /**
   * Effettua il logout dell'utente.
   * Chiama l'API di logout e pulisce lo stato locale.
   */
  const logout = async () => {
    try {
      const result = await logoutAction();
      if (result.success) {
        setProfile(null);
      }
    } catch (error) {
      console.error('[AuthContext] Errore durante il logout:', error);
    }
  };

  /**
   * Aggiorna il profilo utente.
   * Utile dopo modifiche al profilo per sincronizzare la UI.
   */
  const refreshProfile = async () => {
    await fetchProfile();
  };

  const value: AuthContextType = {
    profile,
    isLoading,
    isAuthenticated: profile !== null,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook per accedere al contesto di autenticazione.
 * 
 * @returns Il contesto di autenticazione con profilo e metodi
 * @throws Error se usato fuori da AuthProvider
 * 
 * @example
 * ```tsx
 * const { profile, isAuthenticated, logout } = useAuth();
 * 
 * if (!isAuthenticated) {
 *   return <LoginPage />;
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve essere usato all'interno di un AuthProvider");
  }
  return context;
}

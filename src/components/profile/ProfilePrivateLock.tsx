/**
 * @fileoverview Messaggio per profilo privato non seguito.
 *
 * Mostra un blocco informativo quando si visita un profilo privato
 * che non si sta seguendo. Indica all'utente che deve seguire
 * il profilo per vedere i contenuti.
 * 
 * STATI:
 * - Profilo privato non seguito: "Segui questa persona..."
 * - Profilo privato con richiesta in sospeso: stesso messaggio
 *   (la richiesta viene gestita da ProfileActions)
 * 
 * LAYOUT:
 * - Icona lucchetto in un cerchio con bordo
 * - Titolo "Questo account è privato"
 * - Sottotitolo con invito a seguire
 * - Centrato orizzontalmente nella pagina
 * 
 * UTILIZZO:
 * Mostrato al posto della griglia dei post quando:
 * - profile.is_private === true
 * - followStatus.isFollowing === false
 * 
 * @module components/profile/ProfilePrivateLock
 */

'use client';

import { Lock } from 'lucide-react';
import { ProfilePrivateLockProps } from '@/types/profile';

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * ProfilePrivateLock - Messaggio di blocco per profili privati.
 * 
 * Visualizza un'icona lucchetto e un messaggio che spiega all'utente
 * che deve seguire il profilo per vedere i contenuti.
 * 
 * @param props - Props del componente
 * @param props.username - Username del profilo (attualmente non usato nel messaggio)
 * @param props.isPending - Se c'è una richiesta di follow in sospeso
 * @returns Blocco informativo con lucchetto e messaggio
 */
export default function ProfilePrivateLock({
  username,
  isPending,
}: ProfilePrivateLockProps) {
  return (
    <div className="w-full flex justify-center px-4 mt-8 mb-12">
      <div className="flex items-center gap-3">
        {/* Icona lucchetto in cerchio */}
        <div className="w-12 h-12 rounded-full border border-[rgb(12,16,20)] dark:border-white flex items-center justify-center flex-shrink-0">
          <Lock className="w-6 h-7 text-[rgb(12,16,20)] dark:text-white" strokeWidth={1.5} />
        </div>
        
        {/* Testo informativo */}
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold md:whitespace-nowrap text-[rgb(12,16,20)] dark:text-white">
            Questo account è privato
          </h2>
          <p className="text-sm md:whitespace-nowrap" style={{ color: 'rgb(168, 168, 168)' }}>
            Segui questa persona per vedere le sue foto e i suoi video.
          </p>
        </div>
      </div>
    </div>
  );
}

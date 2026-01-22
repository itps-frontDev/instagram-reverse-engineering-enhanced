/**
 * @fileoverview Layout radice dell'applicazione Instagram.
 * 
 * Questo è il layout principale che avvolge tutte le pagine dell'applicazione.
 * Configura i metadata SEO, i font globali e il provider di contesto.
 * 
 * RESPONSABILITÀ:
 * - Definizione metadata SEO (titolo, descrizione, favicon)
 * - Importazione degli stili globali (globals.css)
 * - Wrapping dell'app con i Provider (AuthContext, ThemeProvider, ecc.)
 * - Impostazione della lingua del documento HTML
 * 
 * @module app/layout
 */

import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

// ============================================================================
// METADATA SEO
// ============================================================================

/**
 * Metadata per l'ottimizzazione SEO dell'applicazione.
 * Configurazione del titolo, descrizione e icone.
 */
export const metadata: Metadata = {
  title: "Instagram",
  description: "Create an account or log in to Instagram - A simple, fun & creative way to capture, edit & share photos, videos & messages with friends & family.",
  icons: {
    icon: '/favicon.ico',
  },
};

// ============================================================================
// COMPONENTE LAYOUT
// ============================================================================

/**
 * Layout radice dell'applicazione.
 * 
 * Wrappa tutte le pagine con i Provider necessari per il funzionamento
 * dell'app (autenticazione, tema, ecc.).
 * 
 * @param children - Contenuto della pagina corrente
 * @returns Layout HTML completo con Provider
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className="antialiased">
        {/* Provider globali per autenticazione e stato */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

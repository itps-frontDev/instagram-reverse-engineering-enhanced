/**
 * @fileoverview Componente header pagina settings.
 * 
 * Header consistente per tutte le pagine settings.
 * 
 * @module components/ui/PageHeader
 */

export interface PageHeaderProps {
  /** Titolo della pagina */
  title: string;
  /** Sottotitolo opzionale */
  subtitle?: string;
  /** Classe CSS aggiuntiva */
  className?: string;
}

/**
 * Header per pagine settings.
 * 
 * @example
 * ```tsx
 * <PageHeader title="Modifica profilo" />
 * ```
 */
export function PageHeader({ 
  title, 
  subtitle,
  className = '' 
}: PageHeaderProps) {
  return (
    <div className={`px-0 pt-0 pb-6 ${className}`}>
      <h1 className="text-xl font-bold leading-[25px] break-words mb-4">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-[rgb(115,115,115)] dark:text-[rgb(168,168,168)]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

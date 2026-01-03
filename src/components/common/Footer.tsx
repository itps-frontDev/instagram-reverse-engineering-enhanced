/**
 * @fileoverview Instagram Footer Component
 *
 * Footer with links and copyright information
 */

import Link from 'next/link';

const FOOTER_LINKS = [
  { label: 'Meta', href: 'https://about.meta.com/' },
  { label: 'Informazioni', href: '/about' },
  { label: 'Blog', href: 'https://about.instagram.com/blog' },
  { label: 'Lavora con noi', href: 'https://about.instagram.com/about-us/careers' },
  { label: 'Aiuto', href: 'https://help.instagram.com/' },
  { label: 'API', href: 'https://developers.facebook.com/products/instagram' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Condizioni', href: '/terms' },
  { label: 'Luoghi', href: '/explore/locations' },
  { label: 'Instagram Lite', href: 'https://about.instagram.com/features/lite' },
  { label: 'Meta AI', href: 'https://www.meta.ai/' },
  { label: 'Threads', href: 'https://www.threads.net/' },
  { label: 'Caricamento dei contatti e non-utenti', href: '/privacy/contact-uploading' },
  { label: 'Meta Verified', href: 'https://about.meta.com/technologies/meta-verified/' },
] as const;

const LANGUAGES = ['Italiano', 'English', 'Español', 'Français', 'Deutsch'] as const;

export default function Footer() {
  return (
    <footer className="py-3 px-4 mt-auto mb-[52px]">
      <div className="max-w-[1066px] mx-auto">
        {/* Links */}
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mb-3 text-xs text-[#8E8E8E] dark:text-[#A8A8A8]">
          {FOOTER_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="hover:underline"
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Language selector and copyright */}
        <div className="flex justify-center gap-4 text-xs text-[#8E8E8E] dark:text-[#A8A8A8]">
          <select
            className="bg-transparent text-[#8E8E8E] dark:text-[#A8A8A8] text-xs border-none cursor-pointer focus:outline-none"
            aria-label="Seleziona lingua"
          >
            {LANGUAGES.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
          <span>© 2026 Instagram from Meta</span>
        </div>
      </div>
    </footer>
  );
}

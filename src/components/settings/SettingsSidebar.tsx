/**
 * @fileoverview Settings sidebar navigation
 *
 * Displays the settings menu with sections and items.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItem {
  label: string;
  href: string;
}

interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

export default function SettingsSidebar() {
  const pathname = usePathname();

  const sections: SidebarSection[] = [
    {
      items: [
        { label: 'Modifica profilo', href: '/accounts/edit' },
        { label: "Privacy dell'account", href: '/accounts/privacy' },
      ],
    },
  ];

  return (
    <aside className="w-full md:w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
      <div className="py-6">
        {sections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-8">
            {/* Section Title */}
            {section.title && (
              <h3 className="px-6 mb-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                {section.title}
              </h3>
            )}

            {/* Section Items */}
            <nav>
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-6 py-3 text-sm transition-colors ${
                      isActive
                        ? 'font-semibold border-l-2 border-black dark:border-white bg-gray-50 dark:bg-gray-900'
                        : 'font-normal hover:bg-gray-50 dark:hover:bg-gray-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}

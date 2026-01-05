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
  icon: React.ReactNode;
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
        {
          label: 'Modifica profilo',
          href: '/accounts/edit',
          icon: (
            <svg
              aria-label=""
              fill="currentColor"
              height="24"
              role="img"
              viewBox="0 0 24 24"
              width="24"
            >
              <circle
                cx="12.004"
                cy="12.004"
                fill="none"
                r="10.5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeMiterlimit="10"
                strokeWidth="2"
              />
              <path
                d="M18.793 20.014a6.08 6.08 0 0 0-1.778-2.447 3.991 3.991 0 0 0-2.386-.791H9.38a3.994 3.994 0 0 0-2.386.791 6.09 6.09 0 0 0-1.779 2.447"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeMiterlimit="10"
                strokeWidth="2"
              />
              <circle
                cx="12.006"
                cy="9.718"
                fill="none"
                r="4.109"
                stroke="currentColor"
                strokeLinecap="round"
                strokeMiterlimit="10"
                strokeWidth="2"
              />
            </svg>
          ),
        },
        {
          label: "Privacy dell'account",
          href: '/accounts/privacy',
          icon: (
            <svg
              aria-label=""
              fill="currentColor"
              height="24"
              role="img"
              viewBox="0 0 24 24"
              width="24"
            >
              <path
                d="M6.71 9.555h10.581a2.044 2.044 0 0 1 2.044 2.044v8.357a2.044 2.044 0 0 1-2.043 2.043H6.71a2.044 2.044 0 0 1-2.044-2.044V11.6A2.044 2.044 0 0 1 6.71 9.555Zm1.07 0V6.222a4.222 4.222 0 0 1 8.444 0v3.333"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <aside className="w-full md:w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 py-5 px-6">
        <h1 className="text-xl font-semibold">Impostazioni</h1>
      </div>

      {/* Menu */}
      <div className="py-6">
        {sections.map((section, sectionIdx) => (
          <div key={sectionIdx}>
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
                    className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                      isActive
                        ? 'font-semibold border-l-2 border-black dark:border-white bg-gray-50 dark:bg-gray-900'
                        : 'font-normal hover:bg-gray-50 dark:hover:bg-gray-900'
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
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

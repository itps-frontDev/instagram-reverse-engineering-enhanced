/**
 * @fileoverview Settings sidebar navigation
 *
 * Displays the settings menu with sections and items.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import EditProfileIcon from './icons/EditProfileIcon';
import PrivacyIcon from './icons/PrivacyIcon';

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
          icon: <EditProfileIcon />,
        },
        {
          label: "Privacy dell'account",
          href: '/accounts/privacy',
          icon: <PrivacyIcon />,
        },
      ],
    },
  ];

  return (
    <aside className="w-full md:w-80 border-r border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="px-4 pt-10 pb-6 mx-[34px]">
        <h1 className="text-xl font-bold leading-[25px] break-words">Impostazioni</h1>
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
                    className={`flex items-center gap-3 px-4 mx-[34px] py-3 text-sm font-normal rounded-lg transition-all select-none cursor-pointer ${
                      isActive
                        ? 'bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#262626]'
                        : 'hover:bg-gray-50 dark:hover:bg-[#121212]'
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="leading-[18px] break-words">{item.label}</span>
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

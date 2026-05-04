/**
 * @fileoverview Barrel export per componenti Settings.
 * 
 * Permette di importare i componenti settings da un unico punto:
 * import { SettingsSidebar, EditProfileForm } from '@/components/settings';
 * 
 * @module components/settings
 */

// Sidebar
export { default as SettingsSidebar } from './SettingsSidebar';

// Forms
export { default as EditProfileForm } from './EditProfileForm';
export { default as AccountPrivacyForm } from './AccountPrivacyForm';
export { default as BirthdayForm } from './BirthdayForm';
export { default as PersonalInfoForm } from './PersonalInfoForm';
export { default as SecurityForm } from './SecurityForm';

// Re-export icons
export * from './icons';

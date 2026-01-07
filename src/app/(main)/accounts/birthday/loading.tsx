import SettingsSidebar from '@/components/settings/SettingsSidebar';

export default function Loading() {
  return (
    <div className="flex min-h-screen">
      <SettingsSidebar />
      <main className="flex-1 flex flex-col items-center py-9 px-8">
        <div className="w-full max-w-xl">
          <div className="px-0 pt-0 pb-6">
            <div className="h-[25px] w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="h-12 bg-gray-100 dark:bg-[#232323] rounded-xl animate-pulse" />
        </div>
      </main>
    </div>
  );
}

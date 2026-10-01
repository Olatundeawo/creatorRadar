import { useEffect } from 'react';
import { LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { useQuotaStore } from '../store/quotaStore';
import { useChannelSearch } from '../hooks/useChannelSearch';
import SearchBar from '../components/SearchBar';
import ChannelTable from '../components/ChannelTable';
import FilterPanel from '../components/FilterPanel';
import ExportButton from '../components/ExportButton';
import { LoadingSpinner } from '../components/LoadingSpinner';
import ThemeToggle from '../components/ThemeToggle';
import QuotaWarning from '../components/QuotaWarning';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { useState } from 'react';

export const Home = () => {
  const { user, logout } = useAuthStore();
  const { loading, error, channels, filteredChannels, totalCount } = useAppStore();
  const { fetchQuota } = useQuotaStore();
  const { getChannels } = useChannelSearch();
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    getChannels(1);
    // Fetch quota on mount
    fetchQuota();

    // Fetch quota every 5 minutes
    const interval = setInterval(() => {
      fetchQuota();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [getChannels, fetchQuota]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white truncate">
                <span className="text-gray-900 dark:text-gray-100">creator</span><span className="text-blue-600 dark:text-blue-400">Radar</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                {user?.email}
              </p>
            </div>

            {/* Desktop buttons */}
            <div className="hidden sm:flex gap-2 lg:gap-3 flex-shrink-0">
              {/* <ThemeToggle /> */}
              <button
                onClick={logout}
                className="p-2 lg:px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition flex items-center gap-1 lg:gap-2 text-sm lg:text-base"
              >
                <LogOut size={18} />
                <span className="hidden lg:inline">Logout</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden flex gap-2">
              <ThemeToggle />
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {showMenu && (
            <div className="sm:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  logout();
                  setShowMenu(false);
                }}
                className="w-full p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition flex items-center justify-center gap-2"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Quota Warning */}
        <QuotaWarning />

        {/* Search Bar */}
        <div className="mb-6 sm:mb-8">
          <SearchBar />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Analytics Dashboard */}
        {channels.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <AnalyticsDashboard />
          </div>
        )}

        {/* Channel Count */}
        {filteredChannels.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Showing {filteredChannels.length} of {totalCount} channels
            </p>
          </div>
        )}

        {/* Filter and Export */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          <FilterPanel />
          <ExportButton />
        </div>

        {/* Loading Spinner */}
        {loading && <LoadingSpinner />}

        {/* Channels Table */}
        {!loading && filteredChannels.length > 0 && (
          <div className="overflow-x-auto">
            <ChannelTable />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredChannels.length === 0 && channels.length > 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              No channels match your filters
            </p>
          </div>
        )}

        {!loading && channels.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              Search for YouTube channels to get started
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
import { useState } from 'react';
import { Search, Trash2, X } from 'lucide-react';
import { useChannelSearch } from '../hooks/useChannelSearch';
import { useAppStore } from '../store/appStore';
import { useToastStore } from '../store/toastStore';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [niche, setNiche] = useState('');
  const [maxResults, setMaxResults] = useState(10);
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const { loading } = useAppStore();
  const { search } = useChannelSearch();
  const { addToast } = useToastStore();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      addToast('Please enter a search query', 'warning');
      return;
    }

    // Add to history
    const newSearch = {
      id: Date.now(),
      query,
      niche,
      maxResults,
      timestamp: new Date(),
    };

    const updated = [newSearch, ...searchHistory].slice(0, 10);
    setSearchHistory(updated);
    localStorage.setItem('searchHistory', JSON.stringify(updated));

    await search(query, niche, maxResults);
    addToast(`Found channels for "${query}"`, 'success');
    setShowHistory(false);
  };

  const handleHistoryClick = (item: any) => {
    setQuery(item.query);
    setNiche(item.niche);
    setMaxResults(item.maxResults);
  };

  const deleteHistoryItem = (id: number) => {
    const updated = searchHistory.filter((item) => item.id !== id);
    setSearchHistory(updated);
    localStorage.setItem('searchHistory', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  return (
    <form onSubmit={handleSearch} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Query Input */}
        <div className="sm:col-span-1 relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="e.g., react tutorial"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => searchHistory.length > 0 && setShowHistory(true)}
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          {/* Search History Dropdown */}
          {showHistory && searchHistory.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10">
              <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                {searchHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer group"
                  >
                    <button
                      type="button"
                      onClick={() => handleHistoryClick(item)}
                      className="flex-1 text-left text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className="font-medium">{item.query}</span>
                      {item.niche && <span className="text-xs text-gray-500"> • {item.niche}</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteHistoryItem(item.id)}
                      className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                <button
                  type="button"
                  onClick={clearHistory}
                  className="w-full text-xs text-red-600 hover:text-red-700 py-1"
                >
                  Clear History
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Niche Select */}
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Niche (Optional)
          </label>
          <select
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">All</option>
            <option value="tech">Tech</option>
            <option value="education">Education</option>
            <option value="entertainment">Entertainment</option>
            <option value="gaming">Gaming</option>
            <option value="music">Music</option>
          </select>
        </div>

        {/* Results Count Select */}
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Results
          </label>
          <select
            value={maxResults}
            onChange={(e) => setMaxResults(Number(e.target.value))}
            disabled={loading}
            className="w-full px-4 py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Search Button */}
      <button
        type="submit"
        disabled={loading || !query.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2.5 px-4 rounded-lg transition text-sm sm:text-base"
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
};

export default SearchBar;
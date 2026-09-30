import { Trash2, ExternalLink } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useChannelSearch } from '../hooks/useChannelSearch';
import { formatNumber, formatDate } from '../utils/formatters';

const ChannelTable = () => {
  const { filteredChannels } = useAppStore();
  const { deleteChannel } = useChannelSearch();

  if (filteredChannels.length === 0) {
    return <p className="text-center py-4 text-gray-600">No channels found</p>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow">
      {/* Desktop View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                Channel
              </th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                Subscribers
              </th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                Videos
              </th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                Latest Upload
              </th>
              <th className="px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredChannels.map((channel) => (
              <tr key={channel.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {channel.thumbnailUrl && (
                      <img
                        src={channel.thumbnailUrl}
                        alt={channel.name}
                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm truncate">
                        {channel.name}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  {formatNumber(channel.subscribers)}
                </td>
                <td className="px-4 py-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  {formatNumber(channel.videoCount)}
                </td>
                <td className="px-4 py-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  {channel.latestUpload ? formatDate(new Date(channel.latestUpload)) : 'N/A'}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-2 justify-center">
                    <a
                      href={channel.channelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-600 rounded transition"
                    >
                      <ExternalLink size={16} className="sm:w-5 sm:h-5" />
                    </a>
                    <button
                      onClick={() => deleteChannel(channel.id)}
                      className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-600 rounded transition"
                    >
                      <Trash2 size={16} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="sm:hidden divide-y divide-gray-200 dark:divide-gray-700">
        {filteredChannels.map((channel) => (
          <div key={channel.id} className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              {channel.thumbnailUrl && (
                <img
                  src={channel.thumbnailUrl}
                  alt={channel.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                  {channel.name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Subscribers</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatNumber(channel.subscribers)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Videos</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatNumber(channel.videoCount)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Latest Upload</p>
              <p className="font-semibold text-gray-900 dark:text-white text-xs">
                {channel.latestUpload ? formatDate(new Date(channel.latestUpload)) : 'N/A'}
              </p>
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <a
                href={channel.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded transition text-sm"
              >
                <ExternalLink size={16} />
                Visit
              </a>
              <button
                onClick={() => deleteChannel(channel.id)}
                className="flex-1 flex items-center justify-center gap-2 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded transition text-sm"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChannelTable;
import { useAnalytics } from '../hooks/useAnalytics';

const AnalyticsDashboard = () => {
  const analytics = useAnalytics();

  if (!analytics) return null;

  const stats = [
    { label: 'Total Channels', value: analytics.totalChannels, color: 'blue' },
    { label: 'Total Subscribers', value: analytics.totalSubscribers, suffix: ' subscribers', color: 'green' },
    { label: 'Avg Subscribers', value: analytics.averageSubscribers, suffix: ' per channel', color: 'purple' },
    { label: 'Total Videos', value: analytics.totalVideos, suffix: ' videos', color: 'orange' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6"
          >
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
              {stat.label}
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              {stat.suffix && <span className="text-sm ml-1">{stat.suffix}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Subscribers Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-4">
            Subscriber Distribution
          </h3>
          <div className="space-y-3">
            {[
              { range: '0 - 100K', value: analytics.subscribersInRange('0-100k'), color: 'bg-blue-500' },
              { range: '100K - 1M', value: analytics.subscribersInRange('100k-1m'), color: 'bg-purple-500' },
              { range: '1M+', value: analytics.subscribersInRange('1m+'), color: 'bg-green-500' },
            ].map((item) => (
              <div key={item.range}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{item.range}</span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                    {item.value}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full`}
                    style={{
                      width: `${(item.value / (analytics.totalChannels || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Video Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-4">
            Video Count Distribution
          </h3>
          <div className="space-y-3">
            {[
              { range: '0 - 100', value: analytics.videosInRange('0-100'), color: 'bg-yellow-500' },
              { range: '100 - 1K', value: analytics.videosInRange('100-1k'), color: 'bg-orange-500' },
              { range: '1K+', value: analytics.videosInRange('1k+'), color: 'bg-red-500' },
            ].map((item) => (
              <div key={item.range}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{item.range}</span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                    {item.value}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full`}
                    style={{
                      width: `${(item.value / (analytics.totalChannels || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
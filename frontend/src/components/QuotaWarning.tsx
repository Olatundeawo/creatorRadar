import { AlertTriangle, AlertCircle, AlertOctagon } from 'lucide-react';
import { useQuotaStore } from '../store/quotaStore';

const QuotaWarning = () => {
  const { quota } = useQuotaStore();

  if (!quota) return null;

  // Don't show if status is ok
  if (quota.status === 'ok') return null;

  const getStyles = () => {
    switch (quota.status) {
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-800 dark:text-yellow-200',
          icon: <AlertCircle size={20} className="text-yellow-600" />,
          title: '⚠️ API Quota Warning',
          message: `You've used ${quota.percentage}% of your daily YouTube API quota.`,
        };
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-200',
          icon: <AlertTriangle size={20} className="text-red-600" />,
          title: '🔴 Critical: Quota Almost Full',
          message: `You've used ${quota.percentage}% of your daily quota. Searches may fail soon.`,
        };
      case 'exceeded':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-200',
          icon: <AlertOctagon size={20} className="text-red-600" />,
          title: '❌ Quota Exceeded',
          message: `Your daily quota is exhausted. Resets in ${quota.timeUntilReset}.`,
        };
      default:
        return null;
    }
  };

  const styles = getStyles();
  if (!styles) return null;

  return (
    <div
      className={`${styles.bg} border ${styles.border} ${styles.text} px-4 py-4 rounded-lg mb-6`}
    >
      <div className="flex items-start gap-3">
        {styles.icon}
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{styles.title}</h3>
          <p className="text-sm mt-1">{styles.message}</p>

          {/* Progress Bar */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span>{quota.used.toLocaleString()} / {quota.limit.toLocaleString()} credits</span>
              <span>{quota.percentage}%</span>
            </div>
            <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  quota.status === 'exceeded'
                    ? 'bg-red-600'
                    : quota.status === 'critical'
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
                }`}
                style={{ width: `${Math.min(quota.percentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Reset Time */}
          <p className="text-xs mt-2 opacity-75">
            Resets in: <span className="font-mono font-semibold">{quota.timeUntilReset}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuotaWarning;
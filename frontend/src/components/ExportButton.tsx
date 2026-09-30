import { Download } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { channelAPI } from '../api/client';
import { downloadFile } from '../utils/formatters';

const ExportButton = () => {
  const { filteredChannels } = useAppStore();

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      if (format === 'csv') {
        const blob = await channelAPI.exportCSV();
        downloadFile(blob, `channels-${Date.now()}.csv`);
      } else {
        const blob = await channelAPI.exportXLSX();
        downloadFile(blob, `channels-${Date.now()}.xlsx`);
      }
    } catch (error) {
      console.error(`Export ${format} failed:`, error);
    }
  };

  return (
    <div className="flex gap-2 w-full sm:w-auto">
      <button
        onClick={() => handleExport('csv')}
        disabled={filteredChannels.length === 0}
        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition text-sm sm:text-base font-medium"
      >
        <Download size={18} />
        <span className="hidden sm:inline">CSV</span>
      </button>
      <button
        onClick={() => handleExport('xlsx')}
        disabled={filteredChannels.length === 0}
        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition text-sm sm:text-base font-medium"
      >
        <Download size={18} />
        <span className="hidden sm:inline">XLSX</span>
      </button>
    </div>
  );
};

export default ExportButton;
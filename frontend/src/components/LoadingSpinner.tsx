import { Loader } from 'lucide-react';

export const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <Loader className="animate-spin text-blue-600" size={40} />
  </div>
);
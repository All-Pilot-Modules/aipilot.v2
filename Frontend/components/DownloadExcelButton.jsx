'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function DownloadExcelButton() {
  const params = useParams();
  const moduleParam = params?.module?.toUpperCase();

  const [error, setError] = useState('');

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/csv-export?module=${moduleParam}`);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'student_data.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
      setError(err.message || 'An unexpected error occurred');
    }
  };

  // Auto-hide error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="relative p-4">
      {/* Error Banner */}
      <div
        className={`fixed top-0 left-0 w-full z-50 transition-transform duration-500 ${
          error ? 'translate-y-0' : '-translate-y-full'
        } bg-red-200 border-b border-red-400 text-red-800 text-sm font-medium p-4 shadow`}
      >
        {error}
      </div>

      <button
        onClick={handleDownload}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
      >
        Download all data of this module
      </button>
    </div>
  );
}
import React from 'react';
import DownloadQueue from './DownloadQueue';
import MyDownloads from './MyDownloads';

const Downloads: React.FC = () => {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8">Downloads</h1>
      <div className="space-y-8">
        <DownloadQueue />
        <MyDownloads />
      </div>
    </div>
  );
};

export default Downloads;

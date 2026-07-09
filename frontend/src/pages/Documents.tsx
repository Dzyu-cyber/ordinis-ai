import React from 'react';
import { Upload, Sparkles, FolderOpen } from 'lucide-react';

export const Documents: React.FC = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight m-0">Document Intelligence</h1>
        <p className="text-zinc-400 text-sm mt-1">Upload and extract structured JSON data from business files (Invoices, Resumes, Contracts).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Zone */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-xl flex flex-col items-center justify-center border-dashed border-2 border-zinc-800 text-center min-h-[300px]">
          <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center mb-4">
            <Upload className="w-6 h-6 text-purple-400" />
          </div>
          <span className="font-bold text-white text-base block">Drag & drop files here</span>
          <span className="text-zinc-500 text-xs mt-1 block">Supports PDF, PNG, JPG (up to 10MB)</span>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors duration-200 mt-6 cursor-pointer shadow-md">
            Browse Files
          </button>
        </div>

        {/* Extraction Panel */}
        <div className="glass-panel p-6 rounded-xl space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-white text-sm">Extraction Console</span>
          </div>

          <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-zinc-500" />
            <div className="min-w-0">
              <span className="text-xs font-semibold text-zinc-400 block truncate">No Document Selected</span>
              <span className="text-[10px] text-zinc-600 block">Upload a file to trigger AI parsing</span>
            </div>
          </div>

          <div className="h-40 rounded-lg bg-zinc-950 border border-zinc-900 p-4 font-mono text-[10px] text-zinc-500 overflow-y-auto">
            {"{\n  \"status\": \"idle\",\n  \"data\": {}\n}"}
          </div>
        </div>
      </div>
    </div>
  );
};

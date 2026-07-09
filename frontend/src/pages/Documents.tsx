import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '../services/documentService';
import type { Document } from '../types/document';
import {
  Upload,
  FileText,
  Loader2,
  Trash2,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  ChevronRight,
  X
} from 'lucide-react';

export const Documents: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [uploadType, setUploadType] = useState<'invoice' | 'contract' | 'resume'>('invoice');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // 1. Fetch Documents Query
  // Automatically poll every 3 seconds if there are any documents in pending/processing state
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: documentService.getDocuments,
    refetchInterval: (query) => {
      const docs = query.state.data as Document[] | undefined;
      const hasActiveJobs = docs?.some(d => d.status === 'pending' || d.status === 'processing');
      return hasActiveJobs ? 3000 : 8000; // Poll faster if there are active parsing jobs
    }
  });

  // 2. Upload Document Mutation
  const uploadMutation = useMutation({
    mutationFn: ({ file, type }: { file: File; type: 'invoice' | 'contract' | 'resume' }) =>
      documentService.uploadDocument(file, type),
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSelectedFile(null);
      setUploadError('');
      setIsUploading(false);
      setSelectedDoc(newDoc); // auto-select newly uploaded file
    },
    onError: (err: any) => {
      setUploadError(err.message || 'File upload failed.');
      setIsUploading(false);
    }
  });

  // 3. Delete Document Mutation
  const deleteMutation = useMutation({
    mutationFn: documentService.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSelectedDoc(null);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadError('');
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }
    setIsUploading(true);
    uploadMutation.mutate({ file: selectedFile, type: uploadType });
  };

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'processing':
      case 'pending':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20 animate-pulse';
      case 'failed':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      default:
        return 'text-zinc-500 bg-zinc-800 border-zinc-700';
    }
  };

  const getDocIcon = () => {
    return FileText;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative min-h-[calc(100vh-12rem)]">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight m-0">Document Intelligence</h1>
        <p className="text-zinc-400 text-sm mt-1">Upload and extract structured JSON parameters from invoices, contracts, and resumes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Upload zone + Files list */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload card */}
          <div className="glass-panel p-6 rounded-xl">
            <span className="font-bold text-white text-sm block mb-4">Ingest Document</span>
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {uploadError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
                  {uploadError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                {/* File Picker input */}
                <div className="sm:col-span-2 relative border border-dashed border-zinc-800 hover:border-zinc-700 rounded-lg p-4 bg-zinc-900/30 text-center cursor-pointer transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    disabled={isUploading}
                  />
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Upload className="w-5 h-5 text-purple-400" />
                    <span className="text-xs font-semibold text-zinc-300">
                      {selectedFile ? selectedFile.name : 'Choose file (PDF, PNG, JPG)'}
                    </span>
                    <span className="text-[10px] text-zinc-500">Max size 10MB</span>
                  </div>
                </div>

                {/* Dropdown Type select */}
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Document Type</label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value as any)}
                    className="glass-input w-full px-3 py-2 rounded-lg text-xs cursor-pointer h-14"
                    disabled={isUploading}
                  >
                    <option value="invoice">Invoice</option>
                    <option value="contract">Contract</option>
                    <option value="resume">Resume</option>
                  </select>
                </div>
              </div>

              {/* Submit button */}
              {selectedFile && (
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Extracting Structured Data...
                      </>
                    ) : (
                      'Run AI Ingestion'
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Uploaded Documents List */}
          <div className="space-y-3">
            <span className="font-bold text-white text-sm block">Document Library</span>
            {isLoading ? (
              <div className="glass-panel rounded-xl py-14 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                <span className="text-xs text-zinc-500">Loading library...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="glass-panel rounded-xl py-14 text-center">
                <FolderOpen className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <span className="text-zinc-500 text-xs font-bold block">No documents uploaded yet</span>
              </div>
            ) : (
              <div className="glass-panel rounded-xl overflow-hidden divide-y divide-zinc-900 shadow-xl">
                {documents.map((doc) => {
                  const Icon = getDocIcon();
                  const isSelected = selectedDoc?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? 'bg-purple-600/5' : 'hover:bg-zinc-900/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-white text-sm block truncate pr-4">
                            {doc.filename}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-semibold mt-0.5">
                            <span className="uppercase text-purple-400">{doc.document_type}</span>
                            <span>•</span>
                            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${getStatusBadge(doc.status)}`}>
                          {doc.status}
                        </span>
                        <ChevronRight className={`w-4 h-4 text-zinc-700 transition-transform ${
                          isSelected ? 'translate-x-1 text-purple-400' : ''
                        }`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Parsing Details Pane */}
        <div className="lg:col-span-1">
          {selectedDoc ? (
            <div className="glass-panel p-6 rounded-xl space-y-6 shadow-xl sticky top-6 border border-zinc-800 animate-in fade-in slide-in-from-right-5 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white m-0 truncate pr-4">{selectedDoc.filename}</h3>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">{selectedDoc.document_type}</span>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Extraction Status */}
              {selectedDoc.status === 'processing' || selectedDoc.status === 'pending' ? (
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                  <div>
                    <span className="font-bold text-white text-xs block">AI Vision Extraction In Progress</span>
                    <span className="text-[10px] text-zinc-500 mt-0.5 block">Parsing layout and compiling JSON structure...</span>
                  </div>
                </div>
              ) : selectedDoc.status === 'failed' ? (
                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                  <div>
                    <span className="font-bold text-white text-xs block">Extraction Failed</span>
                    <span className="text-[10px] text-red-400 mt-0.5 block">
                      {selectedDoc.parsed_content?.error || 'Unknown parsing error'}
                    </span>
                  </div>
                </div>
              ) : (
                /* Completed Structured display */
                <div className="space-y-6">
                  <div className="flex items-center gap-1.5 text-purple-400">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-bold text-sm">Extracted Parameters</span>
                  </div>

                  {/* Schema specific rendering */}
                  <div className="space-y-4 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800 text-xs">
                    {selectedDoc.document_type === 'invoice' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 border-b border-zinc-800 pb-2.5">
                          <div>
                            <span className="font-bold text-zinc-500 block uppercase tracking-wider mb-0.5">Invoice #</span>
                            <span className="text-white font-semibold">{selectedDoc.parsed_content?.invoiceNumber || '—'}</span>
                          </div>
                          <div>
                            <span className="font-bold text-zinc-500 block uppercase tracking-wider mb-0.5">Date</span>
                            <span className="text-white">{selectedDoc.parsed_content?.date || '—'}</span>
                          </div>
                        </div>

                        <div>
                          <span className="font-bold text-zinc-500 block uppercase tracking-wider mb-0.5">Vendor</span>
                          <span className="text-white font-semibold">{selectedDoc.parsed_content?.vendor || '—'}</span>
                        </div>

                        <div className="pt-2 border-t border-zinc-800">
                          <span className="font-bold text-zinc-500 block uppercase tracking-wider mb-2">Line Items</span>
                          <div className="space-y-2">
                            {selectedDoc.parsed_content?.lineItems?.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center bg-zinc-950/40 p-2 rounded border border-zinc-900">
                                <span className="text-zinc-300 pr-2 truncate">{item.description}</span>
                                <span className="text-white font-semibold shrink-0">${Number(item.amount).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-zinc-800 text-sm">
                          <span className="font-bold text-zinc-400">Total Amount</span>
                          <span className="text-purple-400 font-extrabold">${Number(selectedDoc.parsed_content?.totalAmount || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {selectedDoc.document_type === 'contract' && (
                      <div className="space-y-3">
                        <div>
                          <span className="font-bold text-zinc-500 block uppercase tracking-wider mb-1">Involved Parties</span>
                          <div className="flex flex-col gap-1">
                            {selectedDoc.parsed_content?.parties?.map((p: string, idx: number) => (
                              <span key={idx} className="text-white font-semibold flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-zinc-800">
                          <span className="font-bold text-zinc-500 block uppercase tracking-wider mb-0.5">Effective Date</span>
                          <span className="text-white font-semibold">{selectedDoc.parsed_content?.effectiveDate || '—'}</span>
                        </div>

                        <div className="pt-2.5 border-t border-zinc-800">
                          <span className="font-bold text-zinc-500 block uppercase tracking-wider mb-0.5">Key Terms</span>
                          <p className="text-zinc-400 leading-relaxed m-0 whitespace-pre-wrap">{selectedDoc.parsed_content?.keyTerms}</p>
                        </div>
                      </div>
                    )}

                    {selectedDoc.document_type === 'resume' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 border-b border-zinc-800 pb-2.5">
                          <div>
                            <span className="font-bold text-zinc-500 block uppercase tracking-wider mb-0.5">Candidate</span>
                            <span className="text-white font-semibold">{selectedDoc.parsed_content?.name || '—'}</span>
                          </div>
                          <div>
                            <span className="font-bold text-zinc-500 block uppercase tracking-wider mb-0.5">Experience</span>
                            <span className="text-white font-semibold">{selectedDoc.parsed_content?.experienceYears || 0} years</span>
                          </div>
                        </div>

                        <div>
                          <span className="font-bold text-zinc-500 block uppercase tracking-wider mb-1.5">Skills</span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedDoc.parsed_content?.skills?.map((s: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-zinc-800">
                          <span className="font-bold text-zinc-500 block uppercase tracking-wider mb-0.5">Education</span>
                          <span className="text-zinc-300 font-semibold">{selectedDoc.parsed_content?.education || '—'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this document?')) {
                          deleteMutation.mutate(selectedDoc.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="w-full py-2.5 border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/30 text-red-400 font-semibold rounded-lg text-xs transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Document Record
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-xl text-center space-y-3 min-h-[300px] flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
                <FileText className="w-6 h-6" />
              </div>
              <span className="font-bold text-white text-sm block">No document selected</span>
              <span className="text-zinc-500 text-xs max-w-xs">
                Select an uploaded file from the library list to review structured AI vision parameters.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, LoaderCircle, Upload, X } from 'lucide-react';
import { Scan, SourceType } from '../domain';
import { createScanApiClient } from '../services/scanApi';
import {
  initialScanEntryState,
  ScanEntryState,
  transitionScanEntry,
  validateImageFile,
} from '../scan-flow/scan-flow';

interface CustomScanModalProps {
  onClose: () => void;
  onScanCreated?: (scan: Scan) => void;
}

const scanApi = createScanApiClient();
const PENDING_RULE_VERSION = 'PENDING_RULE_EVALUATION';

const PROCESSING_COPY: Record<ScanEntryState['status'], string> = {
  IDLE: 'Choose a source and upload a product image to begin.',
  CAPTURING: 'Choose a source image from your device.',
  UPLOADING: 'Uploading the original image as evidence…',
  ANALYZING: 'Image uploaded. Analysis service is not connected yet.',
  EXTRACTING: 'Extracting visible declarations…',
  EVALUATING: 'Evaluating declarations against verified rules…',
  GENERATING_REPORT: 'Preparing the screening report…',
  COMPLETE: 'Screening complete.',
  ERROR: 'The scan could not be uploaded.',
  UNCERTAIN: 'The evidence is insufficient for a reliable determination.',
  NOT_MEASURABLE: 'This check cannot be measured from the available evidence.',
};

export const CustomScanModal: React.FC<CustomScanModalProps> = ({ onClose, onScanCreated }) => {
  const [flow, setFlow] = useState<ScanEntryState>(initialScanEntryState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scan, setScan] = useState<Scan | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (event: Parameters<typeof transitionScanEntry>[1]) => {
    setFlow((current) => transitionScanEntry(current, event));
  };

  const handleSourceSelect = (sourceType: SourceType) => {
    setFlow((current) => transitionScanEntry(current, { type: 'SELECT_SOURCE', sourceType }));
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      setFlow((current) => ({ ...current, status: 'ERROR', errorMessage: validationError }));
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    update({ type: 'IMAGE_SELECTED' });
  };

  const handleUpload = async () => {
    if (!selectedFile || !flow.sourceType || !flow.productName.trim()) {
      setFlow((current) => ({
        ...current,
        status: 'ERROR',
        errorMessage: 'Select a source, enter a product name, and choose a valid image.',
      }));
      return;
    }

    try {
      update({ type: 'UPLOAD_STARTED' });
      const createdScan = scan || await scanApi.createScan({
        productName: flow.productName.trim(),
        sourceType: flow.sourceType,
        ruleVersion: PENDING_RULE_VERSION,
      });
      setScan(createdScan);
      const uploaded = await scanApi.uploadSourceImage(createdScan.id, selectedFile);
      setScan(uploaded.scan);
      update({ type: 'UPLOAD_SUCCEEDED', scanId: uploaded.scan.id });
      onScanCreated?.(uploaded.scan);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed. Please retry.';
      setFlow((current) => ({ ...current, status: 'ERROR', errorMessage: message }));
    }
  };

  const handleRetry = () => {
    setFlow((current) => transitionScanEntry(current, { type: 'RETRY' }));
  };

  const handleClose = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    onClose();
  };

  const isProcessing = ['UPLOADING', 'ANALYZING', 'EXTRACTING', 'EVALUATING', 'GENERATING_REPORT'].includes(flow.status);
  const isError = flow.status === 'ERROR';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-xl w-full overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            {flow.status === 'IDLE' && <Upload className="w-5 h-5 text-amber-400" />}
            {isProcessing && <LoaderCircle className="w-5 h-5 text-amber-400 animate-spin" />}
            {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
            {flow.status === 'ANALYZING' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            <div>
              <h2 className="font-bold text-sm">Scan a product</h2>
              <p className="text-[11px] text-slate-300 font-mono">Digital Compliance Screening</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white p-1 rounded" aria-label="Close scan">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {flow.status === 'IDLE' || isError ? (
            <>
              <div>
                <label className="text-xs font-bold text-slate-900 block mb-2">Source type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(['PHYSICAL_PHOTO', 'ECOMMERCE_LISTING'] as const).map((sourceType) => (
                    <button
                      key={sourceType}
                      type="button"
                      onClick={() => handleSourceSelect(sourceType)}
                      className={`text-left p-3 rounded border text-xs transition-colors ${flow.sourceType === sourceType ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                    >
                      <span className="font-bold block">{sourceType === 'PHYSICAL_PHOTO' ? 'Physical product photo' : 'E-commerce listing'}</span>
                      <span className="text-[11px] text-slate-500">{sourceType === 'PHYSICAL_PHOTO' ? 'Capture from the phone camera' : 'Upload a product listing image'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="scan-product-name" className="text-xs font-bold text-slate-900 block mb-2">Product name</label>
                <input
                  id="scan-product-name"
                  value={flow.productName}
                  onChange={(event) => update({ type: 'SET_PRODUCT_NAME', productName: event.target.value })}
                  placeholder="Enter the product name"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="scan-image" className="text-xs font-bold text-slate-900 block mb-2">Source image</label>
                <input
                  ref={fileInputRef}
                  id="scan-image"
                  type="file"
                  accept="image/*"
                  capture={flow.sourceType === 'PHYSICAL_PHOTO' ? 'environment' : undefined}
                  onChange={handleImageChange}
                  className="sr-only"
                />
                <button
                  type="button"
                  disabled={!flow.sourceType}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full min-h-24 border border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-blue-50/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xs text-slate-600"
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Selected source image preview" className="max-h-36 max-w-full rounded object-contain" />
                  ) : (
                    <span className="flex items-center gap-2"><Upload className="w-4 h-4 text-blue-700" />{flow.sourceType ? 'Capture or choose an image' : 'Choose a source type first'}</span>
                  )}
                </button>
                {selectedFile && <p className="text-[11px] text-slate-500 mt-1">{selectedFile.name} · {(selectedFile.size / 1024).toFixed(0)} KB</p>}
              </div>

              {isError && (
                <div className="p-3 rounded border border-rose-200 bg-rose-50 text-rose-900 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{flow.errorMessage}</span>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center space-y-3">
              <LoaderCircle className="w-8 h-8 text-blue-700 animate-spin mx-auto" />
              <h3 className="font-bold text-slate-900 text-sm">{PROCESSING_COPY[flow.status]}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">The original image has been submitted as evidence. No compliance result is generated until extraction and deterministic evaluation are connected.</p>
              {scan && <p className="text-[11px] text-slate-400 font-mono">Scan ID: {scan.id}</p>}
            </div>
          )}
        </div>

        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between gap-2">
          {isProcessing ? (
            <button onClick={handleClose} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-white">
              Cancel
            </button>
          ) : isError ? (
            <button onClick={handleRetry} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-white">
              <ArrowLeft className="w-3.5 h-3.5" /> Retry
            </button>
          ) : (
            <button onClick={handleClose} className="px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-white">
              Cancel
            </button>
          )}
          {!isProcessing && !isError && (
            <button
              onClick={handleUpload}
              disabled={!flow.sourceType || !flow.productName.trim() || !selectedFile}
              className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded text-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" /> Upload image
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

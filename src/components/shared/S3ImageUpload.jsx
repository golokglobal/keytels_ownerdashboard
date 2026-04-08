import { useRef, useState } from 'react';
import { UploadCloud, X, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Reusable file-upload widget.
 *
 * Props:
 *   uploadFn   async (file: File) => string   — called with the picked file,
 *              must return the public S3 URL (or throw on failure).
 *              Each page provides its own uploadFn targeting the right backend endpoint.
 *   onUploaded (url: string) => void          — called after a successful upload
 *   accept     string  default 'image/*'
 *   label      string  optional label
 *   className  string  optional wrapper class
 */
export const S3ImageUpload = ({
  uploadFn,
  onUploaded,
  accept = 'image/*',
  label = 'Upload image',
  className = '',
}) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]        = useState(null);
  const [success, setSuccess]    = useState(false);
  const [preview, setPreview]    = useState(null);
  const [dragging, setDragging]  = useState(false);

  const reset = () => {
    setError(null);
    setSuccess(false);
    setPreview(null);
  };

  const handleFile = async (file) => {
    if (!file) return;
    reset();
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const url = await uploadFn(file);
      setSuccess(true);
      onUploaded(url);
    } catch (err) {
      setError(err.message || 'Upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 cursor-pointer transition-colors
          ${dragging   ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-indigo-300 hover:bg-slate-50'}
          ${uploading  ? 'pointer-events-none opacity-70' : ''}`}
      >
        {preview ? (
          <div className="relative w-full">
            <img src={preview} alt="preview" className="w-full max-h-36 object-contain rounded-lg" />
            {!uploading && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); reset(); if (inputRef.current) inputRef.current.value = ''; }}
                className="absolute top-1 right-1 bg-white/80 hover:bg-white rounded-full p-0.5 shadow"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}
          </div>
        ) : (
          <>
            <UploadCloud className="w-8 h-8 text-slate-400" />
            <p className="text-sm font-medium text-slate-600">{label}</p>
            <p className="text-xs text-slate-400">Drag & drop or click to browse</p>
          </>
        )}

        {uploading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            Uploading…
          </div>
        )}

        {success && (
          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Uploaded successfully
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-red-600 text-xs mt-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
};

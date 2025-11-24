import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface FileUploadProps {
  label: string;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  onFileSelect: (files: File[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  label, 
  accept = "image/*", 
  maxSizeMB = 5,
  multiple = false,
  onFileSelect 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<{name: string, url: string}[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (files: File[]) => {
    const validFiles = files.filter(file => file.size / 1024 / 1024 <= maxSizeMB);
    
    // Create previews
    const newPreviews = validFiles.map(file => ({
      name: file.name,
      url: URL.createObjectURL(file)
    }));

    if (multiple) {
      setPreviewFiles(prev => [...prev, ...newPreviews]);
    } else {
      setPreviewFiles(newPreviews);
    }

    onFileSelect(validFiles);
  };

  const removeFile = (index: number) => {
    setPreviewFiles(prev => prev.filter((_, i) => i !== index));
    // Note: In a real implementation, we'd need to propagate this removal up to the parent
    // or reset the inputRef value
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      
      <div 
        className={`relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-xl transition-colors ${
          dragActive 
            ? 'border-brand-500 bg-brand-50' 
            : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-slate-400">
            <Upload className="h-full w-full" />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            <span className="font-semibold text-brand-600 hover:text-brand-500 cursor-pointer" onClick={() => inputRef.current?.click()}>
              Click to upload
            </span>{' '}
            or drag and drop
          </p>
          <p className="mt-1 text-xs text-slate-500">
            PNG, JPG, GIF up to {maxSizeMB}MB
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
        />
      </div>

      {/* Previews */}
      {previewFiles.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {previewFiles.map((file, idx) => (
            <div key={idx} className="relative group aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
              <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="absolute top-1 right-1 bg-white/90 text-slate-600 rounded-full p-1 hover:text-red-600 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
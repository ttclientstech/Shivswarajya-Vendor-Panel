import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';

interface FileUploadProps {
    label: string;
    accept?: string;
    onFilesSelect: (files: File[]) => void;
    placeholder?: string;
    multiple?: boolean;
    isLoading?: boolean;
    uploadedFileName?: string;
    error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
    label,
    accept,
    onFilesSelect,
    placeholder,
    multiple = false,
    isLoading = false,
    uploadedFileName,
    error
}) => {
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length > 0) {
            updateFiles(selectedFiles);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files || []);
        if (droppedFiles.length > 0) {
            updateFiles(droppedFiles);
        }
    };

    const updateFiles = (newFiles: File[]) => {
        let updatedFiles: File[];
        if (multiple) {
            updatedFiles = [...files, ...newFiles];
        } else {
            updatedFiles = [newFiles[0]];
        }
        setFiles(updatedFiles);
        onFilesSelect(updatedFiles);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (indexToRemove: number) => {
        const updatedFiles = files.filter((_, index) => index !== indexToRemove);
        setFiles(updatedFiles);
        onFilesSelect(updatedFiles);
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">{label}</label>
            <div
                className={`
                    relative group cursor-pointer
                    border-2 border-dashed rounded-xl p-8
                    flex flex-col items-center justify-center text-center
                    transition-all duration-300 ease-out
                    ${error
                        ? 'border-red-500 bg-red-50/50'
                        : isDragging
                            ? 'border-orange-500 bg-orange-50 scale-[1.02] shadow-xl shadow-orange-500/10'
                            : 'border-gray-200 bg-gray-50/50 hover:bg-white hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/5'
                    }
                    ${isLoading ? 'opacity-70 pointer-events-none' : ''}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isLoading && fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileChange}
                />

                <div className="flex flex-col items-center gap-4 py-2">
                    {isLoading ? (
                        <div className="p-4 rounded-full bg-orange-50 text-orange-500 animate-spin">
                            <Loader2 size={32} />
                        </div>
                    ) : (
                        <div className={`
                            p-4 rounded-full transition-all duration-300
                            ${error
                                ? 'bg-red-100 text-red-600'
                                : isDragging
                                    ? 'bg-orange-100 text-orange-600 scale-110'
                                    : 'bg-white shadow-sm ring-1 ring-gray-100 text-gray-400 group-hover:text-orange-500 group-hover:scale-110 group-hover:ring-orange-100'}`}
                        >
                            <Upload size={32} strokeWidth={1.5} />
                        </div>
                    )}

                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-700">
                            {isLoading ? "Uploading..." : (placeholder || "Click or drag files to upload")}
                        </p>
                        <p className="text-xs text-gray-400">
                            {!isLoading && `Supports: JPG, PNG ${multiple ? '(Multiple files)' : '(Single file)'}`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <p className="text-sm text-red-600 ml-1 flex items-center gap-1 mt-2">
                    <span className="text-red-500">⚠</span> {error}
                </p>
            )}

            {/* File List - Show either local files OR externally provided filename (e.g. after upload) */}
            {(files.length > 0 || uploadedFileName) && (
                <div className="space-y-2 mt-2 animate-fadeIn">
                    {files.length > 0 ? (
                        files.map((file, index) => (
                            <div key={index} className="flex items-center gap-4 w-full p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                                <div className="p-3 bg-gray-50 rounded-lg text-orange-600">
                                    {file.type.startsWith('image/') ? <ImageIcon size={24} /> : <FileText size={24} />}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <span className="block text-sm font-bold text-gray-900 truncate">{file.name}</span>
                                    <span className="block text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                                <button
                                    type="button"
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(index);
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ))
                    ) : uploadedFileName ? (
                        <div className="flex items-center gap-4 w-full p-2 bg-green-50 rounded-xl shadow-sm border border-green-100">
                            <div className="p-3 bg-white rounded-lg text-green-600">
                                <ImageIcon size={24} />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <span className="block text-sm font-bold text-gray-900 truncate">{uploadedFileName}</span>
                                <span className="block text-xs text-green-600">Upload Complete</span>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};


import { X, CheckCircle } from "lucide-react";
import { FileUpload } from "./types";

interface FileUploadItemProps {
  upload: FileUpload;
  onRemove: (file: File) => void;
}

export function FileUploadItem({ upload, onRemove }: FileUploadItemProps) {
  return (
    <div className="flex items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex-shrink-0 mr-3">
        <div className="text-xs font-medium bg-gray-100 px-2 py-1 rounded">
          PDF
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 break-words pr-4">
              {upload.file.name}
            </p>
            {upload.status === 'completed' && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
          {upload.status === 'uploading' && (
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${upload.progress}%` }}
              />
            </div>
          )}
          {upload.status === 'completed' && upload.violationType && (
            <p className="text-xs text-gray-500">
              Type: {upload.violationType}
            </p>
          )}
        </div>
      </div>
      {upload.status !== 'uploading' && (
        <button
          onClick={() => onRemove(upload.file)}
          className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-500"
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

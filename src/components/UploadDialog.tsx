
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, X, RotateCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FileUpload {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

export function UploadDialog({ isOpen, onClose }: UploadDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    for (const file of files) {
      if (file.type !== 'application/pdf') {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload only PDF files."
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload files smaller than 5MB."
        });
        return;
      }

      // Add file to uploads list
      setUploads(prev => [...prev, {
        file,
        progress: 0,
        status: 'uploading'
      }]);

      // Simulate upload progress
      simulateFileUpload(file);
    }
  };

  const simulateFileUpload = (file: File) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploads(prev => 
        prev.map(upload => 
          upload.file === file 
            ? { 
                ...upload, 
                progress, 
                status: progress === 100 ? 'completed' : 'uploading'
              }
            : upload
        )
      );

      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 300);
  };

  const removeFile = (fileToRemove: File) => {
    setUploads(prev => prev.filter(upload => upload.file !== fileToRemove));
  };

  const retryUpload = (file: File) => {
    setUploads(prev => 
      prev.map(upload => 
        upload.file === file 
          ? { ...upload, progress: 0, status: 'uploading' }
          : upload
      )
    );
    simulateFileUpload(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            Upload files
            <button onClick={onClose} className="hover:bg-gray-100 p-1 rounded-full">
              <X className="h-4 w-4" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div
          className={`mt-4 p-6 border-2 border-dashed rounded-lg text-center ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {uploads.length === 0 ? (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-gray-400" />
              <p className="text-sm text-gray-600">
                Drag and drop or{" "}
                <label className="text-blue-500 hover:text-blue-600 cursor-pointer">
                  browse
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileInput}
                  />
                </label>
              </p>
              <p className="text-xs text-gray-400">
                Supported files: PDF (Max. 5MB)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {uploads.map((upload) => (
                <div
                  key={upload.file.name}
                  className="flex items-center gap-3 text-sm"
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center">
                      PDF
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{upload.file.name}</p>
                    {upload.status === 'uploading' && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {upload.status === 'error' ? (
                      <button
                        onClick={() => retryUpload(upload.file)}
                        className="p-1 hover:bg-gray-100 rounded-full"
                      >
                        <RotateCw className="h-4 w-4 text-gray-500" />
                      </button>
                    ) : (
                      <button
                        onClick={() => removeFile(upload.file)}
                        className="p-1 hover:bg-gray-100 rounded-full"
                      >
                        <Trash2 className="h-4 w-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {uploads.length > 0 && (
          <div className="mt-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setUploads([])}
              className="text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Files uploaded",
                  description: "All files have been successfully uploaded."
                });
                setUploads([]);
                onClose();
              }}
              className="text-sm"
            >
              Add files
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

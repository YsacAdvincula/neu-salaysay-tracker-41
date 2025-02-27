
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, X, CheckCircle } from "lucide-react";
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
  status: 'pending' | 'uploading' | 'completed' | 'error';
}

export function UploadDialog({ isOpen, onClose }: UploadDialogProps) {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const { toast } = useToast();

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

      setUploads(prev => [...prev, {
        file,
        progress: 0,
        status: 'pending'
      }]);

      // Simulate upload progress
      simulateUpload(file);
    }
  };

  const simulateUpload = (file: File) => {
    setUploads(prev => 
      prev.map(upload => 
        upload.file === file 
          ? { ...upload, status: 'uploading' }
          : upload
      )
    );

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      
      setUploads(prev => 
        prev.map(upload => 
          upload.file === file 
            ? {
                ...upload,
                progress,
                status: progress >= 100 ? 'completed' : 'uploading'
              }
            : upload
        )
      );

      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 500);
  };

  const removeFile = (fileToRemove: File) => {
    setUploads(prev => prev.filter(upload => upload.file !== fileToRemove));
  };

  const allUploadsCompleted = uploads.length > 0 && 
    uploads.every(upload => upload.status === 'completed');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Upload files
          </DialogTitle>
          <button 
            onClick={onClose} 
            className="absolute right-4 top-4 hover:bg-gray-100 rounded-full p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="space-y-4">
          {uploads.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-8 w-8 text-gray-400" />
                <label className="w-full cursor-pointer text-center">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileInput}
                    multiple
                  />
                  <span className="text-sm text-gray-500">
                    Drop PDF files here or{" "}
                    <span className="text-blue-600 hover:text-blue-700 underline">
                      browse
                    </span>
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    Maximum file size: 10MB
                  </p>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {uploads.map((upload) => (
                <div
                  key={upload.file.name}
                  className="flex items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm"
                >
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
                    </div>
                  </div>
                  {upload.status !== 'uploading' && (
                    <button
                      onClick={() => removeFile(upload.file)}
                      className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-500"
                      aria-label="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setUploads([]);
                onClose();
              }}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (allUploadsCompleted) {
                  toast({
                    title: "Success",
                    description: "All files have been successfully uploaded."
                  });
                  setUploads([]);
                  onClose();
                }
              }}
              className="px-6"
              disabled={!allUploadsCompleted}
            >
              Upload files
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

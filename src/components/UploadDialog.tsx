
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FileUpload {
  file: File;
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
        status: 'pending'
      }]);
    }
  };

  const removeFile = (fileToRemove: File) => {
    setUploads(prev => prev.filter(upload => upload.file !== fileToRemove));
  };

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
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="flex flex-col items-center">
                <label className="w-full cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileInput}
                  />
                  <div className="w-full text-center">
                    <p className="text-sm text-gray-500">
                      Drop PDF files here or{" "}
                      <span className="text-blue-600 hover:text-blue-700">
                        browse
                      </span>
                    </p>
                  </div>
                </label>
              </div>
            </div>
          ) : (
            uploads.map((upload) => (
              <div
                key={upload.file.name}
                className="flex items-center py-3 px-4 bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <div className="flex-shrink-0 mr-3">
                  <div className="text-xs font-medium bg-gray-100 px-2 py-1 rounded">
                    PDF
                  </div>
                </div>
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 break-all pr-4">
                      {upload.file.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(upload.file)}
                  className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-500"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))
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
                if (uploads.length > 0) {
                  toast({
                    title: "Success",
                    description: "Files have been successfully uploaded."
                  });
                  setUploads([]);
                  onClose();
                }
              }}
              className="px-6"
              disabled={uploads.length === 0}
            >
              Upload files
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

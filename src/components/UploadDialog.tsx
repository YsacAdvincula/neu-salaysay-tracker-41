
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadDialog({ isOpen, onClose }: UploadDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
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
    await handleFiles(files);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    await handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
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

      // TODO: Implement actual file upload to Supabase
      toast({
        title: "File received",
        description: `Successfully received: ${file.name}`
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            Upload Files
            <button onClick={onClose} className="hover:bg-gray-100 p-1 rounded-full">
              <X className="h-4 w-4" />
            </button>
          </DialogTitle>
        </DialogHeader>
        <div
          className={`mt-4 p-8 border-2 border-dashed rounded-lg text-center ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-600">Drag files to upload</p>
            <p className="text-xs text-gray-500">or</p>
            <label className="cursor-pointer text-sm text-blue-500 hover:text-blue-600">
              Browse
              <input
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={handleFileInput}
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Supported file type: PDF (Max 5MB)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

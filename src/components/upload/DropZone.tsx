
import { Upload } from "lucide-react";
import { MAX_FILE_SIZE } from "./types";
import { useToast } from "@/components/ui/use-toast";

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export function DropZone({ onFilesSelected }: DropZoneProps) {
  const { toast } = useToast();

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(files);
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

      if (file.size > MAX_FILE_SIZE) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Maximum file size is 5MB."
        });
        return;
      }
    }
    onFilesSelected(files);
  };

  return (
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
            Maximum file size: 5MB
          </p>
        </label>
      </div>
    </div>
  );
}

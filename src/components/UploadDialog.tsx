
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, X, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  violationType?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

const VIOLATION_TYPES = [
  "Attendance Issue",
  "Dress Code Violation",
  "Academic Misconduct",
  "Behavioral Issue",
  "Property Damage",
  "Other"
];

export function UploadDialog({ isOpen, onClose, userId }: UploadDialogProps) {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [selectedViolationType, setSelectedViolationType] = useState<string>("");
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

      setUploads(prev => [...prev, {
        file,
        progress: 0,
        status: 'pending'
      }]);
    }
  };

  const uploadToSupabase = async (file: File, violationType: string) => {
    if (!violationType) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a violation type."
      });
      return;
    }

    if (!userId) {
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "User ID not found. Please log in again."
      });
      return;
    }

    setUploads(prev => 
      prev.map(upload => 
        upload.file === file 
          ? { ...upload, status: 'uploading', progress: 0 }
          : upload
      )
    );

    try {
      // Add a timestamp to the original filename to prevent conflicts while keeping the original name
      const timestamp = Date.now();
      const originalName = file.name;
      const fileName = `${timestamp}_${originalName}`;
      
      // Start upload
      setUploads(prev => 
        prev.map(upload => 
          upload.file === file 
            ? { ...upload, progress: 33 }
            : upload
        )
      );

      // Upload the file to storage
      const { error: uploadError, data } = await supabase.storage
        .from('salaysay-uploads')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw uploadError;
      }

      setUploads(prev => 
        prev.map(upload => 
          upload.file === file 
            ? { ...upload, progress: 66 }
            : upload
        )
      );

      const filePath = data.path;

      // Insert record into salaysay_submissions table
      const { error: insertError } = await supabase
        .from('salaysay_submissions')
        .insert({
          user_id: userId,
          file_path: filePath,
          violation_type: violationType,
          status: 'pending_review'
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw insertError;
      }

      // Update status to completed after successful upload and database insert
      setUploads(prev => 
        prev.map(upload => 
          upload.file === file 
            ? { ...upload, status: 'completed', progress: 100, violationType }
            : upload
        )
      );

      console.log('File uploaded and recorded successfully:', data.path);
    } catch (error) {
      console.error('Detailed upload error:', error);
      setUploads(prev => 
        prev.map(upload => 
          upload.file === file 
            ? { ...upload, status: 'error' }
            : upload
        )
      );

      // More specific error message based on the error type
      let errorMessage = "There was an error uploading your file. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("bucket")) {
          errorMessage = "Storage bucket not found. Please contact support.";
        } else if (error.message.includes("permission")) {
          errorMessage = "Permission denied. Please check your authentication status.";
        } else if (error.message.includes("foreign key")) {
          errorMessage = "Database relation error. User profile may not exist.";
        }
      }

      toast({
        variant: "destructive",
        title: "Upload failed",
        description: errorMessage
      });
    }
  };

  const removeFile = (fileToRemove: File) => {
    setUploads(prev => prev.filter(upload => upload.file !== fileToRemove));
  };

  const handleUpload = async () => {
    if (!selectedViolationType) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a violation type."
      });
      return;
    }

    const pendingUploads = uploads.filter(upload => upload.status === 'pending');
    
    if (pendingUploads.length === 0) {
      toast({
        title: "No files to upload",
        description: "Please select files to upload."
      });
      return;
    }

    for (const upload of pendingUploads) {
      await uploadToSupabase(upload.file, selectedViolationType);
    }
  };

  const allUploadsCompleted = uploads.length > 0 && 
    uploads.every(upload => upload.status === 'completed');

  const handleClose = () => {
    setUploads([]);
    setSelectedViolationType("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Upload Salaysay
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="violation-type">Violation Type</Label>
            <Select 
              value={selectedViolationType} 
              onValueChange={setSelectedViolationType}
            >
              <SelectTrigger id="violation-type" className="w-full">
                <SelectValue placeholder="Select violation type" />
              </SelectTrigger>
              <SelectContent>
                {VIOLATION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
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
                    Maximum file size: 5MB
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
                      {upload.status === 'completed' && upload.violationType && (
                        <p className="text-xs text-gray-500">
                          Type: {upload.violationType}
                        </p>
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
              onClick={handleClose}
              className="px-6"
            >
              Cancel
            </Button>
            {allUploadsCompleted ? (
              <Button
                onClick={handleClose}
                className="px-6"
              >
                Done
              </Button>
            ) : (
              <Button
                onClick={handleUpload}
                className="px-6"
                disabled={uploads.length === 0 || !selectedViolationType}
              >
                Upload files
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

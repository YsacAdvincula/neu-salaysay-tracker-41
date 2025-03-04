
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { FileIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface SalaysayFile {
  id: string;
  created_at: string;
  file_path: string;
  violation_type: string;
  status: string;
  fileName: string;
  user_id: string; // Added this field to match the database schema
}

export function FileExplorer({ userId, refreshTrigger = 0 }: { userId: string; refreshTrigger?: number }) {
  const [files, setFiles] = useState<SalaysayFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);
  const fileViewerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchFiles();
    }
  }, [userId, refreshTrigger]);

  const checkFileExists = async (filePath: string): Promise<boolean> => {
    try {
      const { data } = await supabase.storage
        .from('salaysay-uploads')
        .list(filePath.split('/').slice(0, -1).join('/'), {
          search: filePath.split('/').pop()
        });
      
      return data !== null && data.length > 0;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  };

  const deleteOrphanedRecord = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('salaysay_submissions')
        .delete()
        .eq('id', fileId);
      
      if (error) {
        console.error('Error deleting orphaned record:', error);
      } else {
        console.log('Successfully deleted orphaned record:', fileId);
      }
    } catch (error) {
      console.error('Exception when deleting orphaned record:', error);
    }
  };

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('salaysay_submissions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Process files and check existence in storage
      const filesWithExistenceCheck = await Promise.all(
        data.map(async (file) => {
          const exists = await checkFileExists(file.file_path);
          if (!exists) {
            // If file doesn't exist in storage, delete it from the database
            await deleteOrphanedRecord(file.id);
            return null;
          }
          return {
            ...file,
            fileName: file.file_path.split('/').pop() || file.file_path
          };
        })
      );

      // Filter out null values (files that don't exist)
      setFiles(filesWithExistenceCheck.filter((file): file is SalaysayFile => file !== null));
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        variant: "destructive",
        title: "Failed to load files",
        description: "There was an error loading your files. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = async (filePath: string, fileId: string) => {
    try {
      setViewingFile(fileId);
      setViewError(null);
      
      // Create a longer-lived URL (10 minutes) to allow time for viewing
      const { data, error } = await supabase.storage
        .from('salaysay-uploads')
        .createSignedUrl(filePath, 600);

      if (error) {
        throw error;
      }

      // Open the file in a new tab/window
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error viewing file:', error);
      setViewError("There was an error opening the file. Please try again.");
      toast({
        variant: "destructive",
        title: "Failed to view file",
        description: "There was an error opening the file. Please try again."
      });
    } finally {
      setViewingFile(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_review':
        return 'text-yellow-600';
      case 'approved':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy h:mm a');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading files...</span>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No salaysay files uploaded yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {viewError && (
        <Alert variant="destructive">
          <AlertTitle>Failed to view file</AlertTitle>
          <AlertDescription>{viewError}</AlertDescription>
        </Alert>
      )}
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left font-medium">File Name</th>
                <th className="px-4 py-2 text-left font-medium">Date Uploaded</th>
                <th className="px-4 py-2 text-left font-medium">Violation Type</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {files.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button 
                      className="flex items-center text-left focus:outline-none group"
                      onClick={() => handleViewFile(file.file_path, file.id)}
                      disabled={viewingFile === file.id}
                    >
                      <FileIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                      <span className="font-medium text-blue-600 group-hover:text-blue-800 group-hover:underline truncate max-w-[250px]">
                        {viewingFile === file.id ? (
                          <span className="flex items-center">
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            Opening...
                          </span>
                        ) : (
                          file.fileName
                        )}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(file.created_at)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {file.violation_type}
                  </td>
                  <td className={`px-4 py-3 ${getStatusColor(file.status)}`}>
                    {file.status.replace('_', ' ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div ref={fileViewerRef} className="hidden"></div>
    </div>
  );
}

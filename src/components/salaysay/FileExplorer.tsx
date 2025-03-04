
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileIcon, Eye, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

interface SalaysayFile {
  id: string;
  created_at: string;
  file_path: string;
  violation_type: string;
  status: string;
  fileName: string;
}

export function FileExplorer({ userId }: { userId: string }) {
  const [files, setFiles] = useState<SalaysayFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchFiles();
    }
  }, [userId]);

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

      // Process data to add fileName from file_path
      const processedData = data.map(file => ({
        ...file,
        fileName: file.file_path.split('/').pop() || file.file_path
      }));

      setFiles(processedData);
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
      const { data, error } = await supabase.storage
        .from('salaysay-uploads')
        .createSignedUrl(filePath, 60); // 60 seconds expiry

      if (error) {
        throw error;
      }

      setFileUrl(data.signedUrl);
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error viewing file:', error);
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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-2 text-left font-medium">File Name</th>
              <th className="px-4 py-2 text-left font-medium">Date Uploaded</th>
              <th className="px-4 py-2 text-left font-medium">Violation Type</th>
              <th className="px-4 py-2 text-left font-medium">Status</th>
              <th className="px-4 py-2 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {files.map((file) => (
              <tr key={file.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 flex items-center">
                  <FileIcon className="h-5 w-5 text-red-500 mr-2" />
                  <span className="font-medium text-gray-800 truncate max-w-[250px]">
                    {file.fileName}
                  </span>
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
                <td className="px-4 py-3">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      onClick={() => handleViewFile(file.file_path, file.id)}
                      disabled={viewingFile === file.id}
                    >
                      {viewingFile === file.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Eye className="h-4 w-4 mr-1" />
                      )}
                      View
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

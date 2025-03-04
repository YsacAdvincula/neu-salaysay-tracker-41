
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Send, User } from "lucide-react";
import { UploadDialog } from "@/components/UploadDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
    id: string | null;
  }>({
    email: null,
    fullName: null,
    avatarUrl: null,
    id: null,
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }

      // Set the user email from the session
      setUserProfile(prev => ({ 
        ...prev, 
        email: session.user.email,
        id: session.user.id
      }));

      // Check if user has Google avatar in metadata
      const avatarUrl = session.user.user_metadata?.avatar_url || null;

      // Fetch user profile from the profiles table
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        
        // If profile doesn't exist but we have Google data, create one
        if (avatarUrl) {
          const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
              id: session.user.id,
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "User",
              email: session.user.email,
              avatar_url: avatarUrl,
            });
            
          if (updateError) {
            console.error("Error creating profile:", updateError);
          }
        }
      }

      setUserProfile({
        email: session.user.email,
        fullName: profileData?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "User",
        avatarUrl: avatarUrl || profileData?.avatar_url || null,
        id: session.user.id,
      });
    };
    
    checkUser();
  }, [navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message
      });
    } else {
      navigate('/');
    }
  };

  const handleSubmitSalaysay = () => {
    setIsUploadDialogOpen(true);
  };

  // Get user's initials for avatar fallback
  const getInitials = () => {
    if (!userProfile.fullName) return "U";
    return userProfile.fullName
      .split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Welcome to SALAYSAY TRACKER APP</h1>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-pointer">
                    <Avatar>
                      <AvatarImage src={userProfile.avatarUrl || ""} alt={userProfile.fullName || "User"} />
                      <AvatarFallback className="bg-gray-200 text-gray-700">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-white p-3 shadow-lg border rounded-md">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{userProfile.fullName || "User"}</p>
                    <p className="text-xs text-gray-500">{userProfile.email}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="bg-white hover:bg-gray-100"
            >
              Sign Out
            </Button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
          <p className="text-gray-600 mb-6">
            Welcome to your dashboard. This is where you'll manage your salaysay activities.
          </p>
          <Button onClick={handleSubmitSalaysay} className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Submit Salaysay
          </Button>
        </div>
      </div>
      <UploadDialog 
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        userId={userProfile.id || ""}
      />
    </div>
  );
}

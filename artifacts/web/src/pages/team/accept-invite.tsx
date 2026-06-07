import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, UserPlus, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AcceptInvite() {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  const { session, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const searchParams = new URLSearchParams(window.location.search);
  const invitationId = searchParams.get("id");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  // Fetch invitation details to show what they are joining
  useEffect(() => {
    if (!invitationId) {
      setError(t("invitation.noInvitationId"));
      setChecking(false);
      return;
    }

    async function checkInvitation() {
      try {
        // Better Auth might have a way to get invitation details publically 
        // but for now we'll just try to accept it if logged in or show join button
        setChecking(false);
      } catch (err) {
        setError(t("invitation.failedToLoad"));
        setChecking(false);
      }
    }

    checkInvitation();
  }, [invitationId]);

  const handleAccept = async () => {
    if (!invitationId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (authError) {
        throw new Error(authError.message || "Failed to accept invitation");
      }

      toast({
        title: "Invitation Accepted!",
        description: "You have joined the workspace successfully.",
      });

      // Redirect to dashboard
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  if (checking || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sidebar">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Validating invitation…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar px-4">
      <Card className="w-full max-w-md border-card-border shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <UserPlus className="size-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold">Workspace Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a team on CommissionKit.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg flex items-start gap-3">
              <XCircle className="size-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {!session && !error && (
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-4">
                You need to be signed in to accept this invitation.
              </p>
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => setLocation(`/login?redirect=/accept-invite?id=${invitationId}`)}
              >
                <LogIn className="size-4" />
                Sign in to continue
              </Button>
            </div>
          )}

          {session && !error && (
            <div className="bg-primary/5 border border-primary/10 p-4 rounded-lg flex items-center gap-4">
              <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle2 className="size-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Logged in as</p>
                <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          {session && !error && (
            <Button 
              className="w-full h-11 text-[15px] font-semibold" 
              onClick={handleAccept}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Accepting…
                </>
              ) : (
                "Accept Invitation"
              )}
            </Button>
          )}
          {error && (
            <Button variant="ghost" className="w-full" onClick={() => setLocation("/")}>
              Back to home
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

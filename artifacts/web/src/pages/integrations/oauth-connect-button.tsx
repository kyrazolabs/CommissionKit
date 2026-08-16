import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/hooks/use-workspace";
import { ConnectDialog } from "./connect-dialog";
import type { Connector } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface Props {
  connector: Connector;
  workspaceId?: string;
  isConnected?: boolean;
}

export function OAuthConnectButton({ connector, workspaceId, isConnected = false }: Props) {
  const { activeWorkspace } = useWorkspace();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const supportsOAuth = connector.features.includes("oauth_support");

  if (isConnected || !supportsOAuth) {
    return <ConnectDialog connector={connector} isConnected={isConnected} />;
  }

  const wsId = workspaceId ?? activeWorkspace?.id;

  const startOAuth = () => {
    window.location.href = `${API_BASE}/api/integrations/${wsId}/oauth/start/${connector.name}`;
  };

  return (
    <div className="space-y-2">
      <Button className="w-full" onClick={startOAuth}>
        Connect {connector.displayName}
        <ArrowRight className="size-3.5 ml-1.5" />
      </Button>
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        aria-expanded={showAdvanced}
        className="flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ChevronDown className={cn("size-3.5 transition-transform", showAdvanced && "rotate-180")} />
        Advanced — enter credentials manually
      </button>
      {showAdvanced && <ConnectDialog connector={connector} isConnected={false} />}
    </div>
  );
}

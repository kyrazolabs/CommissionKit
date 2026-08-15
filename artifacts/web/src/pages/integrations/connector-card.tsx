import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ConnectorImage } from "./icons";
import { ConnectDialog } from "./connect-dialog";
import { OAuthConnectButton } from "./oauth-connect-button";
import type { Connector } from "./types";

interface Props {
  connector: Connector;
  isConnected: boolean;
}

export function ConnectorCard({ connector, isConnected }: Props) {
  const { t } = useTranslation();
  const supportsOAuth = connector.features.includes("oauth_support");
  return (
    <Card className={cn("transition-colors", isConnected && "border-primary/40")}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl shrink-0 overflow-hidden bg-muted">
            <ConnectorImage name={connector.name} className={cn("size-6 object-contain", !isConnected && "opacity-50")} />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              {connector.displayName}
              {isConnected && (
                <Badge variant="default" className="text-[10px] bg-teal-600/10 text-teal-600 border-teal-600/20">{t("integrations.connected")}</Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs line-clamp-2">{connector.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {connector.features.map((f) => (
            <Badge key={f} variant="secondary" className="text-[10px]">{f.replace(/_/g, " ")}</Badge>
          ))}
        </div>
        {!isConnected && supportsOAuth ? (
          <OAuthConnectButton connector={connector} isConnected={false} />
        ) : (
          <ConnectDialog connector={connector} isConnected={isConnected} />
        )}
      </CardContent>
    </Card>
  );
}

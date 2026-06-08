import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ConnectorImage } from "./icons";
import { ConnectDialog } from "./connect-dialog";
import type { Connector } from "./types";

interface Props {
  connector: Connector;
  isConnected: boolean;
}

export function ConnectorCard({ connector, isConnected }: Props) {
  return (
    <Card className={cn("transition-colors", isConnected && "ring-2 ring-teal-600/50")}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className={cn("flex size-10 items-center justify-center rounded-xl shrink-0 overflow-hidden border", isConnected ? "border-primary/40 bg-background" : "bg-muted border-transparent")}>
            <ConnectorImage name={connector.name} className={cn("size-6 object-contain", !isConnected && "opacity-50")} />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              {connector.displayName}
              {isConnected && (
                <Badge variant="default" className="text-[10px] bg-teal-600/10 text-teal-600 border-teal-600/20">Connected</Badge>
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
        <ConnectDialog connector={connector} isConnected={isConnected} />
      </CardContent>
    </Card>
  );
}

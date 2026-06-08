import { Cable, Plug, Sprout } from "lucide-react";

export const CONNECTOR_ICONS: Record<string, any> = {
  custom: Cable,
  hubspot: Sprout,
};

export const ICON_SRC: Record<string, string> = {
  odoo: "/plugins/odoo.webp",
  hubspot: "/plugins/hubspot.webp",
};

export function ConnectorImage({ name, className }: { name: string; className?: string }) {
  const src = ICON_SRC[name];
  if (src) {
    return <img src={src} alt={name} className={className} />;
  }
  const Icon = CONNECTOR_ICONS[name] || Plug;
  return <Icon className={className} />;
}

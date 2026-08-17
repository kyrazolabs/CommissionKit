import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  values: Record<string, string | boolean>;
  onChange: (v: Record<string, string | boolean>) => void;
}

export function OdooConnectForm({ values, onChange }: Props) {
  return (
    <>
      <Field label="Odoo Instance URL">
        <Input
          placeholder="https://mycompany.odoo.com"
          value={String(values.baseUrl || "")}
          onChange={(e) => onChange({ ...values, baseUrl: e.target.value })}
          className="h-9 text-sm"
        />
      </Field>
      <Field label="Database Name">
        <Input
          placeholder="mycompany-db"
          value={String(values.database || "")}
          onChange={(e) => onChange({ ...values, database: e.target.value })}
          className="h-9 text-sm"
        />
      </Field>
      <Field label="Username (Email)">
        <Input
          placeholder="admin@mycompany.com"
          value={String(values.username || "")}
          onChange={(e) => onChange({ ...values, username: e.target.value })}
          className="h-9 text-sm"
        />
      </Field>
      <Field label="API Key">
        <Input
          type="password"
          placeholder="Generated from Odoo user settings"
          value={String(values.apiKey || "")}
          onChange={(e) => onChange({ ...values, apiKey: e.target.value })}
          className="h-9 text-sm"
        />
      </Field>
    </>
  );
}

export function HubspotConnectForm({ values, onChange }: Props) {
  return (
    <Field label="Access Token">
      <Input
        type="password"
        placeholder="Service Key or Legacy App token e.g. (pat-na1-xxxx...)"
        value={String(values.accessToken || "")}
        onChange={(e) => onChange({ ...values, accessToken: e.target.value })}
        className="h-9 text-sm"
      />
    </Field>
  );
}

export function CustomConnectForm({ values, onChange }: Props) {
  return (
    <>
      <Field label="Base URL">
        <Input
          placeholder="https://api.erp.example.com"
          value={String(values.baseUrl || "")}
          onChange={(e) => onChange({ ...values, baseUrl: e.target.value })}
          className="h-9 text-sm"
        />
      </Field>
      <Field label="Authentication">
        <Select
          value={String(values.authType || "bearer")}
          onValueChange={(v) => onChange({ ...values, authType: v })}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bearer">Bearer Token</SelectItem>
            <SelectItem value="apiKey">API Key</SelectItem>
            <SelectItem value="basic">Basic Auth</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {String(values.authType || "bearer") === "bearer" && (
        <Field label="Bearer Token">
          <Input
            type="password"
            placeholder="sk-abc123..."
            value={String(values.authToken || "")}
            onChange={(e) => onChange({ ...values, authToken: e.target.value })}
            className="h-9 text-sm"
          />
        </Field>
      )}
      {String(values.authType) === "apiKey" && (
        <>
          <Field label="Header Name">
            <Input
              placeholder="X-API-Key"
              value={String(values.authHeaderName || "")}
              onChange={(e) => onChange({ ...values, authHeaderName: e.target.value })}
              className="h-9 text-sm"
            />
          </Field>
          <Field label="API Key">
            <Input
              type="password"
              placeholder="your-api-key"
              value={String(values.authApiKey || "")}
              onChange={(e) => onChange({ ...values, authApiKey: e.target.value })}
              className="h-9 text-sm"
            />
          </Field>
        </>
      )}
      {String(values.authType) === "basic" && (
        <>
          <Field label="Username">
            <Input
              placeholder="username"
              value={String(values.authUsername || "")}
              onChange={(e) => onChange({ ...values, authUsername: e.target.value })}
              className="h-9 text-sm"
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              placeholder="password"
              value={String(values.authPassword || "")}
              onChange={(e) => onChange({ ...values, authPassword: e.target.value })}
              className="h-9 text-sm"
            />
          </Field>
        </>
      )}
    </>
  );
}

export function SalesforceConnectForm({ values, onChange }: Props) {
  return (
    <>
      <Field label="Instance URL">
        <Input
          placeholder="https://yourinstance.my.salesforce.com"
          value={String(values.instanceUrl || "")}
          onChange={(e) => onChange({ ...values, instanceUrl: e.target.value })}
          className="h-9 text-sm"
        />
      </Field>
      <Field label="Client ID (Consumer Key)">
        <Input
          placeholder="Connected App Consumer Key"
          value={String(values.clientId || "")}
          onChange={(e) => onChange({ ...values, clientId: e.target.value })}
          className="h-9 text-sm"
        />
      </Field>
      <Field label="Client Secret (Consumer Secret)">
        <Input
          type="password"
          placeholder="Connected App Consumer Secret"
          value={String(values.clientSecret || "")}
          onChange={(e) => onChange({ ...values, clientSecret: e.target.value })}
          className="h-9 text-sm"
        />
      </Field>
      <Field label="Username (optional)">
        <Input
          placeholder="user@company.com"
          value={String(values.username || "")}
          onChange={(e) => onChange({ ...values, username: e.target.value })}
          className="h-9 text-sm"
        />
      </Field>
      <Field label="Password (optional)">
        <Input
          type="password"
          placeholder="Required for username-password flow"
          value={String(values.password || "")}
          onChange={(e) => onChange({ ...values, password: e.target.value })}
          className="h-9 text-sm"
        />
      </Field>
      <Field label="Security Token (optional)">
        <Input
          type="password"
          placeholder="Password + Security Token concatenated"
          value={String(values.securityToken || "")}
          onChange={(e) => onChange({ ...values, securityToken: e.target.value })}
          className="h-9 text-sm"
        />
      </Field>
      <p className="text-[11px] text-muted-foreground">
        For External Client Apps: Client ID + Secret only. For Connected Apps: add Username +
        Password + Security Token.
      </p>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MarkdownEditor } from "@/components/markdown-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
  { label: "Bug", value: "BUG" },
  { label: "Feature Request", value: "FEATURE_REQUEST" },
  { label: "Question", value: "QUESTION" },
  { label: "Account Issue", value: "ACCOUNT_ISSUE" },
  { label: "Other", value: "OTHER" },
] as const;

export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [errors, setErrors] = useState<{
    subject?: string;
    description?: string;
    category?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  function stripHtml(html: string) {
    return html.replace(/<[^>]*>/g, "");
  }

  function resetForm() {
    setSubject("");
    setDescription("");
    setCategory("");
    setErrors({});
  }

  function validate() {
    const next: { subject?: string; description?: string; category?: string } = {};
    if (!subject.trim()) next.subject = "Subject is required";
    if (!stripHtml(description).trim()) next.description = "Description is required";
    if (!category) next.category = "Category is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await apiFetch("/api/support/tickets", {
        method: "POST",
        body: JSON.stringify({
          subject: subject.trim(),
          description,
          category,
        }),
        credentials: "include",
      });
      toast("Ticket submitted — we'll respond soon");
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      toast(err.message || "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Contact Support</DialogTitle>
          <DialogDescription>
            Tell us what you need help with and we'll get back to you.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setErrors((p) => ({ ...p, subject: undefined }));
              }}
              placeholder="Brief summary of your issue"
            />
            {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v);
                setErrors((p) => ({ ...p, category: undefined }));
              }}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <MarkdownEditor
              value={description}
              onChange={(v) => {
                setDescription(v);
                setErrors((p) => ({ ...p, description: undefined }));
              }}
              placeholder="Describe what's happening..."
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <LoaderCircle className="size-4 mr-1.5 animate-spin" />}
              Send
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

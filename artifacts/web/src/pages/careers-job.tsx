import { useState } from "react";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useParams, Link } from "wouter";
import { Footer } from "./landing/Footer";
import { Navbar } from "./landing/Navbar";
import {
  CheckCircle2,
  LoaderCircle,
  Send,
  User,
  Mail,
  Phone,
  Linkedin,
  MapPin,
  FileText,
  MessageSquare,
  ArrowLeft,
  Briefcase,
  Check,
  Clock,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { getJobBySlug } from "@/lib/jobs";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

export function CareersJobPage() {
  const { slug } = useParams();
  const job = slug ? getJobBySlug(slug) : undefined;

  usePageMeta({
    title: job ? `${job.title} — Careers` : "Careers",
    description: job
      ? `Apply for the ${job.title} position at CommissionKit. ${job.location} · ${job.type === "contract" ? "Contract" : job.type} · ${job.schedule === "full-time" ? "Full-time" : "Part-time"}.`
      : "Join CommissionKit. We're building the future of sales commission management.",
    robots: "index, follow",
  });

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    linkedinUrl: "",
    location: "",
    experience: "",
    pitch: "",
    agreedToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sidebar px-4">
        <Card className="w-full max-w-md border border-card-border rounded-2xl shadow-sm text-center">
          <CardContent className="p-8">
            <Briefcase className="size-12 text-muted-foreground/40 mx-auto mb-4" />
            <h1 className="text-[18px] font-semibold tracking-tight text-foreground mb-2">
              Position not found
            </h1>
            <p className="text-[13px] text-muted-foreground mb-6">
              This position may have been filled or removed.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/careers">
                <ArrowLeft className="size-4 mr-2" />
                Back to Careers
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const update = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2)
      next.fullName = "Full name is required";
    if (!form.email.trim() || !/.+@.+\..+/.test(form.email))
      next.email = "Valid email is required";
    if (!form.phone.trim() || form.phone.trim().length < 5)
      next.phone = "Phone number is required";
    if (!form.location.trim()) next.location = "Location is required";
    if (!form.experience.trim()) next.experience = "Experience is required";
    if (!form.pitch.trim() || form.pitch.trim().length < 10)
      next.pitch = "Please write at least 10 characters";
    if (!form.agreedToTerms) next.agreedToTerms = "You must agree to the terms";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, position: job.slug }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
      } else if (data.error === "ValidationError" && data.details) {
        const backendErrors: Record<string, string> = {};
        for (const [field, messages] of Object.entries(data.details as Record<string, string[]>)) {
          if (Array.isArray(messages) && messages.length > 0) {
            backendErrors[field] = messages[0];
          }
        }
        setErrors({
          ...backendErrors,
          general: "Please fix the highlighted fields and try again.",
        });
      } else {
        setErrors({
          general: data.error || "Something went wrong. Please try again later.",
        });
      }
    } catch {
      setErrors({ general: "Network error. Please try again later." });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sidebar px-4">
        <Card className="w-full max-w-md border border-card-border rounded-2xl shadow-sm text-center">
          <CardContent className="p-8">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="size-12 text-primary" />
            </div>
            <h1 className="text-[18px] font-semibold tracking-tight text-foreground mb-2">
              Application Received
            </h1>
            <p className="text-[13px] text-muted-foreground mb-2">
              Thank you for applying to the <strong>{job.title}</strong> position.
            </p>
            <p className="text-[13px] text-muted-foreground mb-6">
              Our team will review your application and reach out via email or WhatsApp within 2 business days.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/careers">
                <ArrowLeft className="size-4 mr-2" />
                Back to Careers
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto p-8 lg:px-10 max-w-3xl py-36">
          {/* Back link */}
          <Link href="/careers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="size-3.5" />
            Back to all positions
          </Link>

          {/* Job Header */}
          <div className="mb-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <h1 className="text-[24px] md:text-[28px] font-bold tracking-tight text-foreground">
                {job.title}
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {job.type === "contract" ? "Contract" : job.type === "full-time" ? "Full-time" : "Part-time"}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                <Clock className="size-3" />
                {job.schedule === "full-time" ? "Full-time" : "Part-time"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Briefcase className="size-3.5" />
                {job.department}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {job.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {job.schedule === "full-time" ? "Full-time" : "Part-time"}
              </span>
            </div>
          </div>

          {/* Job Description */}
          <div className="space-y-8 mb-10">
            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-3">About the role</h2>
              <p className="text-[14px] text-muted-foreground leading-relaxed">{job.description}</p>
            </section>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-3">What you'll do</h2>
              <ul className="space-y-2">
                {job.responsibilities.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14px] text-muted-foreground leading-relaxed">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-3">What we're looking for</h2>
              <ul className="space-y-2">
                {job.requirements.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14px] text-muted-foreground leading-relaxed">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-3">What we offer</h2>
              <ul className="space-y-2">
                {job.offers.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14px] text-muted-foreground leading-relaxed">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Application Form */}
          <div className="border-t border-border pt-10">
            <h2 className="text-[18px] font-semibold tracking-tight text-foreground mb-2">
              Apply for this position
            </h2>
            <p className="text-[13px] text-muted-foreground mb-6">
              Fill out the form below and we'll get back to you within 2 business days.
            </p>

            <Card className="border border-card-border rounded-2xl shadow-sm">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {errors.general && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
                      {errors.general}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <User className="size-3.5 text-muted-foreground" />
                      Full Name
                    </Label>
                    <Input
                      value={form.fullName}
                      onChange={(e) => update("fullName", e.target.value)}
                      placeholder="John Doe"
                      aria-invalid={!!errors.fullName}
                    />
                    {errors.fullName && (
                      <p className="text-[12px] text-destructive">{errors.fullName}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Mail className="size-3.5 text-muted-foreground" />
                        Email
                      </Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        placeholder="john@example.com"
                        aria-invalid={!!errors.email}
                      />
                      {errors.email && (
                        <p className="text-[12px] text-destructive">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Phone className="size-3.5 text-muted-foreground" />
                        Phone / WhatsApp
                      </Label>
                      <Input
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        placeholder="+1 234 567 8900"
                        aria-invalid={!!errors.phone}
                      />
                      {errors.phone && (
                        <p className="text-[12px] text-destructive">{errors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Linkedin className="size-3.5 text-muted-foreground" />
                        LinkedIn URL (optional)
                      </Label>
                      <Input
                        value={form.linkedinUrl}
                        onChange={(e) => update("linkedinUrl", e.target.value)}
                        placeholder="https://linkedin.com/in/johndoe"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="size-3.5 text-muted-foreground" />
                        Location
                      </Label>
                      <Input
                        value={form.location}
                        onChange={(e) => update("location", e.target.value)}
                        placeholder="Dubai, UAE"
                        aria-invalid={!!errors.location}
                      />
                      {errors.location && (
                        <p className="text-[12px] text-destructive">{errors.location}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Briefcase className="size-3.5 text-muted-foreground" />
                      Relevant Experience
                    </Label>
                    <Textarea
                      value={form.experience}
                      onChange={(e) => update("experience", e.target.value)}
                      placeholder="Tell us about your background, relevant roles, and achievements."
                      rows={3}
                      aria-invalid={!!errors.experience}
                    />
                    {errors.experience && (
                      <p className="text-[12px] text-destructive">{errors.experience}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="size-3.5 text-muted-foreground" />
                      Why CommissionKit?
                    </Label>
                    <Textarea
                      value={form.pitch}
                      onChange={(e) => update("pitch", e.target.value)}
                      placeholder="Tell us why you want this role and how you plan to succeed."
                      rows={4}
                      aria-invalid={!!errors.pitch}
                    />
                    {errors.pitch && (
                      <p className="text-[12px] text-destructive">{errors.pitch}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-3 rounded-lg border border-card-border bg-card p-4">
                      <FileText className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="text-[13px] text-muted-foreground space-y-1">
                        <p className="font-medium text-foreground">Independent Contractor Terms</p>
                        <p>
                          This is an independent contractor engagement, not employment. Compensation and terms are outlined above under "What we offer." By applying, you confirm you understand and agree to these terms.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="terms"
                        checked={form.agreedToTerms}
                        onCheckedChange={(checked) =>
                          update("agreedToTerms", checked === true)
                        }
                        aria-invalid={!!errors.agreedToTerms}
                      />
                      <label
                        htmlFor="terms"
                        className="text-[13px] text-muted-foreground leading-tight cursor-pointer"
                      >
                        I agree to the terms and confirm this is an independent contractor engagement.
                      </label>
                    </div>
                    {errors.agreedToTerms && (
                      <p className="text-[12px] text-destructive">{errors.agreedToTerms}</p>
                    )}
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full font-semibold">
                    {submitting ? (
                      <>
                        <LoaderCircle className="size-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="size-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      <Footer />
    </>
  );
}

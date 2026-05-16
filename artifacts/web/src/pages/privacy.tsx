import { Navbar } from "./landing/Navbar";
import { Footer } from "./landing/Footer";

export function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-sidebar selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-foreground mb-8 tracking-tight">Privacy Policy</h1>
        <div className="prose prose-slate max-w-none text-muted-foreground space-y-6">
          <p className="text-lg leading-relaxed">
            Your privacy is important to us. It is CommissionKit's policy to respect your privacy regarding any information we may collect from you across our website.
          </p>
          
          <h2 className="text-2xl font-semibold text-foreground mt-12 mb-4">1. Information We Collect</h2>
          <p>
            We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-12 mb-4">2. Use of Information</h2>
          <p>
            We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-12 mb-4">3. Data Sharing</h2>
          <p>
            We don’t share any personally identifying information publicly or with third-parties, except when required to by law.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-12 mb-4">4. Your Rights</h2>
          <p>
            You are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services.
          </p>

          <p className="mt-12 text-sm italic">
            Last updated: May 16, 2024
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

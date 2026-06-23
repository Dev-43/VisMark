import { Navbar } from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import { CTABanner } from "@/components/landing/CTABanner";
import { Footer } from "@/components/landing/Footer";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <CTABanner />
      <Footer />
    </main>
  );
}

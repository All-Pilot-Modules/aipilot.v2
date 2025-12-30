import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import HowItWorksSection from './HowItWorksSection';
import BrandSection from './BrandSection';
import TestimonialsSection from './TestimonialsSection';
import StudentAccessSection from './StudentAccessSection';
import Footer from './Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <main id="main-content">
        <HeroSection />
        <HowItWorksSection />
        <BrandSection />
        <FeaturesSection />
        <TestimonialsSection />
        <StudentAccessSection />
      </main>
      <Footer />
    </div>
  );
}

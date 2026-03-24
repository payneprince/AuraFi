import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Products } from "@/components/Products";
import { Stats } from "@/components/Stats";
import { HowItWorks } from "@/components/HowItWorks";
import { Features } from "@/components/Features";
import { ProductTabs } from "@/components/ProductTabs";
import { Security } from "@/components/Security";
import { Testimonials } from "@/components/Testimonials";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { Integration } from "@/components/Integration";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { LiveChat } from "@/components/LiveChat";
import { authOptions } from "./api/auth/[...nextauth]/route";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <Products />
      <Stats />
      <HowItWorks />
      <Features />
      <ProductTabs />
      <Security />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Integration />
      <Footer />
      <BackToTop />
      <LiveChat />
    </main>
  );
}

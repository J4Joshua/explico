import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Works from "@/components/Works";
import Testimonials from "@/components/Testimonials";
import Mission from "@/components/Mission";
import Services from "@/components/Services";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Works />
      <Footer />
    </main>
  );
}

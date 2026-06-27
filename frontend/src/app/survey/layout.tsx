import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { TestimonialSidebar } from "@/components/marketing/TestimonialSidebar";

export default function SurveyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <div className="flex flex-1">
        <main className="flex-1">{children}</main>
        <TestimonialSidebar />
      </div>
      <Footer />
    </div>
  );
}

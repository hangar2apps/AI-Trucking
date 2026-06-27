import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import {
  TestimonialMobile,
  TestimonialSidebar,
} from "@/components/marketing/TestimonialSidebar";

export default function SurveyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <div className="flex flex-1 flex-col lg:flex-row">
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        <TestimonialSidebar />
      </div>
      <TestimonialMobile />
      <Footer />
    </div>
  );
}

import PricingInfo from "@/components/PricingInfo";
import RegistrationForm from "@/components/RegistrationForm";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl pb-16">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/banner.webp" alt="AAPARTT Nacional Onroad – Circuito Hernán Maticoli, 20, 21, 22 de noviembre" className="w-full" />
      <PricingInfo />
      <RegistrationForm />
    </main>
  );
}

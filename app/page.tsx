import RegistrationForm from "@/components/RegistrationForm";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl pb-16">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/banner.webp" alt="AAPARTT Nacional Onroad – Circuito Hernán Maticoli, 20, 21, 22 de noviembre" className="w-full" />
      <p className="mx-4 my-3 rounded-lg border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-center text-sm font-semibold">
        {/* TODO: reemplazar por los valores reales */}
        Inscripción: $30.000 por categoría · Segunda categoría con 20% de descuento · Pago por transferencia hasta el 10 de noviembre.
      </p>
      <RegistrationForm />
    </main>
  );
}

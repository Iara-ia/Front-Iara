import Link from 'next/link';

// Home / landing simples. O produto vive em /(painel)/visao-geral.
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <p className="text-terracota font-semibold tracking-widest text-sm">IARA</p>
        <h1 className="mt-2 text-4xl font-bold max-w-2xl">
          Crie e opere influenciadoras virtuais de IA — a IA gera, o humano cura.
        </h1>
        <p className="mt-4 text-ink/70 max-w-xl mx-auto">
          Persona, conteúdo, autonomia, engajamento e monetização em um só lugar. Brasil-first.
        </p>
      </div>
      <Link
        href="/visao-geral"
        className="rounded-md bg-terracota px-6 py-3 text-paper font-medium hover:bg-terracota-dark transition"
      >
        Entrar no painel
      </Link>
      <p className="text-xs text-ink/40">
        Conteúdo gerado por IA · em conformidade com Conar e LGPD
      </p>
    </main>
  );
}

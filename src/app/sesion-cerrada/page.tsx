import Link from "next/link";

export default function SesionCerradaPage() {
  return (
    <main className="container" style={{ paddingBlock: "4rem" }}>
      <section style={{ maxWidth: "42rem", margin: "0 auto", textAlign: "center", display: "grid", gap: "1rem" }}>
        <p className="eyebrow">Sesión finalizada</p>
        <h1>Has cerrado sesión correctamente.</h1>
        <p>
          Tu sesión en Ritual Studio se cerró de forma segura. Puedes volver al inicio o iniciar sesión de nuevo cuando
          lo necesites.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" className="btn btn-primary">
            Ir al inicio
          </Link>
          <Link href="/login" className="btn btn-secondary">
            Iniciar sesión
          </Link>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";

export default function AccountProfilePage() {
  return (
    <section className="container stack-lg">
      <article className="studio-card stack-sm">
        <p className="card-label">Perfil</p>
        <h1>Actualiza tus datos</h1>
        <p>
          Esta sección estará disponible próximamente para editar tu nombre y teléfono desde tu cuenta de Ritual
          Studio.
        </p>
        <Link href="/mi-cuenta" className="btn btn-ghost">
          Volver a mi cuenta
        </Link>
      </article>
    </section>
  );
}

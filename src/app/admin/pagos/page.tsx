import SiteShell from "@/components/site-shell";
import { getCurrentUserProfile, isSuperuserProfile } from "@/lib/supabase/server";
import { getPaymentMode, setPaymentMode } from "@/lib/payment-mode";
import { redirect } from "next/navigation";

async function updatePaymentMode(formData: FormData) {
  "use server";

  const mode = formData.get("mode");
  const { user, profile, isAdmin } = await getCurrentUserProfile();

  if (!user || !isAdmin || !isSuperuserProfile(profile)) {
    throw new Error("No autorizado para cambiar el modo de pagos.");
  }

  if (mode !== "prod" && mode !== "test") {
    throw new Error("Modo inválido.");
  }

  const { error } = await setPaymentMode(mode);

  if (error) {
    throw new Error(`No fue posible actualizar el modo. ${error}`);
  }

  redirect("/admin/pagos");
}

export default async function AdminPaymentsPage() {
  const { user, isAdmin, profile } = await getCurrentUserProfile();

  if (!user || !isAdmin) {
    redirect("/unauthorized");
  }

  const currentMode = await getPaymentMode();
  const isSuperuser = isSuperuserProfile(profile);

  return (
    <SiteShell eyebrow="Administrador" title="Modo de pagos" subtitle="Control de modo test/prod para Mercado Pago.">
      <div className="studio-card">
        <p className="card-label">Estado actual</p>
        <h2>Modo activo: {currentMode === "test" ? "Pruebas" : "Producción"}</h2>
        <p>
          El modo activo define qué variables usa backend para checkout y notification_url: credenciales y webhook de
          test o producción.
        </p>
        <p>
          Solo superusuario puede cambiar este valor. Define usuarios superusuario en la variable
          <code> SUPERUSER_EMAILS</code> (lista separada por comas).
        </p>
        {isSuperuser ? (
          <form action={updatePaymentMode} className="studio-form" style={{ marginTop: 16 }}>
            <label htmlFor="mode">Selecciona el modo:</label>
            <select id="mode" name="mode" defaultValue={currentMode}>
              <option value="test">Pruebas (TEST)</option>
              <option value="prod">Producción (APP_USR)</option>
            </select>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 12 }}>
              Guardar modo de pagos
            </button>
          </form>
        ) : (
          <p className="form-hint">No tienes permisos de superusuario para cambiar el modo.</p>
        )}
      </div>
    </SiteShell>
  );
}

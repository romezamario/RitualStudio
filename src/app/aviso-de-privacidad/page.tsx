import SiteShell from "@/components/site-shell";

export default function AvisoPrivacidadPage() {
  return (
    <SiteShell
      eyebrow="Legal"
      title="Aviso de privacidad"
      subtitle="En esta sección explicamos cómo Ritual Studio recolecta, usa, protege y, en su caso, comparte datos personales de clientes conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento en México."
    >
      <div className="privacy-notice">
        <section className="studio-card">
          <h2>1. Responsable del tratamiento de datos personales</h2>
          <p>
            Ritual Studio by Sol (&ldquo;Ritual Studio&rdquo;) es responsable del tratamiento de los datos personales que recaba por medio
            de formularios, mensajes de WhatsApp y procesos de registro/login en la aplicación.
          </p>
          <p>
            Para cualquier tema relacionado con privacidad y protección de datos, puedes escribir a: <strong>privacidad@ritualstudio.mx</strong>.
          </p>
        </section>

        <section className="studio-card">
          <h2>2. Datos personales que podemos recabar</h2>
          <p>Podemos recabar, de manera directa, las siguientes categorías de datos personales:</p>
          <ul>
            <li>Nombre completo.</li>
            <li>Número de teléfono.</li>
            <li>Correo electrónico.</li>
            <li>Datos de contacto adicionales que compartas voluntariamente en mensajes o formularios.</li>
            <li>Datos de uso de la cuenta (por ejemplo, historial de solicitudes o pedidos dentro de la app).</li>
          </ul>
          <p>
            Ritual Studio no solicita de forma ordinaria datos personales sensibles para operar el servicio comercial principal.
          </p>
        </section>

        <section className="studio-card">
          <h2>3. Finalidades del tratamiento</h2>
          <p>Usamos tus datos personales para las siguientes finalidades primarias:</p>
          <ul>
            <li>Crear y administrar tu cuenta después del registro/login.</li>
            <li>Contactarte para cotizaciones, seguimiento de pedidos y atención al cliente.</li>
            <li>Gestionar entregas, cambios y aclaraciones de servicios o productos contratados.</li>
            <li>Emitir comunicaciones operativas necesarias para cumplir la relación comercial.</li>
          </ul>
          <p>Adicionalmente, podremos usar la información para finalidades secundarias como:</p>
          <ul>
            <li>Mejora de experiencia de usuario y calidad del servicio.</li>
            <li>Envío de novedades, promociones o contenido comercial de Ritual Studio.</li>
          </ul>
          <p>
            Si no deseas que tus datos se usen para finalidades secundarias, puedes solicitarlo por correo a
            <strong> privacidad@ritualstudio.mx</strong>.
          </p>
        </section>

        <section className="studio-card">
          <h2>4. Opciones y medios para limitar uso o divulgación</h2>
          <p>
            Puedes limitar el uso o divulgación de tus datos personales enviando una solicitud al correo de privacidad. Atenderemos
            tu petición en un plazo razonable y te confirmaremos por el mismo medio las acciones aplicadas.
          </p>
        </section>

        <section className="studio-card">
          <h2>5. Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)</h2>
          <p>
            Tienes derecho a acceder, rectificar y cancelar tus datos personales, así como a oponerte al tratamiento de los mismos
            o revocar el consentimiento que nos hayas otorgado, conforme a la LFPDPPP.
          </p>
          <p>Para ejercer tus derechos ARCO, envía una solicitud a <strong>privacidad@ritualstudio.mx</strong> con:</p>
          <ul>
            <li>Nombre del titular y medio para comunicar la respuesta.</li>
            <li>Descripción clara del derecho que deseas ejercer.</li>
            <li>Documentos o datos que ayuden a localizar tu registro en nuestros sistemas.</li>
          </ul>
        </section>

        <section className="studio-card">
          <h2>6. Transferencias de datos</h2>
          <p>
            Ritual Studio no vende datos personales. Solo podremos compartir información con proveedores tecnológicos o aliados
            operativos que apoyen funciones indispensables (por ejemplo, infraestructura de autenticación o mensajería), bajo
            obligaciones de confidencialidad y en la medida necesaria para prestar el servicio.
          </p>
        </section>

        <section className="studio-card">
          <h2>7. Uso de cookies y tecnologías de rastreo</h2>
          <p>
            La aplicación puede utilizar cookies o tecnologías similares para recordar preferencias, mejorar navegación y analizar
            comportamiento de uso. Puedes configurar tu navegador para deshabilitar cookies; sin embargo, algunas funciones podrían
            limitarse.
          </p>
        </section>

        <section className="studio-card">
          <h2>8. Medidas de seguridad</h2>
          <p>
            Implementamos medidas administrativas, técnicas y físicas razonables para proteger tus datos personales contra daño,
            pérdida, alteración, destrucción o uso no autorizado.
          </p>
        </section>

        <section className="studio-card">
          <h2>9. Cambios al aviso de privacidad</h2>
          <p>
            Este aviso de privacidad puede actualizarse por cambios legales, regulatorios o por mejoras internas del servicio.
            Publicaremos cualquier modificación en esta misma página.
          </p>
          <p>
            <strong>Última actualización:</strong> 20 de abril de 2026.
          </p>
        </section>
      </div>
    </SiteShell>
  );
}

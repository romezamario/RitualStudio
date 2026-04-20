"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-context";

type DeliveryAddress = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  exteriorNumber: string;
  interiorNumber?: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  references?: string;
  isDefault: boolean;
};

type AddressDraft = {
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  exteriorNumber: string;
  interiorNumber: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  references: string;
};

const INITIAL_DRAFT: AddressDraft = {
  label: "",
  recipientName: "",
  phone: "",
  street: "",
  exteriorNumber: "",
  interiorNumber: "",
  neighborhood: "",
  city: "",
  state: "",
  postalCode: "",
  references: "",
};

const ADDRESS_BOOK_STORAGE_PREFIX = "ritualstudio.address-book";

function getStorageKey(email?: string) {
  const safeEmail = email?.trim().toLowerCase();
  return safeEmail ? `${ADDRESS_BOOK_STORAGE_PREFIX}.${safeEmail}` : null;
}

function readAddressBook(storageKey: string) {
  const raw = window.localStorage.getItem(storageKey);

  if (!raw) {
    return [] as DeliveryAddress[];
  }

  try {
    const parsed = JSON.parse(raw) as DeliveryAddress[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) => item?.id && item?.recipientName && item?.street);
  } catch {
    return [];
  }
}

function persistAddressBook(storageKey: string, addresses: DeliveryAddress[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(addresses));
}

function formatAddress(address: DeliveryAddress) {
  const ext = address.exteriorNumber ? ` #${address.exteriorNumber}` : "";
  const interior = address.interiorNumber ? ` Int ${address.interiorNumber}` : "";
  return `${address.street}${ext}${interior}, ${address.neighborhood}, ${address.city}, ${address.state}, CP ${address.postalCode}`;
}

export default function AddressBookClient() {
  const { user } = useAuth();
  const storageKey = useMemo(() => getStorageKey(user?.email), [user?.email]);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [draft, setDraft] = useState<AddressDraft>(INITIAL_DRAFT);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!storageKey) {
      setAddresses([]);
      return;
    }

    setAddresses(readAddressBook(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    persistAddressBook(storageKey, addresses);
  }, [addresses, storageKey]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const label = draft.label.trim() || `Dirección ${addresses.length + 1}`;

    const nextAddress: DeliveryAddress = {
      id: crypto.randomUUID(),
      label,
      recipientName: draft.recipientName.trim(),
      phone: draft.phone.trim(),
      street: draft.street.trim(),
      exteriorNumber: draft.exteriorNumber.trim(),
      interiorNumber: draft.interiorNumber.trim(),
      neighborhood: draft.neighborhood.trim(),
      city: draft.city.trim(),
      state: draft.state.trim(),
      postalCode: draft.postalCode.trim(),
      references: draft.references.trim(),
      isDefault: addresses.length === 0,
    };

    setAddresses((current) => [...current, nextAddress]);
    setDraft(INITIAL_DRAFT);
    setFeedback("Dirección guardada correctamente.");
  };

  const removeAddress = (addressId: string) => {
    setAddresses((current) => {
      const next = current.filter((address) => address.id !== addressId);

      if (next.length > 0 && !next.some((address) => address.isDefault)) {
        next[0] = { ...next[0], isDefault: true };
      }

      return [...next];
    });
    setFeedback("Dirección eliminada.");
  };

  const setDefaultAddress = (addressId: string) => {
    setAddresses((current) =>
      current.map((address) => ({
        ...address,
        isDefault: address.id === addressId,
      }))
    );
    setFeedback("Dirección principal actualizada.");
  };

  return (
    <div className="split-panel account-grid">
      <section className="studio-card">
        <p className="card-label">Registro de dirección</p>
        <h2>Agregar dirección de entrega</h2>
        <p>Guarda una o más direcciones para usarla en tus pedidos sin volver a capturarla cada vez.</p>

        <form className="studio-form compact-form" onSubmit={onSubmit}>
          <label>
            Alias de dirección (ej. Casa / Oficina)
            <input
              className="input"
              value={draft.label}
              onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
              placeholder="Casa"
            />
          </label>
          <label>
            Nombre de quien recibe
            <input
              className="input"
              required
              value={draft.recipientName}
              onChange={(event) => setDraft((current) => ({ ...current, recipientName: event.target.value }))}
              placeholder="Nombre completo"
            />
          </label>
          <label>
            Teléfono de contacto
            <input
              className="input"
              required
              value={draft.phone}
              onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
              placeholder="10 dígitos"
            />
          </label>
          <label>
            Calle
            <input
              className="input"
              required
              value={draft.street}
              onChange={(event) => setDraft((current) => ({ ...current, street: event.target.value }))}
            />
          </label>
          <div className="two-columns">
            <label>
              Número exterior
              <input
                className="input"
                required
                value={draft.exteriorNumber}
                onChange={(event) => setDraft((current) => ({ ...current, exteriorNumber: event.target.value }))}
              />
            </label>
            <label>
              Número interior (opcional)
              <input
                className="input"
                value={draft.interiorNumber}
                onChange={(event) => setDraft((current) => ({ ...current, interiorNumber: event.target.value }))}
              />
            </label>
          </div>
          <label>
            Colonia
            <input
              className="input"
              required
              value={draft.neighborhood}
              onChange={(event) => setDraft((current) => ({ ...current, neighborhood: event.target.value }))}
            />
          </label>
          <div className="two-columns">
            <label>
              Ciudad / Municipio
              <input
                className="input"
                required
                value={draft.city}
                onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))}
              />
            </label>
            <label>
              Estado
              <input
                className="input"
                required
                value={draft.state}
                onChange={(event) => setDraft((current) => ({ ...current, state: event.target.value }))}
              />
            </label>
          </div>
          <label>
            Código postal
            <input
              className="input"
              required
              value={draft.postalCode}
              onChange={(event) => setDraft((current) => ({ ...current, postalCode: event.target.value }))}
            />
          </label>
          <label>
            Referencias (opcional)
            <textarea
              className="input textarea"
              value={draft.references}
              onChange={(event) => setDraft((current) => ({ ...current, references: event.target.value }))}
              placeholder="Frente a..., portón color..., etc."
            />
          </label>

          <button type="submit" className="btn btn-primary">
            Guardar dirección
          </button>
        </form>

        {feedback ? <p className="cart-feedback">{feedback}</p> : null}
      </section>

      <section className="studio-card">
        <p className="card-label">Direcciones guardadas</p>
        <h2>Mis direcciones de entrega</h2>
        {addresses.length === 0 ? (
          <p>Aún no tienes direcciones guardadas. Agrega una para usarla en próximos pedidos.</p>
        ) : (
          <div className="address-list">
            {addresses.map((address) => (
              <article key={address.id} className="address-item">
                <div>
                  <p className="address-title">
                    {address.label} {address.isDefault ? <span className="default-chip">Principal</span> : null}
                  </p>
                  <p>{address.recipientName}</p>
                  <p>{address.phone}</p>
                  <p>{formatAddress(address)}</p>
                  {address.references ? <p>Referencia: {address.references}</p> : null}
                </div>
                <div className="address-actions">
                  {!address.isDefault ? (
                    <button type="button" className="btn btn-ghost" onClick={() => setDefaultAddress(address.id)}>
                      Marcar principal
                    </button>
                  ) : null}
                  <button type="button" className="btn btn-ghost" onClick={() => removeAddress(address.id)}>
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

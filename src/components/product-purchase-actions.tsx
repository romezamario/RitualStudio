"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { MarketplaceProduct } from "@/data/marketplace-products";
import { useCart } from "@/components/cart-context";

type ProductPurchaseActionsProps = {
  product: MarketplaceProduct;
};

type DeliveryWindow = "morning" | "afternoon";

type DeliverySlot = {
  dateIso: string;
  dateLabel: string;
  window: DeliveryWindow;
  label: string;
};

const SLOT_START_HOURS: Record<DeliveryWindow, number> = { morning: 8, afternoon: 14 };
const SLOT_LABELS: Record<DeliveryWindow, string> = { morning: "08:00 - 14:00", afternoon: "14:00 - 20:00" };
const MIN_DELIVERY_LEAD_HOURS = 36;
const SLOTS_TO_DISPLAY = 10;

function buildDeliverySlots(now: Date) {
  const minimumAllowed = new Date(now.getTime() + MIN_DELIVERY_LEAD_HOURS * 60 * 60 * 1000);
  const slots: DeliverySlot[] = [];
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);

  const dateFormatter = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Mexico_City",
  });

  while (slots.length < SLOTS_TO_DISPLAY) {
    for (const window of ["morning", "afternoon"] as const) {
      const slotStart = new Date(cursor);
      slotStart.setHours(SLOT_START_HOURS[window], 0, 0, 0);

      if (slotStart >= minimumAllowed) {
        const dateIso = slotStart.toISOString().slice(0, 10);
        const formattedDate = dateFormatter.format(slotStart);
        const dateLabel = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

        slots.push({
          dateIso,
          dateLabel,
          window,
          label: SLOT_LABELS[window],
        });
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return slots;
}

export default function ProductPurchaseActions({ product }: ProductPurchaseActionsProps) {
  const router = useRouter();
  const { addProductToCart } = useCart();
  const [feedback, setFeedback] = useState("");
  const deliverySlots = useMemo(() => buildDeliverySlots(new Date()), []);
  const [selectedSlotKey, setSelectedSlotKey] = useState(deliverySlots[0] ? `${deliverySlots[0].dateIso}-${deliverySlots[0].window}` : "");

  const selectedSlot = deliverySlots.find((slot) => `${slot.dateIso}-${slot.window}` === selectedSlotKey);

  const handleAddToCart = () => {
    addProductToCart({
      product,
      deliveryDateIso: selectedSlot?.dateIso,
      deliveryDateLabel: selectedSlot?.dateLabel,
      deliveryWindowLabel: selectedSlot?.label,
    });
    setFeedback("Producto agregado al carrito");

    window.setTimeout(() => {
      setFeedback("");
    }, 1800);
  };

  const handleBuyNow = () => {
    addProductToCart({
      product,
      deliveryDateIso: selectedSlot?.dateIso,
      deliveryDateLabel: selectedSlot?.dateLabel,
      deliveryWindowLabel: selectedSlot?.label,
    });
    router.push("/checkout");
  };

  return (
    <div className="purchase-actions-wrap">
      <section className="delivery-calendar" aria-label="Calendario de entrega">
        <h3>Selecciona fecha de entrega</h3>
        <p className="delivery-calendar-note">La entrega mínima se habilita con 36 horas de anticipación.</p>

        <div className="delivery-calendar-grid">
          {deliverySlots.map((slot) => {
            const key = `${slot.dateIso}-${slot.window}`;
            const isActive = selectedSlotKey === key;

            return (
              <button
                key={key}
                type="button"
                className={`delivery-slot${isActive ? " is-selected" : ""}`}
                onClick={() => setSelectedSlotKey(key)}
              >
                <span>{slot.dateLabel}</span>
                <strong>{slot.label}</strong>
              </button>
            );
          })}
        </div>

        {selectedSlot ? (
          <p className="delivery-calendar-selection">
            Entrega estimada: <strong>{selectedSlot.dateLabel}</strong> · <strong>{selectedSlot.label}</strong>
          </p>
        ) : null}
      </section>

      <div className="purchase-actions">
        <button type="button" className="btn btn-ghost" onClick={handleAddToCart}>
          Agregar al carrito
        </button>
        <button type="button" className="btn btn-primary" onClick={handleBuyNow}>
          Comprar ahora
        </button>
        {feedback ? <p className="cart-feedback">{feedback}</p> : null}
      </div>
    </div>
  );
}

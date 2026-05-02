"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { MarketplaceProduct } from "@/data/marketplace-products";
import { useCart } from "@/components/cart-context";

type ProductPurchaseActionsProps = {
  product: MarketplaceProduct;
  showDeliveryCalendar?: boolean;
};

type DeliveryWindow = "morning" | "afternoon";

type DeliveryDateOption = {
  dateIso: string;
  dateLabel: string;
};

const SLOT_LABELS: Record<DeliveryWindow, string> = { morning: "08:00 - 14:00", afternoon: "14:00 - 20:00" };
const MIN_DELIVERY_LEAD_HOURS = 36;
const DATES_TO_DISPLAY = 14;

function buildDeliveryDates(now: Date) {
  const minimumAllowed = new Date(now.getTime() + MIN_DELIVERY_LEAD_HOURS * 60 * 60 * 1000);
  const firstAvailableDate = new Date(minimumAllowed);
  firstAvailableDate.setHours(0, 0, 0, 0);

  const options: DeliveryDateOption[] = [];
  const cursor = new Date(firstAvailableDate);

  const dateFormatter = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Mexico_City",
  });

  for (let index = 0; index < DATES_TO_DISPLAY; index += 1) {
    const dateIso = cursor.toISOString().slice(0, 10);
    const formattedDate = dateFormatter.format(cursor);
    const dateLabel = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    options.push({ dateIso, dateLabel });
    cursor.setDate(cursor.getDate() + 1);
  }

  return options;
}

export default function ProductPurchaseActions({ product, showDeliveryCalendar = true }: ProductPurchaseActionsProps) {
  const router = useRouter();
  const { addProductToCart } = useCart();
  const [feedback, setFeedback] = useState("");
  const deliveryDates = useMemo(() => buildDeliveryDates(new Date()), []);
  const [selectedDateIso, setSelectedDateIso] = useState(deliveryDates[0]?.dateIso ?? "");
  const [selectedWindow, setSelectedWindow] = useState<DeliveryWindow>("morning");

  const selectedDate = deliveryDates.find((date) => date.dateIso === selectedDateIso);
  const selectedWindowLabel = SLOT_LABELS[selectedWindow];

  const handleAddToCart = () => {
    addProductToCart({
      product,
      deliveryDateIso: selectedDate?.dateIso,
      deliveryDateLabel: selectedDate?.dateLabel,
      deliveryWindowLabel: selectedWindowLabel,
    });
    setFeedback("Producto agregado al carrito");

    window.setTimeout(() => {
      setFeedback("");
    }, 1800);
  };

  const handleBuyNow = () => {
    addProductToCart({
      product,
      deliveryDateIso: selectedDate?.dateIso,
      deliveryDateLabel: selectedDate?.dateLabel,
      deliveryWindowLabel: selectedWindowLabel,
    });
    router.push("/checkout");
  };

  return (
    <div className="purchase-actions-wrap">
      {showDeliveryCalendar ? (
        <section className="delivery-calendar" aria-label="Calendario de entrega">
          <h3>Selecciona fecha de entrega</h3>
          <p className="delivery-calendar-note">La entrega mínima se habilita con 36 horas de anticipación.</p>

          <div className="delivery-calendar-grid">
            {deliveryDates.map((date) => {
              const isActive = selectedDateIso === date.dateIso;

              return (
                <button
                  key={date.dateIso}
                  type="button"
                  className={`delivery-slot${isActive ? " is-selected" : ""}`}
                  onClick={() => setSelectedDateIso(date.dateIso)}
                >
                  <span>{date.dateLabel}</span>
                </button>
              );
            })}
          </div>

          <label className="delivery-time-picker">
            <span>Selecciona tiempo de entrega</span>
            <select value={selectedWindow} onChange={(event) => setSelectedWindow(event.target.value as DeliveryWindow)}>
              <option value="morning">{SLOT_LABELS.morning}</option>
              <option value="afternoon">{SLOT_LABELS.afternoon}</option>
            </select>
          </label>

          {selectedDate ? (
            <p className="delivery-calendar-selection">
              Entrega estimada: <strong>{selectedDate.dateLabel}</strong> · <strong>{selectedWindowLabel}</strong>
            </p>
          ) : null}
        </section>
      ) : null}

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

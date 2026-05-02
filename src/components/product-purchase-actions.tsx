"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MarketplaceProduct } from "@/data/marketplace-products";
import { useCart } from "@/components/cart-context";

type ProductPurchaseActionsProps = {
  product: MarketplaceProduct;
  showDeliveryCalendar?: boolean;
  showMarketplaceLink?: boolean;
  deliveryDatesToDisplay?: number;
};

type DeliveryWindow = "morning" | "afternoon";

const SLOT_LABELS: Record<DeliveryWindow, string> = { morning: "08:00 - 14:00", afternoon: "14:00 - 20:00" };
const MIN_DELIVERY_LEAD_HOURS = 36;
const DEFAULT_DATES_TO_DISPLAY = 14;
const DELIVERY_TIMEZONE = "America/Mexico_City";

function buildDeliveryDates(now: Date, datesToDisplay: number) {
  const minimumAllowed = new Date(now.getTime() + MIN_DELIVERY_LEAD_HOURS * 60 * 60 * 1000);
  const firstAvailableDate = new Date(minimumAllowed);
  firstAvailableDate.setHours(0, 0, 0, 0);

  const options: string[] = [];
  const cursor = new Date(firstAvailableDate);

  const dateFormatter = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: DELIVERY_TIMEZONE,
  });

    const safeDatesToDisplay = Number.isFinite(datesToDisplay) && datesToDisplay > 0 ? Math.trunc(datesToDisplay) : DEFAULT_DATES_TO_DISPLAY;

  for (let index = 0; index < safeDatesToDisplay; index += 1) {
    const dateIso = cursor.toISOString().slice(0, 10);
    options.push(dateIso);
    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    options,
    dateFormatter,
  };
}

export default function ProductPurchaseActions({
  product,
  showDeliveryCalendar = true,
  showMarketplaceLink = false,
  deliveryDatesToDisplay = DEFAULT_DATES_TO_DISPLAY,
}: ProductPurchaseActionsProps) {
  const router = useRouter();
  const { addProductToCart } = useCart();
  const [feedback, setFeedback] = useState("");
  const weekdayFormatter = useMemo(
    () => new Intl.DateTimeFormat("es-MX", { weekday: "short", timeZone: DELIVERY_TIMEZONE }),
    [],
  );
  const dayFormatter = useMemo(
    () => new Intl.DateTimeFormat("es-MX", { day: "numeric", timeZone: DELIVERY_TIMEZONE }),
    [],
  );
  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat("es-MX", { month: "short", timeZone: DELIVERY_TIMEZONE }),
    [],
  );
  const { options: deliveryDates, dateFormatter } = useMemo(
    () => buildDeliveryDates(new Date(), deliveryDatesToDisplay),
    [deliveryDatesToDisplay],
  );
  const [selectedDateIso, setSelectedDateIso] = useState(deliveryDates[0] ?? "");
  const [selectedWindow, setSelectedWindow] = useState<DeliveryWindow>("morning");

  const selectedDate = deliveryDates.find((dateIso) => dateIso === selectedDateIso);
  const selectedDateLabel = selectedDate
    ? (() => {
        const [year, month, day] = selectedDate.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        const formatted = dateFormatter.format(date);
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
      })()
    : "";
  const selectedWindowLabel = SLOT_LABELS[selectedWindow];
  const deliveryDateCards = deliveryDates.map((dateIso) => {
    const [year, month, day] = dateIso.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return {
      iso: dateIso,
      weekday: weekdayFormatter.format(date),
      day: dayFormatter.format(date),
      month: monthFormatter.format(date),
    };
  });

  const handleAddToCart = () => {
    addProductToCart({
      product,
      deliveryDateIso: selectedDate,
      deliveryDateLabel: selectedDateLabel,
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
      deliveryDateIso: selectedDate,
      deliveryDateLabel: selectedDateLabel,
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

          <label className="delivery-date-picker">
            <span>Selecciona día de entrega</span>
            <div className="delivery-date-cards" role="radiogroup" aria-label="Selecciona día de entrega">
              {deliveryDateCards.map((dateCard) => {
                const isSelected = dateCard.iso === selectedDateIso;

                return (
                  <button
                    key={dateCard.iso}
                    type="button"
                    className={isSelected ? "delivery-date-card is-selected" : "delivery-date-card"}
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedDateIso(dateCard.iso)}
                  >
                    <span>{dateCard.weekday.replace(".", "")}</span>
                    <strong>{dateCard.day}</strong>
                    <small>{dateCard.month.replace(".", "")}</small>
                  </button>
                );
              })}
            </div>
          </label>

          <label className="delivery-time-picker">
            <span>Selecciona tiempo de entrega</span>
            <select value={selectedWindow} onChange={(event) => setSelectedWindow(event.target.value as DeliveryWindow)}>
              <option value="morning">{SLOT_LABELS.morning}</option>
              <option value="afternoon">{SLOT_LABELS.afternoon}</option>
            </select>
          </label>

          {selectedDateLabel ? (
            <p className="delivery-calendar-selection">
              Entrega estimada: <strong>{selectedDateLabel}</strong> · <strong>{selectedWindowLabel}</strong>
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="purchase-actions">
        {showMarketplaceLink ? (
          <Link href="/marketplace" className="btn btn-ghost">
            Volver al marketplace
          </Link>
        ) : null}
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

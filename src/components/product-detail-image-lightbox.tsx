"use client";

import Image from "next/image";
import { useState } from "react";

type ProductDetailImageLightboxProps = {
  imageSrc: string;
  imageAlt: string;
  sizes?: string;
  priority?: boolean;
};

export default function ProductDetailImageLightbox({
  imageSrc,
  imageAlt,
  sizes = "(max-width: 900px) 100vw, 48vw",
  priority = false,
}: ProductDetailImageLightboxProps) {
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  return (
    <>
      <button
        type="button"
        className="product-detail-image-wrap product-detail-image-trigger"
        onClick={() => setIsImageExpanded(true)}
        aria-label={`Abrir imagen completa de ${imageAlt}`}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={1400}
          height={1000}
          className="product-detail-image"
          sizes={sizes}
          priority={priority}
        />
      </button>

      {isImageExpanded ? (
        <div
          className="product-image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Imagen completa de ${imageAlt}`}
          onClick={() => setIsImageExpanded(false)}
        >
          <button
            type="button"
            className="product-image-lightbox-close"
            onClick={() => setIsImageExpanded(false)}
            aria-label="Cerrar imagen completa"
          >
            ×
          </button>
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={1600}
            height={1200}
            className="product-image-lightbox-content"
            sizes="100vw"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}

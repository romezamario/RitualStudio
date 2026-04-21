export type MarketplaceProduct = {
  slug: string;
  name: string;
  category: "Ramos" | "Centros de mesa" | "Eventos" | "Regalos";
  price: string;
  image: string;
  shortDescription: string;
  description: string;
  size: string;
  flowers: string[];
  idealFor: string[];
  delivery: string;
};

export const marketplaceProducts: MarketplaceProduct[] = [
  {
    slug: "ramo-luna-rosada",
    name: "Ramo Luna Rosada",
    category: "Ramos",
    price: "$1,650 MXN",
    image:
      "https://images.unsplash.com/photo-1470509037663-253afd7f0f51?auto=format&fit=crop&w=1200&q=80",
    shortDescription: "Rosas blush, lisianthus y eucalipto en lectura suave para regalo editorial.",
    description:
      "Composición en espiral de tonos rosados con acentos verdes para un gesto elegante y contemporáneo. Incluye envoltura textil premium.",
    size: "Mediano (45 cm de alto aprox.)",
    flowers: ["Rosa de jardín", "Lisianthus", "Eucalipto"],
    idealFor: ["Aniversario", "Cumpleaños", "Regalo corporativo"],
    delivery: "Entrega el mismo día en ciudades con cobertura express (pedido antes de 1:00 p.m.)."
  },
  {
    slug: "ramo-atelier-marfil",
    name: "Ramo Atelier Marfil",
    category: "Ramos",
    price: "$1,980 MXN",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80",
    shortDescription: "Paleta marfil con textura escultórica para interiores sobrios.",
    description:
      "Diseño monocromático con flores en diferentes aperturas para crear profundidad visual. Ideal para espacios minimalistas.",
    size: "Grande (55 cm de alto aprox.)",
    flowers: ["Rosa crema", "Clavel premium", "Ammi majus"],
    idealFor: ["Casa nueva", "Agradecimiento", "Lobby boutique"],
    delivery: "Programación con 24 horas de anticipación según zona de cobertura."
  },
  {
    slug: "centro-bruma",
    name: "Centro Bruma",
    category: "Centros de mesa",
    price: "$2,450 MXN",
    image:
      "https://images.unsplash.com/photo-1526394931762-36a3e30d4e41?auto=format&fit=crop&w=1200&q=80",
    shortDescription: "Centro bajo para comedor con textura orgánica y vela opcional.",
    description:
      "Arreglo horizontal pensado para mesas de conversación. Combina tonos arena y humo con follajes fluidos.",
    size: "60 cm de largo aprox.",
    flowers: ["Dalia estacional", "Rosa spray", "Follaje olivo"],
    idealFor: ["Cena especial", "Airbnb premium", "Restaurante"],
    delivery: "Entrega y montaje ligero en sitio según disponibilidad de cobertura."
  },
  {
    slug: "centro-editorial",
    name: "Centro Editorial",
    category: "Centros de mesa",
    price: "$3,200 MXN",
    image:
      "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=1200&q=80",
    shortDescription: "Composición protagonista para mesas largas y experiencias privadas.",
    description:
      "Diseño modular de tres piezas que permite distribuir volumen a lo largo de la mesa y mantener visibilidad entre invitados.",
    size: "Set de 3 módulos de 30 cm",
    flowers: ["Garden roses", "Ranúnculo", "Verdes de temporada"],
    idealFor: ["Cena privada", "Lanzamiento de marca", "Mesa de novios"],
    delivery: "Incluye montaje y retiro opcional bajo cotización."
  },
  {
    slug: "evento-ritual-civil",
    name: "Pack Ritual Civil",
    category: "Eventos",
    price: "Desde $8,900 MXN",
    image:
      "https://images.unsplash.com/photo-1468327768560-75b778cbb551?auto=format&fit=crop&w=1200&q=80",
    shortDescription: "Flores clave para ceremonia civil íntima de hasta 30 invitados.",
    description:
      "Incluye bouquet principal, boutonnieres, dos arreglos de ceremonia y señalética floral sutil para fotografías.",
    size: "Cobertura esencial",
    flowers: ["Flor premium según temporada", "Texturas botánicas"],
    idealFor: ["Boda civil", "Elopement", "Ceremonia íntima"],
    delivery: "Visita técnica previa y montaje en horario pactado."
  },
  {
    slug: "evento-brand-pop-up",
    name: "Pack Brand Pop-up",
    category: "Eventos",
    price: "Desde $12,500 MXN",
    image:
      "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=1200&q=80",
    shortDescription: "Ambientación floral para activaciones comerciales y vitrinas.",
    description:
      "Dirección creativa y producción floral para espacios de marca. Enfoque en fotogenia y permanencia del montaje.",
    size: "Cobertura media",
    flowers: ["Base seca + flor fresca", "Elementos de montaje"],
    idealFor: ["Pop-up store", "PR event", "Escaparate"],
    delivery: "Incluye traslado, montaje y desmontaje básico según ciudad y logística."
  },
  {
    slug: "regalo-ritual-box",
    name: "Ritual Gift Box",
    category: "Regalos",
    price: "$1,350 MXN",
    image:
      "https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?auto=format&fit=crop&w=1200&q=80",
    shortDescription: "Mini arreglo + vela artesanal + tarjeta caligrafiada.",
    description:
      "Caja curada para obsequio inmediato con experiencia completa de unboxing y mensaje personalizado.",
    size: "Caja 30 x 22 cm",
    flowers: ["Mini bouquet estacional", "Vela de soya"],
    idealFor: ["Agradecimiento", "Regalo ejecutivo", "Autocuidado"],
    delivery: "Entrega local en franjas de 3 horas."
  },
  {
    slug: "regalo-florero-ceramica",
    name: "Set Florero + Flores",
    category: "Regalos",
    price: "$2,150 MXN",
    image:
      "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=1200&q=80",
    shortDescription: "Florero de cerámica artesanal con arreglo listo para exhibir.",
    description:
      "Propuesta de regalo duradero que combina objeto decorativo y composición floral diseñada para durar varios días.",
    size: "Florero 26 cm + arreglo",
    flowers: ["Rosas premium", "Astilbe", "Follaje mixto"],
    idealFor: ["Inauguración", "Regalo de pareja", "Home styling"],
    delivery: "Disponible con envío local y empaque reforzado."
  }
];

export const marketplaceCategories = Array.from(new Set(marketplaceProducts.map((product) => product.category)));

export function getMarketplaceProductBySlug(slug: string) {
  return marketplaceProducts.find((product) => product.slug === slug);
}

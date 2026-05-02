export type DeliveryAddress = {
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

export type AddressDraft = {
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

export const INITIAL_ADDRESS_DRAFT: AddressDraft = {
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

export function getAddressBookStorageKey(email?: string) {
  const safeEmail = email?.trim().toLowerCase();
  return safeEmail ? `${ADDRESS_BOOK_STORAGE_PREFIX}.${safeEmail}` : null;
}

export function readAddressBook(storageKey: string) {
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

export function persistAddressBook(storageKey: string, addresses: DeliveryAddress[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(addresses));
}

export function formatDeliveryAddress(address: DeliveryAddress) {
  const ext = address.exteriorNumber ? ` #${address.exteriorNumber}` : "";
  const interior = address.interiorNumber ? ` Int ${address.interiorNumber}` : "";
  return `${address.street}${ext}${interior}, ${address.neighborhood}, ${address.city}, ${address.state}, CP ${address.postalCode}`;
}

export function addressDraftToDeliveryAddress(draft: AddressDraft, labelFallbackIndex: number): DeliveryAddress {
  const label = draft.label.trim() || `Dirección ${labelFallbackIndex}`;

  return {
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
    isDefault: false,
  };
}

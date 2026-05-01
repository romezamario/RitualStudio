export type MercadoPagoEnvType = "test" | "prod";

export type MercadoPagoEnvValidationResult = {
  env: MercadoPagoEnvType;
  publicKey: string;
  accessToken: string;
  publicKeyPrefix: string;
  accessTokenPrefix: string;
  publicKeyLength: number;
  accessTokenLength: number;
};

type ValidateMercadoPagoEnvInput = {
  publicKey?: string;
  accessToken?: string;
};

const INVALID_ENV_ERROR =
  "Configuración inválida de Mercado Pago: las credenciales no pertenecen al mismo entorno (test/prod).";

function sanitize(rawValue?: string) {
  if (!rawValue) return "";
  return rawValue.trim().replace(/^['"]|['"]$/g, "").replace(/^Bearer[:\s]+/i, "").trim();
}

function detectMpEnv(value: string): MercadoPagoEnvType | null {
  if (/^TEST-/i.test(value)) return "test";
  if (/^APP_USR-/i.test(value)) return "prod";
  return null;
}

function safePrefix(value: string) {
  return value ? value.slice(0, 7) : "missing";
}

export function validateMercadoPagoEnv(input?: ValidateMercadoPagoEnvInput): MercadoPagoEnvValidationResult {
  const publicKey = sanitize(input?.publicKey ?? process.env.NEXT_PUBLIC_MP_PUBLIC_KEY);
  const accessToken = sanitize(input?.accessToken ?? process.env.MP_ACCESS_TOKEN);

  if (!publicKey || !accessToken) {
    throw new Error(
      "Configuración inválida de Mercado Pago: faltan variables requeridas (NEXT_PUBLIC_MP_PUBLIC_KEY y/o MP_ACCESS_TOKEN).",
    );
  }

  const publicKeyEnv = detectMpEnv(publicKey);
  const accessTokenEnv = detectMpEnv(accessToken);

  if (!publicKeyEnv || !accessTokenEnv || publicKeyEnv !== accessTokenEnv) {
    throw new Error(INVALID_ENV_ERROR);
  }

  const result: MercadoPagoEnvValidationResult = {
    env: publicKeyEnv,
    publicKey,
    accessToken,
    publicKeyPrefix: safePrefix(publicKey),
    accessTokenPrefix: safePrefix(accessToken),
    publicKeyLength: publicKey.length,
    accessTokenLength: accessToken.length,
  };

  console.info("[mercadopago-env] validated", {
    env: result.env,
    publicKeyPrefix: result.publicKeyPrefix,
    accessTokenPrefix: result.accessTokenPrefix,
    publicKeyLength: result.publicKeyLength,
    accessTokenLength: result.accessTokenLength,
  });

  return result;
}

export function detectPublicKeyEnvironment(publicKey?: string): MercadoPagoEnvType | null {
  return detectMpEnv(sanitize(publicKey));
}

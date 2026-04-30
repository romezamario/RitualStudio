import { handleWebhook } from "../route";

export async function POST(request: Request) {
  return handleWebhook(request, "prod");
}

export async function GET() {
  return Response.json({ ok: true, environment: "prod" });
}

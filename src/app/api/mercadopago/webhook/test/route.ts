import { handleWebhook } from "../route";

export async function POST(request: Request) {
  return handleWebhook(request, "test");
}

export async function GET() {
  return Response.json({ ok: true, environment: "test" });
}

import { NextResponse } from "next/server";
import os from "node:os";

const startedAt = Date.now();

function uptimeSeconds() {
  return Math.round((Date.now() - startedAt) / 1000);
}

export async function GET() {
  const status = {
    status: "ok",
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown",
    uptime_seconds: uptimeSeconds(),
    host: os.hostname(),
    timestamp: new Date().toISOString(),
    checks: {
      api: process.env.NEXT_PUBLIC_API_BASE_URL ? "configured" : "missing",
      stripe: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "configured" : "missing",
      locale_support: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? "en",
    },
  } as const;

  return NextResponse.json(status, { status: 200 });
}

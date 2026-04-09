import { NextResponse } from "next/server";

import { getConfigHealth } from "@/lib/env";

export async function GET() {
  const health = getConfigHealth();

  return NextResponse.json(health, {
    status: health.ok ? 200 : 503
  });
}

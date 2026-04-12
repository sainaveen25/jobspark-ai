import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";

const paramsSchema = z.object({
  id: z.string().uuid()
});

export async function DELETE(request: Request, context: { params: { id: string } }) {
  try {
    const { admin, userId } = await requireApiUser(request);
    const { id } = paramsSchema.parse(context.params);

    unwrapSupabaseResult(
      await admin.from("skills").delete().eq("id", id).eq("user_id", userId),
      "Unable to delete skill"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete skill" }, { status: 400 });
  }
}

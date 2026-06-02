import { NextResponse } from "next/server";
import { executeQuery, generatePresignedUrl } from "@/lib/snowflake";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const rows = await executeQuery<Record<string, unknown>>(
      `SELECT click_script_stage_path FROM DEMO_PORTAL.PUBLIC.DEMOS WHERE id = ?`,
      [parseInt(id)]
    );

    if (rows.length === 0 || !rows[0].CLICK_SCRIPT_STAGE_PATH) {
      return NextResponse.json({ error: "No script available" }, { status: 404 });
    }

    const url = await generatePresignedUrl(
      rows[0].CLICK_SCRIPT_STAGE_PATH as string,
      "DEMO_PORTAL.PUBLIC.SCRIPTS_STAGE"
    );

    return NextResponse.redirect(url);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

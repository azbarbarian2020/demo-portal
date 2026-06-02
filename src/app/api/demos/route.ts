import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/snowflake";
import { Demo } from "@/lib/types";

export async function GET() {
  try {
    const rows = await executeQuery<Record<string, unknown>>(
      `SELECT id, name, description, short_description, thumbnail_stage_path,
              entry_url, demo_type, topics, capabilities,
              click_script_stage_path, video_url, status, sort_order,
              created_at, updated_at, created_by
       FROM DEMO_PORTAL.PUBLIC.DEMOS
       ORDER BY sort_order ASC, created_at DESC`
    );

    const demos: Demo[] = rows.map((row) => {
      const thumbPath = row.THUMBNAIL_STAGE_PATH as string | null;
      const thumbnail_url = thumbPath
        ? `/api/image?path=${encodeURIComponent(thumbPath)}`
        : undefined;

      return {
        id: row.ID as number,
        name: row.NAME as string,
        description: row.DESCRIPTION as string,
        short_description: row.SHORT_DESCRIPTION as string,
        thumbnail_stage_path: thumbPath,
        thumbnail_url,
        entry_url: row.ENTRY_URL as string,
        demo_type: row.DEMO_TYPE as "SPCS" | "STREAMLIT",
        topics: (row.TOPICS as string[]) || [],
        capabilities: (row.CAPABILITIES as string[]) || [],
        click_script_stage_path: row.CLICK_SCRIPT_STAGE_PATH as string | null,
        video_url: row.VIDEO_URL as string | null,
        status: row.STATUS as "PUBLISHED" | "DRAFT" | "DISABLED",
        sort_order: row.SORT_ORDER as number,
        created_at: row.CREATED_AT as string,
        updated_at: row.UPDATED_AT as string,
        created_by: row.CREATED_BY as string | null,
      };
    });

    return NextResponse.json(demos);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name, description, short_description, entry_url, demo_type,
      topics, capabilities, thumbnail_stage_path, click_script_stage_path,
      video_url, status, sort_order,
    } = body;

    await executeQuery(
      `INSERT INTO DEMO_PORTAL.PUBLIC.DEMOS
        (name, description, short_description, entry_url, demo_type,
         topics, capabilities, thumbnail_stage_path, click_script_stage_path,
         video_url, status, sort_order, created_by)
       SELECT ?, ?, ?, ?, ?, PARSE_JSON(?), PARSE_JSON(?), ?, ?, ?, ?, ?, 'ADMIN'`,
      [
        name,
        description || null,
        short_description || null,
        entry_url,
        demo_type || "SPCS",
        JSON.stringify(topics || []),
        JSON.stringify(capabilities || []),
        thumbnail_stage_path || null,
        click_script_stage_path || null,
        video_url || null,
        status || "PUBLISHED",
        sort_order || 0,
      ]
    );

    const inserted = await executeQuery<{ ID: number }>(
      `SELECT MAX(id) AS ID FROM DEMO_PORTAL.PUBLIC.DEMOS WHERE name = ?`,
      [name]
    );

    return NextResponse.json({ id: inserted[0]?.ID, success: true }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

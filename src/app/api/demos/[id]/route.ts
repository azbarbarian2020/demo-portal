import { NextResponse } from "next/server";
import { executeQuery, generatePresignedUrl } from "@/lib/snowflake";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const rows = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM DEMO_PORTAL.PUBLIC.DEMOS WHERE id = ?`,
      [parseInt(id)]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const row = rows[0];
    let thumbnail_url: string | undefined;
    const thumbPath = row.THUMBNAIL_STAGE_PATH as string | null;
    if (thumbPath) {
      try {
        thumbnail_url = await generatePresignedUrl(thumbPath, "DEMO_PORTAL.PUBLIC.IMAGES_STAGE");
      } catch {
        thumbnail_url = undefined;
      }
    }

    return NextResponse.json({
      id: row.ID,
      name: row.NAME,
      description: row.DESCRIPTION,
      short_description: row.SHORT_DESCRIPTION,
      thumbnail_stage_path: thumbPath,
      thumbnail_url,
      entry_url: row.ENTRY_URL,
      demo_type: row.DEMO_TYPE,
      topics: row.TOPICS || [],
      capabilities: row.CAPABILITIES || [],
      click_script_stage_path: row.CLICK_SCRIPT_STAGE_PATH,
      video_url: row.VIDEO_URL,
      status: row.STATUS,
      sort_order: row.SORT_ORDER,
      created_at: row.CREATED_AT,
      updated_at: row.UPDATED_AT,
      created_by: row.CREATED_BY,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await executeQuery(
      `DELETE FROM DEMO_PORTAL.PUBLIC.DEMOS WHERE id = ?`,
      [parseInt(id)]
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    const updatable = [
      "name", "description", "short_description", "entry_url", "demo_type",
      "thumbnail_stage_path", "click_script_stage_path", "video_url", "status", "sort_order",
    ];

    for (const field of updatable) {
      if (body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (body.topics !== undefined) {
      fields.push("topics = PARSE_JSON(?)");
      values.push(JSON.stringify(body.topics));
    }
    if (body.capabilities !== undefined) {
      fields.push("capabilities = PARSE_JSON(?)");
      values.push(JSON.stringify(body.capabilities));
    }

    fields.push("updated_at = CURRENT_TIMESTAMP()");
    values.push(parseInt(id));

    await executeQuery(
      `UPDATE DEMO_PORTAL.PUBLIC.DEMOS SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

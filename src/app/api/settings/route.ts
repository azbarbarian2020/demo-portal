import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/snowflake";

export async function GET() {
  try {
    const rows = await executeQuery<Record<string, unknown>>(
      `SELECT key, value FROM DEMO_PORTAL.PUBLIC.SETTINGS WHERE key IN ('topics', 'capabilities')`
    );

    const settings: Record<string, string[]> = { topics: [], capabilities: [] };
    for (const row of rows) {
      const key = row.KEY as string;
      const value = row.VALUE;
      if (key === "topics" || key === "capabilities") {
        settings[key] = Array.isArray(value) ? value : JSON.parse(value as string);
      }
    }

    return NextResponse.json(settings);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { topics, capabilities } = body;

    if (topics !== undefined) {
      await executeQuery(
        `MERGE INTO DEMO_PORTAL.PUBLIC.SETTINGS t
         USING (SELECT 'topics' AS key) s ON t.key = s.key
         WHEN MATCHED THEN UPDATE SET value = PARSE_JSON('${JSON.stringify(topics).replace(/'/g, "''")}')
         WHEN NOT MATCHED THEN INSERT (key, value) VALUES ('topics', PARSE_JSON('${JSON.stringify(topics).replace(/'/g, "''")}'))`
      );
    }

    if (capabilities !== undefined) {
      await executeQuery(
        `MERGE INTO DEMO_PORTAL.PUBLIC.SETTINGS t
         USING (SELECT 'capabilities' AS key) s ON t.key = s.key
         WHEN MATCHED THEN UPDATE SET value = PARSE_JSON('${JSON.stringify(capabilities).replace(/'/g, "''")}')
         WHEN NOT MATCHED THEN INSERT (key, value) VALUES ('capabilities', PARSE_JSON('${JSON.stringify(capabilities).replace(/'/g, "''")}'))`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

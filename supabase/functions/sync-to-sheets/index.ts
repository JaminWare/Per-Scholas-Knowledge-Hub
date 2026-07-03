import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Supabase Database Webhook sends the full event envelope.
    // Shape: { type, table, schema, record, old_record }
    const body = await req.json();

    // Only process INSERT events on the submissions table.
    if (body.type !== "INSERT" || body.table !== "submissions") {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Not an INSERT on submissions." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const record = body.record as {
      id: string;
      full_name: string;
      track: string;
      badge: string;
      title: string;
      content: string;
      media_link?: string;
      created_at: string;
    };

    // Forward the flat record to the Google Apps Script Web App.
    const sheetsResponse = await fetch(sheetsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });

    const sheetsText = await sheetsResponse.text();

    if (!sheetsResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Google Sheets relay failed.", detail: sheetsText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, sheets_response: sheetsText }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TIMEOUT_MS = 8000;
const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);

function isBlockedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (BLOCKED_HOSTS.has(parsed.hostname)) return true;
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:")
      return true;
    // Block private IP ranges
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(parsed.hostname))
      return true;
    return false;
  } catch {
    return true;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ reachable: false, status: null, error: "Missing url" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (isBlockedUrl(url)) {
      return new Response(
        JSON.stringify({ reachable: false, status: null, error: "Blocked host" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let status: number | null = null;
    let reachable = false;
    let error: string | undefined;
    let corsBlocked = false;

    try {
      // Try HEAD first
      const headRes = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "LKB-LinkValidator/1.0",
        },
      });
      status = headRes.status;
      reachable = headRes.status >= 200 && headRes.status < 400;

      // If HEAD returns 405, fall back to GET
      if (headRes.status === 405) {
        const getRes = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          redirect: "follow",
          headers: {
            "User-Agent": "LKB-LinkValidator/1.0",
          },
        });
        status = getRes.status;
        reachable = getRes.status >= 200 && getRes.status < 400;
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        error = "Timeout";
      } else if (e.message?.includes("NetworkError") || e.message?.includes("CORS")) {
        corsBlocked = true;
        error = "CORS Suspected";
      } else {
        error = e.message ?? "Request failed";
      }
    } finally {
      clearTimeout(timeout);
    }

    return new Response(
      JSON.stringify({ reachable, status, error, corsBlocked }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ reachable: false, status: null, error: e?.message ?? "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

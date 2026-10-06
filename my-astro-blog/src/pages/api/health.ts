import type { APIRoute } from "astro";
import process from "node:process";

export const GET: APIRoute = async () => {
    return new Response(
        JSON.stringify({
            status: "ok",
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        }),
        { headers: { "Content-Type": "application/json" }, }
    );
};  
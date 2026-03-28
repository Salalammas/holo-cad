import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Astra, a holographic CAD assistant. Keep responses under 8 words. Use function calling to control the 3D model state when the user asks to change it.`;

const tools = [
  {
    type: "function",
    function: {
      name: "setRotation",
      description: "Rotate the 3D model to a specific angle on an axis",
      parameters: {
        type: "object",
        properties: {
          axis: { type: "string", enum: ["x", "y", "z"], description: "Axis to rotate around" },
          degrees: { type: "number", description: "Rotation angle in degrees" },
        },
        required: ["axis", "degrees"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "setColor",
      description: "Change the color of the 3D model",
      parameters: {
        type: "object",
        properties: {
          hexCode: { type: "string", description: "Hex color code like #ff0000" },
        },
        required: ["hexCode"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "toggleWireframe",
      description: "Toggle wireframe rendering on or off",
      parameters: {
        type: "object",
        properties: {
          enabled: { type: "boolean", description: "true for wireframe, false for solid" },
        },
        required: ["enabled"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "resetView",
      description: "Reset the 3D model to its default view, rotation, color, and scale",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, modelState } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return new Response(
        JSON.stringify({ error: "transcript is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userContent = modelState
      ? `[Current model state: ${JSON.stringify(modelState)}]\n\nUser says: "${transcript}"`
      : `User says: "${transcript}"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        tools,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please wait and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI request failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;

    const result: Record<string, unknown> = {
      text: message?.content || "",
      commands: [] as Array<{ name: string; args: Record<string, unknown> }>,
    };

    if (message?.tool_calls) {
      for (const tc of message.tool_calls) {
        if (tc.type === "function") {
          let args = {};
          try {
            args = JSON.parse(tc.function.arguments);
          } catch { /* empty */ }
          (result.commands as Array<{ name: string; args: Record<string, unknown> }>).push({
            name: tc.function.name,
            args,
          });
        }
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("astra-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

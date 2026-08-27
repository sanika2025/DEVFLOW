// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, sessionId, message } = await req.json();
    
    // Fallback Mock AI Response if no real API logic is hooked up
    // In a real scenario, you'd use OPENAI_API_KEY from Deno.env.get('OPENAI_API_KEY')
    let aiResponse = "";
    
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes("react")) {
      aiResponse = "React is a fantastic choice for building UIs! Remember to keep your components small, use hooks for state and side-effects, and try not to mutate state directly. Have you practiced using `useEffect` lately?";
    } else if (lowerMsg.includes("interview")) {
      aiResponse = "For technical interviews, I recommend starting with clarifying questions, speaking your thought process aloud, and writing clean, modular code. Let's do a mock question: 'How would you design a rate limiter?'";
    } else if (lowerMsg.includes("debug")) {
      aiResponse = "Debugging can be tricky! Try isolating the component. Have you checked what your state looks like right before the bug occurs? A simple `console.log` can sometimes work wonders.";
    } else {
      aiResponse = "That's a great point! As your AI mentor, I'd say consistency is key. Keep pushing forward with your learning roadmap. What specific challenge are you tackling with that right now?";
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

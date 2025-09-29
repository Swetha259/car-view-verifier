import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, expectedView } = await req.json();
    
    if (!imageBase64 || !expectedView) {
      return new Response(
        JSON.stringify({ error: 'Missing imageBase64 or expectedView' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Use Lovable AI to classify the car view
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an automotive image classifier. Analyze car images and determine the view angle.
            
            Respond with ONLY one of these exact view types:
            - "front" - front view of the car showing headlights, grille, front bumper
            - "back" - rear view showing taillights, rear bumper, license plate area
            - "side" - side profile of the car (either left or right side is acceptable)
            - "top" - top-down view of the car showing roof, hood, trunk
            
            If the image is unclear, damaged, or doesn't show a car, respond with "unknown".
            
            Respond with only the view type, nothing else.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'What view angle is this car image showing?'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        max_tokens: 10
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI classification failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const detectedView = data.choices[0]?.message?.content?.trim().toLowerCase();
    
    console.log(`Expected: ${expectedView}, Detected: ${detectedView}`);
    
    // Check if the detected view matches expected view
    const isMatch = detectedView === expectedView.toLowerCase();
    
    return new Response(
      JSON.stringify({
        detectedView,
        expectedView: expectedView.toLowerCase(),
        isMatch,
        confidence: detectedView === 'unknown' ? 0 : (isMatch ? 0.95 : 0.85)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in classify-car-view function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
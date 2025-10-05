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

    // First, validate the view type
    const validateResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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

    if (!validateResponse.ok) {
      const errorText = await validateResponse.text();
      console.error('OpenAI validation error:', validateResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Image validation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validateData = await validateResponse.json();
    const detectedView = validateData.choices[0]?.message?.content?.trim().toLowerCase();
    
    // Analyze image quality
    const qualityResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `You are an automotive image quality expert specializing in vehicle inspection photos.
            
            Analyze the image for:
            1. Motion blur or camera shake - Check if car edges, text, or details are blurred from movement
            2. Focus quality - Is the car in sharp focus?
            3. Clarity - Are fine details like badges, trim, and body lines clearly visible?
            4. Overall suitability for vehicle damage inspection
            
            Respond ONLY with valid JSON (no markdown, no code blocks):
            {
              "qualityScore": 85,
              "isBlurry": false,
              "sharpness": "High/Medium/Low",
              "issues": "Specific issues found"
            }
            
            Quality scoring guidelines:
            - 85-100: Excellent - Sharp, clear, no blur, suitable for detailed inspection
            - 70-84: Good - Minor softness but details visible, acceptable for inspection
            - 50-69: Fair - Noticeable blur or shake, some details unclear, marginal for inspection
            - Below 50: Poor - Significant blur/shake/motion, not suitable for inspection
            
            Be strict: If there's any motion blur, camera shake, or the car isn't in sharp focus, score below 70.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze the quality of this image. Is it clear and sharp enough for vehicle inspection?'
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
        max_tokens: 200
      }),
    });

    if (!qualityResponse.ok) {
      const errorText = await qualityResponse.text();
      console.error('OpenAI quality analysis error:', qualityResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Image quality analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const qualityData = await qualityResponse.json();
    let qualityContent = qualityData.choices[0]?.message?.content?.trim();
    
    // Remove markdown code blocks if present
    qualityContent = qualityContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    let qualityResult;
    try {
      qualityResult = JSON.parse(qualityContent);
    } catch (e) {
      console.error('Failed to parse quality JSON:', qualityContent);
      qualityResult = {
        qualityScore: 50,
        isBlurry: true,
        sharpness: "Low",
        issues: "Could not analyze quality"
      };
    }

    // Then, perform detailed image analysis
    const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `You are an expert automotive analyst. Analyze the car image and provide detailed information.
            
            Respond in the following JSON format:
            {
              "make": "Car manufacturer",
              "model": "Car model (if identifiable)",
              "color": "Primary color",
              "condition": "Overall condition (Excellent/Good/Fair/Poor)",
              "damage": "Any visible damage or issues",
              "features": "Notable features or characteristics"
            }
            
            If information cannot be determined, use "Unknown" or "Not visible".`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this ${expectedView} view of a car and provide detailed information.`
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
        max_tokens: 500
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error('OpenAI analysis error:', analysisResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Image analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analysisData = await analysisResponse.json();
    let analysisContent = analysisData.choices[0]?.message?.content?.trim();
    
    // Remove markdown code blocks if present
    analysisContent = analysisContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    let analysisResult;
    try {
      analysisResult = JSON.parse(analysisContent);
    } catch (e) {
      console.error('Failed to parse analysis JSON:', analysisContent);
      analysisResult = {
        make: "Unknown",
        model: "Unknown",
        color: "Unknown",
        condition: "Unknown",
        damage: "Analysis failed",
        features: "Could not analyze"
      };
    }
    
    console.log(`Expected: ${expectedView}, Detected: ${detectedView}`);
    
    // Check if the detected view matches expected view
    const isMatch = detectedView === expectedView.toLowerCase();
    
    return new Response(
      JSON.stringify({
        detectedView,
        expectedView: expectedView.toLowerCase(),
        isMatch,
        confidence: detectedView === 'unknown' ? 0 : (isMatch ? 0.95 : 0.85),
        analysis: analysisResult,
        quality: qualityResult
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
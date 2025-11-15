import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const { html } = await request.json();

    if (!html) {
      return NextResponse.json({ error: 'HTML is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json({
        error: 'API key not configured. Please add ANTHROPIC_API_KEY to your .env.local file.'
      }, { status: 500 });
    }

    console.log('🤖 Sending HTML to Claude AI for parsing...');

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are an HTML parser. Extract order information from this ACON3D order history page.

Please analyze the HTML and extract ALL purchased assets. For each asset, provide:
- title: The asset name
- url: The asset's product page URL
- thumbnailUrl: The asset's thumbnail image URL (if available)
- price: The price as a number (if available)
- currency: The currency symbol (default to "$" if not found)
- platform: "ACON3D"

Return ONLY a valid JSON array with this structure:
[
  {
    "title": "Asset Name",
    "url": "https://acon3d.com/...",
    "thumbnailUrl": "https://...",
    "price": 99.00,
    "currency": "$",
    "platform": "ACON3D"
  }
]

HTML:
${html.substring(0, 50000)}` // Limit to first 50k chars to avoid token limits
      }]
    });

    console.log('📥 Received response from Claude AI');

    // Extract the text content
    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    let responseText = textContent.text.trim();

    // Remove markdown code blocks if present
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    console.log('Parsing JSON response...');
    const assets = JSON.parse(responseText);

    console.log(`✅ Successfully parsed ${assets.length} assets`);

    return NextResponse.json({
      success: true,
      assets: assets
    });

  } catch (error: any) {
    console.error('Parse error:', error);
    console.error('Error details:', error.message);

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to parse orders',
      details: error.stack
    }, { status: 200 }); // Return 200 so frontend can show the error message
  }
}

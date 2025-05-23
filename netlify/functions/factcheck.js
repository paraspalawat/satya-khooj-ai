exports.handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { claim } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!claim) {
    return res.status(400).json({ error: 'Claim is required.' });
  }


  const prompt = `
    You are a Ramayan fact-checking AI that evaluates claims about the ancient Indian epic. Given the claim below, analyze its accuracy based on authentic versions of the Ramayan (Valmiki Ramayan, Ramcharitmanas, etc.).

    Claim to verify: "${claim}"

    Provide:
    1. A verdict: [TRUE, FALSE, PARTIALLY TRUE, or UNKNOWN]
    2. A detailed analysis explaining your verdict (200-300 words)
    3. Specific references to books/chapters/verses supporting your analysis
    4. Any notable variations across different versions of the Ramayan

    Format response as JSON:
    {
      "verdict": "TRUE/FALSE/PARTIALLY TRUE/UNKNOWN",
      "analysis": "Your detailed analysis...",
      "sources": ["Source 1: Book/Chapter/Verse", "Source 2: Book/Chapter/Verse", ...],
      "variations": "Notes on variations across versions (if applicable)"
    }
  `;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://satya-khoj-ai.netlify.app/',
        'X-Title': 'Ramayan-Fact-Checker'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages: [
          { role: 'system', content: 'You are a Ramayan scholar and fact-checker with extensive knowledge of all authentic versions of the epic.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

 if (!response.ok) {
  let errorMessage = 'OpenRouter API failed';
  const text = await response.text();  // try reading plain text body
  console.error('Non-OK response from OpenRouter:', text);
  try {
    const errorData = JSON.parse(text);
    errorMessage = errorData.error?.message || errorMessage;
  } catch (parseError) {
    console.error('Failed to parse error JSON from OpenRouter:', parseError);
    errorMessage = `OpenRouter returned invalid response: ${text}`;
  }
  return res.status(500).json({ error: errorMessage });
}


    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      return res.status(500).json({ error: 'Invalid response from OpenRouter.' });
    }

    const content = data.choices[0].message.content;

    try {
      const parsed = JSON.parse(content);
      return res.status(200).json(parsed);
    } catch (err) {
      console.warn('Failed to parse model JSON. Returning raw content.');
      return res.status(200).json({
        verdict: 'UNKNOWN',
        analysis: content,
        sources: ['Could not format structured output'],
        variations: 'N/A'
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: error.message || 'Something went wrong.' });
  }
};



  
    if (!claim) {
      return res.status(400).json({ error: 'Claim is required.' });
    }
  
    const apiKey = process.env.OPENROUTER_API_KEY;
  
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
        const errorData = await response.json();
        return res.status(500).json({ error: errorData.error?.message || 'OpenRouter API failed' });
      }
  
      const data = await response.json();
      const content = data.choices[0].message.content;
  
      try {
        const parsed = JSON.parse(content);
        return res.status(200).json(parsed);
      } catch (err) {
        return res.status(200).json({
          verdict: 'UNKNOWN',
          analysis: content,
          sources: ['Could not format structured output'],
          variations: 'N/A'
        });
      }
  
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Something went wrong.' });
    }
  };
  

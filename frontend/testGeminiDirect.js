// Test file to verify direct API access to Gemini
const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.API_KEY;
console.log('Using API key:', API_KEY);

async function testGemini() {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${API_KEY}`,
      {
        contents: [{
          parts: [{
            text: "Hello, what is your name?"
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.9,
          topK: 40
        }
      }
    );

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.candidates && response.data.candidates.length > 0) {
      const text = response.data.candidates[0].content.parts[0].text;
      console.log('Generated text:', text);
      console.log('Success!');
    } else {
      console.log('No candidates in response');
    }
  } catch (error) {
    console.error('Error details:', error.response ? error.response.data : error.message);
  }
}

testGemini();

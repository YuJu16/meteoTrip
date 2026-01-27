const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

async function testGemini() {
    try {
        console.log('Testing Gemini API...');

        // Read .env.local manually
        const envPath = path.join(__dirname, '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('ERROR: .env.local not found');
            return;
        }

        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/GEMINI_API_KEY=(.*)/);

        if (!match) {
            console.error('ERROR: GEMINI_API_KEY not found in .env.local');
            return;
        }

        const apiKey = match[1].trim();
        console.log('API Key found (starts with):', apiKey.substring(0, 5) + '...');

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = 'Say hello under 5 words.';
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log('SUCCESS! Gemini response:', text);
    } catch (error) {
        console.error('FAILURE:', error.message);
        if (error.cause) console.error('Cause:', error.cause);
    }
}

testGemini();

const Groq = require('groq-sdk');
require('dotenv').config({ path: './backend/.env' });

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

console.log('Testing Groq API...');
console.log('API Key present:', !!process.env.GROQ_API_KEY);

async function testGroqAPI() {
    try {
        const response = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{
                role: "user",
                content: "Say hello"
            }],
            temperature: 0.6,
        });

        console.log('✅ Groq API working!');
        console.log('Response:', response.choices[0].message.content);
    } catch (error) {
        console.log('❌ Groq API error:', error.message);
        console.log('Error details:', error.status, error.error);
    }
}

testGroqAPI();
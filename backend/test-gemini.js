require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModels() {
  console.log('🔍 Testing Gemini Models...\n');
  console.log('API Key:', process.env.GEMINI_API_KEY ? 'Found ✅' : 'Missing ❌');
  console.log('');

  const modelsToTry = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-1.0-pro',
    'gemini-pro-vision',
    'text-bison-001',
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`Testing: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say "Hello!"');
      const text = result.response.text();
      
      console.log(`✅ SUCCESS! Model "${modelName}" works!`);
      console.log(`Response: ${text}\n`);
      console.log(`🎉 Use this model name in your chatbotService.js:\n`);
      console.log(`const model = genAI.getGenerativeModel({ model: '${modelName}' });\n`);
      break; // Stop after first working model
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message.substring(0, 100)}...\n`);
    }
  }
}

testModels().catch(console.error);

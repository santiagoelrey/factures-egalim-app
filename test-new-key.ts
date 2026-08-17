import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

const NEW_API_KEY = 'AIzaSyCGMNMxk7osHBR3X_AoYfFwYgwfftdJe4k';

const google = createGoogleGenerativeAI({ apiKey: NEW_API_KEY });

async function testNewKey() {
    console.log('🔑 Test de la nouvelle clé API Gemini...\n');

    const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

    for (const modelName of models) {
        try {
            console.log(`⏳ Test du modèle: ${modelName}...`);
            const result = await generateText({
                model: google(modelName),
                prompt: 'Réponds juste "OK" en français.',
            });
            console.log(`✅ ${modelName} FONCTIONNE! Réponse: "${result.text.trim()}"\n`);
        } catch (error: any) {
            const code = error?.statusCode || error?.code || '?';
            console.log(`❌ ${modelName} ERREUR ${code}: ${error?.message?.substring(0, 100)}\n`);
        }
    }
}

testNewKey();

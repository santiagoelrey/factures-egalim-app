
import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';

// Manually load env vars just in case (though we will hardcode for test)
// Function to read .env.local
function getEnv() {
    const content = fs.readFileSync('.env.local', 'utf8');
    const env: any = {};
    content.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim().replace(/^"|"$/g, '').replace(/\\n/g, '\n');
    });
    return env;
}

const env = getEnv();

const auth = new GoogleAuth({
    credentials: {
        client_email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: env.GOOGLE_PRIVATE_KEY,
    },
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    projectId: 'gestion-factures-486610'
});

async function testVertex() {
    console.log('Testing Vertex AI access for project:', 'gestion-factures-486610');
    try {
        const client = await auth.getClient();
        const projectId = await auth.getProjectId();
        const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/gemini-1.5-flash:streamGenerateContent`;

        console.log('Requesting URL:', url);

        const response = await client.request({
            url,
            method: 'POST',
            data: {
                contents: [{ role: 'user', parts: [{ text: 'Hello, are you working?' }] }],
                generationConfig: { maxOutputTokens: 100 }
            }
        });

        console.log('Vertex AI Success! Status:', response.status);
        console.log('Data:', JSON.stringify(response.data).substring(0, 200) + '...');
    } catch (error: any) {
        console.error('Vertex AI Error:', error.message);
        if (error.response) {
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testVertex();

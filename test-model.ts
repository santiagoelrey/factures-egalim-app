
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const apiKey = 'AIzaSyCSjxzlxO39Vh2Lwy0hH5GG-9zJWMsng4U';

process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;

async function test() {
    console.log('Testing API Key:', apiKey ? 'Present' : 'Missing');

    try {
        console.log('Testing gemini-1.5-flash...');
        const result = await generateText({
            model: google('gemini-1.5-flash'),
            prompt: 'Hello, are you working?',
        });
        console.log('Success:', result.text);
    } catch (error) {
        console.error('Error with gemini-1.5-flash:', error);
    }

    try {
        console.log('Testing gemini-1.5-pro...');
        const result = await generateText({
            model: google('gemini-1.5-pro'),
            prompt: 'Hello, are you working?',
        });
        console.log('Success with pro:', result.text);
    } catch (error) {
        console.error('Error with gemini-1.5-pro:', error);
    }

    try {
        console.log('Testing gemini-2.0-flash-exp...');
        const result = await generateText({
            model: google('gemini-2.0-flash-exp'),
            prompt: 'Hello, are you working?',
        });
        console.log('Success with 2.0 flash:', result.text);
    } catch (error) {
        console.error('Error with gemini-2.0-flash-exp:', error);
    }
}

test();

import dotenv from 'dotenv';
import { BotFrameworkAdapter, TurnContext } from 'botbuilder';
import express from 'express';
import bodyParser from 'body-parser';

dotenv.config();

// Configure the adapter
const adapter = new BotFrameworkAdapter({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD,
});

// Generic error handler
adapter.onTurnError = async (context, error) => {
  console.error(`[onTurnError]: ${error}`);
  await context.sendActivity('Something went wrong.');
};

// Create the Express server
const app = express();
const PORT = process.env.PORT || 3978;
app.use(bodyParser.json());

app.post('/api/messages', (req, res) => {
  console.log('Incoming POST /api/messages');
  adapter.processActivity(req, res, async (context) => {
    console.log('Processing activity...');
    if (context.activity.type === 'message') {
      const msg = context.activity.text?.trim() || '';
      console.log(`Received message: "${msg}" from user: ${context.activity.from?.name}`);
      // Check if the bot was mentioned
      const mentioned = context.activity.entities?.some(e => e.type === 'mention' && e.mentioned?.name === 'Agent');
      if (mentioned) {
        console.log('Bot was mentioned in the message.');
        // Remove the mention from the message text
        const input = TurnContext.removeRecipientMention(context.activity);
        console.log(`Processed input after mention removal: "${input}"`);

        // Send the processed text to the AI engine
        const agentResponse = await fetchAgentResponse(input, context.activity);
        console.log(`Agent response: "${agentResponse}"`);

        // Send the response back to Teams
        return await context.sendActivity(agentResponse);
      } else {
        console.log('Bot was not mentioned, no response sent.');
        
        await context.sendActivity('Debug: Message filtered, bot not mentioned.');
        return;
      }
    } else {
      console.log(`Activity type is not 'message': ${context.activity.type}`);
      await context.sendActivity('This bot only responds to messages.');
      return;
    }
  }).catch(error => {
    console.error('Error in processActivity:', error);
  });
});

app.listen(PORT, () => {
  console.log(`Bot listening on port ${PORT}`);
});

async function fetchAgentResponse(input: string, activity: any): Promise<string> {

  // Extract bot id from mention entity if available
  let agentId = 'cmdemuhxb0001us0gj4c8k05m';
  if (activity && Array.isArray(activity.entities)) {
    const mention = activity.entities.find((e: any) => e.type === 'mention' && e.mentioned && e.mentioned.id);
    if (mention && mention.mentioned && mention.mentioned.id) {
      agentId = mention.mentioned.id;
    }
  }
  const payload = {
    input,
    agentId
  };

  // Get API key from environment variable
  const apiKey = process.env.AGENTSGANG_API_KEY || '';

  console.log('Sending payload to agent engine:', JSON.stringify(payload));
  try {
    const res = await fetch('http://localhost:3000/api/agents/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${apiKey}`
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`Agent Engine returned status ${res.status}`);
      throw new Error(`Agent Engine returned status ${res.status}`);
    }

    const { response } = await res.json();
    console.log('Received response from agent engine:', response);
    return response;
  } catch (error) {
    console.error('Error fetching agent response:', error);
    return "Sorry, I couldn't process your request.";
  }
}

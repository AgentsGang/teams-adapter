require('dotenv').config();
import * as path from 'path';
import * as restify from 'restify';

import { BotFrameworkAdapter, TurnContext } from 'botbuilder';

// Create adapter. See https://aka.ms/about-bot-adapter to learn more about adapters.
const adapter = new BotFrameworkAdapter({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Catch-all for errors. 
adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};

// Create the main dialog.

// Create HTTP server.
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log(`\n${ server.name } listening to ${ server.url }`);
});

// Listen for incoming requests.
server.post('/api/messages', async (req, res) => {
    // Route received a request to adapter for processing
    await adapter.processActivity(req, res, async (context) => {
        if (context.activity.type === 'message') {
            const msg = context.activity.text?.trim() || '';
            
            // Check if the bot was mentioned
            const mentioned = context.activity.entities?.some(e => e.type === 'mention' && e.mentioned?.name === 'Agent');
      
            if (mentioned) {
              // Remove the mention from the message text
              const input = TurnContext.removeRecipientMention(context.activity);
      
              // Send the processed text to the AI engine
              const agentResponse = await fetchAgentResponse(input, context.activity);
      
              // Send the response back to Teams
              await context.sendActivity(agentResponse);
            }
          }
    });
});

async function fetchAgentResponse(input: string, activity: any): Promise<string> {
    const payload = {
      input,
      user: activity.from?.name,
      metadata: {
        conversationId: activity.conversation?.id,
        serviceUrl: activity.serviceUrl,
        timestamp: activity.timestamp,
      },
    };
  
    try {
      const res = await fetch('http://localhost:3000/agent/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      if (!res.ok) {
          throw new Error(`Agent Engine returned status ${res.status}`);
      }
  
      const { response } = await res.json();
      return response;
    } catch (error) {
      console.error("Error fetching agent response:", error);
      return "Sorry, I couldn't process your request.";
    }
  }
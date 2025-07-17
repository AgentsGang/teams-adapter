# Teams Adapter for an AI Agent

## Use Case

I have an engine for running AI agents, and I want to connect it to Microsoft Teams.

The primary use case is as follows:
An agent is added to a chat. When it is mentioned, it receives the message as input.

For example:
> @Agent please review pull request <url>

The agent will receive the message, use its tools to process it, and then respond in a specific format.

**Goal:** How do I write this Teams adapter? It needs to be designed well from the start because it will be extended later to handle channels, alerts, groups, and more.

---

## Proposed Plan (via ChatGPT)

Excellent plan. Below is a step-by-step proposal for the architecture and implementation of a Teams Adapter for your AI agent, with a focus on scalability and extensibility.

### 🔧 **Adapter Goal**

To enable the AI agent to interact with Microsoft Teams by:
1.  Receiving mentions (`@Agent ...`).
2.  Processing them using its core engine.
3.  Sending the response back to the chat.
4.  Supporting future expansion for other scenarios like alerts, notifications, group chats, and channels.

### 🧱 **Architecture (Designed for the Future)**

```
┌──────────────────────────┐
│   Microsoft Teams (UI)   │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  Microsoft Bot Framework │   ← Incoming Webhook
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────────┐
│ Teams Adapter (Node.js/TS)   │
│ - Recognizes commands        │
│ - Converts to a unified msg  │
│ - Sends to Agent Engine      │
│ - Receives & posts response  │
└────────────┬─────────────────┘
             │
             ▼
    ┌────────────────────┐
    │  Agent Engine Core │
    └────────────────────┘
```

### 📦 **Technologies**

*   **Bot Framework SDK** (Node.js)
*   **Microsoft Bot Channels Registration** (in Azure)
*   **Express.js / Fastify** for the webhook endpoint
*   (Optional) A message queue between the **Teams Adapter** and **Agent Engine** if low latency is critical.
*   **OAuth2** support for secure interaction within organizations.

---

### **Implementation Steps**

#### 1. ✅ Register the Bot in Azure

1.  Navigate to the Azure Portal.
2.  Create an **Azure Bot Channels Registration**.
3.  From this, you will obtain:
    *   `Microsoft App ID`
    *   `Microsoft App Password` (Client Secret)
    *   An external URL for your webhook endpoint.

#### 2. ⚙️ Initialize the Teams Adapter (Node.js)

Install the necessary dependencies:
```bash
npm install botbuilder restify
```

Create the basic server:
```typescript
import { BotFrameworkAdapter, TurnContext } from 'botbuilder';
import * as restify from 'restify';

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

// Create the REST server
const server = restify.createServer();
server.listen(process.env.PORT || 3978, () => {
  console.log(`Bot listening on port ${process.env.PORT || 3978}`);
});

// Handle incoming messages
server.post('/api/messages', (req, res) => {
  adapter.processActivity(req, res, async (context) => {
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
```

#### 3. 🧠 `fetchAgentResponse(input, metadata)`

This function acts as the bridge to your AI Engine.

```typescript
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
```

#### 4. 📡 Sending Proactive Messages

The `context.sendActivity` method is how you send responses. For future features like alerts, you will need to send messages proactively (not just in response to a user). To do this, you must save the `conversationReference`.

```typescript
// Get the conversation reference
const reference = TurnContext.getConversationReference(context.activity);

// Store this 'reference' in a database. You can use it later
// to create a conversation context and send proactive notifications.
```

### 5. 📈 Scalability and Extensibility

*   **Alerts (from GitHub, CI/CD, etc.):** Send a proactive message to a channel using a stored `conversationReference`.
*   **Group and Channel Support:** The `activity` from Teams contains `channelData`, which includes the channel type and ID.
*   **Custom Commands:** Parse commands (e.g., `@Agent <command> [args]`) and route them to different modules in your engine.

#### Example Code Structure

```
/src
  /adapter
    teamsAdapter.ts      # The core adapter logic
  /engine
    agentEngineClient.ts # The client for your AI engine
  /handlers
    commandRouter.ts     # Logic for routing commands
  /utils
    messageParser.ts     # Utilities for parsing messages
index.ts                 # Main entry point
.env
```

### 🔐 Security and Deployment

*   **Use HTTPS** for all endpoints.
*   Set up an **Azure AD Application** and configure the necessary permission scopes.
*   Validate incoming request signatures to reject unauthorized traffic.
*   Implement robust **logging and tracing**.

### 🔄 Testing

*   Use the **Bot Framework Emulator** for local testing.
*   Test in a development Teams tenant by **sideloading** your bot application.

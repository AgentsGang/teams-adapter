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

### 🔄 Testing

*   Use the **Bot Framework Emulator** for local testing.
*   Test in a development Teams tenant by **sideloading** your bot application.

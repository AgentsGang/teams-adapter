# User Actions Required

To get your Teams Adapter up and running, please follow these steps:

## 1. Azure Bot Channels Registration

As outlined in the `README.md`, you need to register your bot in Azure to obtain the necessary credentials.

1.  **Navigate to the Azure Portal**.
2.  **Create an Azure Bot Channels Registration**.
3.  Once created, you will find your:
    *   `Microsoft App ID`
    *   `Microsoft App Password` (Client Secret)

## 2. Create a `.env` file

In the root directory of this project (`C:\Users\art.hontar\teams-adapter`), create a file named `.env` and add the following lines, replacing the placeholders with your actual credentials from Azure:

```
MICROSOFT_APP_ID="YOUR_MICROSOFT_APP_ID"
MICROSOFT_APP_PASSWORD="YOUR_MICROSOFT_APP_PASSWORD"
PORT=3978
```

## 3. Run the Teams Adapter

To start the adapter, open your terminal in the project root directory and run:

```bash
npm install
npm start
```

*Note: You might need to install `ts-node` globally or locally if you encounter issues running TypeScript directly. For simplicity, you can compile to JavaScript first using `tsc` and then run the compiled `index.js`.* 

## 4. AI Engine Endpoint

The adapter expects your AI Agent Engine to be running and accessible at `http://localhost:3000/agent/process`. Ensure your AI engine is set up to receive POST requests at this endpoint with a JSON payload containing `input`, `user`, and `metadata`.

## 5. Testing

*   **Bot Framework Emulator:** You can download and use the [Bot Framework Emulator](https://github.com/Microsoft/BotFramework-Emulator/releases) to test your bot locally. Point it to `http://localhost:3978/api/messages`.
*   **Teams Sideloading:** For testing within Microsoft Teams, you will need to create an app package and sideload it into a development Teams tenant. Refer to the official Microsoft Teams documentation for detailed steps on how to do this.

```
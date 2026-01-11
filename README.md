# LinkedIn AutoReply

> AI-powered browser extension for generating intelligent LinkedIn message replies using Azure OpenAI

## 📋 Overview

LinkedIn AutoReply is a Firefox browser extension that helps professionals craft thoughtful, personalized responses to LinkedIn messages quickly and efficiently. Using Azure OpenAI's language models, the extension analyzes incoming messages and generates contextually appropriate replies based on your professional profile and custom prompt templates.

## ✨ Features

- **AI-Powered Reply Generation**: Leverage Azure OpenAI (GPT-4, GPT-3.5) to generate natural, professional responses
- **Custom Prompt Profiles**: Create and manage multiple prompt templates for different scenarios:
  - Politely declining job offers
  - Reactivating network connections
  - Rewriting message drafts
  - And more custom profiles
- **Personalization**: Automatic placeholder replacement with your professional information (name, job title, company, skills, summary)
- **Context-Aware**: The extension reads conversation history to generate contextually relevant replies
- **Privacy-First**: All data stored locally on your device; no information collected by the extension developer
- **Seamless Integration**: Works directly within LinkedIn's messaging interface

## 🚀 Installation

### From Source (Development)

1. Clone this repository:
   ```bash
   git clone https://github.com/Midii-11/Linkedin_AutoReply.git
   cd Linkedin_AutoReply
   ```

2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`

3. Click **"Load Temporary Add-on"**

4. Select the `manifest.json` file from the cloned repository

### From Firefox Add-ons (Coming Soon)

The extension will be available on the Firefox Add-ons marketplace once published.

## ⚙️ Configuration

### Initial Setup

1. Click the extension icon in your Firefox toolbar to open the settings popup

2. **Configure Azure OpenAI Settings**:
   - **Endpoint URL**: Your Azure OpenAI resource endpoint (e.g., `https://your-resource.openai.azure.com/`)
   - **API Key**: Your Azure OpenAI API key
   - **Deployment Name**: The name of your deployed model (e.g., `gpt-4`, `gpt-35-turbo`)

3. **Add Your Personal Information** (used for placeholder replacement):
   - Full Name
   - Job Title
   - Company
   - Skills
   - Profile Summary

4. Click **"Save All Settings"**

### Azure OpenAI Setup

If you don't have an Azure OpenAI resource:

1. Go to the [Azure Portal](https://portal.azure.com/)
2. Create an Azure OpenAI resource
3. Deploy a model (GPT-4 or GPT-3.5-turbo recommended)
4. Copy your endpoint URL and API key from the resource's "Keys and Endpoint" section

### Managing Prompt Profiles

The extension comes with default prompt profiles stored in the `prompts/` directory:

- `politely_decline.txt`: For declining job offers professionally
- `reactivate_network.txt`: For reconnecting with dormant connections
- `rewrite_draft.txt`: For improving message drafts

You can add custom profiles through the extension popup:

1. Click the **"+"** button in the "Prompt Profiles" section
2. Enter a profile name and system prompt
3. Use placeholders like `{{full_name}}`, `{{job_title}}`, `{{company}}`, etc.
4. Save the profile

## 📖 Usage

1. **Open LinkedIn Messages**: Navigate to LinkedIn and open any conversation

2. **Generate a Reply**: 
   - The extension will inject a toolbar into the message input area
   - Select a prompt profile from the dropdown (e.g., "Polite Decline", "Reactivate Network")
   - Click the generate button
   - The AI will analyze the conversation and generate a contextually appropriate reply

3. **Review and Send**: 
   - Review the generated message
   - Make any necessary edits
   - Send when ready

## 🔒 Privacy & Security

### Data Storage
- **Local Storage Only**: All configuration data (API keys, personal information, and prompts) is stored locally in your browser using `browser.storage.local`
- **No External Data Collection**: The extension developer does not collect, store, or transmit any of your data

### Data Transmission
- **Azure OpenAI Only**: Your message content and conversation history are sent exclusively to your configured Azure OpenAI endpoint for reply generation
- **Secure HTTPS**: All communications with Azure OpenAI use encrypted HTTPS connections
- **User Control**: You control what data is sent by configuring your personal information and using the extension selectively

### Recommendations
- Keep your Azure OpenAI API key secure and do not share it
- Regularly rotate your API keys following Azure security best practices
- Review generated messages before sending to ensure they meet your standards

## 🛠️ Development

### Project Structure

```
Linkedin_AutoReply/
├── manifest.json          # Extension manifest (Manifest V3)
├── background/
│   └── background.js      # Background service worker
├── content/
│   ├── content.js         # Content script injected into LinkedIn pages
│   └── content.css        # Styles for injected UI elements
├── popup/
│   ├── popup.html         # Extension popup interface
│   ├── popup.js           # Popup logic
│   └── popup.css          # Popup styles
├── prompts/
│   ├── politely_decline.txt
│   ├── reactivate_network.txt
│   └── rewrite_draft.txt
└── icons/
    ├── icon-48.png
    └── icon-128.png
```

### Technologies Used

- **Manifest V3**: Modern Firefox extension architecture
- **Vanilla JavaScript**: No external dependencies for minimal footprint
- **Azure OpenAI API**: GPT-4 and GPT-3.5-turbo language models
- **Browser Storage API**: Secure local data persistence

### Building from Source

This extension does not require a build process. All code runs directly in the browser.

### Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📦 Publishing to Firefox Add-ons (AMO)

### Prerequisites

1. **Icons**: Ensure `icons/icon-48.png` and `icons/icon-128.png` are finalized
2. **Manifest**: The `manifest.json` includes the extension ID: `linkedin-autoreply@AD.ai`

### Packaging Steps

1. Create a ZIP file containing:
   ```
   manifest.json
   background/
   content/
   popup/
   icons/
   prompts/
   ```

2. Name the archive: `linkedin-autoreply.zip`

### Publishing Steps

1. Go to the [Firefox Add-on Developer Hub](https://addons.mozilla.org/en-US/developers/)
2. Log in and click **"Submit a New Add-on"**
3. Choose distribution method:
   - **"On this site"**: Public listing on Firefox Add-ons
   - **"On your own"**: Self-distribution with Mozilla signature
4. Upload `linkedin-autoreply.zip`
5. The automated validator will check your code
   - Note: Usage of `innerHTML` (with sanitization) is for preserving newlines in LinkedIn's editor
6. Complete the listing details (description, screenshots, privacy policy, etc.)
7. Submit for review

### Privacy Policy for Submission

When publishing, include this privacy policy statement:

> This extension stores user configuration data (Azure OpenAI API credentials and personal profile information) locally on the user's device using browser.storage.local. This data is transmitted only to the user's configured Azure OpenAI endpoint for the purpose of generating message replies. The extension developer does not collect, store, or transmit any user data.

## 📄 License

This project is available under the MIT License. See the LICENSE file for more information.

## 🤝 Support

For questions, issues, or feature requests:

- **Issues**: [GitHub Issues](https://github.com/Midii-11/Linkedin_AutoReply/issues)
- **Repository**: [GitHub](https://github.com/Midii-11/Linkedin_AutoReply)

## ⚠️ Disclaimer

This extension is not affiliated with, endorsed by, or officially connected with LinkedIn Corporation or Microsoft Corporation. LinkedIn is a registered trademark of LinkedIn Corporation.

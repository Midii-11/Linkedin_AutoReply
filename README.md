# LinkedIn AutoReply Extension

## Publishing to Firefox Add-ons (AMO)

### Prerequisites
1.  **Icons**: Ensure `icons/icon-48.png`, `icons/icon-96.png`, and `icons/icon-128.png` are actual icons you want to use. Currently, they are copies of your logo.
2.  **Manifest**: The `manifest.json` has been updated with a placeholder ID (`linkedin-autoreply@example.com`). You should change this to a unique email-like ID for your extension (e.g., `yourname-linkedin-autoreply@extensions.org`) or let AMO generate one if you don't include it (but including it is safer for updates).

### Steps to Package
1.  Select all files and folders in this directory:
    - `manifest.json`
    - `background/`
    - `content/`
    - `popup/`
    - `icons/`
    - `prompts/`
2.  Right-click -> **Send to** -> **Compressed (zipped) folder**.
3.  Name it `linkedin-autoreply.zip`.

### Steps to Publish
1.  Go to the [Firefox Add-on Developer Hub](https://addons.mozilla.org/en-US/developers/).
2.  Log in and click **"Submit a New Add-on"**.
3.  Select **"On this site"** (if you want it public) or **"On your own"** (if you just want a signed file to distribute yourself).
4.  Upload `linkedin-autoreply.zip`.
5.  The validator will check your code.
    - **Note**: Since you use `innerHTML` in `content.js` (even though sanitized), the manual reviewer might ask about it. Explain it's for preserving newlines in the LinkedIn editor.
6.  Fill in the listing details (Description, Screenshots, etc.).
7.  Submit!

### Privacy Policy
Since you store user data (API Key, Personal Info) in `browser.storage.local`, you should state in your privacy policy that:
- Data is stored locally on the user's device.
- Data is sent to Azure OpenAI solely for the purpose of generating replies.
- No data is collected by you (the developer).

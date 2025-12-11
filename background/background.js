browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'generateReply') {
        generateReply(request.data)
            .then(response => sendResponse({ success: true, data: response }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep channel open for async response
    }
    if (request.action === 'loadPrompt') {
        // load a local extension prompt file and return its text
        loadPrompt(request.path)
            .then(text => sendResponse({ success: true, data: text }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }
});

async function generateReply({ messages, systemPrompt }) {
    const settings = await browser.storage.local.get(['endpoint', 'apiKey', 'deployment', 'personalInfo']);

    if (!settings.endpoint || !settings.apiKey || !settings.deployment) {
        throw new Error('Missing Azure OpenAI settings. Please configure the extension.');
    }

    // Placeholder Substitution
    let finalSystemPrompt = systemPrompt;
    if (settings.personalInfo) {
        const info = settings.personalInfo;
        const fullName = info.name || '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const replacements = {
            '{{name}}': fullName,
            '{{full_name}}': fullName,
            '{{first_name}}': firstName,
            '{{last_name}}': lastName,
            '{{job_title}}': info.job || '',
            '{{company}}': info.company || '',
            '{{current_company}}': info.company || '', // Alias
            '{{skills}}': info.skills || '',
            '{{summary}}': info.summary || ''
        };

        for (const [key, value] of Object.entries(replacements)) {
            // Replace {{key}}
            finalSystemPrompt = finalSystemPrompt.split(key).join(value);
            // Replace {{KEY}} (uppercase)
            finalSystemPrompt = finalSystemPrompt.split(key.toUpperCase()).join(value);
        }
    }

    // Construct URL
    // Format: https://{your-resource-name}.openai.azure.com/openai/deployments/{deployment-id}/chat/completions?api-version={api-version}
    let endpoint = settings.endpoint.replace(/\/$/, ''); // Remove trailing slash
    const apiVersion = '2023-05-15'; // Use a stable version
    const url = `${endpoint}/openai/deployments/${settings.deployment}/chat/completions?api-version=${apiVersion}`;

    const payload = {
        messages: [
            { role: 'system', content: finalSystemPrompt },
            ...messages
        ],
        temperature: 0.7,
        max_tokens: 800
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': settings.apiKey
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${response.status} ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

async function loadPrompt(path) {
    // path is relative inside the extension, e.g. 'prompts/rewrite_draft.txt'
    const url = browser.runtime.getURL(path);
    const resp = await fetch(url);
    if (!resp.ok) {
        throw new Error(`Failed to load prompt: ${resp.status} ${resp.statusText}`);
    }
    return await resp.text();
}

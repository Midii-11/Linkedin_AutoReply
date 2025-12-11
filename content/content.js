// State
let currentObserver = null;
let injectedToolbar = null;

// Selectors (These are best guesses and might need adjustment based on LinkedIn's actual DOM)
const SELECTORS = {
    // The main message list container
    MESSAGE_LIST: '.msg-s-message-list-content',
    // Individual message bubbles
    MESSAGE_BUBBLE: '.msg-s-event-listitem',
    // The content of the message
    MESSAGE_TEXT: '.msg-s-event-listitem__body',
    // The sender name (to distinguish user vs others)
    MESSAGE_SENDER: '.msg-s-message-group__profile-link',
    // The input form container
    INPUT_FORM: '.msg-form__contenteditable',
    // The container where we want to inject our toolbar (usually above the input)
    INPUT_CONTAINER: '.msg-form__left-actions', // Or .msg-form
    // The main conversation container to watch for changes
    CONVERSATION_CONTAINER: '.msg-convo-wrapper'
};

// Initialize
function init() {
    console.log('LinkedIn AutoReply: Initializing...');

    // Watch for navigation changes (SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            onUrlChange();
        }
    }).observe(document, { subtree: true, childList: true });

    // Initial check
    checkAndInject();

    // Continuous check for the chat window appearing (since it's dynamic)
    setInterval(checkAndInject, 2000);
}

function onUrlChange() {
    console.log('LinkedIn AutoReply: URL changed');
    checkAndInject();
}

function checkAndInject() {
    // Try to find the input area
    const inputArea = document.querySelector(SELECTORS.INPUT_FORM);
    if (inputArea && !document.querySelector('.linkedin-autoreply-toolbar')) {
        injectToolbar(inputArea);
    }
}

async function injectToolbar(inputArea) {
    console.log('LinkedIn AutoReply: Injecting toolbar');

    // Create Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'linkedin-autoreply-toolbar';

    // Profile Selector
    const select = document.createElement('select');
    select.className = 'linkedin-autoreply-select';

    // Load profiles
    const settings = await browser.storage.local.get('profiles');
    const profiles = settings.profiles || [];

    if (profiles.length === 0) {
        const option = document.createElement('option');
        option.text = 'No profiles configured';
        select.appendChild(option);
        select.disabled = true;
    } else {
        profiles.forEach((p, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.text = p.name;
            select.appendChild(option);
        });
    }

    // Generate Button
    const btn = document.createElement('button');
    btn.className = 'linkedin-autoreply-btn';
    btn.innerHTML = '<span>Generate Reply</span><div class="linkedin-autoreply-spinner"></div>';
    btn.onclick = async () => {
        if (select.disabled) {
            alert('Please configure profiles in the extension settings.');
            return;
        }
        const profileIndex = select.value;
        const profile = profiles[profileIndex];
        await handleGenerateClick(btn, profile, inputArea);
    };

    // Rewrite Draft Button
    const rewriteBtn = document.createElement('button');
    rewriteBtn.className = 'linkedin-autoreply-btn linkedin-autoreply-rewrite';
    rewriteBtn.style.marginLeft = '8px';
    rewriteBtn.innerHTML = '<span>Rewrite Draft</span><div class="linkedin-autoreply-spinner"></div>';
    rewriteBtn.onclick = async () => {
        if (select.disabled) {
            alert('Please configure profiles in the extension settings.');
            return;
        }
        await handleRewriteClick(rewriteBtn, inputArea);
    };

    // Status
    const status = document.createElement('span');
    status.className = 'linkedin-autoreply-status';

    toolbar.appendChild(select);
    toolbar.appendChild(btn);
    toolbar.appendChild(rewriteBtn);
    toolbar.appendChild(status);

    // Insert before the input form's parent or inside a suitable container
    // Finding a good place to insert: usually above the input box.
    // The inputArea is contenteditable. Its parent usually holds the whole form.
    const formContainer = inputArea.closest('form') || inputArea.parentElement;
    formContainer.insertBefore(toolbar, formContainer.firstChild);

    injectedToolbar = toolbar;
}

async function handleGenerateClick(btn, profile, inputArea) {
    const spinner = btn.querySelector('.linkedin-autoreply-spinner');
    const btnText = btn.querySelector('span');

    try {
        // UI Loading State
        btn.disabled = true;
        spinner.style.display = 'inline-block';
        btnText.textContent = 'Generating...';

        // 1. Extract Context
        const messages = extractChatHistory();
        if (messages.length === 0) {
            throw new Error('No messages found to reply to.');
        }

        // 2. Call API via Background
        const response = await browser.runtime.sendMessage({
            action: 'generateReply',
            data: {
                messages: messages,
                systemPrompt: profile.systemPrompt
            }
        });

        if (!response.success) {
            throw new Error(response.error);
        }

        // 3. Insert Text
        insertText(inputArea, response.data);

    } catch (err) {
        console.error('LinkedIn AutoReply Error:', err);
        alert('Error: ' + err.message);
    } finally {
        // Reset UI
        btn.disabled = false;
        spinner.style.display = 'none';
        btnText.textContent = 'Generate Reply';
    }
}

async function handleRewriteClick(btn, inputArea) {
    const spinner = btn.querySelector('.linkedin-autoreply-spinner');
    const btnText = btn.querySelector('span');

    try {
        // UI Loading State
        btn.disabled = true;
        spinner.style.display = 'inline-block';
        btnText.textContent = 'Rewriting...';

        // Get the current draft from the input area
        const draft = (inputArea.innerText || inputArea.textContent || '').trim();
        if (!draft) {
            throw new Error('No draft found. Please type your message first.');
        }

        // Load the rewrite prompt via the background script to avoid CSP/network issues
        const promptResp = await browser.runtime.sendMessage({ action: 'loadPrompt', path: 'prompts/rewrite_draft.txt' });
        if (!promptResp || !promptResp.success) {
            throw new Error(promptResp?.error || 'Failed to load rewrite prompt');
        }
        const systemPrompt = promptResp.data;

        // Send the draft to the background to rewrite
        const response = await browser.runtime.sendMessage({
            action: 'generateReply',
            data: {
                messages: [{ role: 'user', content: draft }],
                systemPrompt: systemPrompt
            }
        });

        if (!response.success) {
            throw new Error(response.error);
        }

        // Replace the draft with the rewritten text
        // Clear current content then insert rewritten text
        inputArea.focus();
        inputArea.innerHTML = ''; // clear
        insertText(inputArea, response.data);

    } catch (err) {
        console.error('LinkedIn AutoReply Rewrite Error:', err);
        alert('Error: ' + err.message);
    } finally {
        btn.disabled = false;
        spinner.style.display = 'none';
        btnText.textContent = 'Rewrite Draft';
    }
}

function extractChatHistory() {
    const history = [];
    // Find all message items
    const items = document.querySelectorAll(SELECTORS.MESSAGE_BUBBLE);

    // Get last 10 messages
    const recentItems = Array.from(items).slice(-10);

    recentItems.forEach(item => {
        const textEl = item.querySelector(SELECTORS.MESSAGE_TEXT);
        const senderEl = item.querySelector(SELECTORS.MESSAGE_SENDER);

        if (textEl) {
            const text = textEl.innerText.trim();
            // Heuristic: if the message is on the right, it's "user", else "assistant" (or rather "user" vs "other")
            // But for the LLM, we want "user" (the other person) and "assistant" (me) usually, 
            // OR we just label them "User" (me) and "Recruiter" (them).
            // Actually, for the LLM to reply AS me, the "user" role in OpenAI API should be the OTHER person, and "assistant" role should be ME (previous replies).
            // LinkedIn usually distinguishes by class or alignment.
            // Let's assume:
            // .msg-s-event-listitem--other => The other person (Role: user)
            // .msg-s-event-listitem--me => Me (Role: assistant)

            let role = 'user'; // Default to them
            if (item.classList.contains('msg-s-event-listitem--me')) {
                role = 'assistant';
            }

            history.push({ role, content: text });
        }
    });

    return history;
}

function insertText(inputArea, text) {
    inputArea.focus();

    // Escape HTML to prevent injection issues when constructing HTML string
    const escapeHtml = (str) => {
        return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    // Convert newlines to HTML paragraphs
    // LinkedIn's editor typically respects <p> tags for line breaks.
    const lines = text.split('\n');
    const html = lines.map(line => `<p>${escapeHtml(line) || '<br>'}</p>`).join('');

    // Use insertHTML to preserve structure
    const success = document.execCommand('insertHTML', false, html);

    if (!success) {
        // Fallback: direct innerHTML manipulation (less safe for event listeners but might work)
        inputArea.innerHTML = html;
        inputArea.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

// Run
init();

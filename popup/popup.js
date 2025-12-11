document.addEventListener('DOMContentLoaded', restoreSettings);
document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
document.getElementById('add-profile-btn').addEventListener('click', showAddProfile);
document.getElementById('save-profile-btn').addEventListener('click', saveProfile);
document.getElementById('cancel-profile-btn').addEventListener('click', hideProfileEditor);

let profiles = [];
let editingProfileIndex = -1;
let editingRewrite = false;

async function restoreSettings() {
    const data = await browser.storage.local.get(['endpoint', 'apiKey', 'deployment', 'profiles', 'personalInfo']);

    if (data.endpoint) document.getElementById('endpoint').value = data.endpoint;
    if (data.apiKey) document.getElementById('apiKey').value = data.apiKey;
    if (data.deployment) document.getElementById('deployment').value = data.deployment;

    if (data.personalInfo) {
        document.getElementById('p-name').value = data.personalInfo.name || '';
        document.getElementById('p-job').value = data.personalInfo.job || '';
        document.getElementById('p-company').value = data.personalInfo.company || '';
        document.getElementById('p-skills').value = data.personalInfo.skills || '';
        document.getElementById('p-summary').value = data.personalInfo.summary || '';
    }

    profiles = data.profiles || [];


    // Load default profile if empty (use background loader to fetch extension resources)
    if (profiles.length === 0) {
        try {
            const promptResp = await browser.runtime.sendMessage({ action: 'loadPrompt', path: 'prompts/politely_decline.txt' });
            if (promptResp && promptResp.success) {
                const defaultPrompt = promptResp.data;
                profiles.push({ name: 'Politely Decline', systemPrompt: defaultPrompt });
                // Save immediately so it persists
                await browser.storage.local.set({ profiles });
            } else {
                console.error('Failed to load default prompt:', promptResp?.error);
            }
        } catch (e) {
            console.error('Failed to load default prompt:', e);
        }
    }

    renderProfiles();
    await renderRewritePrompt();
}

async function saveSettings() {
    const endpoint = document.getElementById('endpoint').value;
    const apiKey = document.getElementById('apiKey').value;
    const deployment = document.getElementById('deployment').value;

    const personalInfo = {
        name: document.getElementById('p-name').value,
        job: document.getElementById('p-job').value,
        company: document.getElementById('p-company').value,
        skills: document.getElementById('p-skills').value,
        summary: document.getElementById('p-summary').value
    };

    await browser.storage.local.set({
        endpoint,
        apiKey,
        deployment,
        profiles,
        personalInfo
    });

    // Rewrite prompt is saved from the editor; profiles/settings saved above.

    const status = document.getElementById('status');
    status.textContent = 'Settings saved!';
    setTimeout(() => status.textContent = '', 2000);
}

function renderProfiles() {
    const list = document.getElementById('profiles-list');
    list.innerHTML = '';

    if (profiles.length === 0) {
        list.innerHTML = '<div class="empty-state">No profiles added yet.</div>';
        return;
    }

    profiles.forEach((profile, index) => {
        const div = document.createElement('div');
        div.className = 'profile-item';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'profile-name';
        nameSpan.textContent = profile.name;
        div.appendChild(nameSpan);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'profile-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => editProfile(index);

        const delBtn = document.createElement('button');
        delBtn.className = 'action-btn delete';
        delBtn.textContent = 'Delete';
        delBtn.onclick = () => deleteProfile(index);

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(delBtn);
        div.appendChild(actionsDiv);

        list.appendChild(div);
    });
}

async function renderRewritePrompt() {
    const list = document.getElementById('rewrite-list');
    if (!list) return;
    list.innerHTML = '';
    
    async function editRewrite() {
        editingRewrite = true;
        document.getElementById('editor-title').textContent = 'Edit Rewrite Prompt';

        // Hide the profile-name input when editing the rewrite prompt
        try {
            document.querySelector('label[for="profile-name"]').style.display = 'none';
            document.getElementById('profile-name').style.display = 'none';
        } catch (e) {}

        // Load current stored rewrite prompt or fallback to bundled default
        try {
            const data = await browser.storage.local.get('rewritePrompt');
            let prompt = (data && data.rewritePrompt) ? data.rewritePrompt : '';
            if (!prompt) {
                const promptResp = await browser.runtime.sendMessage({ action: 'loadPrompt', path: 'prompts/rewrite_draft.txt' });
                if (promptResp && promptResp.success) prompt = promptResp.data;
            }
            document.getElementById('system-prompt').value = prompt || '';
        } catch (e) {
            console.error('Failed to load rewrite prompt for editing:', e);
            document.getElementById('system-prompt').value = '';
        }

        document.getElementById('profile-editor').classList.remove('hidden');
    }

    try {
        const data = await browser.storage.local.get('rewritePrompt');
        const prompt = (data && data.rewritePrompt) ? data.rewritePrompt : '';

        const div = document.createElement('div');
        div.className = 'profile-item';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'profile-name';
        nameSpan.textContent = 'Rewrite Draft';
        div.appendChild(nameSpan);

        const excerpt = document.createElement('div');
        excerpt.className = 'profile-excerpt';
        excerpt.textContent = prompt ? (prompt.length > 120 ? prompt.slice(0, 117) + '...' : prompt) : '';
        div.appendChild(excerpt);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'profile-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => editRewrite();

        actionsDiv.appendChild(editBtn);
        div.appendChild(actionsDiv);

        list.appendChild(div);
    } catch (e) {
        console.error('Failed to render rewrite prompt:', e);
        list.innerHTML = '<div class="empty-state"></div>';
    }
}

function showAddProfile() {
    editingProfileIndex = -1;
    document.getElementById('editor-title').textContent = 'New Profile';
    document.getElementById('profile-name').value = '';
    document.getElementById('system-prompt').value = '';
    // Ensure profile name is visible when creating/editing profiles
    document.querySelector('label[for="profile-name"]').style.display = '';
    document.getElementById('profile-name').style.display = '';
    editingRewrite = false;
    document.getElementById('profile-editor').classList.remove('hidden');
}

function editProfile(index) {
    editingProfileIndex = index;
    const profile = profiles[index];
    document.getElementById('editor-title').textContent = 'Edit Profile';
    document.getElementById('profile-name').value = profile.name;
    document.getElementById('system-prompt').value = profile.systemPrompt;
    // Ensure profile name is visible when editing profiles
    document.querySelector('label[for="profile-name"]').style.display = '';
    document.getElementById('profile-name').style.display = '';
    editingRewrite = false;
    document.getElementById('profile-editor').classList.remove('hidden');
}

function hideProfileEditor() {
    document.getElementById('profile-editor').classList.add('hidden');
    // Reset rewrite editing state and ensure profile-name field visible
    editingRewrite = false;
    try {
        document.querySelector('label[for="profile-name"]').style.display = '';
        document.getElementById('profile-name').style.display = '';
    } catch (e) {}
}

function saveProfile() {
    const nameEl = document.getElementById('profile-name');
    const name = nameEl ? nameEl.value : '';
    const systemPrompt = document.getElementById('system-prompt').value;

    if (editingRewrite) {
        // Save rewrite prompt separately
        browser.storage.local.set({ rewritePrompt: systemPrompt }).then(() => {
            hideProfileEditor();
            renderRewritePrompt();
            const status = document.getElementById('status');
            status.textContent = 'Rewrite prompt saved!';
            setTimeout(() => status.textContent = '', 2000);
        }).catch(e => {
            console.error('Failed to save rewrite prompt:', e);
            alert('Failed to save rewrite prompt');
        });
        return;
    }

    if (!name || !systemPrompt) {
        alert('Please fill in both fields');
        return;
    }

    if (editingProfileIndex === -1) {
        profiles.push({ name, systemPrompt });
    } else {
        profiles[editingProfileIndex] = { name, systemPrompt };
    }

    hideProfileEditor();
    renderProfiles();
    // Auto-save settings when profiles change
    saveSettings();
}

function deleteProfile(index) {
    if (confirm('Are you sure you want to delete this profile?')) {
        profiles.splice(index, 1);
        renderProfiles();
        saveSettings();
    }
}

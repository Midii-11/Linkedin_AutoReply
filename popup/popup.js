document.addEventListener('DOMContentLoaded', restoreSettings);
document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
document.getElementById('add-profile-btn').addEventListener('click', showAddProfile);
document.getElementById('save-profile-btn').addEventListener('click', saveProfile);
document.getElementById('cancel-profile-btn').addEventListener('click', hideProfileEditor);

let profiles = [];
let editingProfileIndex = -1;

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

    // Load default profile if empty
    if (profiles.length === 0) {
        try {
            const response = await fetch('../prompts/politely_decline.txt');
            if (response.ok) {
                const defaultPrompt = await response.text();
                profiles.push({ name: 'Politely Decline', systemPrompt: defaultPrompt });
                // Save immediately so it persists
                await browser.storage.local.set({ profiles });
            }
        } catch (e) {
            console.error('Failed to load default prompt:', e);
        }
    }

    renderProfiles();
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

function showAddProfile() {
    editingProfileIndex = -1;
    document.getElementById('editor-title').textContent = 'New Profile';
    document.getElementById('profile-name').value = '';
    document.getElementById('system-prompt').value = '';
    document.getElementById('profile-editor').classList.remove('hidden');
}

function editProfile(index) {
    editingProfileIndex = index;
    const profile = profiles[index];
    document.getElementById('editor-title').textContent = 'Edit Profile';
    document.getElementById('profile-name').value = profile.name;
    document.getElementById('system-prompt').value = profile.systemPrompt;
    document.getElementById('profile-editor').classList.remove('hidden');
}

function hideProfileEditor() {
    document.getElementById('profile-editor').classList.add('hidden');
}

function saveProfile() {
    const name = document.getElementById('profile-name').value;
    const systemPrompt = document.getElementById('system-prompt').value;

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

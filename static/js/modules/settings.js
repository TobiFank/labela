export function initSettings() {
    const settingsButton = document.getElementById('settingsButton');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const promptSelect = document.getElementById('promptSelect');
    const promptEditor = document.getElementById('promptEditor');
    const newPromptName = document.getElementById('newPromptName');
    const addNewPrompt = document.getElementById('addNewPrompt');
    const editPrompt = document.getElementById('editPrompt');
    const deletePrompt = document.getElementById('deletePrompt');
    const temperatureSlider = document.getElementById('temperatureSlider');
    const temperatureValue = document.getElementById('temperatureValue');
    const resetSettings = document.getElementById('resetSettings');
    const saveSettings = document.getElementById('saveSettings');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    let currentSettings = {};
    let prompts = {};
    let isEditing = false;

    settingsButton.addEventListener('click', function() {
        fetchSettings().then(() => {
            settingsModal.classList.remove('hidden');
        });
    });

    closeSettings.addEventListener('click', function() {
        settingsModal.classList.add('hidden');
    });

    function fetchSettings() {
        return Promise.all([
            fetch('/get_settings').then(response => response.json()),
            fetch('/get_prompts').then(response => response.json())
        ]).then(([settings, fetchedPrompts]) => {
            currentSettings = settings;
            prompts = fetchedPrompts;
            updateSettingsUI(settings);
            updatePromptsUI();
        }).catch(error => console.error('Error:', error));
    }

    function updateSettingsUI(data) {
        promptEditor.value = data.prompt;
        temperatureSlider.value = data.temperature;
        temperatureValue.textContent = data.temperature;
        promptSelect.value = data.currentPrompt;
        promptEditor.value = prompts[data.currentPrompt].content;
    }

    temperatureSlider.addEventListener('input', function() {
        temperatureValue.textContent = this.value;
    });

    promptSelect.addEventListener('change', function() {
        promptEditor.value = prompts[this.value].content;
        deletePrompt.classList.toggle('hidden', this.value === 'default');
        isEditing = false;
        promptEditor.disabled = true;
        editPrompt.textContent = 'Edit';
    });

    editPrompt.addEventListener('click', function() {
        isEditing = !isEditing;
        promptEditor.disabled = !isEditing;
        this.textContent = isEditing ? 'Save' : 'Edit';

        if (!isEditing) {
            // Save the edited prompt
            const selectedPromptKey = promptSelect.value;
            fetch('/edit_prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: selectedPromptKey,
                    content: promptEditor.value
                })
            })
                .then(response => response.json())
                .then(updatedPrompts => {
                    prompts = updatedPrompts;
                    console.log('Prompt updated successfully');
                })
                .catch(error => console.error('Error updating prompt:', error));
        }
    });

    addNewPrompt.addEventListener('click', function() {
        const name = newPromptName.value.trim();
        const content = promptEditor.value.trim();
        console.log('Attempting to add new prompt:', { name, content });
        if (name && content) {
            fetch('/add_prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, content })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Received updated prompts:', data.prompts);
                    prompts = data.prompts;
                    currentSettings.currentPrompt = data.newPromptKey;
                    updatePromptsUI();
                    newPromptName.value = '';
                })
                .catch(error => {
                    console.error('Error adding prompt:', error);
                    alert('Failed to add new prompt. Please check the console for details.');
                });
        } else {
            console.error('Invalid prompt name or content');
            alert('Please enter both a name and content for the new prompt.');
        }
    });

    deletePrompt.addEventListener('click', function() {
        const promptToDelete = promptSelect.value;
        console.log('Attempting to delete prompt:', promptToDelete);
        if (promptToDelete !== 'default') {
            fetch('/delete_prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptToDelete })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(updatedPrompts => {
                    console.log('Received updated prompts after deletion:', updatedPrompts);
                    prompts = updatedPrompts;
                    currentSettings.currentPrompt = 'default'; // Set current prompt to default
                    updatePromptsUI();
                })
                .catch(error => {
                    console.error('Error deleting prompt:', error);
                    alert('Failed to delete prompt. Please check the console for details.');
                });
        } else {
            console.error('Attempted to delete default prompt');
            alert('The default prompt cannot be deleted.');
        }
    });

    function updatePromptsUI() {
        console.log('Updating prompts UI. Current prompts:', prompts);

        promptSelect.innerHTML = Object.keys(prompts).map(key => {
            console.log(`Adding option: key=${key}, name=${prompts[key].name}`);
            return `<option value="${key}">${prompts[key].name}</option>`;
        }).join('');

        console.log('Updated promptSelect innerHTML:', promptSelect.innerHTML);

        const currentPrompt = currentSettings.currentPrompt || 'default';
        console.log('Current prompt:', currentPrompt);

        promptSelect.value = currentPrompt;
        console.log('Set promptSelect value to:', promptSelect.value);

        const selectedPromptContent = prompts[currentPrompt]?.content;
        console.log('Selected prompt content:', selectedPromptContent);

        promptEditor.value = selectedPromptContent || '';
        console.log('Set promptEditor value to:', promptEditor.value);

        deletePrompt.classList.toggle('hidden', currentPrompt === 'default');
        console.log('Delete button hidden:', deletePrompt.classList.contains('hidden'));

        promptEditor.disabled = true;
        editPrompt.textContent = 'Edit';
        isEditing = false;
    }

    resetSettings.addEventListener('click', function() {
        fetch('/reset_settings')
            .then(response => response.json())
            .then(data => {
                currentSettings = data;
                updateSettingsUI(data);
            })
            .catch(error => console.error('Error:', error));
    });

    saveSettings.addEventListener('click', function() {
        const newSettings = {
            prompt: promptEditor.value,
            temperature: parseFloat(temperatureSlider.value),
            currentPrompt: promptSelect.value
        };

        fetch('/save_settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSettings)
        })
            .then(response => response.json())
            .then(data => {
                console.log('Settings saved:', data);
                currentSettings = newSettings;
                settingsModal.classList.add('hidden');
            })
            .catch(error => console.error('Error:', error));
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });
}
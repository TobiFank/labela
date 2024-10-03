export function initSettings() {
    const settingsButton = document.getElementById('settingsButton');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const promptSelect = document.getElementById('promptSelect');
    const promptEditor = document.getElementById('promptEditor');
    const newPromptName = document.getElementById('newPromptName');
    const addNewPrompt = document.getElementById('addNewPrompt');
    const deletePrompt = document.getElementById('deletePrompt');
    const temperatureSlider = document.getElementById('temperatureSlider');
    const temperatureValue = document.getElementById('temperatureValue');
    const resetSettings = document.getElementById('resetSettings');
    const saveSettings = document.getElementById('saveSettings');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    let currentSettings = {};
    let prompts = {};

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
    }

    temperatureSlider.addEventListener('input', function() {
        temperatureValue.textContent = this.value;
    });

    promptSelect.addEventListener('change', function() {
        promptEditor.value = prompts[this.value].content;
        deletePrompt.classList.toggle('hidden', this.value === 'default');
    });

    addNewPrompt.addEventListener('click', function() {
        const name = newPromptName.value.trim();
        const content = promptEditor.value.trim();
        if (name && content) {
            fetch('/add_prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, content })
            })
                .then(response => response.json())
                .then(data => {
                    prompts = data.prompts;
                    currentSettings.currentPrompt = data.newPromptKey;
                    updatePromptsUI();
                    newPromptName.value = '';
                })
                .catch(error => console.error('Error adding prompt:', error));
        }
    });

    deletePrompt.addEventListener('click', function() {
        const promptToDelete = promptSelect.value;
        if (promptToDelete !== 'default') {
            fetch('/delete_prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptToDelete })
            })
                .then(response => response.json())
                .then(updatedPrompts => {
                    prompts = updatedPrompts;
                    currentSettings.currentPrompt = 'default';
                    updatePromptsUI();
                })
                .catch(error => console.error('Error deleting prompt:', error));
        }
    });

    function updatePromptsUI() {
        promptSelect.innerHTML = Object.keys(prompts).map(key =>
            `<option value="${key}">${prompts[key].name}</option>`
        ).join('');

        promptSelect.value = currentSettings.currentPrompt;
        promptEditor.value = prompts[currentSettings.currentPrompt].content;
        deletePrompt.classList.toggle('hidden', currentSettings.currentPrompt === 'default');
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
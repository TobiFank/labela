document.addEventListener('DOMContentLoaded', function() {
    const techniqueSelect = document.getElementById('technique');
    const huggingfaceSection = document.getElementById('huggingfaceSection');
    const apikeySection = document.getElementById('apikeySection');
    const quantizedSection = document.getElementById('quantizedSection');
    const captionerForm = document.getElementById('captionerForm');
    const statusDiv = document.getElementById('status');
    const consoleDiv = document.getElementById('console');
    const abortButton = document.getElementById('abortButton');

    // Function to update visibility based on selected technique
    function updateVisibility() {
        if (techniqueSelect.value === 'huggingface') {
            huggingfaceSection.classList.remove('hidden');
            apikeySection.classList.add('hidden');
            quantizedSection.classList.remove('hidden');
        } else {
            huggingfaceSection.classList.add('hidden');
            apikeySection.classList.remove('hidden');
            quantizedSection.classList.add('hidden');
        }
    }

    // Set initial visibility
    updateVisibility();

    techniqueSelect.addEventListener('change', updateVisibility);

    captionerForm.onsubmit = function(e) {
        e.preventDefault();
        var formData = new FormData(this);

        fetch('/run_captioner', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                statusDiv.textContent = data.message;
                abortButton.classList.remove('hidden');
                listenForConsoleOutput();
            })
            .catch(error => console.error('Error:', error));
    };

    abortButton.addEventListener('click', function() {
        fetch('/abort_captioner', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                statusDiv.textContent = data.message;
                abortButton.classList.add('hidden');
            })
            .catch(error => console.error('Error:', error));
    });

    function listenForConsoleOutput() {
        const eventSource = new EventSource('/console_output');

        eventSource.onmessage = function(event) {
            consoleDiv.textContent += event.data + '\n';
            consoleDiv.scrollTop = consoleDiv.scrollHeight;
        };

        eventSource.onerror = function() {
            eventSource.close();
            abortButton.classList.add('hidden');
        };
    }

    // Add model functionality
    const addModelButton = document.getElementById('addModelButton');
    const addModelModal = document.getElementById('addModelModal');
    const newModelInput = document.getElementById('newModelInput');
    const cancelAddModel = document.getElementById('cancelAddModel');
    const confirmAddModel = document.getElementById('confirmAddModel');
    const modelSelect = document.getElementById('model');

    addModelButton.addEventListener('click', function() {
        addModelModal.classList.remove('hidden');
    });

    cancelAddModel.addEventListener('click', function() {
        addModelModal.classList.add('hidden');
        newModelInput.value = '';
    });

    confirmAddModel.addEventListener('click', function() {
        const newModel = newModelInput.value.trim();
        if (newModel) {
            fetch('/add_model', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `model=${encodeURIComponent(newModel)}`
            })
                .then(response => response.json())
                .then(data => {
                    modelSelect.innerHTML = data.map(model => `<option value="${model}">${model}</option>`).join('');
                    addModelModal.classList.add('hidden');
                    newModelInput.value = '';
                })
                .catch(error => console.error('Error:', error));
        }
    });

    // Remove model functionality
    const removeModelButton = document.getElementById('removeModelButton');

    removeModelButton.addEventListener('click', function() {
        const selectedModel = modelSelect.value;
        if (selectedModel) {
            fetch('/remove_model', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `model=${encodeURIComponent(selectedModel)}`
            })
                .then(response => response.json())
                .then(data => {
                    modelSelect.innerHTML = data.map(model => `<option value="${model}">${model}</option>`).join('');
                })
                .catch(error => console.error('Error:', error));
        }
    });

    const shutdownButton = document.getElementById('shutdownButton');
    const shutdownModal = document.getElementById('shutdownModal');
    const cancelShutdown = document.getElementById('cancelShutdown');
    const confirmShutdown = document.getElementById('confirmShutdown');

    shutdownButton.addEventListener('click', function() {
        shutdownModal.classList.remove('hidden');
    });

    cancelShutdown.addEventListener('click', function() {
        shutdownModal.classList.add('hidden');
    });

    confirmShutdown.addEventListener('click', function() {
        fetch('/shutdown', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                shutdownModal.classList.add('hidden');
                alert('Server is shutting down. You can close this tab now.');
            })
            .catch(error => console.error('Error:', error));
    });

    const settingsButton = document.getElementById('settingsButton');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const promptEditor = document.getElementById('promptEditor');
    const temperatureSlider = document.getElementById('temperatureSlider');
    const temperatureValue = document.getElementById('temperatureValue');
    const resetSettings = document.getElementById('resetSettings');
    const saveSettings = document.getElementById('saveSettings');

    let currentSettings = {};

    // Fetch settings when the page loads
    fetchSettings();

    settingsButton.addEventListener('click', function() {
        // Ensure settings are up to date when opening the modal
        fetchSettings().then(() => {
            settingsModal.classList.remove('hidden');
        });
    });

    closeSettings.addEventListener('click', function() {
        settingsModal.classList.add('hidden');
    });

    function fetchSettings() {
        return fetch('/get_settings')
            .then(response => response.json())
            .then(data => {
                currentSettings = data;
                updateSettingsUI(data);
            })
            .catch(error => console.error('Error:', error));
    }

    function updateSettingsUI(data) {
        promptEditor.value = data.prompt;
        temperatureSlider.value = data.temperature;
        temperatureValue.textContent = data.temperature;
    }

    temperatureSlider.addEventListener('input', function() {
        temperatureValue.textContent = this.value;
    });

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
            temperature: parseFloat(temperatureSlider.value)
        };

        fetch('/save_settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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

    // Tab functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });
});
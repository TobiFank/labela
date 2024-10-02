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
});
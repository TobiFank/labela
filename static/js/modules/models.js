export function initModels() {
    const addModelButton = document.getElementById('addModelButton');
    const addModelModal = document.getElementById('addModelModal');
    const newModelInput = document.getElementById('newModelInput');
    const cancelAddModel = document.getElementById('cancelAddModel');
    const confirmAddModel = document.getElementById('confirmAddModel');
    const modelSelect = document.getElementById('model');
    const removeModelButton = document.getElementById('removeModelButton');

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
}
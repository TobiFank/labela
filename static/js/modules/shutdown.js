export function initShutdown() {
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
}
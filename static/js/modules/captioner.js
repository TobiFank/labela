export function initCaptioner() {
    const captionerForm = document.getElementById('captionerForm');
    const statusDiv = document.getElementById('status');
    const consoleDiv = document.getElementById('console');
    const abortButton = document.getElementById('abortButton');

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
}
export function initTechnique() {
    const techniqueSelect = document.getElementById('technique');
    const huggingfaceSection = document.getElementById('huggingfaceSection');
    const apikeySection = document.getElementById('apikeySection');
    const quantizedSection = document.getElementById('quantizedSection');

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

    updateVisibility();
    techniqueSelect.addEventListener('change', updateVisibility);
}

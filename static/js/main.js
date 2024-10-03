import { initTechnique } from './modules/technique.js';
import { initCaptioner } from './modules/captioner.js';
import { initModels } from './modules/models.js';
import { initShutdown } from './modules/shutdown.js';
import { initSettings } from './modules/settings.js';

document.addEventListener('DOMContentLoaded', function() {
    initTechnique();
    initCaptioner();
    initModels();
    initShutdown();
    initSettings();
});

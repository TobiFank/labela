import json
import os
import queue
import signal
import subprocess
import sys
import threading

from flask import Flask, render_template, request, jsonify, Response
from config import CONFIG_FILE, INPUT_FOLDER, OUTPUT_FOLDER

app = Flask(__name__)

output_queue = queue.Queue()

captioner_thread = None
abort_flag = threading.Event()

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    return {'api_key': '', 'trigger_word': '', 'huggingface_models': ['microsoft/git-base-coco']}

def save_config(config):
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f)

@app.route('/')
def index():
    config = load_config()
    return render_template('index.html', config=config)

@app.route('/run_captioner', methods=['POST'])
def run_captioner():
    global captioner_thread, abort_flag
    abort_flag.clear()
    config = load_config()
    technique = request.form['technique']
    trigger = request.form['trigger']
    api_key = request.form['api_key'] if request.form['api_key'] else config['api_key']
    model = request.form['model'] if technique == 'huggingface' else ''

    quantized = request.form.get('quantized', 'false').lower() == 'true'

    config['trigger_word'] = trigger
    if technique == 'apikey':
        config['api_key'] = api_key
    save_config(config)

    def run_script():
        cmd = [sys.executable, 'image_captioner.py', technique]
        if trigger:
            cmd.extend(['--trigger', trigger])
        if technique == 'apikey':
            cmd.extend(['--api_key', api_key])
        elif technique == 'huggingface':
            cmd.extend(['--model', model])
        if quantized:
            cmd.append('--quantize')
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1, universal_newlines=True)
        while True:
            if abort_flag.is_set():
                process.terminate()
                output_queue.put("Process aborted by user.")
                break

            line = process.stdout.readline()
            if not line and process.poll() is not None:
                break
            if line:
                output_queue.put(line)

        output_queue.put(None)  # Signal that the process has finished

    captioner_thread = threading.Thread(target=run_script)
    captioner_thread.start()

    return jsonify({"message": "Captioning process started"})

@app.route('/abort_captioner', methods=['POST'])
def abort_captioner():
    global abort_flag

    if captioner_thread and captioner_thread.is_alive():
        abort_flag.set()
        captioner_thread.join()  # Wait for the thread to finish
        return jsonify({"message": "Captioning process aborted"})
    else:
        return jsonify({"message": "No active captioning process to abort"})

@app.route('/console_output')
def console_output():
    def generate():
        while True:
            output = output_queue.get()
            if output is None:
                break
            yield f"data: {output}\n\n"

    return Response(generate(), mimetype='text/event-stream')

@app.route('/add_model', methods=['POST'])
def add_model():
    config = load_config()
    new_model = request.form['model']
    if new_model not in config['huggingface_models']:
        config['huggingface_models'].append(new_model)
        save_config(config)
    return jsonify(config['huggingface_models'])

@app.route('/remove_model', methods=['POST'])
def remove_model():
    config = load_config()
    model_to_remove = request.form['model']
    if model_to_remove in config['huggingface_models']:
        config['huggingface_models'].remove(model_to_remove)
        save_config(config)
    return jsonify(config['huggingface_models'])

@app.route('/shutdown', methods=['POST'])
def shutdown():
    # Shutdown the Flask app
    os.kill(os.getpid(), signal.SIGINT)
    return jsonify({"message": "Server shutting down..."})

@app.route('/get_prompt')
def get_prompt():
    with open('prompts.json', 'r') as f:
        prompts = json.load(f)
    return jsonify({'prompt': prompts['openai_api_captioner']['user'] or prompts['openai_api_captioner']['default']})

@app.route('/get_settings')
def get_settings():
    with open('settings.json', 'r') as f:
        settings = json.load(f)
    return jsonify(settings)

@app.route('/save_settings', methods=['POST'])
def save_settings():
    new_settings = request.json
    with open('settings.json', 'w') as f:
        json.dump(new_settings, f, indent=2)
    return jsonify({'message': 'Settings saved successfully'})

@app.route('/reset_settings')
def reset_settings():
    default_settings = {
        'prompt': "I will show you some examples of image captions. Then, I want you to caption a new image in a similar style, focusing ONLY on what you can directly observe in the image. Follow these strict guidelines:\n\n1. Describe the building, its location, and visible surroundings using ONLY factual, objective terms.\n2. State the weather conditions visible in the image without interpretation.\n3. Describe any visible street-level activity or urban elements factually.\n4. If present, describe the geometric facade of the building in detail, focusing on its observable features.\n5. DO NOT use subjective or interpretive language like \"striking,\" \"beautiful,\" \"serene,\" or \"inviting.\"\n6. DO NOT make assumptions about atmosphere, feelings, or anything not directly visible in the image.\n7. DO NOT use flowery or poetic language. Stick to clear, factual descriptions.\n8. Focus solely on what is visible - do not invent or imagine elements not shown in the image.\n\nHere are some example captions:\n\n{example_captions}\n\nNow, caption the new image using ONLY objective, factual descriptions of what you can directly observe. Do not use any subjective or interpretive language. Describe the image as if you are a camera, not a poet or storyteller.",
        'temperature': 0.7
    }
    with open('settings.json', 'w') as f:
        json.dump(default_settings, f, indent=2)
    return jsonify(default_settings)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
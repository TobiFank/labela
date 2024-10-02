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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
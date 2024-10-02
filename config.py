import os

# Get the project root directory
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

# Define paths relative to the project root
INPUT_FOLDER = os.path.join(PROJECT_ROOT, "images_to_caption")
OUTPUT_FOLDER = os.path.join(PROJECT_ROOT, "images_to_caption")
EXAMPLES_FOLDER = os.path.join(PROJECT_ROOT, "example_images")

CONFIG_FILE = os.path.join(PROJECT_ROOT, 'config.json')

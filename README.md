# Image Caption Generator

A modern web application for generating and managing image captions using various AI models.

## Features

- Training data generation interface
- Batch processing capabilities
- Multiple AI model support (OpenAI, HuggingFace)
- Real-time processing status
- Caption review and editing
- Cost estimation and tracking

## Prerequisites

- Docker
- Docker Compose
- OpenAI API key (for OpenAI models)
- HuggingFace API key (for HuggingFace models)

## Setup

1. Clone the repository:
```bash
git clone [repository-url]
cd image-caption-generator
```

2. Create and configure environment variables:
```bash
cp .env.template .env
```
Edit the `.env` file with your API keys and preferences.

3. Build the Docker images (only required for the first time):
```bash
docker compose build
```

4. Start the application:
```bash
docker compose up -d
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Project Structure

```
.
├── frontend/              # Next.js frontend application
├── backend/              # FastAPI backend application
├── data/                 # Data directories
│   ├── examples/        # Example images and captions
│   ├── input/          # Input images for processing
│   └── output/         # Generated captions and metadata
├── docker-compose.yml    # Docker Compose configuration
├── .env                 # Environment variables
└── README.md            # This file
```

## Usage

1. Access the web interface at http://localhost:3000
2. Choose between Training Data Generator or Batch Processing
3. Configure your settings (API keys, models, etc.)
4. Start processing images

### Training Data Generator

Use this mode to:
- Upload example pairs
- Test caption generation
- Fine-tune prompts
- Preview model inputs

### Batch Processing

Use this mode to:
- Process multiple images
- Monitor progress
- Review and edit captions
- Track costs and performance

## Development

To modify the application:

1. Frontend changes:
```bash
cd frontend
npm install
npm run dev
```

2. Backend changes:
```bash
cd backend
poetry install
poetry run uvicorn app.main:app --reload
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

[Your chosen license]
# Job Assignment System

AI-powered job matching system that analyzes candidate CVs and matches them with compatible job positions using Gemini AI.

## Features

- **Kanban Interface**: Visual board showing candidates and job positions
- **AI Matching**: Gemini AI analyzes CVs and job requirements to find compatible matches
- **CV Upload**: Support for PDF upload with automatic text extraction
- **Compatibility Scoring**: Each match includes a compatibility score (0-100%) and reasoning
- **Real-time Updates**: Instant UI updates when adding users, jobs, or running matches

## Tech Stack

- **Backend**: Bun + Hono
- **Database**: SQLite with Drizzle ORM
- **Storage**: Minio for PDF files
- **AI**: Google Gemini API
- **PDF Processing**: pdf-parse
- **Frontend**: Vanilla JavaScript with custom CSS
- **Containerization**: Docker & Docker Compose

## Prerequisites

- [Bun](https://bun.sh/) (v1.0+) or Docker
- [Gemini API Key](https://aistudio.google.com/app/apikey)

## Quick Start with Docker

1. **Clone and setup environment**:
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

2. **Start the application**:
   ```bash
   docker-compose up --build
   ```

3. **Access the application**:
   - App: http://localhost:5555
   - Minio runs internally on the Docker network (not exposed to host)

## Local Development

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Setup database**:
   ```bash
   bun run db:setup
   ```

3. **Start Minio** (in a separate terminal):
   ```bash
   docker run -p 9000:9000 -p 9001:9001 \
     -e MINIO_ROOT_USER=minioadmin \
     -e MINIO_ROOT_PASSWORD=minioadmin \
     minio/minio server /data --console-address ":9001"
   ```

4. **Set environment variables**:
   ```bash
   export GEMINI_API_KEY=your_api_key_here
   export MINIO_ENDPOINT=localhost
   ```

5. **Start the development server**:
   ```bash
   bun run dev
   ```

6. **Open**: http://localhost:5555

   **Note:** When running locally, Minio will be accessible at localhost:9000. For production use with Docker Compose, Minio is isolated on the internal network.

## Usage

### Adding Candidates

1. Click **"+ User"** button
2. Fill in candidate details:
   - Name and email (required)
   - Skills (optional, comma-separated)
   - CV text (paste directly) OR upload PDF
3. Click **"Add Candidate"**

### Adding Job Positions

1. Click **"+ Job"** button
2. Fill in job details:
   - Title, description, and requirements (required)
   - Location and salary (optional)
3. Click **"Add Position"**

### Running AI Matching

1. Ensure you have at least one candidate with CV/skills and one job
2. Click **"RUN MATCH"** button
3. Wait for Gemini AI to analyze and match
4. View compatibility tags on candidate and job cards
5. Hover over tags to see reasoning

## API Endpoints

- `GET /api/users` - Get all candidates
- `POST /api/users` - Add new candidate
- `POST /api/users/:id/upload-cv` - Upload CV PDF
- `DELETE /api/users/:id` - Delete candidate
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Add new job
- `DELETE /api/jobs/:id` - Delete job
- `GET /api/matches` - Get all matches
- `POST /api/match` - Run AI matching for all users and jobs

## Project Structure

```
.
├── src/
│   ├── db/
│   │   ├── schema.ts        # Database schema
│   │   ├── index.ts         # Database connection
│   │   └── setup.ts         # Database initialization
│   ├── services/
│   │   ├── gemini.ts        # Gemini AI integration
│   │   ├── minio.ts         # Minio storage client
│   │   └── pdf.ts           # PDF text extraction
│   └── index.ts             # Main application server
├── static/
│   ├── index.html           # Frontend HTML
│   ├── style.css            # Styles
│   └── app.js               # Frontend JavaScript
├── data/
│   └── jobs.db              # SQLite database (auto-created)
├── Dockerfile
├── docker-compose.yaml
└── package.json
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key (required) | - |
| `PORT` | Application port | 5555 |
| `MINIO_ENDPOINT` | Minio server endpoint | minio |
| `MINIO_PORT` | Minio server port | 9000 |
| `MINIO_USE_SSL` | Use SSL for Minio | false |
| `MINIO_ACCESS_KEY` | Minio access key | minioadmin |
| `MINIO_SECRET_KEY` | Minio secret key | minioadmin |

## Design Philosophy

The UI features an **Industrial-Editorial** aesthetic:
- Bold, condensed typography (Bebas Neue)
- Elegant serif body text (Crimson Pro)
- Monospace accents (JetBrains Mono)
- Dark theme with layered textures
- Vibrant accent colors for status indicators
- Smooth, confident animations

## Troubleshooting

**Minio connection errors**:
- Ensure Minio is running before starting the app
- Check `MINIO_ENDPOINT` matches your setup (localhost for local, minio for Docker)

**Gemini API errors**:
- Verify your API key is valid
- Check you have API quota available
- Ensure candidates have CV text or skills before matching

**Database errors**:
- Run `bun run db:setup` to reinitialize the database
- Check file permissions on the `data/` directory

## License

MIT

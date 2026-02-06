# Polymorphix

A cloud-native video processing platform built with microservices architecture. Upload videos and get them automatically transcoded to multiple resolutions (1080p, 720p, 480p) with cloud storage on Cloudflare R2.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.12+-blue.svg)
![React](https://img.shields.io/badge/react-19.2-blue.svg)
![FastAPI](https://img.shields.io/badge/fastapi-0.126-green.svg)

## Features

- **Video Upload & Processing** - Upload videos and automatically transcode to multiple resolutions
- **Cloud Storage** - Videos and thumbnails stored on Cloudflare R2 with presigned URLs
- **Async Job Processing** - Celery workers handle video transcoding in the background
- **JWT Authentication** - Secure user authentication with access tokens
- **Responsive UI** - Modern React frontend with dark mode support
- **Video Player** - Built-in Video.js player with quality selection

## Architecture

```mermaid
graph LR
    subgraph Client
        A[React Frontend<br/>:3000]
    end

    subgraph Backend
        B[FastAPI<br/>:8080]
        C[(PostgreSQL<br/>Neon)]
    end

    subgraph Message Queue
        D[RabbitMQ<br/>:5672]
    end

    subgraph Workers
        E[Celery Worker<br/>Transcode]
        F[Celery Worker<br/>Upload]
    end

    subgraph Storage
        G[Cloudflare R2]
    end

    A -->|HTTP/REST| B
    B -->|Prisma ORM| C
    B -->|Queue Tasks| D
    D --> E
    D --> F
    E -->|FFmpeg| F
    F -->|S3 API| G
```

### Video Processing Pipeline

```mermaid
flowchart LR
    A[📤 Upload] --> B[💾 Store Raw]
    B --> C[📋 Queue Job]
    C --> D[🎬 Transcode]
    D --> E[1080p @ 5Mbps]
    D --> F[720p @ 2.5Mbps]
    D --> G[480p @ 1Mbps]
    E --> H[☁️ Upload to R2]
    F --> H
    G --> H
    H --> I[✅ Ready]
```

## Tech Stack

### Backend
- **FastAPI** - Modern async Python web framework
- **Prisma** - Type-safe ORM for PostgreSQL
- **Celery** - Distributed task queue for video processing
- **FFmpeg** - Video transcoding engine
- **RabbitMQ** - Message broker for Celery
- **Cloudflare R2** - S3-compatible object storage
- **JWT** - Token-based authentication

### Frontend
- **React 19** - UI framework with hooks
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS
- **Video.js** - HTML5 video player
- **React Hook Form** - Form management
- **Axios** - HTTP client

### Infrastructure
- **Docker Compose** - Container orchestration
- **PostgreSQL** - Primary database (Neon serverless)
- **Prisma Studio** - Database GUI (optional)

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 22+ (for local frontend development)
- Python 3.12+ (for local backend development)
- Cloudflare R2 bucket with API credentials

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/polymorphix.git
   cd polymorphix
   ```

2. **Configure backend environment**
   ```bash
   cp server/.env.example server/.env
   ```

   Edit `server/.env` with your credentials:
   ```env
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   JWT_SECRET_KEY=your-secret-key-here

   R2_ACCOUNT_ID=your-cloudflare-account-id
   R2_ACCESS_KEY=your-r2-access-key
   R2_SECRET_KEY=your-r2-secret-key
   R2_BUCKET_NAME=your-bucket-name
   R2_PUBLIC_URL=https://pub-xxx.r2.dev

   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

3. **Configure frontend environment**
   ```bash
   cp client/.env.example client/.env
   ```

   Edit `client/.env`:
   ```env
   VITE_API_URL=http://localhost:8080
   ```

### Running with Docker

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

Services will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **Prisma Studio**: http://localhost:5555

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/signin` | Login user |
| GET | `/auth/me` | Get current user |

### Videos
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/videos` | List user's videos |
| POST | `/videos/upload` | Upload new video |
| DELETE | `/videos/{id}` | Delete single video |
| DELETE | `/videos` | Delete all videos |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Welcome message |
| GET | `/health` | Health check |

## Project Structure

```
polymorphix/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React context providers
│   │   ├── lib/            # API client & utilities
│   │   └── pages/          # Page components
│   └── package.json
│
├── server/                 # FastAPI backend
│   ├── app/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic (R2, etc.)
│   │   ├── tasks/          # Celery tasks
│   │   └── schemas/        # Pydantic models
│   ├── prisma/             # Database schema
│   └── pyproject.toml
│
└── docker-compose.yml      # Container orchestration
```

## Video Processing Pipeline

1. **Upload**: User uploads video via frontend
2. **Store**: Raw video saved to `/video_queue` volume
3. **Queue**: `process_video` task dispatched to Celery
4. **Transcode**: FFmpeg creates 3 resolution variants
5. **Thumbnail**: Screenshot extracted at 10% of duration
6. **Upload**: Variants uploaded to R2 via `upload` queue
7. **Ready**: Database updated, video available to stream

## Configuration

### CORS Origins
Configure allowed origins in `server/.env`:
```env
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Video Quality Presets
Configured in `server/app/tasks/video_tasks.py`:
```python
RESOLUTIONS = [
    {"name": "1080", "height": 1080, "bitrate": 5000},
    {"name": "720", "height": 720, "bitrate": 2500},
    {"name": "480", "height": 480, "bitrate": 1000},
]
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Video.js](https://videojs.com/) - Open source video player
- [Cloudflare R2](https://www.cloudflare.com/products/r2/) - S3-compatible storage
- [shadcn/ui](https://ui.shadcn.com/) - UI component library

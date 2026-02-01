FROM python:3.12

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /server

COPY pyproject.toml uv.lock ./

RUN uv sync --frozen

COPY prisma ./prisma

RUN uv run prisma generate

COPY app ./app
COPY main.py .

EXPOSE 8080

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--reload"]

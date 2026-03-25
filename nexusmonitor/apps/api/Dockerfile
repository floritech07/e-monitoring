# syntax=docker/dockerfile:1
FROM python:3.12-slim AS builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --user -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
RUN useradd -m nexus && chown -R nexus:nexus /app

COPY --from=builder /root/.local /home/nexus/.local
COPY ./apps/api ./apps/api
COPY ./packages ./packages

ENV PATH=/home/nexus/.local/bin:$PATH
USER 1000

EXPOSE 8000
CMD ["uvicorn", "apps.api.main:app", "--host", "0.0.0.0", "--port", "8000"]

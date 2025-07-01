FROM python:3.10-slim-buster

# Install postgresql-client for wait-for-db.sh
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --force-reinstall -r requirements.txt

COPY backend/app ./app
COPY backend/create_admin.py .
COPY frontend ./frontend

EXPOSE 8000

COPY backend/wait-for-db.sh .
RUN chmod +x wait-for-db.sh

CMD ["./wait-for-db.sh", "db", "sh", "-c", "python create_admin.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
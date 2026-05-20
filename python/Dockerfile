FROM python:3.11-slim

WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt && \
    pip install notebook ipykernel

# Copy your app code
COPY . /app

# Add startup script
COPY ./scripts/start.sh /start.sh
RUN chmod +x /start.sh

ENV PYTHONPATH=/app

EXPOSE 5001

CMD ["/start.sh"]
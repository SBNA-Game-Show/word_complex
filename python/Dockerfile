FROM python:3.11-slim

WORKDIR /app

RUN mkdir -p /app/jupyter_notebook

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt && \
    pip install notebook ipykernel

# Download spaCy English model
RUN python -m spacy download en_core_web_sm
RUN python -c "import stanza; stanza.download('sa')"

# Copy your app code
COPY . /app

# Add startup script
COPY ./scripts/start.sh /start.sh
RUN chmod +x /start.sh

ENV PYTHONPATH=/app

EXPOSE 5001

CMD ["/start.sh"]
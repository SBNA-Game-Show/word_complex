FROM python:3.11-slim

WORKDIR /app


# Copy requirements
COPY requirements_prod.txt .


RUN apt-get update && \
    apt-get install -y ca-certificates && \
    update-ca-certificates

# Install Python dependencies
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r requirements_prod.txt 

# Download spaCy English model
RUN python -m spacy download en_core_web_sm
RUN python -c "import stanza; stanza.download('sa')"

# Copy your app code
COPY . /app

# Add startup script
COPY ./scripts/prodstart.sh /prodstart.sh
RUN chmod +x /prodstart.sh

ENV PYTHONPATH=/app

EXPOSE 7860

CMD ["/prodstart.sh"]
# Build stage: install dependencies
FROM python:3.9-slim AS builder
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y gcc

# Copy dependency list and install them into a dedicated prefix
COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --prefix=/install -r requirements.txt

# Copy the rest of the application code into the image
COPY . .

# Final stage: use a regular Python slim image for runtime
FROM python:3.9-slim
WORKDIR /app

# Copy application code and installed packages from the builder image
COPY --from=builder /app /app
COPY --from=builder /install /usr/local

# Set PYTHONPATH so Python finds the installed packages
ENV PYTHONPATH=/usr/local/lib/python3.9/site-packages

# Run the agent script (adjust the entrypoint as needed)
ENTRYPOINT ["python3", "realtime_agent.py", "start"]

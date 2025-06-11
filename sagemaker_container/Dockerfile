FROM python:3.10-slim

WORKDIR /app

# Instala libgomp para que LightGBM funcione
RUN apt-get update && apt-get install -y libgomp1

# Copiar archivos del modelo y código
COPY app/ ./app/
COPY app/models /app/models

# Instalar dependencias
COPY app/requirements-deploy.txt .
RUN pip install --no-cache-dir -r requirements-deploy.txt

# Puerto que usará SageMaker
EXPOSE 8080

# Ejecutar la app
CMD ["python", "app/inference.py"]

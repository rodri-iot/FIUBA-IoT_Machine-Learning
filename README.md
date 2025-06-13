# 🏦 FIUBA-IoT_Machine-Learning: Predicción Inteligente Bancaria

## 🌟 Descripción del Proyecto
Este proyecto tiene como objetivo optimizar campañas de marketing bancario mediante la predicción de qué clientes son más propensos a aceptar un depósito a plazo fijo. Se aplican técnicas avanzadas de Machine Learning y análisis de datos para mejorar la eficiencia, reducir costos y personalizar la experiencia del cliente.

## 🧠 ¿Qué hace?
Permite ingresar los datos de un posible cliente y, con base en un modelo de Machine Learning entrenado con LightGBM, predecir si suscribirá un depósito a plazo. La app también muestra la importancia de cada variable usando SHAP.

## 🛠️ Tecnologías Utilizadas
- **Machine Learning:** Python, Scikit-learn, LightGBM, Pandas, NumPy, Matplotlib, Seaborn
- **Frontend:** React + Vite (desplegado en AWS S3)
- **Backend:** Python Flask (desplegado en AWS EC2)
- **Infraestructura:** Docker, EC2, S3, GitHub

## 🧪 Proceso de Desarrollo
- **Exploración de Datos (EDA):** análisis descriptivo, detección de patrones.
- **Preprocesamiento:** normalización, reducción de variables, codificación.
- **Modelado:** comparación de modelos, selección de LightGBM como final.
- **Métricas:** precisión, recall y ROC-AUC (con foco en recall por el desbalanceo).
- **Interpretabilidad:** explicación con SHAP values.

## 🖥️ App Web Interactiva
Disponible aquí 👉 http://fiuba-frontend-ml-bank-prediction.s3-website-us-east-1.amazonaws.com/

### 🧪 Casos Precargados
Simulaciones para operadores que deseen predecir resultados durante llamadas reales a clientes.

## 📊 Ejemplo de Predicción
- `1` = El cliente 🔴 **NO hará** un depósito a plazo.
- `0` = El cliente 🟢 **SÍ hará** un depósito a plazo.

## 📥 Descargar el Modelo
Próximamente disponible.

## 📂 Estructura del Proyecto
```
frontend/       --> React + Vite + estilos
backend/        --> Flask + modelo ML + endpoints REST
models/         --> Modelos entrenados (.joblib)
data/           --> Datos de entrada y prueba
```

## 📌 Próximos Pasos
- Mejorar el modelo con más variables y datos históricos.
- Reemplazar servicio Docker simulado por un endpoint real en SageMaker.
- Implementar HTTPS con dominio propio.

## 👨‍💻 Autor
Rodrigo Pinedo  
📩 rodrigo.j.pinedo@gmail.com  
🔗 [LinkedIn](https://www.linkedin.com/in/rodrigopinedo/) | [GitHub](https://github.com/rodri-iot)

---
Proyecto académico FIUBA - Ingeniería en IoT y Machine Learning
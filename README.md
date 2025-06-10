# FIUBA-IoT_Machine-Learning

El objetivo es evaluar los datos, realizando un análisis descriptivo y evaluar una serie de modelos de clasificación y elegir el que mejor  resultados obtiene prediciendo la columna 21 que representa si se suscribe al servicio correspondiente.

# 🏦 Marketing Bancario Inteligente: Predicción de Suscripciones a Depósitos a Plazo
---

## 🌟 **Descripción del Proyecto**
Este proyecto tiene como objetivo optimizar las campañas de marketing bancario mediante la predicción de qué clientes son más propensos a aceptar un depósito a plazo fijo. Utilizamos técnicas avanzadas de Machine Learning y análisis de datos para mejorar la eficiencia, reducir costos y personalizar la experiencia del cliente.

---

## 🛠️ **Herramientas y Tecnologías**
- **Lenguaje:** Python
- **Frameworks y Librerías:**
  - Pandas, NumPy, Scikit-learn, LightGBM, XGBoost, Matplotlib, Seaborn, Plotly, Streamlit
- **Infraestructura:**
  - Jupyter Notebook para desarrollo
  - Streamlit para visualización interactiva

---

## 🧪 **Proceso de Desarrollo**
1. **Exploración y Análisis de Datos (EDA):**
   - Análisis descriptivo y gráfico de las variables.
   - Identificación de patrones y relaciones clave.
   
2. **Preprocesamiento de Datos:**
   - Transformaciones como Yeo-Johnson para normalizar variables.
   - Agrupación de categorías y eliminación de outliers.
   - Creación de variables derivadas, como trimestres y campañas previas.

3. **Modelos Predictivos:**
   - Entrenamiento de tres modelos principales:
     - **Random Forest**
     - **XGBoost**
     - **LightGBM** (modelo final seleccionado)
   - Evaluación basada en métricas como *recall* y *f1-score* debido al desbalanceo del dataset.

4. **Resultados:**
   - El modelo LightGBM alcanzó un **recall del 86%**, lo que significa que identifica correctamente a la mayoría de los clientes propensos a aceptar la oferta.

5. **Implementación Interactiva:**
   - Despliegue de una aplicación interactiva con Streamlit para simular predicciones basadas en inputs del usuario.

---

## 📊 **Resultados Clave**
- **Optimización de Recursos:**
  - El modelo permite enfocar las campañas en clientes más propensos, reduciendo costos y mejorando la tasa de conversión.
- **Incremento Proyectado:**
  - Un posible aumento del 20% en la efectividad de las campañas.
- **Beneficios para el Cliente:**
  - Interacciones personalizadas y menos intrusivas.

---

## 🖥️ **Cómo Usar el Proyecto**

### **1. Requisitos Previos**
- Instalar Python 3.8 o superior.
- Clonar este repositorio:
  ```bash
  git clone https://github.com/rodri-iot/Challenge_Python_Bank.git
  cd Challenge_Python_Bank
  ```
---

## Estructura

El proyecto está organizado de la siguiente manera:

``` 
|-- `app.py` - El script principal de Python que ejecutas para tu proyecto.
|-- `explore.py` - Un notebook para que puedas hacer tus exploraciones, idealmente el codigo de este notebook se migra hacia app.py para subir a produccion.
|-- `utils.py` - Este archivo contiene código de utilidad para operaciones como conexiones de base de datos.
|-- `requirements.txt` - Este archivo contiene la lista de paquetes de Python necesarios.
|-- `models/` - Este directorio debería contener tus clases de modelos SQLAlchemy.
|-- `data/` - Este directorio contiene los siguientes subdirectorios:
  |--- `interim/` - Para datos intermedios que han sido transformados.
  |--- `processed/` - Para los datos finales a utilizar para el modelado.
  |--- `raw/` - Para datos brutos sin ningún procesamiento.
```
---

## Configuración

**Pre requisitos**

Asegúrate de tener Python 3.11+ instalado en tu máquina. También necesitarás pip para instalar los paquetes de Python.

**Instalación**

Clona el repositorio del proyecto en tu máquina local.

Navega hasta el directorio del proyecto e instala los paquetes de Python requeridos:

```bash
pip install -r requirements.txt
```

**Crear una base de datos (si es necesario)**

Crea una nueva base de datos dentro del motor Postgres personalizando y ejecutando el siguiente comando: `$ createdb -h localhost -U <username> <db_name>`
Conéctate al motor Postgres para usar tu base de datos, manipular tablas y datos: `$ psql -h localhost -U <username> <db_name>`
NOTA: Recuerda revisar la información del archivo ./.env para obtener el nombre de usuario y db_name.

¡Una vez que estés dentro de PSQL podrás crear tablas, hacer consultas, insertar, actualizar o eliminar datos y mucho más!

**Variables de entorno**

Crea un archivo .env en el directorio raíz del proyecto para almacenar tus variables de entorno, como tu cadena de conexión a la base de datos:

```makefile
DATABASE_URL="your_database_connection_url_here"
```

## Ejecutando la Aplicación

Para ejecutar la aplicación, ejecuta el script app.py desde la raíz del directorio del proyecto:

```bash
python app.py
```
---

## Añadiendo Modelos

Para añadir clases de modelos SQLAlchemy, crea nuevos archivos de script de Python dentro del directorio models/. Estas clases deben ser definidas de acuerdo a tu esquema de base de datos.

Definición del modelo de ejemplo (`models/example_model.py`):

```py
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String

Base = declarative_base()

class ExampleModel(Base):
    __tablename__ = 'example_table'
    id = Column(Integer, primary_key=True)
    name = Column(String)

```
---

## Ejecutar la Aplicación

```bash
  streamlit run src/fp_ds_bank.py
```
También puede ingresar al [LINK](https://bank-marketing-4geeks.streamlit.app/)

---

## 📥 Descargar el Modelo

Puedes descargar el modelo entrenado para tus experimentos: [Descargar Modelo LightGBM](https://github.com/rodri-iot/Final_Project_Data_Science/blob/main/models/lightgbm_model.joblib)

---

## 🎯 Próximos Pasos

- Ampliar el modelo para otros productos financieros, como préstamos o tarjetas de crédito.
- Mejorar la personalización utilizando datos adicionales, como historial de transacciones.
- Desplegar el modelo en un entorno de producción para campañas en tiempo real.

---

## Colaboradores

- Rodrigo Pinedo
- rodrigo.j.pinedo@gmail.com
- LinkedIn: https://www.linkedin.com/in/rodrigopinedo/

# 📊 Desafio para Grupo ST

**Autor:** Rodrigo Pinedo  
**Fecha:** 12 de mayo del 2025

**Video:** https://www.loom.com/share/d9eb4896e4994ddca1288b767cb2edba?sid=9ac55204-3936-46c1-9150-8cc4ef3439cf  

**Repositorio:** https://github.com/rodri-iot/Challenge_Python_Bank/tree/main

---

## 🎯 Objetivo del Proyecto

- Predecir si un cliente se suscribirá a un depósito a plazo.

---

## 🎯 Metodología

<img src="../data/img/image-3.png" alt="metodologia" width="60%">

---

## 📁 Dataset

- Fuente: Bank Marketing Dataset (versión ajustada)
- 20 variables predictoras después del preprocesamiento
- Variable objetivo: `y` → 1 = sí, 0 = no
- Distribución desbalanceada: ~11% clase positiva (`y=1`)

---

## 🛠️ Preprocesamiento

| Variable Original | Transformación Aplicada                                                                                        | Tipo de Acción           | Justificación                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------- |
| `duration`        | ❌ Eliminar                                                                                                     | Eliminación              | Provoca *data leakage* (conocida post-llamada).               |
| `age`             | Crear rangos de edad (0: 17–25, ..., 5: 65+)                                                                   | Discretización (binning) | Mejora interpretabilidad y capta no linealidades.             |
| `campaign`        | Limitar a un máximo de 7 (winsorización)                                                                       | Reducción de outliers    | Evita distorsión por insistencia excesiva.                    |
| `pdays`           | `prev_contacted` 0: yes, 1: 999 = no                                                                      | Binarización             | Captura si el cliente fue contactado antes.                   |
| `previous`        | `had_contact` 1: yes > 0; 0: yes = 0                                                                           | Binarización             | Indica si el cliente respondió a campañas anteriores.         |
| `emp.var.rate`    | Mantener sin cambios                                                                                           | Conservación directa     | Variable económica clave. No requiere transformación.         |
| `euribor3m`       | Incluir en índice `economic_index`                                                                             | Feature engineering      | Alta colinealidad. Mejor usar valor combinado.                |
| `nr.employed`     | Mantener sin cambios                                                                                           | Conservación directa     | Complementa el contexto económico.                            |
| `cons.price.idx`  | Incluir en índice `economic_index`                                                                             | Feature engineering      | Moderada correlación con otras macroeconómicas.               |
| `cons.conf.idx`   | Incluir en índice `economic_index`                                                                             | Feature engineering      | Aporta al sentimiento económico general.                      |
| `job`             | Reagrupar en sectores:<br>1: manual (blue-collar, etc.)<br>2: profesional<br>3: sin actividad<br>4: otros      | Binning semántico        | Reduce dimensionalidad sin perder significado económico.      |
| `marital`         | Codificación:<br>0: single<br>1: married<br>2: divorced/unknown                                                | Codificación ordinal     | Mantiene segmentación clave.                                  |
| `education`       | Codificación ordinal:<br>0: illiterate ... 6: university.degree                                                | Codificación ordinal     | Representa jerarquía educativa.                               |
| `default`         | Binarizar:<br>0: no<br>1: yes o unknown                                                                        | Binning simplificado     | Simplifica y evita pérdida por “unknown”.                     |
| `housing`         | Binarizar:<br>0: no<br>1: yes o unknown                                                                        | Binning simplificado     | Idem `default`. Captura carga financiera.                     |
| `loan`            | Binarizar:<br>0: no<br>1: yes o unknown                                                                        | Binning simplificado     | Refleja compromiso financiero.                                |
| `contact`         | Codificación binaria:<br>0: telephone<br>1: cellular                                                           | Binarización             | Canal importante en conversión.                               |
| `month`           | Agrupar en:<br>`Q1`: jan-mar<br>`Q2`: apr-jun<br>`Q3`: jul-sep<br>`Q4`: oct-dec<br>+ categoría separada: `may` | Agrupación personalizada | “may” tiene volumen atípico. Resto se agrupa estacionalmente. |
| `day_of_week`     | ❌ Eliminar                                                                                                     | Eliminación              | No aporta diferenciación predictiva.                          |
| `poutcome`        | One-hot encoding                                                                                               | Codificación categórica  | “success” tiene alto valor predictivo.                        |
| `y`               | Codificación binaria:<br>0: no<br>1: yes                                                                       | Codificación objetivo    | Requerido para clasificación supervisada.                     |


---

## 🧠 Modelos Evaluados

| Modelo              | Técnica de Balanceo          |
|---------------------|------------------------------|
| Random Forest       | `class_weight='balanced'`    |
| LightGBM            | `scale_pos_weight`           |
| Logistic Regression | `class_weight='balanced'`    |
| XGBoost             | `scale_pos_weight`           |

---

## 📊 Métricas de Evaluación

| Modelo         | Recall (y=1) | Precision | F1-score | ROC AUC |
|----------------|--------------|-----------|----------|---------|
| LightGBM       | **0.6171**   | **0.3849**| **0.4741**| **0.7914** |
| XGBoost        | 0.6289       | 0.3601    | 0.4579   | 0.7922  |
| Random Forest  | 0.5786       | 0.3990    | 0.4723   | 0.7852  |
| Logistic Reg.  | 0.6813       | 0.2571    | 0.3733   | 0.7642  |

---

## 📈 Curva ROC

*Comparación visual de la capacidad discriminativa de cada modelo.*  

<img src="../data/img/image.png" alt="curva ROC" width="60%">

---

## 📉 Curva Precision-Recall

*Trade-off entre recall y precision por modelo.*  

<img src="../data/img/image-1.png" alt="curva Precision-Recall" width="60%">

---

## 📌 Importancia de Variables – LightGBM

Top 15 variables más influyentes:  

<img src="../data/img/image-2.png" alt="Variables" width="60%">

---

## ✅ Conclusión

> Se recomienda utilizar **LightGBM** por los siguientes motivos:

| Criterio                          | Resultado                                                         |
| --------------------------------- | ----------------------------------------------------------------- |
| **Recall**                        | 0.6171 — suficientemente alto, en el top 3 de modelos             |
| **Precision**                     | 0.3849 — la segunda más alta entre todos los modelos evaluados    |
| **F1-score**                      | 0.4741 — mejor equilibrio entre precisión y recall                |
| **ROC AUC**                       | 0.7914 — excelente capacidad global de discriminación             |
| **Velocidad / escalabilidad**     | Entrenamiento muy eficiente, ideal para entornos productivos      |
| **Simplicidad en interpretación** | Permite extraer e interpretar fácilmente importancia de variables |

---

## 🔜 Siguientes pasos

- Modelo guardado como `.joblib` y `.pkl` en `/models`
- Listo para integración en una API o dashboard
- Ajuste de umbral posible para diferentes escenarios comerciales

---

## ❓ Preguntas

Gracias por tu atención.

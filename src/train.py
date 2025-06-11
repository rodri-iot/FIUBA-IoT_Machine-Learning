import pandas as pd
import numpy as np
import joblib
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import classification_report, roc_auc_score
from lightgbm import LGBMClassifier
from preprocessing import CustomPreprocessor

RANDOM_STATE = 42
np.random.seed(RANDOM_STATE)

# Paso 1: Cargar dataset
df_raw = pd.read_csv('data/raw/bank-additional-full.csv', sep=';')

# Paso 2: Crear pipeline completo
pipeline = Pipeline([
    ('preprocessing', CustomPreprocessor()),
    ('classifier', LGBMClassifier(random_state=RANDOM_STATE))
])

# Paso 3: Entrenamiento
df_raw['y'] = df_raw['y'].map({'no': 0, 'yes': 1})
X = df_raw.drop(columns=['y'])
y = df_raw['y']
X_train, X_test, y_train, y_test = train_test_split(X, y, stratify=y, test_size=0.2, random_state=RANDOM_STATE)

# Parámetros para búsqueda
scale_weight = (y_train == 0).sum() / (y_train == 1).sum()
param_grid = {
    'classifier__num_leaves': [31, 50],
    'classifier__max_depth': [-1, 10],
    'classifier__learning_rate': [0.05, 0.1],
    'classifier__n_estimators': [100, 200],
    'classifier__scale_pos_weight': [scale_weight]
}

# GridSearch
grid = GridSearchCV(
    estimator=pipeline,
    param_grid=param_grid,
    scoring='recall',
    cv=5,
    verbose=1,
    n_jobs=-1
)

# Entrenar
grid.fit(X_train, y_train)

# Paso 4: Evaluación
best_model = grid.best_estimator_
print("✅ El modelo espera", best_model.named_steps['preprocessing'].fit(X_train).transform(X_train).shape[1], "features después del preprocesamiento")

y_pred = best_model.predict(X_test)
y_proba = best_model.predict_proba(X_test)[:, 1]

print("\n🔍 Mejor configuración:", grid.best_params_)
print("\n🔍 Resultados de evaluación:")
print(classification_report(y_test, y_pred))
print("ROC AUC:", round(roc_auc_score(y_test, y_proba), 4))


# Paso 5: Guardado del pipeline completo
joblib.dump(best_model, 'models/pipeline_model.joblib')
print("✅ Pipeline guardado en: models/pipeline_model.joblib")
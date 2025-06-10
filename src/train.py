import pandas as pd
import numpy as np
import joblib
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.base import BaseEstimator, TransformerMixin
from lightgbm import LGBMClassifier

RANDOM_STATE = 42
np.random.seed(RANDOM_STATE)

# Paso 1: Clase de preprocesamiento
class CustomPreprocessor(BaseEstimator, TransformerMixin):
    def __init__(self):
        self.scaler = StandardScaler()
        self.pca = PCA(n_components=1)

    def fit(self, X, y=None):
        econ_vars = ['euribor3m', 'cons.price.idx', 'cons.conf.idx']
        econ_scaled = self.scaler.fit_transform(X[econ_vars])
        self.pca.fit(econ_scaled)
        return self

    def transform(self, X):
        df = X.copy()
        df['prev_contact'] = np.where(df['pdays'] == 999, 1, 0)
        df['age_bin'] = pd.cut(df['age'], bins=[16, 25, 35, 45, 55, 65, 100],
                               labels=[0, 1, 2, 3, 4, 5]).astype('int64')
        df['campaign'] = df['campaign'].clip(upper=7)

        # PCA
        econ_vars = ['euribor3m', 'cons.price.idx', 'cons.conf.idx']
        econ_scaled = self.scaler.transform(df[econ_vars])
        df['economic_index'] = self.pca.transform(econ_scaled).flatten()

        # Codificaciones
        df['job_group'] = df['job'].map({
            'blue-collar': 1, 'housemaid': 1, 'services': 1,
            'admin.': 2, 'management': 2, 'technician': 2,
            'entrepreneur': 2, 'self-employed': 2,
            'student': 3, 'retired': 3, 'unemployed': 3, 'unknown': 4
        })

        df['marital_code'] = df['marital'].map({'single': 0, 'married': 1, 'divorced': 2, 'unknown': 2})

        df['education_ord'] = df['education'].map({
            'illiterate': 0, 'basic.4y': 1, 'basic.6y': 2, 'basic.9y': 3,
            'high.school': 4, 'professional.course': 5,
            'university.degree': 6, 'unknown': 3
        })

        for col in ['default', 'housing', 'loan']:
            df[col + '_bin'] = df[col].replace({'no': 0, 'yes': 1, 'unknown': 1})

        df['contact_bin'] = df['contact'].map({'telephone': 0, 'cellular': 1})

        df['month_group'] = df['month'].map({
            'jan': 'Q1', 'feb': 'Q1', 'mar': 'Q1',
            'apr': 'Q2', 'may': 'MAY', 'jun': 'Q2',
            'jul': 'Q3', 'aug': 'Q3', 'sep': 'Q3',
            'oct': 'Q4', 'nov': 'Q4', 'dec': 'Q4'
        })

        df = pd.get_dummies(df, columns=['month_group'], prefix='month', drop_first=True)
        df = pd.get_dummies(df, columns=['poutcome'], prefix='pout')

        drop_cols = ['duration', 'age', 'pdays', 'previous',
                     'emp.var.rate', 'euribor3m', 'cons.price.idx', 'cons.conf.idx',
                     'job', 'marital', 'education', 'default',
                     'housing', 'loan', 'contact', 'month', 'day_of_week']

        df = df.drop(columns=drop_cols)

        return df

# Paso 2: Cargar dataset
df_raw = pd.read_csv('data/raw/bank-additional-full.csv', sep=';')

# Paso 3: Crear pipeline completo
pipeline = Pipeline([
    ('preprocessing', CustomPreprocessor()),
    ('classifier', LGBMClassifier(random_state=RANDOM_STATE))
])

# Paso 4: Entrenamiento
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
    cv=3,
    verbose=1,
    n_jobs=-1
)

# Entrenar
grid.fit(X_train, y_train)

# Paso 5: Evaluación
best_model = grid.best_estimator_
y_pred = best_model.predict(X_test)
y_proba = best_model.predict_proba(X_test)[:, 1]

print("\n🔍 Mejor configuración:", grid.best_params_)
print("\n🔍 Resultados de evaluación:")
print(classification_report(y_test, y_pred))
print("ROC AUC:", round(roc_auc_score(y_test, y_proba), 4))


# Paso 6: Guardado del pipeline completo
joblib.dump(best_model, 'models/pipeline_model.joblib')
print("✅ Pipeline guardado en: models/pipeline_model.joblib")
import pandas as pd
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

class CustomPreprocessor(BaseEstimator, TransformerMixin):
    def __init__(self):
        self.scaler = StandardScaler()
        self.pca = PCA(n_components=1)
        self.feature_names_ = None

    def fit(self, X, y=None):
        econ_vars = ['euribor3m', 'cons.price.idx', 'cons.conf.idx']
        econ_scaled = self.scaler.fit_transform(X[econ_vars])
        self.pca.fit(econ_scaled)

        df = self._prepare_features(X)
        self.feature_names_ = df.columns.tolist()
        return self

    def transform(self, X):
        df = self._prepare_features(X)

        for col in self.feature_names_:
            if col not in df.columns:
                df[col] = 0
        df = df[self.feature_names_]

        return df

    def _prepare_features(self, X):
        df = X.copy()
        df['prev_contact'] = np.where(df['pdays'] == 999, 1, 0)
        df['age_bin'] = pd.cut(df['age'], bins=[16, 25, 35, 45, 55, 65, 100],
                               labels=[0, 1, 2, 3, 4, 5]).astype('int64')
        df['campaign'] = df['campaign'].clip(upper=7)

        econ_vars = ['euribor3m', 'cons.price.idx', 'cons.conf.idx']
        econ_scaled = self.scaler.transform(df[econ_vars])
        df['economic_index'] = self.pca.transform(econ_scaled).flatten()

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

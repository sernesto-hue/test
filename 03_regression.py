"""
=============================================================
 XGBoost - Régression
=============================================================
Ce script couvre :
  1. Régression simple (dataset California Housing)
  2. Différentes fonctions de perte
  3. Métriques de régression
  4. Régression avec features catégorielles
  5. Visualisation de l'importance des features
=============================================================
"""

import numpy as np
from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb

# -------------------------------------------------------
# 1. RÉGRESSION DE BASE
# -------------------------------------------------------
print("=" * 60)
print("RÉGRESSION - California Housing")
print("=" * 60)

# Charger le dataset
data = fetch_california_housing()
X, y = data.data, data.target
feature_names = data.feature_names

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"Target : prix médian des maisons (en $100k)")
print(f"Features : {list(feature_names)}")
print(f"Prix moyen : {y.mean():.2f} ($100k)")
print(f"Train : {X_train.shape[0]}, Test : {X_test.shape[0]}")

# Modèle de régression
reg = xgb.XGBRegressor(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.1,
    objective="reg:squarederror",  # MSE classique
    eval_metric="rmse",
    early_stopping_rounds=15,
    random_state=42,
    verbosity=0,
)

reg.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=False,
)

y_pred = reg.predict(X_test)

# Métriques
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"\nRésultats :")
print(f"  RMSE : {rmse:.4f}")
print(f"  MAE  : {mae:.4f}")
print(f"  R2   : {r2:.4f}")
print(f"  Best round : {reg.best_iteration}")

# Importance des features
print("\nImportance des features :")
importances = reg.feature_importances_
indices = np.argsort(importances)[::-1]
for i, idx in enumerate(indices):
    bar = "#" * int(importances[idx] * 50)
    print(f"  {feature_names[idx]:>12s} : {importances[idx]:.3f} {bar}")

# -------------------------------------------------------
# 2. DIFFÉRENTES FONCTIONS DE PERTE
# -------------------------------------------------------
print("\n" + "=" * 60)
print("FONCTIONS DE PERTE POUR LA RÉGRESSION")
print("=" * 60)

# XGBoost supporte plusieurs objectifs de régression :
#   - reg:squarederror  : MSE (sensible aux outliers)
#   - reg:absoluteerror : MAE (robuste aux outliers)
#   - reg:squaredlogerror : log(pred+1) - log(y+1) (pour targets positifs)
#   - reg:pseudohubererror : Huber loss (compromis MSE/MAE)

objectives = {
    "reg:squarederror": "MSE (L2)",
    "reg:absoluteerror": "MAE (L1)",
    "reg:pseudohubererror": "Pseudo-Huber",
}

for obj, name in objectives.items():
    model = xgb.XGBRegressor(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        objective=obj,
        random_state=42,
        verbosity=0,
    )
    model.fit(X_train, y_train)
    pred = model.predict(X_test)

    rmse_val = np.sqrt(mean_squared_error(y_test, pred))
    mae_val = mean_absolute_error(y_test, pred)
    print(f"  {name:>15s} -> RMSE: {rmse_val:.4f}, MAE: {mae_val:.4f}")

# -------------------------------------------------------
# 3. RÉGRESSION QUANTILE
# -------------------------------------------------------
print("\n" + "=" * 60)
print("RÉGRESSION QUANTILE")
print("=" * 60)

# Prédire des intervalles de confiance avec la régression quantile
quantiles = [0.1, 0.5, 0.9]
predictions = {}

for q in quantiles:
    model_q = xgb.XGBRegressor(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        objective="reg:quantileerror",
        quantile_alpha=q,
        random_state=42,
        verbosity=0,
    )
    model_q.fit(X_train, y_train)
    predictions[q] = model_q.predict(X_test)

# Afficher quelques prédictions avec intervalles
print("\nPrédictions avec intervalle de confiance (80%) :")
print(f"  {'Vrai':>8s}  {'Q10':>8s}  {'Q50':>8s}  {'Q90':>8s}  {'Dans IC':>8s}")
print("  " + "-" * 45)

in_interval = 0
for i in range(10):
    inside = predictions[0.1][i] <= y_test[i] <= predictions[0.9][i]
    in_interval += inside
    marker = "oui" if inside else "NON"
    print(
        f"  {y_test[i]:8.3f}  {predictions[0.1][i]:8.3f}  "
        f"{predictions[0.5][i]:8.3f}  {predictions[0.9][i]:8.3f}  {marker:>8s}"
    )

# Couverture globale
coverage = np.mean(
    (predictions[0.1] <= y_test) & (y_test <= predictions[0.9])
)
print(f"\nCouverture de l'intervalle 80% : {coverage:.1%} (attendu : ~80%)")

# -------------------------------------------------------
# 4. FEATURES CATÉGORIELLES (support natif)
# -------------------------------------------------------
print("\n" + "=" * 60)
print("FEATURES CATÉGORIELLES (support natif)")
print("=" * 60)

# XGBoost supporte nativement les features catégorielles
# depuis la version 1.6+ (enable_categorical=True)

# Simuler des données avec features catégorielles
import pandas as pd

np.random.seed(42)
n = 500
df = pd.DataFrame({
    "surface": np.random.uniform(30, 200, n),
    "quartier": np.random.choice(["centre", "banlieue", "campagne"], n),
    "type": np.random.choice(["appartement", "maison", "studio"], n),
    "etage": np.random.randint(0, 10, n),
})

# Target = prix simulé
prix_base = {"centre": 5, "banlieue": 3, "campagne": 1.5}
type_mult = {"appartement": 1.0, "maison": 1.5, "studio": 0.7}
df["prix"] = (
    df["surface"] * df["quartier"].map(prix_base) * df["type"].map(type_mult)
    + np.random.normal(0, 50, n)
) / 100

# Convertir en catégories pandas
df["quartier"] = df["quartier"].astype("category")
df["type"] = df["type"].astype("category")

X_cat = df.drop("prix", axis=1)
y_cat = df["prix"]
X_tr_c, X_te_c, y_tr_c, y_te_c = train_test_split(X_cat, y_cat, test_size=0.2, random_state=42)

# XGBoost avec enable_categorical
reg_cat = xgb.XGBRegressor(
    n_estimators=100,
    max_depth=5,
    learning_rate=0.1,
    enable_categorical=True,  # activer le support catégoriel natif
    random_state=42,
    verbosity=0,
)

reg_cat.fit(X_tr_c, y_tr_c)
y_pred_cat = reg_cat.predict(X_te_c)

rmse_cat = np.sqrt(mean_squared_error(y_te_c, y_pred_cat))
r2_cat = r2_score(y_te_c, y_pred_cat)
print(f"RMSE avec features catégorielles : {rmse_cat:.4f}")
print(f"R2 : {r2_cat:.4f}")

print("\n" + "=" * 60)
print("FIN DU TUTORIEL RÉGRESSION")
print("=" * 60)

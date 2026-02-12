"""
=============================================================
 XGBoost - Les Fondamentaux
=============================================================
Ce script couvre :
  1. Comment fonctionne le Gradient Boosting
  2. L'API native XGBoost vs l'API Scikit-learn
  3. Les structures de données (DMatrix)
  4. Entraînement de base et prédiction
  5. Importance des features
=============================================================
"""

import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import xgboost as xgb

# -------------------------------------------------------
# 1. COMMENT FONCTIONNE LE GRADIENT BOOSTING
# -------------------------------------------------------
# Le gradient boosting construit un modèle de manière additive :
#
#   F(x) = f_0(x) + lr * f_1(x) + lr * f_2(x) + ...
#
# Où :
#   - f_0 est une prédiction initiale (ex: la moyenne)
#   - f_i sont des arbres de décision
#   - lr est le learning rate (taux d'apprentissage)
#
# À chaque étape, un nouvel arbre est entraîné sur les RÉSIDUS
# (erreurs) du modèle courant. Plus précisément, sur le gradient
# négatif de la fonction de perte.
#
# XGBoost ajoute un terme de régularisation à l'objectif :
#   Obj = Loss(y, pred) + Omega(arbres)
#   Omega = gamma * T + 0.5 * lambda * ||w||^2
#   (T = nombre de feuilles, w = poids des feuilles)

# -------------------------------------------------------
# 2. CRÉER DES DONNÉES D'EXEMPLE
# -------------------------------------------------------
print("=" * 60)
print("XGBOOST - LES FONDAMENTAUX")
print("=" * 60)

# Générer un dataset de classification
X, y = make_classification(
    n_samples=1000,
    n_features=10,
    n_informative=5,
    n_redundant=2,
    random_state=42,
)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"\nDonnées : {X_train.shape[0]} train, {X_test.shape[0]} test")
print(f"Features : {X_train.shape[1]}")

# -------------------------------------------------------
# 3. API SCIKIT-LEARN (la plus simple)
# -------------------------------------------------------
print("\n" + "-" * 60)
print("API SCIKIT-LEARN")
print("-" * 60)

# XGBClassifier s'utilise comme n'importe quel estimateur sklearn
clf = xgb.XGBClassifier(
    n_estimators=100,       # nombre d'arbres
    max_depth=3,            # profondeur max de chaque arbre
    learning_rate=0.1,      # taux d'apprentissage (eta)
    objective="binary:logistic",  # fonction de perte
    eval_metric="logloss",  # métrique d'évaluation
    random_state=42,
    verbosity=0,            # 0 = silencieux
)

# Entraîner le modèle
clf.fit(X_train, y_train)

# Prédire
y_pred = clf.predict(X_test)
y_proba = clf.predict_proba(X_test)[:, 1]  # probabilités

accuracy = accuracy_score(y_test, y_pred)
print(f"Accuracy : {accuracy:.4f}")

# -------------------------------------------------------
# 4. API NATIVE XGBOOST (plus de contrôle)
# -------------------------------------------------------
print("\n" + "-" * 60)
print("API NATIVE XGBOOST")
print("-" * 60)

# DMatrix : structure de données optimisée de XGBoost
dtrain = xgb.DMatrix(X_train, label=y_train)
dtest = xgb.DMatrix(X_test, label=y_test)

# Paramètres sous forme de dictionnaire
params = {
    "max_depth": 3,
    "learning_rate": 0.1,
    "objective": "binary:logistic",
    "eval_metric": "logloss",
    "seed": 42,
    "verbosity": 0,
}

# Entraîner avec watchlist pour suivre les performances
watchlist = [(dtrain, "train"), (dtest, "test")]
model = xgb.train(
    params,
    dtrain,
    num_boost_round=100,
    evals=watchlist,
    verbose_eval=20,  # afficher toutes les 20 itérations
)

# Prédire (retourne des probabilités, pas des classes)
y_proba_native = model.predict(dtest)
y_pred_native = (y_proba_native > 0.5).astype(int)

accuracy_native = accuracy_score(y_test, y_pred_native)
print(f"Accuracy (API native) : {accuracy_native:.4f}")

# -------------------------------------------------------
# 5. IMPORTANCE DES FEATURES
# -------------------------------------------------------
print("\n" + "-" * 60)
print("IMPORTANCE DES FEATURES")
print("-" * 60)

# Trois types d'importance :
#   - weight  : nombre de fois qu'une feature est utilisée pour split
#   - gain    : gain moyen apporté par la feature
#   - cover   : nombre moyen d'échantillons affectés

importance = model.get_score(importance_type="gain")
# Trier par importance décroissante
importance_sorted = sorted(importance.items(), key=lambda x: x[1], reverse=True)

print("\nImportance des features (par gain) :")
for feat, score in importance_sorted:
    print(f"  {feat:>5s} : {score:.2f}")

# -------------------------------------------------------
# 6. VALIDATION CROISÉE INTÉGRÉE
# -------------------------------------------------------
print("\n" + "-" * 60)
print("VALIDATION CROISÉE")
print("-" * 60)

cv_results = xgb.cv(
    params,
    dtrain,
    num_boost_round=100,
    nfold=5,
    metrics=["logloss", "error"],
    seed=42,
    verbose_eval=False,
)

print(f"Meilleur logloss (CV) : {cv_results['test-logloss-mean'].min():.4f}")
print(f"Meilleur error (CV)   : {cv_results['test-error-mean'].min():.4f}")
print(f"Meilleur round        : {cv_results['test-logloss-mean'].idxmin()}")

# -------------------------------------------------------
# 7. SAUVEGARDER / CHARGER UN MODÈLE
# -------------------------------------------------------
print("\n" + "-" * 60)
print("SAUVEGARDE / CHARGEMENT")
print("-" * 60)

# Format JSON (lisible, portable)
model.save_model("model.json")
print("Modèle sauvegardé : model.json")

# Recharger
model_loaded = xgb.Booster()
model_loaded.load_model("model.json")
print("Modèle rechargé avec succès")

# Vérifier que les prédictions sont identiques
y_proba_loaded = model_loaded.predict(dtest)
assert np.allclose(y_proba_native, y_proba_loaded), "Les prédictions diffèrent !"
print("Vérification OK : prédictions identiques")

print("\n" + "=" * 60)
print("FIN DU TUTORIEL FONDAMENTAUX")
print("=" * 60)

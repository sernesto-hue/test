"""
=============================================================
 XGBoost - Optimisation des Hyperparamètres
=============================================================
Ce script couvre :
  1. Comprendre chaque hyperparamètre
  2. Grid Search
  3. Random Search
  4. Stratégie de tuning étape par étape
  5. Éviter le surapprentissage (overfitting)
=============================================================
"""

import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import (
    train_test_split,
    GridSearchCV,
    RandomizedSearchCV,
    cross_val_score,
)
from sklearn.metrics import accuracy_score
import xgboost as xgb

# -------------------------------------------------------
# DONNÉES
# -------------------------------------------------------
X, y = make_classification(
    n_samples=2000,
    n_features=20,
    n_informative=10,
    random_state=42,
)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# -------------------------------------------------------
# 1. GUIDE DES HYPERPARAMÈTRES
# -------------------------------------------------------
print("=" * 60)
print("GUIDE DES HYPERPARAMÈTRES XGBOOST")
print("=" * 60)

guide = """
PARAMÈTRES DE STRUCTURE DES ARBRES :
  max_depth (défaut: 6)
    - Profondeur maximale de chaque arbre
    - Plus profond = plus complexe = risque d'overfitting
    - Valeurs typiques : 3-10
    - Commencer par 3-6

  min_child_weight (défaut: 1)
    - Poids minimum requis dans un noeud enfant
    - Plus élevé = modèle plus conservateur
    - Valeurs typiques : 1-10

  gamma (défaut: 0)
    - Réduction minimum de la perte pour faire un split
    - Plus élevé = moins de splits = arbre plus simple
    - Valeurs typiques : 0-5

PARAMÈTRES D'APPRENTISSAGE :
  learning_rate / eta (défaut: 0.3)
    - Taux d'apprentissage, réduit la contribution de chaque arbre
    - Plus petit = plus d'arbres nécessaires mais meilleure généralisation
    - Valeurs typiques : 0.01-0.3

  n_estimators (défaut: 100)
    - Nombre d'arbres (rounds de boosting)
    - Utiliser early_stopping pour trouver la valeur optimale
    - Valeurs typiques : 100-10000

PARAMÈTRES DE RÉGULARISATION :
  reg_alpha (défaut: 0)
    - Régularisation L1 (Lasso) sur les poids des feuilles
    - Encourage les poids à être exactement 0 (sparsité)

  reg_lambda (défaut: 1)
    - Régularisation L2 (Ridge) sur les poids des feuilles
    - Réduit les poids extrêmes

PARAMÈTRES DE SOUS-ÉCHANTILLONNAGE :
  subsample (défaut: 1)
    - Fraction des données utilisées par arbre
    - < 1 ajoute de la randomisation (réduit l'overfitting)
    - Valeurs typiques : 0.6-1.0

  colsample_bytree (défaut: 1)
    - Fraction des features utilisées par arbre
    - Similaire au Random Forest
    - Valeurs typiques : 0.5-1.0

  colsample_bylevel (défaut: 1)
    - Fraction des features par niveau de profondeur

  colsample_bynode (défaut: 1)
    - Fraction des features par split
"""
print(guide)

# -------------------------------------------------------
# 2. GRID SEARCH (recherche exhaustive)
# -------------------------------------------------------
print("=" * 60)
print("GRID SEARCH")
print("=" * 60)

# Attention : Grid Search teste TOUTES les combinaisons
# Avec beaucoup de paramètres, ça peut être très long !
param_grid = {
    "max_depth": [3, 5, 7],
    "learning_rate": [0.01, 0.1],
    "n_estimators": [100, 200],
    "subsample": [0.8, 1.0],
}

print(f"Nombre de combinaisons : {3 * 2 * 2 * 2} = 24")
print("Avec 5-fold CV : 24 * 5 = 120 modèles à entraîner\n")

clf = xgb.XGBClassifier(
    objective="binary:logistic",
    eval_metric="logloss",
    random_state=42,
    verbosity=0,
)

grid_search = GridSearchCV(
    clf,
    param_grid,
    cv=3,             # 3-fold pour aller plus vite (5 en production)
    scoring="accuracy",
    n_jobs=-1,        # utiliser tous les CPU
    verbose=1,
)

grid_search.fit(X_train, y_train)

print(f"\nMeilleurs paramètres : {grid_search.best_params_}")
print(f"Meilleur score CV    : {grid_search.best_score_:.4f}")

y_pred_grid = grid_search.predict(X_test)
print(f"Score test           : {accuracy_score(y_test, y_pred_grid):.4f}")

# -------------------------------------------------------
# 3. RANDOM SEARCH (plus efficace)
# -------------------------------------------------------
print("\n" + "=" * 60)
print("RANDOM SEARCH")
print("=" * 60)

# Random Search échantillonne aléatoirement dans l'espace
# Souvent aussi bon que Grid Search avec moins d'itérations
param_distributions = {
    "max_depth": [3, 4, 5, 6, 7, 8],
    "learning_rate": [0.01, 0.02, 0.05, 0.1, 0.2],
    "n_estimators": [50, 100, 200, 300, 500],
    "subsample": [0.6, 0.7, 0.8, 0.9, 1.0],
    "colsample_bytree": [0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    "min_child_weight": [1, 3, 5, 7],
    "gamma": [0, 0.1, 0.5, 1, 2],
    "reg_alpha": [0, 0.01, 0.1, 1],
    "reg_lambda": [0.1, 0.5, 1, 2, 5],
}

total_combos = 1
for v in param_distributions.values():
    total_combos *= len(v)
print(f"Espace total : {total_combos:,} combinaisons")
print(f"On en teste seulement 30 !\n")

random_search = RandomizedSearchCV(
    xgb.XGBClassifier(
        objective="binary:logistic",
        eval_metric="logloss",
        random_state=42,
        verbosity=0,
    ),
    param_distributions,
    n_iter=30,        # nombre de combinaisons à tester
    cv=3,
    scoring="accuracy",
    n_jobs=-1,
    random_state=42,
    verbose=1,
)

random_search.fit(X_train, y_train)

print(f"\nMeilleurs paramètres : {random_search.best_params_}")
print(f"Meilleur score CV    : {random_search.best_score_:.4f}")

y_pred_rand = random_search.predict(X_test)
print(f"Score test           : {accuracy_score(y_test, y_pred_rand):.4f}")

# -------------------------------------------------------
# 4. STRATÉGIE DE TUNING ÉTAPE PAR ÉTAPE
# -------------------------------------------------------
print("\n" + "=" * 60)
print("STRATÉGIE DE TUNING RECOMMANDÉE")
print("=" * 60)

print("""
Étape 1 : Fixer un learning_rate élevé (0.1) et trouver n_estimators
           avec early_stopping
""")

# Étape 1 : Trouver le bon nombre d'arbres
model_step1 = xgb.XGBClassifier(
    n_estimators=1000,
    learning_rate=0.1,
    max_depth=5,
    early_stopping_rounds=30,
    random_state=42,
    verbosity=0,
)
model_step1.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=False,
)
best_n = model_step1.best_iteration
print(f"  -> Meilleur n_estimators : {best_n}")

print("""
Étape 2 : Tuner max_depth et min_child_weight
""")

# Étape 2
param_step2 = {
    "max_depth": [3, 4, 5, 6, 7],
    "min_child_weight": [1, 3, 5, 7],
}

gs2 = GridSearchCV(
    xgb.XGBClassifier(
        n_estimators=best_n,
        learning_rate=0.1,
        random_state=42,
        verbosity=0,
    ),
    param_step2,
    cv=3,
    scoring="accuracy",
    n_jobs=-1,
)
gs2.fit(X_train, y_train)
best_depth = gs2.best_params_["max_depth"]
best_mcw = gs2.best_params_["min_child_weight"]
print(f"  -> max_depth : {best_depth}, min_child_weight : {best_mcw}")

print("""
Étape 3 : Tuner subsample et colsample_bytree
""")

param_step3 = {
    "subsample": [0.6, 0.7, 0.8, 0.9, 1.0],
    "colsample_bytree": [0.6, 0.7, 0.8, 0.9, 1.0],
}

gs3 = GridSearchCV(
    xgb.XGBClassifier(
        n_estimators=best_n,
        learning_rate=0.1,
        max_depth=best_depth,
        min_child_weight=best_mcw,
        random_state=42,
        verbosity=0,
    ),
    param_step3,
    cv=3,
    scoring="accuracy",
    n_jobs=-1,
)
gs3.fit(X_train, y_train)
best_ss = gs3.best_params_["subsample"]
best_cs = gs3.best_params_["colsample_bytree"]
print(f"  -> subsample : {best_ss}, colsample_bytree : {best_cs}")

print("""
Étape 4 : Tuner la régularisation
""")

param_step4 = {
    "reg_alpha": [0, 0.001, 0.01, 0.1, 1],
    "reg_lambda": [0.1, 0.5, 1, 2, 5],
}

gs4 = GridSearchCV(
    xgb.XGBClassifier(
        n_estimators=best_n,
        learning_rate=0.1,
        max_depth=best_depth,
        min_child_weight=best_mcw,
        subsample=best_ss,
        colsample_bytree=best_cs,
        random_state=42,
        verbosity=0,
    ),
    param_step4,
    cv=3,
    scoring="accuracy",
    n_jobs=-1,
)
gs4.fit(X_train, y_train)
best_alpha = gs4.best_params_["reg_alpha"]
best_lambda = gs4.best_params_["reg_lambda"]
print(f"  -> reg_alpha : {best_alpha}, reg_lambda : {best_lambda}")

print("""
Étape 5 : Réduire le learning_rate et augmenter n_estimators
""")

# Modèle final avec learning_rate réduit
final_model = xgb.XGBClassifier(
    n_estimators=2000,
    learning_rate=0.01,       # réduit de 0.1 à 0.01
    max_depth=best_depth,
    min_child_weight=best_mcw,
    subsample=best_ss,
    colsample_bytree=best_cs,
    reg_alpha=best_alpha,
    reg_lambda=best_lambda,
    early_stopping_rounds=50,
    random_state=42,
    verbosity=0,
)

final_model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=False,
)

y_pred_final = final_model.predict(X_test)
final_acc = accuracy_score(y_test, y_pred_final)

print(f"  -> n_estimators final : {final_model.best_iteration}")
print(f"  -> Accuracy finale    : {final_acc:.4f}")

# -------------------------------------------------------
# 5. DÉTECTER L'OVERFITTING
# -------------------------------------------------------
print("\n" + "=" * 60)
print("DÉTECTER L'OVERFITTING")
print("=" * 60)

# Un modèle qui overfit : train >> test
# Entraîner un modèle trop complexe volontairement
overfit_model = xgb.XGBClassifier(
    n_estimators=500,
    max_depth=15,           # très profond
    learning_rate=0.3,      # taux élevé
    min_child_weight=1,
    subsample=1.0,          # pas de sous-échantillonnage
    colsample_bytree=1.0,
    reg_alpha=0,            # pas de régularisation
    reg_lambda=0,
    random_state=42,
    verbosity=0,
)

overfit_model.fit(X_train, y_train)

train_acc = accuracy_score(y_train, overfit_model.predict(X_train))
test_acc = accuracy_score(y_test, overfit_model.predict(X_test))

print(f"\nModèle surappris :")
print(f"  Train accuracy : {train_acc:.4f}")
print(f"  Test accuracy  : {test_acc:.4f}")
print(f"  Écart          : {train_acc - test_acc:.4f}")

# Comparer avec le modèle bien tuné
train_acc_final = accuracy_score(y_train, final_model.predict(X_train))
print(f"\nModèle bien tuné :")
print(f"  Train accuracy : {train_acc_final:.4f}")
print(f"  Test accuracy  : {final_acc:.4f}")
print(f"  Écart          : {train_acc_final - final_acc:.4f}")

print("""
STRATÉGIES ANTI-OVERFITTING :
  1. Réduire max_depth (3-6 au lieu de 10+)
  2. Augmenter min_child_weight
  3. Ajouter de la régularisation (reg_alpha, reg_lambda)
  4. Sous-échantillonner (subsample < 1, colsample_bytree < 1)
  5. Réduire le learning_rate (+ augmenter n_estimators)
  6. Utiliser early_stopping
  7. Augmenter gamma (pénalité sur le nombre de feuilles)
""")

print("=" * 60)
print("FIN DU TUTORIEL TUNING")
print("=" * 60)

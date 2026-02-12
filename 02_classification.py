"""
=============================================================
 XGBoost - Classification
=============================================================
Ce script couvre :
  1. Classification binaire (cancer du sein)
  2. Classification multi-classes (iris)
  3. Gestion du déséquilibre de classes
  4. Courbe ROC et matrice de confusion
  5. Early stopping
=============================================================
"""

import numpy as np
from sklearn.datasets import load_breast_cancer, load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score,
)
import xgboost as xgb

# -------------------------------------------------------
# 1. CLASSIFICATION BINAIRE
# -------------------------------------------------------
print("=" * 60)
print("CLASSIFICATION BINAIRE - Cancer du sein")
print("=" * 60)

# Charger le dataset
data = load_breast_cancer()
X, y = data.data, data.target
feature_names = data.feature_names

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Classes : {data.target_names}")
print(f"Distribution train : {np.bincount(y_train)}")
print(f"Distribution test  : {np.bincount(y_test)}")

# Entraîner avec early stopping
# Early stopping arrête l'entraînement si la métrique ne s'améliore
# plus pendant N rounds consécutifs
clf = xgb.XGBClassifier(
    n_estimators=500,          # max 500 arbres
    max_depth=4,
    learning_rate=0.05,
    objective="binary:logistic",
    eval_metric="logloss",
    early_stopping_rounds=20,  # arrêter si pas d'amélioration en 20 rounds
    random_state=42,
    verbosity=0,
)

clf.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=False,
)

print(f"\nMeilleur round : {clf.best_iteration}")
print(f"Meilleur score  : {clf.best_score:.4f}")

# Prédictions
y_pred = clf.predict(X_test)
y_proba = clf.predict_proba(X_test)[:, 1]

print(f"\nAccuracy  : {accuracy_score(y_test, y_pred):.4f}")
print(f"ROC AUC   : {roc_auc_score(y_test, y_proba):.4f}")

print("\nMatrice de confusion :")
cm = confusion_matrix(y_test, y_pred)
print(f"  TN={cm[0][0]}  FP={cm[0][1]}")
print(f"  FN={cm[1][0]}  TP={cm[1][1]}")

print("\nRapport de classification :")
print(classification_report(y_test, y_pred, target_names=data.target_names))

# -------------------------------------------------------
# 2. CLASSIFICATION MULTI-CLASSES
# -------------------------------------------------------
print("=" * 60)
print("CLASSIFICATION MULTI-CLASSES - Iris")
print("=" * 60)

data_iris = load_iris()
X_iris, y_iris = data_iris.data, data_iris.target

X_tr, X_te, y_tr, y_te = train_test_split(
    X_iris, y_iris, test_size=0.3, random_state=42, stratify=y_iris
)

# Pour le multi-classes, XGBoost utilise softmax ou softprob
clf_multi = xgb.XGBClassifier(
    n_estimators=100,
    max_depth=3,
    learning_rate=0.1,
    objective="multi:softprob",  # retourne les probabilités par classe
    num_class=3,
    eval_metric="mlogloss",      # log loss multi-classes
    random_state=42,
    verbosity=0,
)

clf_multi.fit(X_tr, y_tr)

y_pred_iris = clf_multi.predict(X_te)
y_proba_iris = clf_multi.predict_proba(X_te)

print(f"Accuracy : {accuracy_score(y_te, y_pred_iris):.4f}")
print("\nProbabilités pour les 3 premiers échantillons :")
for i in range(3):
    probs = ", ".join(f"{p:.3f}" for p in y_proba_iris[i])
    print(f"  Échantillon {i} : [{probs}] -> Classe {y_pred_iris[i]} ({data_iris.target_names[y_pred_iris[i]]})")

print("\nRapport :")
print(classification_report(y_te, y_pred_iris, target_names=data_iris.target_names))

# -------------------------------------------------------
# 3. GESTION DU DÉSÉQUILIBRE DE CLASSES
# -------------------------------------------------------
print("=" * 60)
print("DÉSÉQUILIBRE DE CLASSES")
print("=" * 60)

# Créer un dataset déséquilibré (95% classe 0, 5% classe 1)
from sklearn.datasets import make_classification

X_imb, y_imb = make_classification(
    n_samples=2000,
    n_features=10,
    weights=[0.95, 0.05],
    random_state=42,
)

X_tr_imb, X_te_imb, y_tr_imb, y_te_imb = train_test_split(
    X_imb, y_imb, test_size=0.3, random_state=42, stratify=y_imb
)

print(f"Distribution train : {np.bincount(y_tr_imb)}")
print(f"Ratio de déséquilibre : {np.bincount(y_tr_imb)[0] / np.bincount(y_tr_imb)[1]:.1f}:1")

# Méthode 1 : scale_pos_weight
# Poids = nombre_négatifs / nombre_positifs
ratio = np.sum(y_tr_imb == 0) / np.sum(y_tr_imb == 1)

clf_balanced = xgb.XGBClassifier(
    n_estimators=100,
    max_depth=3,
    learning_rate=0.1,
    scale_pos_weight=ratio,  # compenser le déséquilibre
    objective="binary:logistic",
    eval_metric="aucpr",     # AUC Precision-Recall (meilleur pour données déséquilibrées)
    random_state=42,
    verbosity=0,
)

clf_balanced.fit(X_tr_imb, y_tr_imb)
y_pred_bal = clf_balanced.predict(X_te_imb)

print(f"\nAvec scale_pos_weight={ratio:.1f} :")
print(classification_report(y_te_imb, y_pred_bal, zero_division=0))

# Méthode 2 : sample_weight (poids individuels)
weights = np.where(y_tr_imb == 1, ratio, 1.0)

clf_weighted = xgb.XGBClassifier(
    n_estimators=100,
    max_depth=3,
    learning_rate=0.1,
    random_state=42,
    verbosity=0,
)

clf_weighted.fit(X_tr_imb, y_tr_imb, sample_weight=weights)
y_pred_w = clf_weighted.predict(X_te_imb)

print("Avec sample_weight :")
print(classification_report(y_te_imb, y_pred_w, zero_division=0))

print("=" * 60)
print("FIN DU TUTORIEL CLASSIFICATION")
print("=" * 60)

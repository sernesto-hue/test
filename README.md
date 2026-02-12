# Apprendre XGBoost - Guide Complet

## Qu'est-ce que XGBoost ?

**XGBoost** (eXtreme Gradient Boosting) est une bibliothèque optimisée de gradient boosting.
C'est l'un des algorithmes les plus populaires en Machine Learning, notamment dans les compétitions Kaggle.

## Structure du projet

| Fichier | Contenu |
|---------|---------|
| `01_fondamentaux.py` | Théorie du gradient boosting et bases de XGBoost |
| `02_classification.py` | Exemple complet de classification binaire |
| `03_regression.py` | Exemple complet de régression |
| `04_tuning.py` | Optimisation des hyperparamètres |
| `requirements.txt` | Dépendances Python |

## Installation

```bash
pip install -r requirements.txt
```

## Concepts clés

### 1. Gradient Boosting (Boosting par gradient)
- Ensemble de modèles faibles (arbres de décision) combinés séquentiellement
- Chaque arbre corrige les erreurs du précédent
- Le gradient de la fonction de perte guide l'apprentissage

### 2. Pourquoi XGBoost ?
- **Rapide** : parallélisation et optimisations hardware
- **Régularisation** : L1 (Lasso) et L2 (Ridge) intégrées
- **Gestion des valeurs manquantes** : automatique
- **Élagage intelligent** : coupe les branches inutiles (pruning)
- **Validation croisée** : intégrée via `cv()`

### 3. Hyperparamètres importants
- `n_estimators` : nombre d'arbres
- `max_depth` : profondeur maximale des arbres
- `learning_rate` (eta) : taux d'apprentissage
- `subsample` : fraction des données par arbre
- `colsample_bytree` : fraction des features par arbre
- `reg_alpha` / `reg_lambda` : régularisation L1 / L2

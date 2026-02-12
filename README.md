# Apprendre le Machine Learning - Guides Complets

## Installation

```bash
pip install -r requirements.txt
```

---

## 1. XGBoost

**XGBoost** (eXtreme Gradient Boosting) est une bibliothèque optimisée de gradient boosting.
C'est l'un des algorithmes les plus populaires en Machine Learning, notamment dans les compétitions Kaggle.

| Fichier | Contenu |
|---------|---------|
| `01_fondamentaux.py` | Théorie du gradient boosting et bases de XGBoost |
| `02_classification.py` | Exemple complet de classification binaire et multi-classes |
| `03_regression.py` | Exemple complet de régression |
| `04_tuning.py` | Optimisation des hyperparamètres |

### Concepts clés XGBoost
- Ensemble de modèles faibles (arbres) combinés séquentiellement
- Régularisation L1/L2 intégrée
- Gestion automatique des valeurs manquantes
- Hyperparamètres : `n_estimators`, `max_depth`, `learning_rate`, `subsample`, `reg_alpha`/`reg_lambda`

---

## 2. Modèles de Markov Cachés (HMM)

Un **HMM** (Hidden Markov Model) est un modèle probabiliste pour les séquences.
Il suppose que le système évolue entre des états cachés, et que chaque état produit une observation visible.

| Fichier | Contenu |
|---------|---------|
| `05_hmm_fondamentaux.py` | Théorie des HMM, les 3 problèmes fondamentaux, implémentation from scratch |
| `06_hmm_applications.py` | Applications pratiques : météo, NLP (POS tagging), séquences ADN |
| `07_hmm_avance.py` | Algorithme de Baum-Welch, HMM Gaussien, modèles multi-séquences |

### Concepts clés HMM
- **États cachés** : non observables directement (ex: météo sous-jacente)
- **Observations** : ce qu'on observe (ex: activité d'une personne)
- **Matrice de transition** A : probabilités de passer d'un état à l'autre
- **Matrice d'émission** B : probabilités d'observer un symbole dans un état
- **3 problèmes** : Évaluation (Forward), Décodage (Viterbi), Apprentissage (Baum-Welch)

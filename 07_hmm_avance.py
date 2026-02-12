"""
=============================================================
 Modèles de Markov Cachés - Concepts Avancés
=============================================================
Ce script couvre :
  1. Algorithme de Baum-Welch (implémentation from scratch)
  2. Apprentissage à partir de données (hmmlearn)
  3. HMM Gaussien (observations continues)
  4. Sélection du nombre d'états (BIC/AIC)
  5. HMM avec multi-séquences
  6. Limites des HMM et alternatives
=============================================================
"""

import numpy as np
from hmmlearn import hmm
import warnings
warnings.filterwarnings("ignore")

# -------------------------------------------------------
# 1. ALGORITHME DE BAUM-WELCH (from scratch)
# -------------------------------------------------------
print("=" * 60)
print("1. ALGORITHME DE BAUM-WELCH (EM pour HMM)")
print("=" * 60)

print("""
PROBLÈME 3 : APPRENTISSAGE
  Comment ajuster les paramètres (A, B, pi) du modèle
  pour maximiser P(O | lambda) ?

L'algorithme de Baum-Welch est un cas particulier de l'algorithme EM
(Expectation-Maximization) :

  E-step : Calculer les probabilités postérieures des états
           en utilisant Forward-Backward
  M-step : Re-estimer A, B, pi à partir de ces probabilités

Variables intermédiaires :
  gamma[t][i] = P(S_t = i | O, lambda)
    -> probabilité d'être dans l'état i au temps t
    -> gamma[t][i] = alpha[t][i] * beta[t][i] / P(O)

  xi[t][i][j] = P(S_t = i, S_t+1 = j | O, lambda)
    -> probabilité de transition de i vers j au temps t
    -> xi[t][i][j] = alpha[t][i] * A[i][j] * B[j][O_t+1] * beta[t+1][j] / P(O)

Re-estimation :
  pi[i]    = gamma[0][i]
  A[i][j]  = sum_t(xi[t][i][j]) / sum_t(gamma[t][i])
  B[i][k]  = sum_t(gamma[t][i] si O_t=k) / sum_t(gamma[t][i])
""")


def baum_welch(obs_seq, N, M, max_iter=100, tol=1e-6):
    """
    Algorithme de Baum-Welch complet.

    Args:
        obs_seq: séquence d'observations (indices entiers)
        N: nombre d'états cachés
        M: nombre de symboles d'observation
        max_iter: nombre maximal d'itérations
        tol: seuil de convergence

    Returns:
        A, B, pi, log_probs (historique)
    """
    T = len(obs_seq)

    # Initialisation aléatoire (normalisée)
    np.random.seed(42)
    pi = np.random.dirichlet(np.ones(N))
    A = np.random.dirichlet(np.ones(N), size=N)
    B = np.random.dirichlet(np.ones(M), size=N)

    log_probs = []

    for iteration in range(max_iter):
        # === E-STEP ===

        # Forward
        alpha = np.zeros((T, N))
        alpha[0] = pi * B[:, obs_seq[0]]
        for t in range(1, T):
            for j in range(N):
                alpha[t, j] = B[j, obs_seq[t]] * np.sum(alpha[t-1] * A[:, j])

        # Log-probabilité
        log_prob = np.log(np.sum(alpha[-1]))
        log_probs.append(log_prob)

        # Vérifier convergence
        if iteration > 0 and abs(log_probs[-1] - log_probs[-2]) < tol:
            print(f"  Convergence après {iteration + 1} itérations")
            break

        # Backward
        beta = np.zeros((T, N))
        beta[-1] = 1.0
        for t in range(T - 2, -1, -1):
            for i in range(N):
                beta[t, i] = np.sum(A[i] * B[:, obs_seq[t+1]] * beta[t+1])

        # Gamma : P(S_t = i | O, lambda)
        gamma = alpha * beta
        gamma /= gamma.sum(axis=1, keepdims=True)

        # Xi : P(S_t = i, S_t+1 = j | O, lambda)
        xi = np.zeros((T - 1, N, N))
        for t in range(T - 1):
            for i in range(N):
                for j in range(N):
                    xi[t, i, j] = (
                        alpha[t, i] * A[i, j]
                        * B[j, obs_seq[t+1]] * beta[t+1, j]
                    )
            xi[t] /= xi[t].sum()

        # === M-STEP ===

        # Re-estimer pi
        pi = gamma[0]

        # Re-estimer A
        for i in range(N):
            for j in range(N):
                A[i, j] = xi[:, i, j].sum() / gamma[:-1, i].sum()

        # Re-estimer B
        for i in range(N):
            for k in range(M):
                mask = np.array(obs_seq) == k
                B[i, k] = gamma[mask, i].sum() / gamma[:, i].sum()

    return A, B, pi, log_probs


# Tester l'algorithme de Baum-Welch
print("\n--- Test de l'algorithme de Baum-Welch ---\n")

# Vrai modèle
states = ["Soleil", "Pluie"]
observations = ["Marcher", "Courses", "Ménage"]

A_true = np.array([[0.7, 0.3], [0.4, 0.6]])
B_true = np.array([[0.6, 0.3, 0.1], [0.1, 0.4, 0.5]])
pi_true = np.array([0.6, 0.4])

# Générer une longue séquence à partir du vrai modèle
np.random.seed(42)
T = 500
true_states = []
obs_data = []
state = np.random.choice(2, p=pi_true)
for t in range(T):
    true_states.append(state)
    obs = np.random.choice(3, p=B_true[state])
    obs_data.append(obs)
    state = np.random.choice(2, p=A_true[state])

print(f"Longueur de la séquence d'entraînement : {T}")
print(f"\nParamètres VRAIS :")
print(f"  pi = {pi_true}")
print(f"  A  = {A_true.tolist()}")
print(f"  B  = {B_true.tolist()}")

# Apprendre avec Baum-Welch
A_learned, B_learned, pi_learned, log_history = baum_welch(obs_data, N=2, M=3)

print(f"\nParamètres APPRIS :")
print(f"  pi = [{', '.join(f'{p:.3f}' for p in pi_learned)}]")
print(f"  A  = [{', '.join(f'{a:.3f}' for a in A_learned[0])}]")
print(f"       [{', '.join(f'{a:.3f}' for a in A_learned[1])}]")
print(f"  B  = [{', '.join(f'{b:.3f}' for b in B_learned[0])}]")
print(f"       [{', '.join(f'{b:.3f}' for b in B_learned[1])}]")

# Note : les états peuvent être permutés (label switching)
print("""
ATTENTION : Les états appris peuvent être PERMUTÉS par rapport aux vrais.
L'état "0" appris peut correspondre à l'état "1" vrai et vice versa.
C'est normal : le HMM n'a pas de notion de nom d'état.
""")

# Convergence
print(f"Historique log-probabilité (premiers et derniers) :")
for i in [0, 1, 2, len(log_history)-3, len(log_history)-2, len(log_history)-1]:
    if i < len(log_history):
        print(f"  Itération {i+1:>3d} : {log_history[i]:.4f}")

# -------------------------------------------------------
# 2. APPRENTISSAGE AVEC hmmlearn
# -------------------------------------------------------
print("\n" + "=" * 60)
print("2. APPRENTISSAGE AVEC hmmlearn")
print("=" * 60)

# hmmlearn rend l'apprentissage beaucoup plus simple
model = hmm.CategoricalHMM(
    n_components=2,
    n_iter=200,
    random_state=42,
    init_params="ste",  # initialiser s=startprob, t=transmat, e=emissionprob
)

# Entraîner
X_train = np.array(obs_data).reshape(-1, 1)
model.fit(X_train)

print(f"Paramètres appris par hmmlearn :")
print(f"  pi = {model.startprob_.round(3)}")
print(f"  A  = ")
for row in model.transmat_:
    print(f"       {row.round(3)}")
print(f"  B  = ")
for row in model.emissionprob_:
    print(f"       {row.round(3)}")
print(f"\n  Score (log-vraisemblance) : {model.score(X_train):.4f}")

# -------------------------------------------------------
# 3. HMM GAUSSIEN (observations continues)
# -------------------------------------------------------
print("\n" + "=" * 60)
print("3. HMM GAUSSIEN")
print("=" * 60)

print("""
Quand les observations sont continues (et non discrètes),
on utilise un HMM Gaussien :
  - Chaque état émet selon une distribution normale N(mu, sigma²)
  - hmmlearn.GaussianHMM gère cela nativement

Types de covariance :
  - "spherical" : sigma² scalaire (même variance dans toutes les dimensions)
  - "diag"      : matrice diagonale (variances indépendantes par dimension)
  - "full"      : matrice de covariance complète
  - "tied"      : même covariance pour tous les états
""")

# Générer des données 2D avec 3 régimes
np.random.seed(42)

# Régime 1 : centre en (0, 0)
n1 = 100
data1 = np.random.multivariate_normal([0, 0], [[1, 0.5], [0.5, 1]], n1)

# Régime 2 : centre en (5, 5)
n2 = 80
data2 = np.random.multivariate_normal([5, 5], [[0.5, 0], [0, 0.5]], n2)

# Régime 3 : centre en (0, 5)
n3 = 60
data3 = np.random.multivariate_normal([0, 5], [[1, -0.3], [-0.3, 1]], n3)

# Retour au régime 1
n4 = 60
data4 = np.random.multivariate_normal([0, 0], [[1, 0.5], [0.5, 1]], n4)

X_gauss = np.vstack([data1, data2, data3, data4])
true_labels = np.concatenate([
    np.zeros(n1), np.ones(n2), 2 * np.ones(n3), np.zeros(n4)
]).astype(int)

print(f"Données : {X_gauss.shape[0]} points, {X_gauss.shape[1]} dimensions, 3 régimes")

# Entraîner un HMM Gaussien
model_gauss = hmm.GaussianHMM(
    n_components=3,
    covariance_type="full",
    n_iter=200,
    random_state=42,
)
model_gauss.fit(X_gauss)

predicted_labels = model_gauss.predict(X_gauss)

print(f"\nMoyennes apprises :")
for i in range(3):
    print(f"  État {i} : mu = {model_gauss.means_[i].round(2)}")

print(f"\nMatrice de transition :")
for i in range(3):
    row = ", ".join(f"{model_gauss.transmat_[i, j]:.3f}" for j in range(3))
    print(f"  État {i} -> [{row}]")

# Accuracy (avec gestion de la permutation des labels)
from itertools import permutations

best_acc = 0
for perm in permutations(range(3)):
    remapped = np.array([perm[l] for l in predicted_labels])
    acc = np.mean(remapped == true_labels)
    best_acc = max(best_acc, acc)

print(f"\nMeilleure accuracy (après permutation) : {best_acc:.1%}")

# -------------------------------------------------------
# 4. SÉLECTION DU NOMBRE D'ÉTATS
# -------------------------------------------------------
print("\n" + "=" * 60)
print("4. SÉLECTION DU NOMBRE D'ÉTATS (BIC/AIC)")
print("=" * 60)

print("""
Comment choisir le bon nombre d'états cachés ?

Critères d'information :
  AIC = -2 * log(L) + 2 * k
  BIC = -2 * log(L) + k * log(n)

  L = vraisemblance du modèle
  k = nombre de paramètres libres
  n = nombre d'observations

Plus la valeur est BASSE, meilleur est le modèle.
BIC pénalise plus les modèles complexes que AIC.
""")

# Tester différents nombres d'états
for n_states in range(2, 7):
    model_test = hmm.GaussianHMM(
        n_components=n_states,
        covariance_type="full",
        n_iter=200,
        random_state=42,
    )
    model_test.fit(X_gauss)

    log_likelihood = model_test.score(X_gauss) * len(X_gauss)
    n_params = (
        n_states - 1                         # pi
        + n_states * (n_states - 1)           # A
        + n_states * X_gauss.shape[1]         # means
        + n_states * X_gauss.shape[1] * (X_gauss.shape[1] + 1) // 2  # covariances
    )

    aic = -2 * log_likelihood + 2 * n_params
    bic = -2 * log_likelihood + n_params * np.log(len(X_gauss))

    marker = " <-- MINIMUM" if n_states == 3 else ""
    print(f"  {n_states} états : AIC={aic:>10.1f}  BIC={bic:>10.1f}  params={n_params}{marker}")

# -------------------------------------------------------
# 5. MULTI-SÉQUENCES
# -------------------------------------------------------
print("\n" + "=" * 60)
print("5. ENTRAÎNER SUR PLUSIEURS SÉQUENCES")
print("=" * 60)

print("""
En pratique, on a souvent PLUSIEURS séquences indépendantes
(ex: plusieurs patients, plusieurs conversations, etc.)

hmmlearn gère cela avec le paramètre 'lengths' qui indique
la longueur de chaque séquence dans les données concaténées.
""")

# Générer 5 séquences indépendantes
model_gen = hmm.CategoricalHMM(n_components=2, random_state=42)
model_gen.startprob_ = np.array([0.6, 0.4])
model_gen.transmat_ = np.array([[0.7, 0.3], [0.4, 0.6]])
model_gen.emissionprob_ = np.array([[0.6, 0.3, 0.1], [0.1, 0.4, 0.5]])

sequences = []
lengths = []
for i in range(10):
    length = np.random.randint(50, 150)
    seq, _ = model_gen.sample(length)
    sequences.append(seq)
    lengths.append(length)

# Concaténer toutes les séquences
X_multi = np.vstack(sequences)

print(f"Nombre de séquences : {len(lengths)}")
print(f"Longueurs : {lengths}")
print(f"Total observations : {X_multi.shape[0]}")

# Entraîner avec lengths
model_multi = hmm.CategoricalHMM(
    n_components=2,
    n_iter=200,
    random_state=42,
)
model_multi.fit(X_multi, lengths=lengths)

print(f"\nParamètres appris :")
print(f"  pi = {model_multi.startprob_.round(3)}")
print(f"  A  = {model_multi.transmat_.round(3).tolist()}")
print(f"  B  = {model_multi.emissionprob_.round(3).tolist()}")

print(f"\nVrais paramètres :")
print(f"  pi = {model_gen.startprob_}")
print(f"  A  = {model_gen.transmat_.tolist()}")
print(f"  B  = {model_gen.emissionprob_.tolist()}")

# -------------------------------------------------------
# 6. LIMITES ET ALTERNATIVES
# -------------------------------------------------------
print("\n" + "=" * 60)
print("6. LIMITES DES HMM ET ALTERNATIVES")
print("=" * 60)

print("""
LIMITES DES HMM :

  1. Hypothèse de Markov (ordre 1)
     - L'état suivant ne dépend que de l'état actuel
     - Solution : HMM d'ordre supérieur (augmente N exponentiellement)

  2. Nombre d'états fixe
     - Il faut choisir N à l'avance
     - Solution : HMM non-paramétrique (Dirichlet Process HMM)

  3. Distributions d'émission limitées
     - Gaussien ou catégoriel
     - Solution : HMM avec réseaux de neurones pour les émissions

  4. Pas de dépendances longue portée
     - Difficulté avec les séquences très longues
     - Solution : LSTM, Transformers

  5. Optimum local
     - Baum-Welch peut converger vers un minimum local
     - Solution : relancer avec différentes initialisations

ALTERNATIVES MODERNES :

  | Modèle          | Avantage                           |
  |-----------------|-------------------------------------|
  | CRF             | Pas d'hypothèse de Markov sur obs   |
  | LSTM/GRU        | Dépendances longue portée           |
  | Transformer     | Attention sur toute la séquence      |
  | HMM neuronal    | Émissions flexibles                 |

QUAND UTILISER UN HMM :
  - Séquences courtes à moyennes
  - Peu de données (HMM a peu de paramètres)
  - Interprétabilité requise (on voit les états)
  - Domaines : bioinformatique, parole, finance, NLP classique
""")

# -------------------------------------------------------
# RÉSUMÉ : LES 3 PROBLÈMES ET LEURS ALGORITHMES
# -------------------------------------------------------
print("=" * 60)
print("RÉSUMÉ : LES 3 PROBLÈMES FONDAMENTAUX")
print("=" * 60)

print("""
  +-----------+------------------+-------------------+----------------+
  | Problème  | Question         | Algorithme        | Complexité     |
  +-----------+------------------+-------------------+----------------+
  | Évaluation| P(O | lambda)    | Forward           | O(N² * T)      |
  | Décodage  | Meilleure S*     | Viterbi           | O(N² * T)      |
  | Apprent.  | Meilleur lambda  | Baum-Welch (EM)   | O(N² * T * I)  |
  +-----------+------------------+-------------------+----------------+

  N = nombre d'états, T = longueur de la séquence, I = itérations EM
""")

print("=" * 60)
print("FIN DU TUTORIEL AVANCÉ HMM")
print("=" * 60)

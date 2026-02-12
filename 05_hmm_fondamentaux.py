"""
=============================================================
 Modèles de Markov Cachés (HMM) - Les Fondamentaux
=============================================================
Ce script couvre :
  1. Qu'est-ce qu'une chaîne de Markov ?
  2. Qu'est-ce qu'un HMM ?
  3. Les 5 éléments d'un HMM
  4. Les 3 problèmes fondamentaux
  5. Algorithme Forward (évaluation)
  6. Algorithme Viterbi (décodage)
  7. Implémentation from scratch + avec hmmlearn
=============================================================
"""

import numpy as np

# -------------------------------------------------------
# 1. CHAÎNE DE MARKOV (rappel)
# -------------------------------------------------------
print("=" * 60)
print("1. CHAÎNE DE MARKOV - RAPPEL")
print("=" * 60)

print("""
Une chaîne de Markov est un processus stochastique où :
  - Le système passe par une suite d'états : S1, S2, S3, ...
  - La probabilité de l'état suivant ne dépend QUE de l'état actuel
    (propriété de Markov / sans mémoire)

  P(S_t+1 | S_t, S_t-1, ..., S_1) = P(S_t+1 | S_t)

Exemple : Météo simplifiée
  - États : {Soleil, Pluie}
  - Si Soleil aujourd'hui : 70% Soleil demain, 30% Pluie demain
  - Si Pluie aujourd'hui  : 40% Soleil demain, 60% Pluie demain
""")

# Matrice de transition d'une chaîne de Markov simple
# Ligne = état actuel, Colonne = état suivant
etats_meteo = ["Soleil", "Pluie"]
A_meteo = np.array([
    [0.7, 0.3],  # Soleil -> [Soleil, Pluie]
    [0.4, 0.6],  # Pluie  -> [Soleil, Pluie]
])

print("Matrice de transition :")
for i, etat in enumerate(etats_meteo):
    probs = ", ".join(f"{etats_meteo[j]}={A_meteo[i,j]:.1f}" for j in range(2))
    print(f"  {etat:>6s} -> {probs}")

# Simuler une chaîne de Markov
np.random.seed(42)
etat_actuel = 0  # commence par Soleil
sequence = [etat_actuel]
for _ in range(9):
    etat_actuel = np.random.choice(2, p=A_meteo[etat_actuel])
    sequence.append(etat_actuel)

print(f"\nSimulation (10 jours) : {' -> '.join(etats_meteo[s] for s in sequence)}")

# -------------------------------------------------------
# 2. QU'EST-CE QU'UN HMM ?
# -------------------------------------------------------
print("\n" + "=" * 60)
print("2. QU'EST-CE QU'UN HMM ?")
print("=" * 60)

print("""
Un HMM ajoute une couche à la chaîne de Markov :
  - Les ÉTATS sont CACHÉS (on ne les observe pas directement)
  - À chaque état, le système ÉMET une OBSERVATION visible

Exemple classique : Le problème du casino malhonnête
  - Un casino utilise 2 dés : un dé normal et un dé pipé
  - Le croupier change secrètement de dé (états cachés)
  - Nous ne voyons que les résultats des lancers (observations)

  États cachés  :  Normal -> Normal -> Pipé -> Pipé -> Normal
                     |          |        |       |        |
  Observations  :    3         5        6       6        2

Les 5 éléments d'un HMM (lambda = (A, B, pi)) :
  1. N : nombre d'états cachés
  2. M : nombre de symboles d'observation possibles
  3. A : matrice de transition (N x N)
         A[i][j] = P(état j au temps t+1 | état i au temps t)
  4. B : matrice d'émission (N x M)
         B[i][k] = P(observation k | état i)
  5. pi : distribution initiale (1 x N)
         pi[i] = P(état i au temps t=0)
""")

# -------------------------------------------------------
# 3. DÉFINIR UN HMM : Exemple météo-activité
# -------------------------------------------------------
print("=" * 60)
print("3. DÉFINIR UN HMM : MÉTÉO -> ACTIVITÉ")
print("=" * 60)

print("""
Scénario :
  - On ne connaît PAS la météo (états cachés)
  - On observe ce que fait une personne (observations)

  États cachés  : {Soleil, Pluie}
  Observations  : {Marcher, Faire les courses, Ménage}
""")

# Définition du HMM
states = ["Soleil", "Pluie"]
observations = ["Marcher", "Courses", "Ménage"]
N = len(states)       # 2 états
M = len(observations) # 3 observations

# Matrice de transition A (2x2)
A = np.array([
    [0.7, 0.3],  # Soleil -> [Soleil, Pluie]
    [0.4, 0.6],  # Pluie  -> [Soleil, Pluie]
])

# Matrice d'émission B (2x3)
B = np.array([
    [0.6, 0.3, 0.1],  # Soleil -> [Marcher, Courses, Ménage]
    [0.1, 0.4, 0.5],  # Pluie  -> [Marcher, Courses, Ménage]
])

# Distribution initiale pi
pi = np.array([0.6, 0.4])  # 60% chance de commencer par Soleil

print("A (transition) :")
for i in range(N):
    print(f"  {states[i]:>6s} -> " + ", ".join(f"{states[j]}={A[i,j]:.1f}" for j in range(N)))

print("\nB (émission) :")
for i in range(N):
    print(f"  {states[i]:>6s} -> " + ", ".join(f"{observations[j]}={B[i,j]:.1f}" for j in range(M)))

print(f"\npi (initial) : " + ", ".join(f"{states[i]}={pi[i]:.1f}" for i in range(N)))

# Vérifier que les lignes somment à 1
assert np.allclose(A.sum(axis=1), 1), "A : les lignes ne somment pas à 1"
assert np.allclose(B.sum(axis=1), 1), "B : les lignes ne somment pas à 1"
assert np.isclose(pi.sum(), 1), "pi ne somme pas à 1"
print("\nVérification OK : toutes les distributions sont valides")

# -------------------------------------------------------
# 4. PROBLÈME 1 : ÉVALUATION (Algorithme Forward)
# -------------------------------------------------------
print("\n" + "=" * 60)
print("4. PROBLÈME 1 : ÉVALUATION (Forward)")
print("=" * 60)

print("""
QUESTION : Quelle est la probabilité d'observer la séquence O
           étant donné le modèle lambda ?
           P(O | lambda) = ?

Séquence observée : [Marcher, Courses, Ménage]

APPROCHE NAÏVE : Sommer sur toutes les séquences d'états possibles
  -> Complexité : O(N^T * T) -> Exponentielle !

ALGORITHME FORWARD : Programmation dynamique
  -> Complexité : O(N^2 * T) -> Polynomial !

  alpha[t][i] = P(O_1, ..., O_t, S_t = i | lambda)

  Initialisation : alpha[0][i] = pi[i] * B[i][O_0]
  Récurrence     : alpha[t][i] = B[i][O_t] * sum_j(alpha[t-1][j] * A[j][i])
  Terminaison    : P(O | lambda) = sum_i(alpha[T-1][i])
""")

def forward(obs_seq, A, B, pi):
    """Algorithme Forward - calcule P(O | lambda)"""
    T = len(obs_seq)
    N = len(pi)

    # Matrice alpha (T x N)
    alpha = np.zeros((T, N))

    # Initialisation (t=0)
    alpha[0] = pi * B[:, obs_seq[0]]

    # Récurrence (t=1 à T-1)
    for t in range(1, T):
        for j in range(N):
            alpha[t, j] = B[j, obs_seq[t]] * np.sum(alpha[t-1] * A[:, j])

    # Terminaison
    prob = np.sum(alpha[-1])

    return prob, alpha

# Séquence observée : Marcher(0), Courses(1), Ménage(2)
obs = [0, 1, 2]
obs_names = [observations[o] for o in obs]

prob, alpha = forward(obs, A, B, pi)

print(f"Séquence observée : {' -> '.join(obs_names)}")
print(f"\nMatrice alpha (probabilités forward) :")
print(f"  {'':>8s}  " + "  ".join(f"{s:>10s}" for s in states))
for t in range(len(obs)):
    vals = "  ".join(f"{alpha[t, i]:10.6f}" for i in range(N))
    print(f"  t={t} ({observations[obs[t]]:>7s})  {vals}")

print(f"\nP(Marcher, Courses, Ménage | modèle) = {prob:.6f}")

# -------------------------------------------------------
# 5. ALGORITHME BACKWARD
# -------------------------------------------------------
print("\n" + "=" * 60)
print("5. ALGORITHME BACKWARD")
print("=" * 60)

print("""
L'algorithme Backward est le symétrique du Forward :

  beta[t][i] = P(O_t+1, ..., O_T | S_t = i, lambda)

  Initialisation : beta[T-1][i] = 1
  Récurrence     : beta[t][i] = sum_j(A[i][j] * B[j][O_t+1] * beta[t+1][j])

Utile pour l'algorithme de Baum-Welch (apprentissage).
""")

def backward(obs_seq, A, B, pi):
    """Algorithme Backward"""
    T = len(obs_seq)
    N = len(pi)

    beta = np.zeros((T, N))

    # Initialisation (t=T-1)
    beta[-1] = 1.0

    # Récurrence (t=T-2 à 0)
    for t in range(T - 2, -1, -1):
        for i in range(N):
            beta[t, i] = np.sum(A[i] * B[:, obs_seq[t+1]] * beta[t+1])

    # P(O | lambda) via backward
    prob = np.sum(pi * B[:, obs_seq[0]] * beta[0])

    return prob, beta

prob_back, beta = backward(obs, A, B, pi)

print(f"Matrice beta (probabilités backward) :")
print(f"  {'':>8s}  " + "  ".join(f"{s:>10s}" for s in states))
for t in range(len(obs)):
    vals = "  ".join(f"{beta[t, i]:10.6f}" for i in range(N))
    print(f"  t={t} ({observations[obs[t]]:>7s})  {vals}")

print(f"\nP(O | modèle) via Forward  = {prob:.6f}")
print(f"P(O | modèle) via Backward = {prob_back:.6f}")
print(f"Les deux méthodes concordent : {np.isclose(prob, prob_back)}")

# -------------------------------------------------------
# 6. PROBLÈME 2 : DÉCODAGE (Algorithme de Viterbi)
# -------------------------------------------------------
print("\n" + "=" * 60)
print("6. PROBLÈME 2 : DÉCODAGE (Viterbi)")
print("=" * 60)

print("""
QUESTION : Quelle est la séquence d'états cachés la plus probable
           ayant produit les observations ?
           S* = argmax P(S | O, lambda)

ALGORITHME DE VITERBI : Programmation dynamique (similaire à Forward)

  delta[t][i] = max probabilité d'arriver à l'état i au temps t
  psi[t][i]   = état précédent qui maximise cette probabilité

  Initialisation : delta[0][i] = pi[i] * B[i][O_0]
  Récurrence     : delta[t][i] = B[i][O_t] * max_j(delta[t-1][j] * A[j][i])
                   psi[t][i]   = argmax_j(delta[t-1][j] * A[j][i])
  Terminaison    : S*_T = argmax_i(delta[T-1][i])
  Backtracking   : S*_t = psi[t+1][S*_t+1]
""")

def viterbi(obs_seq, A, B, pi):
    """Algorithme de Viterbi - trouve la séquence d'états la plus probable"""
    T = len(obs_seq)
    N = len(pi)

    # delta et psi
    delta = np.zeros((T, N))
    psi = np.zeros((T, N), dtype=int)

    # Initialisation
    delta[0] = pi * B[:, obs_seq[0]]
    psi[0] = 0

    # Récurrence
    for t in range(1, T):
        for j in range(N):
            # Pour chaque état j, trouver le meilleur prédécesseur
            scores = delta[t-1] * A[:, j]
            psi[t, j] = np.argmax(scores)
            delta[t, j] = B[j, obs_seq[t]] * np.max(scores)

    # Backtracking
    path = np.zeros(T, dtype=int)
    path[-1] = np.argmax(delta[-1])

    for t in range(T - 2, -1, -1):
        path[t] = psi[t + 1, path[t + 1]]

    best_prob = np.max(delta[-1])

    return path, best_prob, delta

# Décoder la séquence Marcher -> Courses -> Ménage
path, best_prob, delta = viterbi(obs, A, B, pi)

print(f"Séquence observée  : {' -> '.join(obs_names)}")
print(f"États décodés      : {' -> '.join(states[s] for s in path)}")
print(f"Probabilité        : {best_prob:.6f}")

print(f"\nMatrice delta (Viterbi) :")
print(f"  {'':>8s}  " + "  ".join(f"{s:>10s}" for s in states))
for t in range(len(obs)):
    vals = "  ".join(f"{delta[t, i]:10.6f}" for i in range(N))
    print(f"  t={t} ({observations[obs[t]]:>7s})  {vals}")

# Tester avec différentes séquences
print("\n--- Décodage de différentes séquences ---")
test_sequences = [
    [0, 0, 0],  # Marcher, Marcher, Marcher
    [2, 2, 2],  # Ménage, Ménage, Ménage
    [0, 2, 0],  # Marcher, Ménage, Marcher
    [1, 2, 1, 0, 2],  # Séquence plus longue
]

for seq in test_sequences:
    path, prob, _ = viterbi(seq, A, B, pi)
    obs_str = ", ".join(observations[o] for o in seq)
    state_str = ", ".join(states[s] for s in path)
    print(f"  Obs: [{obs_str:>40s}] -> États: [{state_str}]")

# -------------------------------------------------------
# 7. GÉNÉRER DES SÉQUENCES À PARTIR D'UN HMM
# -------------------------------------------------------
print("\n" + "=" * 60)
print("7. GÉNÉRER DES SÉQUENCES")
print("=" * 60)

def generate_sequence(A, B, pi, length):
    """Générer une séquence d'états et d'observations"""
    states_seq = []
    obs_seq = []

    # État initial
    state = np.random.choice(len(pi), p=pi)
    states_seq.append(state)

    # Observation initiale
    obs = np.random.choice(B.shape[1], p=B[state])
    obs_seq.append(obs)

    # Générer la suite
    for _ in range(length - 1):
        state = np.random.choice(len(pi), p=A[state])
        obs = np.random.choice(B.shape[1], p=B[state])
        states_seq.append(state)
        obs_seq.append(obs)

    return states_seq, obs_seq

np.random.seed(42)
print("5 séquences générées (longueur 8) :\n")
for i in range(5):
    s_seq, o_seq = generate_sequence(A, B, pi, 8)

    # Décoder avec Viterbi pour comparer
    decoded, _, _ = viterbi(o_seq, A, B, pi)

    obs_str = " ".join(f"{observations[o]:>8s}" for o in o_seq)
    real_str = " ".join(f"{states[s]:>8s}" for s in s_seq)
    dec_str = " ".join(f"{states[s]:>8s}" for s in decoded)

    correct = sum(1 for a, b in zip(s_seq, decoded) if a == b)

    print(f"  Séquence {i+1} :")
    print(f"    Observations  : {obs_str}")
    print(f"    États réels   : {real_str}")
    print(f"    Viterbi       : {dec_str}")
    print(f"    Correct       : {correct}/{len(s_seq)}")
    print()

# -------------------------------------------------------
# 8. UTILISER hmmlearn (bibliothèque Python)
# -------------------------------------------------------
print("=" * 60)
print("8. UTILISER hmmlearn")
print("=" * 60)

print("""
hmmlearn est la bibliothèque Python de référence pour les HMM.
Elle fournit :
  - CategoricalHMM : observations discrètes (comme notre exemple)
  - GaussianHMM    : observations continues (gaussiennes)
  - GMMHMM         : observations mixtes gaussiennes

Installation : pip install hmmlearn
""")

from hmmlearn import hmm

# Créer un HMM catégoriel
model = hmm.CategoricalHMM(n_components=2, n_iter=100, random_state=42)

# Fixer les paramètres (au lieu de les apprendre)
model.startprob_ = pi
model.transmat_ = A
model.emissionprob_ = B

# Générer une séquence
obs_generated, states_generated = model.sample(10)
print("Séquence générée avec hmmlearn :")
print(f"  Observations : {[observations[int(o)] for o in obs_generated.flatten()]}")
print(f"  États        : {[states[int(s)] for s in states_generated]}")

# Score (log-probabilité)
test_obs = np.array([[0], [1], [2]])  # Marcher, Courses, Ménage
log_prob = model.score(test_obs)
print(f"\nLog P(Marcher, Courses, Ménage) = {log_prob:.6f}")
print(f"    P(Marcher, Courses, Ménage) = {np.exp(log_prob):.6f}")
print(f"    Notre calcul Forward        = {prob:.6f}")
print(f"    Concordance : {np.isclose(np.exp(log_prob), prob)}")

# Décodage Viterbi
log_prob_v, state_seq = model.decode(test_obs, algorithm="viterbi")
print(f"\nDécodage Viterbi (hmmlearn) : {[states[s] for s in state_seq]}")
print(f"Décodage Viterbi (notre)    : {[states[s] for s in path]}")

# Probabilités postérieures
posteriors = model.predict_proba(test_obs)
print(f"\nProbabilités postérieures P(état | observations) :")
print(f"  {'':>8s}  " + "  ".join(f"{s:>10s}" for s in states))
for t in range(len(obs)):
    vals = "  ".join(f"{posteriors[t, i]:10.4f}" for i in range(N))
    print(f"  t={t} ({observations[obs[t]]:>7s})  {vals}")

print("\n" + "=" * 60)
print("FIN DU TUTORIEL FONDAMENTAUX HMM")
print("=" * 60)

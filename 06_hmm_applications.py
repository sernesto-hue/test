"""
=============================================================
 Modèles de Markov Cachés - Applications Pratiques
=============================================================
Ce script couvre :
  1. Reconnaissance de régimes de marché (finance)
  2. Analyse de séquences ADN simplifiée
  3. POS Tagging simplifié (étiquetage grammatical)
  4. Détection d'anomalies dans des séquences
=============================================================
"""

import numpy as np
from hmmlearn import hmm

# -------------------------------------------------------
# 1. RÉGIMES DE MARCHÉ (Finance)
# -------------------------------------------------------
print("=" * 60)
print("1. RÉGIMES DE MARCHÉ")
print("=" * 60)

print("""
Idée : Le marché boursier alterne entre des régimes cachés :
  - Marché haussier (bull) : rendements positifs, faible volatilité
  - Marché baissier (bear) : rendements négatifs, forte volatilité

On modélise les rendements quotidiens avec un HMM Gaussien.
""")

# Simuler des données de marché avec 2 régimes
np.random.seed(42)

# Régime 1 : Haussier (rendements positifs, faible vol)
n_bull = 100
returns_bull = np.random.normal(0.001, 0.01, n_bull)  # mu=0.1%, sigma=1%

# Régime 2 : Baissier (rendements négatifs, forte vol)
n_bear = 50
returns_bear = np.random.normal(-0.002, 0.025, n_bear)  # mu=-0.2%, sigma=2.5%

# Régime 1 encore
n_bull2 = 80
returns_bull2 = np.random.normal(0.001, 0.01, n_bull2)

# Régime 2 encore
n_bear2 = 30
returns_bear2 = np.random.normal(-0.003, 0.03, n_bear2)

# Concaténer
returns = np.concatenate([returns_bull, returns_bear, returns_bull2, returns_bear2])
true_regimes = np.concatenate([
    np.zeros(n_bull, dtype=int),
    np.ones(n_bear, dtype=int),
    np.zeros(n_bull2, dtype=int),
    np.ones(n_bear2, dtype=int),
])

print(f"Total : {len(returns)} jours de trading simulés")
print(f"Rendement moyen : {returns.mean()*100:.3f}%")
print(f"Volatilité      : {returns.std()*100:.3f}%")

# Entraîner un HMM Gaussien à 2 états
model_market = hmm.GaussianHMM(
    n_components=2,
    covariance_type="full",
    n_iter=200,
    random_state=42,
)

X_market = returns.reshape(-1, 1)
model_market.fit(X_market)

# Décoder les régimes
predicted_regimes = model_market.predict(X_market)

# Les labels peuvent être inversés (HMM ne connaît pas les noms)
# On identifie quel état correspond à "bull" via la moyenne
means = model_market.means_.flatten()
if means[0] < means[1]:
    # État 0 = bear, État 1 = bull -> inverser
    predicted_regimes = 1 - predicted_regimes
    means = means[::-1]
    covars = model_market.covars_.flatten()[::-1]
else:
    covars = model_market.covars_.flatten()

regime_names = ["Haussier", "Baissier"]
print(f"\nParamètres appris :")
for i in range(2):
    print(f"  {regime_names[i]:>9s} : mu={means[i]*100:+.3f}%, sigma={np.sqrt(covars[i])*100:.3f}%")

print(f"\nMatrice de transition apprise :")
T = model_market.transmat_
for i in range(2):
    probs = ", ".join(f"{regime_names[j]}={T[i,j]:.3f}" for j in range(2))
    print(f"  {regime_names[i]:>9s} -> {probs}")

# Accuracy de détection
accuracy = np.mean(predicted_regimes == true_regimes)
print(f"\nAccuracy de détection des régimes : {accuracy:.1%}")

# Afficher les transitions détectées
changes = np.where(np.diff(predicted_regimes) != 0)[0]
print(f"Transitions détectées aux jours : {changes.tolist()}")
print(f"Transitions réelles aux jours   : {[n_bull-1, n_bull+n_bear-1, n_bull+n_bear+n_bull2-1]}")

# -------------------------------------------------------
# 2. ANALYSE DE SÉQUENCES ADN SIMPLIFIÉE
# -------------------------------------------------------
print("\n" + "=" * 60)
print("2. ANALYSE DE SÉQUENCES ADN")
print("=" * 60)

print("""
Idée : L'ADN contient des régions riches en CG et d'autres riches en AT.
  - États cachés : {Riche_CG, Riche_AT}
  - Observations : {A, C, G, T}

Les îlots CpG (riches en CG) sont biologiquement importants car
ils sont souvent associés aux promoteurs de gènes.
""")

# Définir le HMM pour l'ADN
nucleotides = ["A", "C", "G", "T"]
nuc_to_idx = {n: i for i, n in enumerate(nucleotides)}

# HMM à 2 états
model_dna = hmm.CategoricalHMM(n_components=2, n_iter=100, random_state=42)

# Paramètres manuels
model_dna.startprob_ = np.array([0.5, 0.5])

# Transition : les régions sont "collantes" (on reste dans le même état)
model_dna.transmat_ = np.array([
    [0.95, 0.05],  # Riche_CG reste souvent Riche_CG
    [0.05, 0.95],  # Riche_AT reste souvent Riche_AT
])

# Émission
model_dna.emissionprob_ = np.array([
    [0.15, 0.35, 0.35, 0.15],  # Riche_CG : plus de C et G
    [0.35, 0.15, 0.15, 0.35],  # Riche_AT : plus de A et T
])

region_names = ["Riche_CG", "Riche_AT"]

# Générer une séquence ADN
obs_dna, states_dna = model_dna.sample(200)
obs_dna = obs_dna.flatten().astype(int)

sequence_str = "".join(nucleotides[o] for o in obs_dna[:60])
states_str = "".join("C" if s == 0 else "A" for s in states_dna[:60])

print(f"Séquence ADN (60 premiers) :")
print(f"  ADN    : {sequence_str}")
print(f"  Région : {states_str}")
print(f"  (C=Riche_CG, A=Riche_AT)")

# Décoder la séquence
decoded_states = model_dna.predict(obs_dna.reshape(-1, 1))

accuracy_dna = np.mean(decoded_states == states_dna)
print(f"\nAccuracy du décodage : {accuracy_dna:.1%}")

# Trouver les îlots CpG (régions contiguës Riche_CG)
def find_islands(states, target_state):
    """Trouver les régions contiguës d'un état donné"""
    islands = []
    start = None
    for i, s in enumerate(states):
        if s == target_state and start is None:
            start = i
        elif s != target_state and start is not None:
            islands.append((start, i - 1, i - start))
            start = None
    if start is not None:
        islands.append((start, len(states) - 1, len(states) - start))
    return islands

islands = find_islands(decoded_states, 0)
print(f"\nÎlots CpG détectés : {len(islands)}")
for start, end, length in islands[:5]:
    island_seq = "".join(nucleotides[o] for o in obs_dna[start:end+1])
    cg_count = island_seq.count("C") + island_seq.count("G")
    cg_ratio = cg_count / len(island_seq) if len(island_seq) > 0 else 0
    print(f"  Position {start:>3d}-{end:>3d} (longueur {length:>3d}) : CG={cg_ratio:.0%}")

# -------------------------------------------------------
# 3. POS TAGGING SIMPLIFIÉ
# -------------------------------------------------------
print("\n" + "=" * 60)
print("3. POS TAGGING SIMPLIFIÉ")
print("=" * 60)

print("""
Idée : Assigner une catégorie grammaticale à chaque mot
  - États cachés : {Nom, Verbe, Déterminant, Adjectif}
  - Observations : mots du vocabulaire

Simplifié avec un petit vocabulaire pour illustrer le concept.
""")

# Petit vocabulaire
vocab = ["le", "chat", "mange", "poisson", "dort", "gros", "petit", "un"]
vocab_to_idx = {w: i for i, w in enumerate(vocab)}

# POS tags
tags = ["DET", "NOM", "VERBE", "ADJ"]
n_tags = len(tags)
n_vocab = len(vocab)

# Créer le HMM POS tagger
model_pos = hmm.CategoricalHMM(n_components=n_tags, n_iter=100, random_state=42)

# Probabilité initiale : une phrase commence souvent par un déterminant
model_pos.startprob_ = np.array([0.6, 0.2, 0.1, 0.1])

# Transitions (grammaire simplifiée)
# DET -> NOM (très probable), NOM -> VERBE, VERBE -> DET/NOM, ADJ -> NOM
model_pos.transmat_ = np.array([
    # DET   NOM    VERBE  ADJ
    [0.05, 0.50,  0.05,  0.40],  # DET  -> NOM ou ADJ
    [0.10, 0.10,  0.70,  0.10],  # NOM  -> VERBE
    [0.40, 0.30,  0.10,  0.20],  # VERBE-> DET ou NOM
    [0.10, 0.70,  0.10,  0.10],  # ADJ  -> NOM
])

# Émissions (quel mot pour quelle catégorie)
# vocab: le, chat, mange, poisson, dort, gros, petit, un
model_pos.emissionprob_ = np.array([
    # le    chat  mange  poisson dort  gros  petit  un
    [0.45, 0.01, 0.01,  0.01,   0.01, 0.01, 0.01,  0.49],  # DET
    [0.01, 0.40, 0.01,  0.50,   0.01, 0.03, 0.03,  0.01],  # NOM
    [0.01, 0.01, 0.55,  0.01,   0.40, 0.01, 0.01,  0.01],  # VERBE (mange, dort)
    [0.01, 0.01, 0.01,  0.01,   0.01, 0.47, 0.47,  0.01],  # ADJ (gros, petit)
])

# Tester avec des phrases
phrases = [
    "le chat mange le poisson",
    "un gros chat dort",
    "le petit poisson mange",
    "un chat mange un petit poisson",
]

for phrase in phrases:
    words = phrase.split()
    indices = [vocab_to_idx[w] for w in words]
    obs_array = np.array(indices).reshape(-1, 1)

    _, decoded_tags = model_pos.decode(obs_array, algorithm="viterbi")

    tagged = " ".join(f"{w}/{tags[t]}" for w, t in zip(words, decoded_tags))
    print(f"  \"{phrase}\"")
    print(f"  -> {tagged}\n")

# -------------------------------------------------------
# 4. DÉTECTION D'ANOMALIES
# -------------------------------------------------------
print("=" * 60)
print("4. DÉTECTION D'ANOMALIES DANS DES SÉQUENCES")
print("=" * 60)

print("""
Idée : Entraîner un HMM sur des séquences "normales", puis
       utiliser le score (log-probabilité) pour détecter les anomalies.
       Une séquence anormale aura un score très bas.
""")

# Simuler un capteur avec 2 états normaux : {Bas, Haut}
# Observations discrétisées : {0=très_bas, 1=bas, 2=moyen, 3=haut, 4=très_haut}

# Entraîner sur des données normales
model_normal = hmm.CategoricalHMM(n_components=2, n_iter=100, random_state=42)
model_normal.startprob_ = np.array([0.7, 0.3])
model_normal.transmat_ = np.array([
    [0.8, 0.2],
    [0.3, 0.7],
])
model_normal.emissionprob_ = np.array([
    [0.1, 0.4, 0.3, 0.15, 0.05],  # État Bas : surtout bas/moyen
    [0.05, 0.1, 0.3, 0.4, 0.15],  # État Haut : surtout moyen/haut
])

obs_labels = ["très_bas", "bas", "moyen", "haut", "très_haut"]

# Générer des séquences normales pour calibration
np.random.seed(42)
normal_scores = []
for _ in range(100):
    obs, _ = model_normal.sample(20)
    score = model_normal.score(obs)
    normal_scores.append(score)

mean_score = np.mean(normal_scores)
std_score = np.std(normal_scores)
threshold = mean_score - 2 * std_score  # 2 écarts-types en dessous

print(f"Calibration sur 100 séquences normales :")
print(f"  Score moyen     : {mean_score:.2f}")
print(f"  Écart-type      : {std_score:.2f}")
print(f"  Seuil (mu - 2s) : {threshold:.2f}")

# Tester avec des séquences normales et anormales
print(f"\n--- Test de détection ---")

# Séquences normales
test_normal = [
    [1, 2, 1, 2, 3, 2, 1, 2, 3, 3, 2, 1, 1, 2, 3, 2, 1, 2, 2, 1],
    [2, 3, 3, 4, 3, 2, 3, 3, 2, 1, 2, 3, 3, 2, 3, 4, 3, 2, 2, 3],
]

# Séquences anormales (patterns inhabituels)
test_anomalies = [
    [0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4],  # Oscillation extrême
    [4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0],  # Transitions brusques
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],  # Bloqué sur très_bas
]

all_tests = [(s, "Normal") for s in test_normal] + [(s, "Anomalie") for s in test_anomalies]

for seq, label in all_tests:
    obs = np.array(seq).reshape(-1, 1)
    score = model_normal.score(obs)
    detected = "ANOMALIE" if score < threshold else "Normal"
    correct = (label == "Normal" and detected == "Normal") or (label == "Anomalie" and detected == "ANOMALIE")
    marker = "OK" if correct else "ERREUR"

    pattern = "".join(obs_labels[o][0] for o in seq)  # première lettre
    print(f"  [{marker:>6s}] Score={score:>7.2f}  Détecté={detected:>8s}  Vrai={label:>8s}  Pattern: {pattern}")

print("\n" + "=" * 60)
print("FIN DU TUTORIEL APPLICATIONS HMM")
print("=" * 60)

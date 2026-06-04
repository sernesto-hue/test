/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ISO11228Params, ISO11228Result, ISO11228_3Params, ISO11228_3Result, BayesianAnalysisResult, BayesianSample } from "./types";

// Box-Muller transform for generating standard normal random values N(0, 1)
export function randomNormal(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Generate chi-square random values for degrees of freedom k
export function randomChiSquare(df: number): number {
  let sum = 0;
  for (let i = 0; i < df; i++) {
    const z = randomNormal();
    sum += z * z;
  }
  // Fallback for df = 0 or safety
  return sum || 0.001;
}

/**
 * Bayesian Log-Normal Exposure Assessment Engine
 * Computes posterior distributions for GM, GSD and 95th Percentile
 */
export function runBayesianExposureSimulation(
  chemicalName: string,
  vlepLimit: number,
  unit: string,
  measurementsOnly: number[]
): BayesianAnalysisResult {
  // Clear trace concentrations (ensure strictly positive values)
  const measurements = measurementsOnly.filter(x => x > 0);
  const n = measurements.length;

  const numDraws = 1500;
  const posteriorSamples: { p95: number; gm: number; index: number }[] = [];

  let gmEstimate = 0;
  let gsdEstimate = 1.8; // standard occupational hygiene default GSD
  let p95Estimate = 0;
  let exceedanceProb = 0;
  let riskCategory: "green" | "yellow" | "red" = "green";

  if (n < 2) {
    // Fallback/Prior Simulation for low or empty measurement datasets
    // We construct a representative Bayesian prior with GSD centered around 1.8 to 2.2
    const assumedGM = n === 1 ? measurements[0] : vlepLimit * 0.15;
    const logMean = Math.log(assumedGM);
    const logSD = Math.log(1.9); // assumed default GSD

    let exceedCount = 0;
    let sumGM = 0;
    let sumP95 = 0;

    for (let i = 0; i < numDraws; i++) {
      // Simulate random fluctuations of posterior bounds around prior
      const s_sd = logSD * (0.8 + 0.4 * Math.random());
      const s_mean = logMean + randomNormal() * (n === 1 ? 0.3 : 0.6);
      
      const gm = Math.exp(s_mean);
      const gsd = Math.exp(s_sd);
      const p95 = Math.exp(s_mean + 1.64485 * s_sd);

      if (p95 > vlepLimit) {
        exceedCount++;
      }

      sumGM += gm;
      sumP95 += p95;

      if (i < 150) {
        posteriorSamples.push({
          gm,
          p95,
          index: i,
        });
      }
    }

    gmEstimate = measurements[0] || assumedGM;
    gsdEstimate = 1.9;
    p95Estimate = sumP95 / numDraws;
    exceedanceProb = (exceedCount / numDraws) * 100;

  } else {
    // True uninformative Bayesian formulation: log-exposure y_i = ln(x_i) ~ N(mu, sigma^2)
    const logY = measurements.map(x => Math.log(x));
    const logMean = logY.reduce((a, b) => a + b, 0) / n;
    
    // Sample variance of log values
    const sampleVar = logY.reduce((sum, val) => sum + Math.pow(val - logMean, 2), 0) / (n - 1);
    const sampleSD = Math.sqrt(sampleVar);

    let exceedCount = 0;
    let sumGM = 0;
    let sumGSD = 0;
    let sumP95 = 0;

    for (let i = 0; i < numDraws; i++) {
      // Draw 1: sigma^2 ~ Inv-Chi²(n-1, s_y^2) => sigma^2 = (n-1) * s_y^2 / Chi²(n-1)
      const chi2 = randomChiSquare(n - 1);
      const sigmaSquare = ((n - 1) * sampleVar) / chi2;
      const sigma = Math.sqrt(sigmaSquare);

      // Draw 2: mu | sigma^2 ~ N(logMean, sigma^2 / n)
      const z = randomNormal();
      const mu = logMean + z * (sigma / Math.sqrt(n));

      // Compute parameters for this draw
      const gm = Math.exp(mu);
      const gsd = Math.exp(sigma);
      const p95 = Math.exp(mu + 1.64485 * sigma);

      if (p95 > vlepLimit) {
        exceedCount++;
      }

      sumGM += gm;
      sumGSD += gsd;
      sumP95 += p95;

      // Keep subset of samples for visual plotting
      if (i < 150) {
        posteriorSamples.push({
          gm,
          p95,
          index: i
        });
      }
    }

    gmEstimate = Math.exp(logMean);
    gsdEstimate = sumGSD / numDraws;
    p95Estimate = sumP95 / numDraws;
    exceedanceProb = (exceedCount / numDraws) * 100;
  }

  // EN 689 / European Bayesian risk classification
  // Red = High risk: Prob(P95 > VLEP) > 20%
  // Yellow = Caution: Prob(P95 > VLEP) between 5% and 20%
  // Green = Compliant: Prob(P95 > VLEP) < 5%
  if (exceedanceProb > 20) {
    riskCategory = "red";
  } else if (exceedanceProb > 5) {
    riskCategory = "yellow";
  } else {
    riskCategory = "green";
  }

  return {
    chemicalName,
    vlepLimit,
    unit,
    measuredPoints: measurementsOnly,
    gmEstimate: Number(gmEstimate.toFixed(3)),
    gsdEstimate: Number(gsdEstimate.toFixed(3)),
    p95Estimate: Number(p95Estimate.toFixed(3)),
    exceedanceProb: Number(exceedanceProb.toFixed(1)),
    riskCategory,
    posteriorSamples
  };
}

/**
 * ISO 11228-1: Recommended Weight Limit (RWL) & Lifting Index Calculation (IL)
 */
export function calculateISO11228(params: ISO11228Params): ISO11228Result {
  const {
    actualWeight,
    verticalPosition,
    horizontalDistance,
    verticalDistance,
    asymmetryAngle,
    frequency,
    coupling,
    genderReference
  } = params;

  // 1. Reference Mass (M_ref)
  // Recommended is 20kg (incorporating INRS and EU safety margins), 25kg for men, 15kg for women
  let mRef = 20.0;
  if (genderReference === "male") mRef = 25.0;
  if (genderReference === "female") mRef = 15.0;

  // 2. Horizontal Multiplier (HM)
  // Range H from 25cm to 63cm. HM = 25 / H
  let hm = 1.0;
  if (horizontalDistance <= 25) {
    hm = 1.0;
  } else if (horizontalDistance >= 63) {
    hm = 0.0;
  } else {
    hm = 25 / horizontalDistance;
  }

  // 3. Vertical Multiplier (VM)
  // V from 0 to 175cm. VM = 1 - 0.003 * |V - 75|
  let vm = 1 - 0.003 * Math.abs(verticalPosition - 75);
  if (vm < 0) vm = 0;
  if (vm > 1) vm = 1;

  // 4. Distance Multiplier (DM)
  // D from 25cm to 200cm. DM = 0.82 + 4.5 / D
  let dm = 1.0;
  if (verticalDistance > 25) {
    const dVal = Math.min(200, verticalDistance);
    dm = 0.82 + 4.5 / dVal;
    if (dm > 1.0) dm = 1.0;
  }

  // 5. Asymmetry Multiplier (AM)
  // A from 0 to 135 degrees. AM = 1 - 0.0032 * A
  const angle = Math.min(135, Math.max(0, asymmetryAngle));
  let am = 1 - 0.0032 * angle;
  if (am < 0) am = 0;

  // 6. Frequency Multiplier (FM) — NIOSH 1994 Table 5 stepped lookup
  // Three duration bands: ≤1h, ≤2h, ≤8h
  const fm = (() => {
    if (frequency <= 0) return 1.0;
    const d = params.durationHours;
    const band = d <= 1 ? 0 : d <= 2 ? 1 : 2;
    // [maxFreq, fm_≤1h, fm_≤2h, fm_≤8h]
    const table: [number, number, number, number][] = [
      [0.2,  1.00, 0.95, 0.85],
      [0.5,  0.97, 0.92, 0.81],
      [1,    0.94, 0.88, 0.75],
      [2,    0.91, 0.84, 0.65],
      [3,    0.88, 0.79, 0.55],
      [4,    0.84, 0.72, 0.45],
      [5,    0.80, 0.60, 0.35],
      [6,    0.75, 0.50, 0.27],
      [7,    0.70, 0.42, 0.22],
      [8,    0.60, 0.35, 0.18],
      [9,    0.52, 0.30, 0.15],
      [10,   0.45, 0.26, 0.13],
      [11,   0.41, 0.23, 0.00],
      [12,   0.37, 0.21, 0.00],
      [13,   0.34, 0.18, 0.00],
      [14,   0.31, 0.16, 0.00],
      [15,   0.28, 0.00, 0.00],
      [Infinity, 0.00, 0.00, 0.00],
    ];
    for (const [maxFreq, fs, fm_m, fl] of table) {
      if (frequency <= maxFreq) return [fs, fm_m, fl][band];
    }
    return 0.0;
  })();

  // 7. Coupling Multiplier (CM)
  let cm = 1.0;
  if (coupling === "fair") {
    cm = 0.95;
  } else if (coupling === "poor") {
    cm = 0.90;
  }

  // Recommended Weight Limit
  const rwl = mRef * hm * vm * dm * am * fm * cm;

  // Lifting Index (IL)
  const liftingIndex = rwl > 0 ? actualWeight / rwl : 99;

  // Risk Classification
  let riskLevel: "low" | "medium" | "high" = "low";
  if (liftingIndex > 2.0) {
    riskLevel = "high"; // Action corrective indispensable immédiate
  } else if (liftingIndex > 1.0) {
    riskLevel = "medium"; // À surveiller, besoin d'adaptation ergonomique
  } else {
    riskLevel = "low"; // Tout à fait acceptable et sécurisé
  }

  return {
    recommendedWeightLimit: Number(rwl.toFixed(2)),
    liftingIndex: Number(liftingIndex.toFixed(2)),
    riskLevel,
    multipliers: {
      hm: Number(hm.toFixed(3)),
      vm: Number(vm.toFixed(3)),
      dm: Number(dm.toFixed(3)),
      am: Number(am.toFixed(3)),
      fm: Number(fm.toFixed(3)),
      cm: Number(cm.toFixed(3))
    }
  };
}

/**
 * ISO 11228-3: Gestes Répétitifs des membres supérieurs - Méthode d'Indice OCRA (Check-list Simplifiée)
 */
export function calculateISO11228_3(params: ISO11228_3Params): ISO11228_3Result {
  const {
    technicalActionsPerMin,
    forceBorgScale,
    postureScore,
    recoveryDeficitHours,
    additionalFactors,
    durationHours
  } = params;

  // 1. Frequency Score (CF)
  let frequencyContribution = 1;
  if (technicalActionsPerMin >= 55) {
    frequencyContribution = 15;
  } else if (technicalActionsPerMin >= 45) {
    frequencyContribution = 12;
  } else if (technicalActionsPerMin >= 35) {
    frequencyContribution = 9;
  } else if (technicalActionsPerMin >= 26) {
    frequencyContribution = 6;
  } else if (technicalActionsPerMin >= 15) {
    frequencyContribution = 3;
  }

  // 2. Force Score (FF) — EN ISO 11228-3 Annexe B stepped scale (Borg CR10)
  const b = Number(forceBorgScale);
  let forceContribution: number;
  if (b >= 8)      forceContribution = 14;
  else if (b >= 5) forceContribution = 10;
  else if (b >= 3) forceContribution = 6;
  else if (b >= 2) forceContribution = 4;
  else if (b >= 1) forceContribution = 2;
  else             forceContribution = 0;

  // 3. Posture Score (PF)
  let postureContribution = 1;
  if (postureScore === "moderate") {
    postureContribution = 4;
  } else if (postureScore === "severe") {
    postureContribution = 8;
  }

  // 4. Additional Factors Score (AF)
  let additionalContribution = 0;
  if (additionalFactors === "few") {
    additionalContribution = 2;
  } else if (additionalFactors === "multiple") {
    additionalContribution = 4;
  }

  // 5. Recovery Multiplier (RF)
  let recoveryMultiplier = 1.0;
  if (recoveryDeficitHours >= 4) {
    recoveryMultiplier = 1.8;
  } else if (recoveryDeficitHours === 3) {
    recoveryMultiplier = 1.5;
  } else if (recoveryDeficitHours === 2) {
    recoveryMultiplier = 1.30;
  } else if (recoveryDeficitHours === 1) {
    recoveryMultiplier = 1.15;
  }

  // 6. Duration Multiplier (DF)
  let durationMultiplier = 1.0;
  if (durationHours <= 2) {
    durationMultiplier = 0.6;
  } else if (durationHours <= 4) {
    durationMultiplier = 0.8;
  } else if (durationHours <= 6) {
    durationMultiplier = 1.0;
  } else if (durationHours <= 8) {
    durationMultiplier = 1.2;
  } else {
    durationMultiplier = 1.4;
  }

  const baseScoreSum = frequencyContribution + forceContribution + postureContribution + additionalContribution;
  const rawScore = baseScoreSum * recoveryMultiplier * durationMultiplier;
  const ocraScore = Number(rawScore.toFixed(1));

  // Risk Rating — ISO 11228-3 / OCRA thresholds:
  // ≤ 7.5   → Acceptable (vert)
  // 7.6-11.0 → Très faible / limite (jaune)
  // 11.1-14.0 → Moyen (orange)
  // > 14.0  → Élevé (rouge)
  let riskLevel: "low" | "medium" | "high" = "low";
  let riskLabel = "Risque Acceptable (Poste conforme)";
  if (ocraScore > 14.0) {
    riskLevel = "high";
    riskLabel = "Action Corrective Urgente (TMS d'alerte critique)";
  } else if (ocraScore >= 11.1) {
    riskLevel = "medium";
    riskLabel = "Risque Moyen — Orange (Observation médicale rapprochée requise)";
  } else if (ocraScore >= 7.6) {
    riskLevel = "medium";
    riskLabel = "Risque Limite / Très Faible (Rotation ou alternance conseillée)";
  }

  return {
    ocraScore,
    riskLevel,
    riskLabel,
    contributions: {
      frequency: frequencyContribution,
      force: forceContribution,
      posture: postureContribution,
      additional: additionalContribution
    },
    multipliers: {
      recovery: recoveryMultiplier,
      duration: durationMultiplier
    }
  };
}

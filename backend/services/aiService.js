/**
 * AI Service for Smart Health Predictor
 * Computes organ scores based on symptoms, history, and vitals.
 * Provides custom foods, exercises, and supplements.
 */

// Simple rules mapping symptoms to organ systems and specialties
const SYMPTOM_SYSTEM_MAP = {
  // Cardiovascular
  "chest_pain": { organ: "heart", specialty: "Cardiologist", weight: 35 },
  "shortness_of_breath": { organ: "heart", specialty: "Cardiologist", weight: 20 },
  "palpitations": { organ: "heart", specialty: "Cardiologist", weight: 15 },
  
  // Liver / Gastro
  "yellow_skin": { organ: "liver", specialty: "Gastroenterologist", weight: 40 },
  "nausea": { organ: "liver", specialty: "Gastroenterologist", weight: 15 },
  "abdominal_pain": { organ: "liver", specialty: "Gastroenterologist", weight: 20 },
  
  // Renal / Kidney
  "swollen_ankles": { organ: "kidney", specialty: "Nephrologist", weight: 30 },
  "frequent_urination": { organ: "kidney", specialty: "Nephrologist", weight: 20 },
  "foamy_urine": { organ: "kidney", specialty: "Nephrologist", weight: 35 },
  
  // Thyroid / Endocrine
  "weight_fluctuation": { organ: "thyroid", specialty: "Endocrinologist", weight: 25 },
  "extreme_fatigue": { organ: "thyroid", specialty: "Endocrinologist", weight: 15 },
  "cold_intolerance": { organ: "thyroid", specialty: "Endocrinologist", weight: 30 },
  "heat_intolerance": { organ: "thyroid", specialty: "Endocrinologist", weight: 30 },
  
  // Metabolic / Diabetes
  "excessive_thirst": { organ: "metabolic", specialty: "Endocrinologist", weight: 25 },
  "slow_healing": { organ: "metabolic", specialty: "Endocrinologist", weight: 30 },
  "blurred_vision": { organ: "metabolic", specialty: "Endocrinologist", weight: 25 },
  
  // Blood / General
  "dizziness": { organ: "blood", specialty: "General Physician", weight: 15 },
  "pale_skin": { organ: "blood", specialty: "General Physician", weight: 30 },
  "easy_bruising": { organ: "blood", specialty: "General Physician", weight: 35 }
};

const calculateBMI = (weightKg, heightCm) => {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
};

const assessVitals = (vitals) => {
  const { systolic, diastolic, sugar, temperature, bmi } = vitals;
  const warnings = [];
  
  // Blood Pressure
  let bpLevel = "Normal";
  if (systolic >= 140 || diastolic >= 90) {
    bpLevel = "Stage 2 Hypertension";
    warnings.push("High blood pressure detected. Limit salt and monitor readings.");
  } else if ((systolic >= 130 && systolic < 140) || (diastolic >= 80 && diastolic < 90)) {
    bpLevel = "Stage 1 Hypertension";
    warnings.push("Pre-hypertension levels detected. Monitor dietary sodium.");
  } else if (systolic >= 120 && systolic < 130 && diastolic < 80) {
    bpLevel = "Elevated";
  }

  // Blood Sugar
  let sugarLevel = "Normal";
  if (sugar >= 126) {
    sugarLevel = "Diabetic Range";
    warnings.push("Elevated blood glucose levels. Limit refined carbohydrates and sugars.");
  } else if (sugar >= 100 && sugar < 126) {
    sugarLevel = "Prediabetic Range";
    warnings.push("Borderline glucose levels detected. Avoid sweet drinks and get regular physical exercise.");
  }

  // BMI
  let bmiCategory = "Normal";
  if (bmi >= 30) {
    bmiCategory = "Obese";
    warnings.push("BMI indicates obesity. Focus on weight management and cardiovascular wellness.");
  } else if (bmi >= 25 && bmi < 30) {
    bmiCategory = "Overweight";
  } else if (bmi < 18.5) {
    bmiCategory = "Underweight";
  }

  // Temperature
  let fever = false;
  if (temperature >= 100.4) {
    fever = true;
    warnings.push("Body temperature indicates fever. Ensure adequate hydration and rest.");
  }

  return { bpLevel, sugarLevel, bmiCategory, fever, warnings };
};

const computeOrganHealthScores = (symptomsList, vitals, historyString = "") => {
  const baseScores = {
    heart: 95,
    liver: 95,
    kidney: 95,
    thyroid: 95,
    metabolic: 95,
    blood: 95
  };

  // 1. Deduct based on specific symptoms selected
  symptomsList.forEach(sym => {
    const mapping = SYMPTOM_SYSTEM_MAP[sym];
    if (mapping) {
      baseScores[mapping.organ] -= mapping.weight;
    }
  });

  // 2. Deduct based on vital metrics
  // Heart: High BP reduces score
  if (vitals.systolic >= 140 || vitals.diastolic >= 90) {
    baseScores.heart -= 20;
  } else if (vitals.systolic >= 130 || vitals.diastolic >= 80) {
    baseScores.heart -= 10;
  }

  // Kidney: High BP and high sugar reduce renal score
  if (vitals.systolic >= 140 || vitals.diastolic >= 90) {
    baseScores.kidney -= 10;
  }
  if (vitals.sugar >= 126) {
    baseScores.kidney -= 15;
  }

  // Metabolic: High sugar and High BMI reduce metabolic score
  if (vitals.sugar >= 126) {
    baseScores.metabolic -= 25;
  } else if (vitals.sugar >= 100) {
    baseScores.metabolic -= 15;
  }
  if (vitals.bmi >= 30) {
    baseScores.metabolic -= 15;
  } else if (vitals.bmi >= 25) {
    baseScores.metabolic -= 5;
  }

  // Thyroid: Sudden weight fluctuations or high temperature
  if (symptomsList.includes("weight_fluctuation")) {
    baseScores.thyroid -= 10;
  }

  // 3. Deduct based on Medical History keywords
  const historyLower = historyString.toLowerCase();
  if (historyLower.includes("heart") || historyLower.includes("cardiac") || historyLower.includes("bp") || historyLower.includes("hypertension")) {
    baseScores.heart -= 10;
  }
  if (historyLower.includes("liver") || historyLower.includes("hepatitis") || historyLower.includes("alcohol")) {
    baseScores.liver -= 10;
  }
  if (historyLower.includes("kidney") || historyLower.includes("renal") || historyLower.includes("dialysis")) {
    baseScores.kidney -= 15;
  }
  if (historyLower.includes("thyroid") || historyLower.includes("goiter")) {
    baseScores.thyroid -= 15;
  }
  if (historyLower.includes("diabetes") || historyLower.includes("sugar") || historyLower.includes("insulin")) {
    baseScores.metabolic -= 15;
    baseScores.kidney -= 5;
  }
  if (historyLower.includes("anemia") || historyLower.includes("blood")) {
    baseScores.blood -= 15;
  }

  // Clamp scores between 15 and 100
  Object.keys(baseScores).forEach(organ => {
    baseScores[organ] = Math.max(15, Math.min(100, baseScores[organ]));
  });

  return baseScores;
};

const getStatus = (score) => {
  if (score >= 85) return "optimal";
  if (score >= 70) return "good";
  if (score >= 50) return "caution";
  return "at_risk";
};

// Generates dynamic advice details based on organ scores
const generateConditionRecommendations = (organsScores) => {
  const recommendations = {};

  Object.entries(organsScores).forEach(([organ, score]) => {
    const status = getStatus(score);
    let severity = "info"; // maintenance
    let consultFlag = false;

    if (status === "caution" || status === "at_risk") {
      severity = "warning";
      consultFlag = true;
    }

    recommendations[organ] = {
      score,
      status,
      severity,
      consultFlag,
      specialty: getSpecialtyForOrgan(organ)
    };
  });

  return recommendations;
};

const getSpecialtyForOrgan = (organ) => {
  switch (organ) {
    case "heart": return "Cardiologist";
    case "liver": return "Gastroenterologist";
    case "kidney": return "Nephrologist";
    case "thyroid": return "Endocrinologist";
    case "metabolic": return "Endocrinologist";
    default: return "General Physician";
  }
};

const predictHealthRisks = async (inputData) => {
  const { age, gender, symptoms = [], history = "", vitals = {} } = inputData;
  
  // Calculate BMI
  const bmi = calculateBMI(vitals.weight, vitals.height);
  const completeVitals = { ...vitals, bmi };
  
  // Perform rule-based processing
  const organScores = computeOrganHealthScores(symptoms, completeVitals, history);
  const assessment = assessVitals(completeVitals);
  const organRecs = generateConditionRecommendations(organScores);
  
  // Determine overall risk level based on the lowest organ score
  const minScore = Math.min(...Object.values(organScores));
  let overallRisk = "Low";
  if (minScore < 50) overallRisk = "High";
  else if (minScore < 70) overallRisk = "Medium";

  // Match main specialist recommendation
  let primarySpecialist = "General Physician";
  const worstOrgans = Object.entries(organScores).sort((a, b) => a[1] - b[1]);
  if (worstOrgans[0][1] < 85) {
    primarySpecialist = getSpecialtyForOrgan(worstOrgans[0][0]);
  }

  // Compute Sleep suggestion based on age and risk
  let suggestedSleep = "7.5 - 8.5 hours per night";
  if (age >= 60) suggestedSleep = "7.0 - 8.0 hours per night";
  else if (age <= 18) suggestedSleep = "8.0 - 9.5 hours per night";

  const wellnessCategories = {
    nutrition: {
      title: "Nutrition & Diet Guidance",
      tips: [
        "Include South Indian whole grains like Ragi, Bajra, and Foxtail Millet to support glycemic control.",
        "Incorporate fresh Moringa leaves (Murungai Keerai) and Curry Leaves daily for natural antioxidant support.",
        "Limit sodium consumption to under 2,000 mg/day (1 teaspoon salt) to manage arterial pressure.",
        "Ensure adequate dietary fiber intake (25-30g daily) through pulses, legumes, and fresh vegetables."
      ]
    },
    mentalWellness: {
      title: "Mental Wellness & Stress Reduction",
      tips: [
        "Practice 10-15 minutes of guided diaphragmatic breathing or meditation twice daily.",
        "Engage in light-to-moderate physical activity (brisk walking) to boost endorphin levels and reduce cortisol.",
        "Maintain regular digital detox hours before bedtime to protect neural circadian recovery."
      ]
    },
    sleep: {
      title: "Sleep & Circadian Rhythm Suggestions",
      recommendedDuration: suggestedSleep,
      tips: [
        `Recommended sleep duration based on age (${age} yrs) and physiological risk: ${suggestedSleep}.`,
        "Maintain a strict, consistent sleep schedule (in bed by 10:00 PM) to align hormonal regulation.",
        "Keep bedroom temperature cool and dark, avoiding caffeine or heavy meals 3 hours prior to sleep."
      ]
    },
    preventiveCare: {
      title: "General Preventive Care & Health Monitoring",
      tips: [
        "Hydrate adequately with 2.5 to 3.0 Liters of water daily.",
        "Schedule bi-monthly blood pressure and fasting blood glucose baseline tracking.",
        "Schedule an annual comprehensive lipid profile and kidney function checkup with a verified specialist."
      ]
    }
  };

  const report = {
    patientDetails: {
      name: inputData.name || "Patient",
      age,
      gender,
      bmi,
      weight: vitals.weight,
      height: vitals.height,
      vitalsSummary: completeVitals
    },
    symptomsSummary: symptoms,
    historySummary: history,
    assessment,
    organScores,
    organRecs,
    wellnessCategories,
    overallRisk,
    recommendedSpecialist: primarySpecialist,
    timestamp: new Date().toISOString()
  };

  // Check for Gemini API key override
  if (process.env.GEMINI_API_KEY) {
    try {
      // Placeholder structure for calling the actual LLM if configured
      // const response = await callGeminiAPI(report);
      // return response;
    } catch (e) {
      console.warn("Gemini API call failed, falling back to rule-based logic", e);
    }
  }

  return report;
};

module.exports = {
  predictHealthRisks
};

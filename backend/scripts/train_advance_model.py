import os
import re
import json
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier, HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib

DATASET_DIR = r"c:\Users\Thrishi\Desktop\shp\dataset"
OUTPUT_DIR = r"c:\Users\Thrishi\Desktop\shp\backend\data"

os.makedirs(OUTPUT_DIR, exist_ok=True)

def normalize_symptom(s):
    if not isinstance(s, str):
        return ""
    s = s.strip().lower()
    s = s.replace(" ", "_")
    s = re.sub(r"_+", "_", s)
    
    corrections = {
        "spotting_urination": "spotting_urination",
        "foul_smell_of_urine": "foul_smell_of_urine",
        "dischromic_patches": "dischromic_patches",
        "fluid_overload.1": "fluid_overload"
    }
    return corrections.get(s, s)

def load_and_preprocess_data():
    print("Loading datasets...")
    df_train = pd.read_csv(os.path.join(DATASET_DIR, "Training.csv"))
    df_test = pd.read_csv(os.path.join(DATASET_DIR, "Testing.csv"))
    df_ds = pd.read_csv(os.path.join(DATASET_DIR, "DiseaseAndSymptoms.csv"))
    df_prec = pd.read_csv(os.path.join(DATASET_DIR, "Disease precaution.csv"))

    raw_symptoms = [c for c in df_train.columns if c != 'prognosis' and not c.startswith('Unnamed')]
    symptom_set = set()
    for s in raw_symptoms:
        norm = normalize_symptom(s)
        if norm:
            symptom_set.add(norm)

    symptom_cols = [c for c in df_ds.columns if 'Symptom' in c]
    for col in symptom_cols:
        for val in df_ds[col].dropna():
            norm = normalize_symptom(str(val))
            if norm:
                symptom_set.add(norm)

    sorted_symptoms = sorted(list(symptom_set))
    print(f"Total unified symptoms: {len(sorted_symptoms)}")

    records = []
    
    for df in [df_train, df_test]:
        for idx, row in df.iterrows():
            disease = str(row['prognosis']).strip()
            sample = {s: 0 for s in sorted_symptoms}
            sample['disease'] = disease
            for c in df.columns:
                if c == 'prognosis' or c.startswith('Unnamed'):
                    continue
                val = row[c]
                if val == 1:
                    norm = normalize_symptom(c)
                    if norm in sample:
                        sample[norm] = 1
            records.append(sample)

    for idx, row in df_ds.iterrows():
        disease = str(row['Disease']).strip()
        sample = {s: 0 for s in sorted_symptoms}
        sample['disease'] = disease
        for c in symptom_cols:
            val = row[c]
            if pd.notna(val):
                norm = normalize_symptom(str(val))
                if norm in sample:
                    sample[norm] = 1
        records.append(sample)

    combined_df = pd.DataFrame(records)
    print(f"Combined raw samples: {len(combined_df)}")

    combined_df = combined_df.drop_duplicates().reset_index(drop=True)
    print(f"Deduplicated combined samples: {len(combined_df)}")

    precautions_map = {}
    for idx, row in df_prec.iterrows():
        d = str(row['Disease']).strip()
        precs = []
        for p_col in ['Precaution_1', 'Precaution_2', 'Precaution_3', 'Precaution_4']:
            if pd.notna(row[p_col]) and str(row[p_col]).strip():
                precs.append(str(row[p_col]).strip().capitalize())
        precautions_map[d] = precs

    return combined_df, sorted_symptoms, precautions_map

def categorize_symptoms(symptoms):
    categories = {
        "Respiratory & ENT": [
            "continuous_sneezing", "shivering", "chills", "cough", "high_fever", "breathlessness",
            "phlegm", "throat_irritation", "redness_of_eyes", "sinus_pressure", "runny_nose",
            "congestion", "chest_pain", "loss_of_smell", "mucoid_sputum", "rusty_sputum", "blood_in_sputum"
        ],
        "Digestive & Abdominal": [
            "stomach_pain", "acidity", "ulcers_on_tongue", "vomiting", "indigestion", "nausea",
            "loss_of_appetite", "abdominal_pain", "constipation", "diarrhea", "stomach_bleeding",
            "distention_of_abdomen", "acute_liver_failure", "fluid_overload", "swelling_of_stomach",
            "yellowing_of_eyes", "jaundice", "pass_of_gases"
        ],
        "Neurological & Head": [
            "headache", "dizziness", "altered_sensorium", "lack_of_concentration", "visual_disturbances",
            "loss_of_balance", "unsteadiness", "weakness_of_one_body_side", "spinning_movements",
            "depression", "irritability", "anxiety", "slurred_speech"
        ],
        "Dermatological & Skin": [
            "itching", "skin_rash", "nodal_skin_eruptions", "dischromic_patches", "internal_itching",
            "skin_peeling", "silver_like_dusting", "small_dents_in_nails", "inflammatory_nails",
            "blister", "red_sore_around_nose", "yellow_crust_ooze", "blackheads", "scurring",
            "pus_filled_blisters"
        ],
        "Musculoskeletal & Joints": [
            "joint_pain", "muscle_wasting", "muscle_weakness", "back_pain", "neck_pain",
            "knee_pain", "hip_joint_pain", "muscle_pain", "stiff_neck", "swelling_joints",
            "movement_stiffness", "painful_walking"
        ],
        "Systemic & General": [
            "fatigue", "weight_gain", "weight_loss", "lethargy", "malaise", "mild_fever",
            "sweating", "dehydration", "swollen_blood_vessels", "swollen_legs",
            "swollen_extremeties", "enlarged_thyroid", "cold_hands_and_feets", "prominent_veins_on_calf"
        ],
        "Cardiovascular & Circulation": [
            "chest_pain", "fast_heart_rate", "palpitations"
        ],
        "Urinary & Metabolic": [
            "burning_micturition", "spotting_urination", "foul_smell_of_urine", "continuous_feel_of_urine",
            "polyuria", "excessive_hunger", "irregular_sugar_level", "increased_appetite", "extra_marital_contacts"
        ],
        "Vision & Eyes": [
            "blurred_and_distorted_vision", "pain_behind_the_eyes", "watery_from_eyes", "yellowing_of_eyes", "redness_of_eyes"
        ]
    }

    symptom_to_cat = {}

    for cat, items in categories.items():
        for item in items:
            symptom_to_cat[item] = cat

    categorized_sets = {cat: [] for cat in categories}
    for s in symptoms:
        cat = symptom_to_cat.get(s, "Systemic & General")
        categorized_sets[cat].append(s)
        symptom_to_cat[s] = cat

    return categorized_sets, symptom_to_cat

def format_symptom_label(s):
    words = s.replace('_', ' ').split()
    formatted = []
    for w in words:
        if w.lower() in ['in', 'of', 'on', 'and', 'the']:
            formatted.append(w.lower())
        else:
            formatted.append(w.capitalize())
    return " ".join(formatted)

def train_and_export():
    df, symptoms, precautions_map = load_and_preprocess_data()

    X = df[symptoms]
    y = df['disease']

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.15, random_state=42, stratify=y)

    print("Evaluating multiple candidate ML models...")
    candidates = {
        "Random Forest Classifier": RandomForestClassifier(n_estimators=150, max_depth=25, random_state=42),
        "Extra Trees Classifier": ExtraTreesClassifier(n_estimators=150, max_depth=25, random_state=42),
        "Hist Gradient Boosting": HistGradientBoostingClassifier(max_iter=150, random_state=42),
        "Logistic Regression": LogisticRegression(max_iter=500, random_state=42)
    }

    results = {}
    best_model_name = None
    best_val_acc = -1.0
    best_candidate_instance = None

    for name, clf in candidates.items():
        clf.fit(X_train, y_train)
        train_acc = accuracy_score(y_train, clf.predict(X_train))
        val_acc = accuracy_score(y_val, clf.predict(X_val))
        
        results[name] = {
            "trainAccuracy": round(float(train_acc * 100), 2),
            "valAccuracy": round(float(val_acc * 100), 2)
        }
        print(f"[{name}] Train Acc: {train_acc*100:.2f}% | Val Acc: {val_acc*100:.2f}%")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_model_name = name
            best_candidate_instance = clf

    print(f"\nWINNING MODEL: {best_model_name} with Validation Accuracy: {best_val_acc*100:.2f}%")

    # Retrain best model architecture on full dataset
    if best_model_name == "Random Forest Classifier":
        best_full = RandomForestClassifier(n_estimators=150, max_depth=25, random_state=42)
    elif best_model_name == "Extra Trees Classifier":
        best_full = ExtraTreesClassifier(n_estimators=150, max_depth=25, random_state=42)
    elif best_model_name == "Hist Gradient Boosting":
        best_full = HistGradientBoostingClassifier(max_iter=150, random_state=42)
    else:
        best_full = LogisticRegression(max_iter=500, random_state=42)

    best_full.fit(X, y)

    joblib_path = os.path.join(OUTPUT_DIR, "advance_model.joblib")
    joblib.dump(best_full, joblib_path)
    print(f"Saved best model ({best_model_name}) to {joblib_path}")

    categorized_symptoms, symptom_to_cat = categorize_symptoms(symptoms)

    symptom_details = []
    for s in symptoms:
        symptom_details.append({
            "id": s,
            "label": format_symptom_label(s),
            "category": symptom_to_cat.get(s, "Systemic & General")
        })

    metadata = {
        "bestModelName": best_model_name,
        "bestValAccuracy": round(float(best_val_acc * 100), 2),
        "modelComparison": results,
        "symptoms": symptoms,
        "symptomDetails": symptom_details,
        "categorizedSymptoms": categorized_symptoms,
        "classes": list(best_full.classes_),
        "precautions": precautions_map,
        "diseaseCount": len(best_full.classes_),
        "symptomCount": len(symptoms),
        "datasetSamples": len(df)
    }

    metadata_path = os.path.join(OUTPUT_DIR, "advance_metadata.json")
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved metadata to {metadata_path}")

if __name__ == '__main__':
    train_and_export()

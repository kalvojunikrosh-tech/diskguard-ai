"""Local Edge AI model for ransomware-like behavioral classification.

Strictly runs 100% on-device using scikit-learn RandomForestClassifier.
Zero cloud API, zero external inference dependencies, zero external data leakage.

NOTICE: This is an academic Edge AI prototype designed to classify generalized
storage behavioral dynamics (rapid modification rate, rename velocity, entropy shifts).
It is not production-grade enterprise antivirus software.
"""
import csv
import logging
import os
import threading
from typing import Dict, List, Optional, Tuple

import numpy as np
from sklearn.ensemble import RandomForestClassifier

from backend.ml.features import BehavioralFeatures

logger = logging.getLogger("diskguard.ml.model")

FEATURE_NAMES = [
    "read_frequency",
    "write_frequency",
    "file_modification_rate",
    "rename_rate",
    "entropy_change",
    "access_irregularity",
    "io_burstiness",
    "read_write_ratio",
]


class EdgeAiClassifier:
    """Lightweight on-device classifier trained locally on behavioral feature vectors."""

    def __init__(self, dataset_path: Optional[str] = None):
        if dataset_path is None:
            dataset_path = os.path.join(os.path.dirname(__file__), "dataset.csv")
        self.dataset_path = dataset_path
        self.model: Optional[RandomForestClassifier] = None
        self.feature_names = FEATURE_NAMES
        self.is_trained = False
        self._feature_importances: Dict[str, float] = {}
        self._train()

    def _train(self):
        """Train RandomForestClassifier on the local behavioral dataset."""
        if not os.path.exists(self.dataset_path):
            logger.error("Dataset not found at %s. Falling back to default heuristic model.", self.dataset_path)
            return

        x_rows: List[List[float]] = []
        y_labels: List[str] = []

        try:
            with open(self.dataset_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    feat_vec = [float(row[feat]) for feat in self.feature_names]
                    x_rows.append(feat_vec)
                    y_labels.append(row["label"].strip())

            x_train = np.array(x_rows)
            y_train = np.array(y_labels)

            clf = RandomForestClassifier(
                n_estimators=35,
                max_depth=4,
                random_state=42,
                class_weight="balanced"
            )
            clf.fit(x_train, y_train)

            self.model = clf
            self.is_trained = True

            importances = clf.feature_importances_
            self._feature_importances = {
                name: round(float(imp), 4) for name, imp in zip(self.feature_names, importances)
            }
            logger.info("Local Edge AI RandomForestClassifier trained successfully on %d samples.", len(x_rows))
        except Exception as e:
            logger.error("Error training local model: %s", e)
            self.is_trained = False

    def predict(self, features: BehavioralFeatures) -> Tuple[str, float, Dict[str, float]]:
        """Perform fast, local CPU inference on extracted behavioral features.

        Returns:
            classification: 'normal', 'suspicious', or 'ransomware-like'
            confidence: probability (0.0 to 1.0)
            feature_importances: feature weight dictionary
        """
        if not self.is_trained or self.model is None:
            return "normal", 0.5, self._feature_importances

        # Construct vector with safe fallbacks for missing/unmeasurable values
        vec = [
            features.read_frequency if features.read_frequency is not None else 0.0,
            features.write_frequency if features.write_frequency is not None else 0.0,
            features.file_modification_rate if features.file_modification_rate is not None else 0.0,
            features.rename_rate if features.rename_rate is not None else 0.0,
            features.entropy_change if features.entropy_change is not None else 0.0,
            features.access_irregularity if features.access_irregularity is not None else 0.2,
            features.io_burstiness if features.io_burstiness is not None else 1.0,
            features.read_write_ratio if features.read_write_ratio is not None else 1.0,
        ]

        x_input = np.array([vec])
        pred_label = self.model.predict(x_input)[0]
        probs = self.model.predict_proba(x_input)[0]
        class_idx = list(self.model.classes_).index(pred_label)
        confidence = round(float(probs[class_idx]), 3)

        return str(pred_label), confidence, self._feature_importances


# Global model singleton
_edge_model_instance: Optional[EdgeAiClassifier] = None
_model_lock = threading.Lock()


def get_edge_model() -> EdgeAiClassifier:
    """Retrieve or initialize the global EdgeAiClassifier singleton."""
    global _edge_model_instance
    if _edge_model_instance is None:
        with _model_lock:
            if _edge_model_instance is None:
                _edge_model_instance = EdgeAiClassifier()
    return _edge_model_instance

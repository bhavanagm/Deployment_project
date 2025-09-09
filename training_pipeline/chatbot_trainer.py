#!/usr/bin/env python3
"""
Comprehensive Chatbot Training Pipeline
Includes data preprocessing, model training, and evaluation components
"""

import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.pipeline import Pipeline
import pickle
import os
from datetime import datetime
import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer
import matplotlib.pyplot as plt
import seaborn as sns

# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
except:
    print("Warning: Could not download NLTK data. Some features may not work.")

class ChatbotTrainer:
    """Main class for training chatbot models"""
    
    def __init__(self, data_path=None):
        self.data_path = data_path or '../training_data/comprehensive_dataset.json'
        self.models = {}
        self.vectorizers = {}
        self.training_data = None
        self.stemmer = PorterStemmer()
        self.stop_words = set(stopwords.words('english')) if 'stopwords' in nltk.data.find('corpora') else set()
        
    def load_data(self):
        """Load training data from JSON file"""
        try:
            with open(self.data_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Extract training samples
            samples = data['training_dataset']['data']
            
            # Convert to DataFrame
            df = pd.DataFrame(samples)
            
            print(f"Loaded {len(df)} training samples")
            print(f"Intent distribution: {df['intent'].value_counts().to_dict()}")
            
            self.training_data = df
            return df
            
        except FileNotFoundError:
            print(f"Error: Training data file not found at {self.data_path}")
            return None
        except Exception as e:
            print(f"Error loading data: {e}")
            return None
    
    def preprocess_text(self, text):
        """Preprocess text data"""
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters and digits
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        
        # Tokenize
        tokens = word_tokenize(text)
        
        # Remove stopwords and stem
        processed_tokens = [
            self.stemmer.stem(token) 
            for token in tokens 
            if token not in self.stop_words and len(token) > 2
        ]
        
        return ' '.join(processed_tokens)
    
    def prepare_data(self):
        """Prepare data for training"""
        if self.training_data is None:
            print("Error: No training data loaded")
            return None
        
        # Preprocess queries
        self.training_data['processed_query'] = self.training_data['query'].apply(self.preprocess_text)
        
        # Prepare features and targets
        X = self.training_data['processed_query']
        y = self.training_data['intent']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        print(f"Training samples: {len(X_train)}")
        print(f"Testing samples: {len(X_test)}")
        
        return X_train, X_test, y_train, y_test
    
    def train_intent_classifier(self, algorithm='logistic_regression'):
        """Train intent classification model"""
        X_train, X_test, y_train, y_test = self.prepare_data()
        
        if X_train is None:
            return None
        
        # Create pipeline
        if algorithm == 'logistic_regression':
            model = Pipeline([
                ('tfidf', TfidfVectorizer(max_features=5000, ngram_range=(1, 2))),
                ('classifier', LogisticRegression(max_iter=1000, random_state=42))
            ])
        elif algorithm == 'random_forest':
            model = Pipeline([
                ('tfidf', TfidfVectorizer(max_features=5000, ngram_range=(1, 2))),
                ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
            ])
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
        
        # Train model
        print(f"Training {algorithm} model...")
        model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"Model Accuracy: {accuracy:.4f}")
        print("\\nClassification Report:")
        print(classification_report(y_test, y_pred))
        
        # Store model
        self.models[f'intent_classifier_{algorithm}'] = model
        
        # Save model
        model_path = f'models/intent_classifier_{algorithm}.pkl'
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
        
        print(f"Model saved to {model_path}")
        
        # Generate confusion matrix
        self.plot_confusion_matrix(y_test, y_pred, algorithm)
        
        return model
    
    def plot_confusion_matrix(self, y_true, y_pred, algorithm):
        """Plot and save confusion matrix"""
        cm = confusion_matrix(y_true, y_pred)
        labels = sorted(set(y_true) | set(y_pred))
        
        plt.figure(figsize=(12, 10))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                   xticklabels=labels, yticklabels=labels)
        plt.title(f'Confusion Matrix - {algorithm}')
        plt.xlabel('Predicted')
        plt.ylabel('Actual')
        plt.xticks(rotation=45, ha='right')
        plt.yticks(rotation=0)
        plt.tight_layout()
        
        # Save plot
        os.makedirs('evaluation', exist_ok=True)
        plt.savefig(f'evaluation/confusion_matrix_{algorithm}.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"Confusion matrix saved to evaluation/confusion_matrix_{algorithm}.png")
    
    def evaluate_models(self):
        """Evaluate all trained models"""
        if not self.models:
            print("No models trained yet")
            return
        
        X_train, X_test, y_train, y_test = self.prepare_data()
        
        results = {}
        
        for model_name, model in self.models.items():
            y_pred = model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            results[model_name] = accuracy
            
        # Display results
        print("\\nModel Comparison:")
        print("-" * 40)
        for model_name, accuracy in results.items():
            print(f"{model_name}: {accuracy:.4f}")
        
        return results
    
    def generate_training_report(self):
        """Generate comprehensive training report"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'data_summary': self.get_data_summary(),
            'model_performance': self.evaluate_models() if self.models else {},
            'recommendations': self.get_recommendations()
        }
        
        # Save report
        os.makedirs('reports', exist_ok=True)
        report_path = f"reports/training_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"Training report saved to {report_path}")
        
        return report
    
    def get_data_summary(self):
        """Get summary of training data"""
        if self.training_data is None:
            return {}
        
        return {
            'total_samples': len(self.training_data),
            'unique_intents': len(self.training_data['intent'].unique()),
            'intent_distribution': self.training_data['intent'].value_counts().to_dict(),
            'avg_query_length': self.training_data['query'].str.len().mean(),
            'avg_response_length': self.training_data['response'].str.len().mean()
        }
    
    def get_recommendations(self):
        """Get recommendations for improving the model"""
        recommendations = []
        
        if self.training_data is not None:
            # Check data balance
            intent_counts = self.training_data['intent'].value_counts()
            min_samples = intent_counts.min()
            max_samples = intent_counts.max()
            
            if max_samples / min_samples > 3:
                recommendations.append(
                    "Data imbalance detected. Consider adding more samples for underrepresented intents."
                )
            
            # Check total samples
            if len(self.training_data) < 100:
                recommendations.append(
                    "Limited training data. Consider collecting more samples for better performance."
                )
            
            # Check query diversity
            unique_queries = self.training_data['query'].nunique()
            total_queries = len(self.training_data)
            
            if unique_queries / total_queries < 0.8:
                recommendations.append(
                    "Low query diversity. Consider adding more varied examples for each intent."
                )
        
        if not recommendations:
            recommendations.append("Training data looks good! Continue monitoring model performance.")
        
        return recommendations
    
    def create_additional_training_data(self, intent, base_queries, count=10):
        """Generate additional training data for specific intent"""
        variations = []
        
        # Simple augmentation techniques
        question_words = ['how', 'what', 'where', 'when', 'why', 'can', 'could', 'would']
        
        for query in base_queries:
            for _ in range(count):
                # Add question words
                if not any(query.lower().startswith(qw) for qw in question_words):
                    variations.append(f"How {query}")
                    variations.append(f"Can you {query}")
                    variations.append(f"Could you {query}")
                
                # Add politeness
                variations.append(f"Please {query}")
                variations.append(f"{query} please")
                
                # Add informal variations
                variations.append(query.replace("you", "u"))
                variations.append(query.replace("your", "ur"))
        
        return list(set(variations))  # Remove duplicates
    
    def export_model_for_production(self, model_name='intent_classifier_logistic_regression'):
        """Export model for production use"""
        if model_name not in self.models:
            print(f"Model {model_name} not found")
            return None
        
        model = self.models[model_name]
        
        # Create production export
        production_model = {
            'model': model,
            'intents': list(self.training_data['intent'].unique()),
            'created': datetime.now().isoformat(),
            'accuracy': self.evaluate_models().get(model_name, 0),
            'version': '1.0'
        }
        
        # Save for production
        os.makedirs('production', exist_ok=True)
        production_path = 'production/chatbot_model.pkl'
        
        with open(production_path, 'wb') as f:
            pickle.dump(production_model, f)
        
        print(f"Production model exported to {production_path}")
        
        return production_path

def main():
    """Main training pipeline execution"""
    print("Starting Chatbot Training Pipeline")
    print("=" * 50)
    
    # Initialize trainer
    trainer = ChatbotTrainer()
    
    # Load data
    if trainer.load_data() is None:
        print("Failed to load training data. Exiting.")
        return
    
    # Train models
    print("\\nTraining Intent Classification Models...")
    trainer.train_intent_classifier('logistic_regression')
    trainer.train_intent_classifier('random_forest')
    
    # Generate report
    print("\\nGenerating Training Report...")
    report = trainer.generate_training_report()
    
    # Export best model for production
    print("\\nExporting Model for Production...")
    trainer.export_model_for_production()
    
    print("\\nTraining pipeline completed successfully!")
    print("Check the following directories for outputs:")
    print("- models/ : Trained model files")
    print("- evaluation/ : Performance visualizations")
    print("- reports/ : Training reports")
    print("- production/ : Production-ready models")

if __name__ == "__main__":
    main()

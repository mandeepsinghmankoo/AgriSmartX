from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.clickjacking import xframe_options_exempt
from django.core.files.base import ContentFile
from django.conf import settings
import numpy as np
from pathlib import Path
from uuid import uuid4
from .models import DetectionHistory
import os

# Try importing cv2 and tensorflow — optional on free tier
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

# Load model lazily on first request to avoid startup memory spike
MODEL_PATH = Path(
    os.getenv("MODEL_PATH", str(Path(settings.BASE_DIR).parent / "farm_equipment_model.h5"))
)
_model = None

def get_model():
    global _model
    if _model is None and TF_AVAILABLE and MODEL_PATH.exists():
        try:
            _model = tf.keras.models.load_model(str(MODEL_PATH))
        except Exception as e:
            print(f"Model load error: {e}")
    return _model
# Class names (must match your dataset)
classes = [
    "combine_harvester",
    "fertilizer_spreader",
    "harrow",
    "seeder",
    "tedder",
    "tractor"
]

@csrf_exempt
@xframe_options_exempt
def detect_equipment(request):
    if not TF_AVAILABLE:
        return JsonResponse({"error": "TensorFlow not installed on this server. ML detection unavailable."}, status=503)
    if not CV2_AVAILABLE:
        return JsonResponse({"error": "OpenCV not installed on this server."}, status=503)

    model = get_model()
    if model is None:
        return JsonResponse({"error": f"Model file not found at: {MODEL_PATH}"}, status=500)

    if request.method == 'POST' and request.FILES.get('image'):
        # Get the uploaded image
        uploaded_file = request.FILES['image']

        try:
            image_bytes = uploaded_file.read()

            # Decode uploaded image bytes directly (faster for live detection).
            file_bytes = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR) if CV2_AVAILABLE else None
            if img is None:
                return JsonResponse({'error': 'Invalid image file'}, status=400)
            
            img = cv2.resize(img, (224, 224))
            img = img / 255.0
            img = np.expand_dims(img, axis=0)
            
            # Predict
            prediction = model.predict(img, verbose=0)
            class_index = np.argmax(prediction)
            label = classes[class_index]
            confidence = float(np.max(prediction))  # Convert to float for JSON

            record = DetectionHistory(label=label, confidence=confidence)
            record.image.save(f"{uuid4().hex}.jpg", ContentFile(image_bytes), save=True)

            # Return JSON response
            preview_url = request.build_absolute_uri(
                f"{settings.MEDIA_URL}{record.image.name}"
            )
            return JsonResponse({
                'label': label,
                'confidence': f"{confidence * 100:.1f}%",
                'preview_url': preview_url,
            })
        
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    # For GET requests, render live camera capture page.
    return render(request, "farm/detect.html")


def detection_history(request):
    records = DetectionHistory.objects.all()[:12]
    data = [
        {
            "label": record.label,
            "confidence": f"{record.confidence * 100:.1f}%",
            "image_url": request.build_absolute_uri(f"{settings.MEDIA_URL}{record.image.name}"),
            "created_at": record.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        }
        for record in records
    ]
    return JsonResponse({"items": data}, status=200)
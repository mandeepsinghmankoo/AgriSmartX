from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.clickjacking import xframe_options_exempt
from django.core.files.base import ContentFile
from django.conf import settings
from pathlib import Path
from uuid import uuid4
from .models import DetectionHistory
import os

# Computer-vision dependencies are optional so Django can still start if a
# platform does not have compatible ML wheels installed.
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    cv2 = None
    CV2_AVAILABLE = False

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    np = None
    NUMPY_AVAILABLE = False

# Try importing tflite-runtime or tensorflow lite
try:
    import tflite_runtime.interpreter as tflite
    TFLITE_AVAILABLE = True
except ImportError:
    try:
        import tensorflow as tf
        tflite = tf.lite
        TFLITE_AVAILABLE = True
    except ImportError:
        TFLITE_AVAILABLE = False

# TFLite model path
MODEL_PATH = Path(
    os.getenv("MODEL_PATH", str(Path(settings.BASE_DIR).parent / "farm_equipment_model.tflite"))
)
_interpreter = None

def get_model():
    global _interpreter
    if _interpreter is None and TFLITE_AVAILABLE and MODEL_PATH.exists():
        try:
            _interpreter = tflite.Interpreter(model_path=str(MODEL_PATH))
            _interpreter.allocate_tensors()
        except Exception as e:
            print(f"TFLite model load error: {e}")
    return _interpreter
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
    if request.method == 'GET':
        return render(request, "farm/detect.html")
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)

    if not TFLITE_AVAILABLE:
        return JsonResponse({"error": "TFLite not installed on this server."}, status=503)
    if not CV2_AVAILABLE or not NUMPY_AVAILABLE:
        return JsonResponse({"error": "OpenCV or NumPy is not installed on this server."}, status=503)

    interpreter = get_model()
    if interpreter is None:
        return JsonResponse({"error": f"Model file not found at: {MODEL_PATH}"}, status=500)

    if request.FILES.get('image'):
        uploaded_file = request.FILES['image']
        try:
            image_bytes = uploaded_file.read()
            file_bytes = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
            if img is None:
                return JsonResponse({'error': 'Invalid image file'}, status=400)

            img = cv2.resize(img, (224, 224))
            img = img / 255.0
            img = np.expand_dims(img, axis=0).astype(np.float32)

            # TFLite inference
            input_details = interpreter.get_input_details()
            output_details = interpreter.get_output_details()
            interpreter.set_tensor(input_details[0]['index'], img)
            interpreter.invoke()
            prediction = interpreter.get_tensor(output_details[0]['index'])

            class_index = np.argmax(prediction)
            label = classes[class_index]
            confidence = float(np.max(prediction))

            record = DetectionHistory(label=label, confidence=confidence)
            record.image.save(f"{uuid4().hex}.jpg", ContentFile(image_bytes), save=True)

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

    return JsonResponse({"error": "Image file is required."}, status=400)


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
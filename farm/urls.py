from django.urls import path
from . import views

urlpatterns = [
    path('detect/', views.detect_equipment, name='detect_equipment'),
    path('history/', views.detection_history, name='detection_history'),
]

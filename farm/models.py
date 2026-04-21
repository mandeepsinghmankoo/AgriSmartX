from django.db import models


class DetectionHistory(models.Model):
    image = models.FileField(upload_to="captures/")
    label = models.CharField(max_length=100)
    confidence = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

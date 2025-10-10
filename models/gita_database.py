from django.db import models


class GitaVerse(models.Model):
    verse_number = models.IntegerField()  # Verse number
    chapter_number = models.IntegerField()  # Chapter number
    sanskrit_text = models.TextField()  # Verse in Sanskrit
    hindi_translation = models.TextField()  # Verse in Hindi
    english_translation = models.TextField()  # Verse in English
    modern_context = models.TextField()  # Modern context transformation
    ai_embedding = models.JSONField()  # AI embeddings
    chapter_theme = models.TextField()  # Theme of the chapter

    class Meta:
        unique_together = ('verse_number', 'chapter_number')  # Ensure unique verses in each chapter

    def __str__(self):
        return f'Chapter {self.chapter_number}, Verse {self.verse_number}'

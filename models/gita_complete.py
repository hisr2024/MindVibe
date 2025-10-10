# models/gita_complete.py

class Verse:
    def __init__(self, chapter, verse_number, sanskrit, hindi, english, modern_context, embedding):
        self.chapter = chapter
        self.verse_number = verse_number
        self.sanskrit = sanskrit
        self.hindi = hindi
        self.english = english
        self.modern_context = modern_context
        self.embedding = embedding

class GitaVerse:
    def __init__(self):
        self.verses = []  # List to hold all verses

    def add_verse(self, verse):
        self.verses.append(verse)

    def get_verse(self, chapter, verse_number):
        # Returns the verse for the given chapter and verse number
        for verse in self.verses:
            if verse.chapter == chapter and verse.verse_number == verse_number:
                return verse
        return None

    def get_all_verses(self):
        return self.verses

# Example of how to populate the model with verses
gita_verse = GitaVerse()
# Add verses here (example)
# gita_verse.add_verse(Verse(1, 1, "धृतराष्ट्र उवाच ...", "धृतराष्ट्र ने कहा ...", "Dhritarashtra said ...", "Modern context...", [0.1, 0.2, ...]))

# Add all 700 verses similarly
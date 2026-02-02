"""
Seed Essential Database Tables for KIAAN

This script seeds the critical tables needed for KIAAN chat to function:
1. subscription_plans - Pricing tiers with quotas
2. wisdom_verses - Curated Gita verses with mental health applications
3. gita_chapters - Chapter metadata

The script is idempotent and safe to run multiple times.

Usage:
    python scripts/seed_essential_data.py
    OR
    python -m scripts.seed_essential_data

Environment:
    DATABASE_URL - PostgreSQL connection string (uses default if not set)
"""

import asyncio
import os
import sys
from decimal import Decimal
from pathlib import Path
from typing import Any

from sqlalchemy import insert, select
from sqlalchemy.ext.asyncio import async_sessionmaker

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.models import (
    Base,
    GitaChapter,
    SubscriptionPlan,
    SubscriptionTier,
    WisdomVerse,
)
from scripts.db_utils import create_ssl_engine, normalize_database_url

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://navi:navi@db:5432/navi")

# Normalize URL for asyncpg
DATABASE_URL = normalize_database_url(DATABASE_URL)

engine = create_ssl_engine(DATABASE_URL)
Session = async_sessionmaker(engine, expire_on_commit=False)

# Constants
UNLIMITED_QUESTIONS = -1  # -1 indicates unlimited quota


# ============================================================================
# SUBSCRIPTION PLANS DATA
# ============================================================================

SUBSCRIPTION_PLANS = [
    {
        "tier": SubscriptionTier.FREE,
        "name": "Free",
        "description": "Perfect for getting started with mental wellness",
        "price_monthly": Decimal("0.00"),
        "price_yearly": None,
        "stripe_price_id_monthly": None,
        "stripe_price_id_yearly": None,
        "features": {
            "kiaan_chat": True,
            "mood_tracking": True,
            "journal_entries": True,
            "basic_analytics": True,
        },
        "kiaan_questions_monthly": 10,
        "encrypted_journal": False,
        "data_retention_days": 30,
        "is_active": True,
    },
    {
        "tier": SubscriptionTier.BASIC,
        "name": "Basic",
        "description": "Enhanced features for regular mental wellness practice",
        "price_monthly": Decimal("9.00"),
        "price_yearly": Decimal("90.00"),
        "stripe_price_id_monthly": None,
        "stripe_price_id_yearly": None,
        "features": {
            "kiaan_chat": True,
            "mood_tracking": True,
            "journal_entries": True,
            "basic_analytics": True,
            "advanced_analytics": True,
            "export_data": True,
        },
        "kiaan_questions_monthly": 50,
        "encrypted_journal": True,
        "data_retention_days": 90,
        "is_active": True,
    },
    {
        "tier": SubscriptionTier.PREMIUM,
        "name": "Premium",
        "description": "Complete mental wellness toolkit with priority support",
        "price_monthly": Decimal("19.00"),
        "price_yearly": Decimal("190.00"),
        "stripe_price_id_monthly": None,
        "stripe_price_id_yearly": None,
        "features": {
            "kiaan_chat": True,
            "mood_tracking": True,
            "journal_entries": True,
            "basic_analytics": True,
            "advanced_analytics": True,
            "export_data": True,
            "priority_support": True,
            "custom_reminders": True,
            "wellness_insights": True,
        },
        "kiaan_questions_monthly": 200,
        "encrypted_journal": True,
        "data_retention_days": 365,
        "is_active": True,
    },
    {
        "tier": SubscriptionTier.ENTERPRISE,
        "name": "Enterprise",
        "description": "Unlimited access for organizations and power users",
        "price_monthly": Decimal("99.00"),
        "price_yearly": Decimal("990.00"),
        "stripe_price_id_monthly": None,
        "stripe_price_id_yearly": None,
        "features": {
            "kiaan_chat": True,
            "mood_tracking": True,
            "journal_entries": True,
            "basic_analytics": True,
            "advanced_analytics": True,
            "export_data": True,
            "priority_support": True,
            "custom_reminders": True,
            "wellness_insights": True,
            "api_access": True,
            "team_management": True,
            "custom_integrations": True,
        },
        "kiaan_questions_monthly": UNLIMITED_QUESTIONS,
        "encrypted_journal": True,
        "data_retention_days": 730,
        "is_active": True,
    },
]


# ============================================================================
# WISDOM VERSES DATA
# ============================================================================

WISDOM_VERSES = [
    {
        "verse_id": "2.47",
        "chapter": 2,
        "verse_number": 47,
        "theme": "action_without_attachment",
        "english": "You have the right to perform your duties, but you are not entitled to the fruits of your actions. Never consider yourself the cause of the results, nor be attached to not doing your duty.",
        "hindi": "तुम्हारा अधिकार केवल कर्म करने में है, फल में कभी नहीं। न तो तुम कर्मों के फल का कारण बनो और न ही कर्म न करने में आसक्त होओ।",
        "sanskrit": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
        "context": "This verse teaches the principle of performing one's duties without attachment to outcomes, a key concept for reducing anxiety and maintaining inner peace.",
        "mental_health_applications": {
            "applications": ["anxiety_management", "stress_reduction", "letting_go", "present_moment_focus"]
        },
        "primary_domain": "anxiety_stress",
        "secondary_domains": ["mindfulness", "acceptance"],
    },
    {
        "verse_id": "2.14",
        "chapter": 2,
        "verse_number": 14,
        "theme": "impermanence",
        "english": "Feelings of heat and cold, pleasure and pain, are caused by contact with the senses. They have a beginning and an end; they are impermanent. Learn to endure them.",
        "hindi": "सर्दी और गर्मी, सुख और दुःख की अनुभूति इंद्रियों के संपर्क से होती है। उनका आदि और अंत है; वे अस्थायी हैं। उन्हें सहन करना सीखो।",
        "sanskrit": "मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः। आगमापायिनोऽनित्यास्तांस्तितिक्षस्व भारत॥",
        "context": "Understanding the temporary nature of emotions and sensations is fundamental to developing emotional resilience.",
        "mental_health_applications": {
            "applications": ["acceptance", "emotional_tolerance", "distress_tolerance", "impermanence_awareness"]
        },
        "primary_domain": "emotional_regulation",
        "secondary_domains": ["mindfulness", "resilience"],
    },
    {
        "verse_id": "6.5",
        "chapter": 6,
        "verse_number": 5,
        "theme": "self_empowerment",
        "english": "Elevate yourself through the power of your mind, and not degrade yourself, for the mind can be the friend and also the enemy of the self.",
        "hindi": "अपने मन की शक्ति से अपना उद्धार करो, अपने आप को नीचा मत गिराओ। क्योंकि मन ही आत्मा का मित्र है और मन ही शत्रु भी है।",
        "sanskrit": "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्। आत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥",
        "context": "This powerful verse emphasizes personal responsibility for one's mental state and the importance of self-mastery.",
        "mental_health_applications": {
            "applications": ["self_empowerment", "depression_recovery", "self_compassion", "personal_growth"]
        },
        "primary_domain": "depression_recovery",
        "secondary_domains": ["self_esteem", "empowerment"],
    },
    {
        "verse_id": "2.48",
        "chapter": 2,
        "verse_number": 48,
        "theme": "equanimity",
        "english": "Perform your duty with an even mind, remaining balanced in success and failure. This evenness of mind is called yoga.",
        "hindi": "समत्व बुद्धि से अपना कर्तव्य करो, सफलता और असफलता में संतुलित रहो। यह समत्व ही योग कहलाता है।",
        "sanskrit": "योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय। सिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते॥",
        "context": "This verse teaches the importance of maintaining equanimity in all situations, a fundamental principle for mental peace.",
        "mental_health_applications": {
            "applications": ["equanimity", "balance", "acceptance", "stress_management"]
        },
        "primary_domain": "emotional_regulation",
        "secondary_domains": ["mindfulness", "balance"],
    },
    {
        "verse_id": "18.78",
        "chapter": 18,
        "verse_number": 78,
        "theme": "faith_and_victory",
        "english": "Wherever there is Krishna, the master of yoga, and wherever there is Arjuna, the supreme archer, there will certainly be opulence, victory, extraordinary power, and morality.",
        "hindi": "जहाँ योग के स्वामी कृष्ण हैं और जहाँ धनुर्धर अर्जुन हैं, वहाँ निश्चित रूप से ऐश्वर्य, विजय, असाधारण शक्ति और नैतिकता होगी।",
        "sanskrit": "यत्र योगेश्वरः कृष्णो यत्र पार्थो धनुर्धरः। तत्र श्रीर्विजयो भूतिर्ध्रुवा नीतिर्मतिर्मम॥",
        "context": "This concluding verse of the Gita emphasizes the power of divine guidance and dedicated effort working together, symbolizing the combination of wisdom and action.",
        "mental_health_applications": {
            "applications": ["faith", "hope", "perseverance", "spiritual_support"]
        },
        "primary_domain": "spiritual_growth",
        "secondary_domains": ["motivation", "hope"],
    },
    {
        "verse_id": "2.56",
        "chapter": 2,
        "verse_number": 56,
        "theme": "equanimity_in_adversity",
        "english": "One whose mind remains undisturbed amidst misery, who does not crave for pleasure, and who is free from attachment, fear, and anger, is called a sage of steady wisdom.",
        "hindi": "जो दुःख में भी विचलित नहीं होता, सुख की इच्छा नहीं रखता, और राग, भय तथा क्रोध से मुक्त है, वह स्थिर बुद्धि वाला मुनि कहलाता है।",
        "sanskrit": "दुःखेष्वनुद्विग्नमनाः सुखेषु विगतस्पृहः। वीतरागभयक्रोधः स्थितधीर्मुनिरुच्यते॥",
        "context": "This verse describes the qualities of a person with stable wisdom who maintains emotional equilibrium regardless of external circumstances.",
        "mental_health_applications": {
            "applications": ["emotional_regulation", "resilience", "mindfulness", "equanimity"]
        },
        "primary_domain": "emotional_regulation",
        "secondary_domains": ["resilience", "mindfulness"],
    },
    {
        "verse_id": "2.70",
        "chapter": 2,
        "verse_number": 70,
        "theme": "inner_peace",
        "english": "Just as the ocean remains undisturbed by the constant flow of waters from rivers merging into it, likewise the sage who is unmoved by desires attains peace, and not the person who strives to satisfy such desires.",
        "hindi": "जैसे सागर में निरंतर नदियों का जल मिलता रहता है पर वह अविचल रहता है, वैसे ही जो व्यक्ति इच्छाओं से अविचलित रहता है वह शांति प्राप्त करता है, न कि वह जो इच्छाओं की पूर्ति का प्रयास करता है।",
        "sanskrit": "आपूर्यमाणमचलप्रतिष्ठं समुद्रमापः प्रविशन्ति यद्वत्। तद्वत्कामा यं प्रविशन्ति सर्वे स शान्तिमाप्नोति न कामकामी॥",
        "context": "This verse beautifully illustrates the concept of inner stability and peace through non-attachment to desires.",
        "mental_health_applications": {
            "applications": ["inner_peace", "contentment", "desire_management", "mental_stillness"]
        },
        "primary_domain": "mindfulness",
        "secondary_domains": ["peace", "contentment"],
    },
]


# ============================================================================
# GITA CHAPTERS DATA
# ============================================================================

GITA_CHAPTERS = [
    {
        "chapter_number": 1,
        "sanskrit_name": "अर्जुन विषाद योग",
        "english_name": "Arjuna's Dilemma",
        "verse_count": 47,
        "themes": ["emotional_crisis", "moral_conflict", "despair", "seeking_guidance"],
        "mental_health_relevance": "Chapter 1 depicts Arjuna's emotional crisis and moral paralysis, illustrating how overwhelming situations can lead to depression and anxiety. It shows the importance of seeking guidance during difficult times.",
    },
    {
        "chapter_number": 2,
        "sanskrit_name": "सांख्य योग",
        "english_name": "Transcendental Knowledge",
        "verse_count": 72,
        "themes": ["self_knowledge", "equanimity", "karma_yoga", "wisdom", "duty"],
        "mental_health_relevance": "Chapter 2 provides foundational teachings on managing emotions, developing equanimity, and understanding the impermanent nature of experiences - core principles for mental wellness.",
    },
    {
        "chapter_number": 6,
        "sanskrit_name": "ध्यान योग",
        "english_name": "Self-Realization",
        "verse_count": 47,
        "themes": ["meditation", "mindfulness", "self_control", "inner_peace", "practice"],
        "mental_health_relevance": "Chapter 6 focuses on meditation and mindfulness practices, offering practical guidance for mental discipline and achieving inner peace through consistent practice.",
    },
    {
        "chapter_number": 18,
        "sanskrit_name": "मोक्ष संन्यास योग",
        "english_name": "Liberation Through Renunciation",
        "verse_count": 78,
        "themes": ["liberation", "renunciation", "synthesis", "freedom", "completion"],
        "mental_health_relevance": "Chapter 18 synthesizes all teachings, offering a complete path to mental and spiritual freedom through balanced action, wisdom, and devotion.",
    },
]


# ============================================================================
# SEEDING FUNCTIONS
# ============================================================================

async def seed_subscription_plans(session: Any) -> None:
    """Seed subscription plans if they don't exist."""
    print("\n=== Seeding Subscription Plans ===")

    for plan_data in SUBSCRIPTION_PLANS:
        # Check if plan already exists
        result = await session.execute(
            select(SubscriptionPlan).where(SubscriptionPlan.tier == plan_data["tier"])
        )
        existing = result.scalar_one_or_none()

        if not existing:
            await session.execute(insert(SubscriptionPlan).values(**plan_data))
            print(f"✅ Inserted {plan_data['name']} plan ({plan_data['tier'].value})")
        else:
            print(f"⏭️  {plan_data['name']} plan already exists, skipping")

    await session.commit()
    print(f"✅ Subscription plans seeding completed ({len(SUBSCRIPTION_PLANS)} plans)")


async def seed_wisdom_verses(session: Any) -> None:
    """Seed wisdom verses if they don't exist."""
    print("\n=== Seeding Wisdom Verses ===")

    for verse_data in WISDOM_VERSES:
        # Check if verse already exists
        result = await session.execute(
            select(WisdomVerse).where(WisdomVerse.verse_id == verse_data["verse_id"])
        )
        existing = result.scalar_one_or_none()

        if not existing:
            await session.execute(insert(WisdomVerse).values(**verse_data))
            print(f"✅ Inserted verse {verse_data['verse_id']}: {verse_data['theme']}")
        else:
            print(f"⏭️  Verse {verse_data['verse_id']} already exists, skipping")

    await session.commit()
    print(f"✅ Wisdom verses seeding completed ({len(WISDOM_VERSES)} verses)")


async def seed_gita_chapters(session: Any) -> None:
    """Seed Gita chapter metadata if they don't exist."""
    print("\n=== Seeding Gita Chapters ===")

    for chapter_data in GITA_CHAPTERS:
        # Check if chapter already exists
        result = await session.execute(
            select(GitaChapter).where(
                GitaChapter.chapter_number == chapter_data["chapter_number"]
            )
        )
        existing = result.scalar_one_or_none()

        if not existing:
            await session.execute(insert(GitaChapter).values(**chapter_data))
            print(
                f"✅ Inserted Chapter {chapter_data['chapter_number']}: "
                f"{chapter_data['english_name']}"
            )
        else:
            print(
                f"⏭️  Chapter {chapter_data['chapter_number']} already exists, skipping"
            )

    await session.commit()
    print(f"✅ Gita chapters seeding completed ({len(GITA_CHAPTERS)} chapters)")


async def verify_seeding(session: Any) -> None:
    """Verify that seeding was successful."""
    print("\n=== Verification ===")

    # Count subscription plans
    result = await session.execute(select(SubscriptionPlan))
    plans = result.scalars().all()
    print(f"✅ Subscription Plans: {len(plans)} total")

    # Count wisdom verses
    result = await session.execute(select(WisdomVerse))
    verses = result.scalars().all()
    print(f"✅ Wisdom Verses: {len(verses)} total")

    # Count Gita chapters
    result = await session.execute(select(GitaChapter))
    chapters = result.scalars().all()
    print(f"✅ Gita Chapters: {len(chapters)} total")

    if len(plans) >= 4 and len(verses) >= 5 and len(chapters) >= 4:
        print("\n✅ All essential data seeded successfully!")
        print("KIAAN should now have verse context and subscription plans.")
    else:
        print("\n⚠️  Warning: Some data may be missing:")
        if len(plans) < 4:
            print(f"   - Expected 4 subscription plans, found {len(plans)}")
        if len(verses) < 5:
            print(f"   - Expected at least 5 wisdom verses, found {len(verses)}")
        if len(chapters) < 4:
            print(f"   - Expected 4 Gita chapters, found {len(chapters)}")


async def main() -> None:
    """Main seeding function."""
    print("=" * 70)
    print("Seeding Essential Database Tables for KIAAN")
    print("=" * 70)
    # Extract and display only the host/database portion without credentials
    db_info = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else "local"
    print(f"\nDatabase: {db_info}")

    try:
        # Create tables if they don't exist
        print("\nCreating tables if needed...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Tables ready")

        # Seed data
        async with Session() as session:
            await seed_subscription_plans(session)
            await seed_wisdom_verses(session)
            await seed_gita_chapters(session)
            await verify_seeding(session)

        print("\n" + "=" * 70)
        print("✅ SEEDING COMPLETED SUCCESSFULLY!")
        print("=" * 70)

    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    asyncio.run(main())

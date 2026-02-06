"""Indian wellness content models: yoga, pranayama, meditation, ayurveda."""

from __future__ import annotations

import datetime
import enum

from sqlalchemy import (
    JSON,
    TIMESTAMP,
    Boolean,
    Enum,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base, SoftDeleteMixin


class IndianDataSourceType(str, enum.Enum):
    """Types of authentic Indian data sources."""

    NHP = "national_health_portal"
    AYUSH = "ministry_ayush"
    ICMR = "icmr"
    NIMHANS = "nimhans"
    YOGA_INSTITUTE = "yoga_institute"
    AYURVEDA = "ayurveda"
    MEDITATION = "meditation"
    PRANAYAMA = "pranayama"
    WELLNESS_INDIA = "wellness_india"
    TRADITIONAL_MEDICINE = "traditional_medicine"


class IndianContentCategory(str, enum.Enum):
    """Categories of Indian wellness content."""

    MENTAL_HEALTH = "mental_health"
    STRESS_MANAGEMENT = "stress_management"
    ANXIETY_RELIEF = "anxiety_relief"
    DEPRESSION_SUPPORT = "depression_support"
    YOGA_PRACTICES = "yoga_practices"
    MEDITATION_TECHNIQUES = "meditation_techniques"
    PRANAYAMA = "pranayama"
    AYURVEDIC_WELLNESS = "ayurvedic_wellness"
    SLEEP_HEALTH = "sleep_health"
    EMOTIONAL_BALANCE = "emotional_balance"
    MINDFULNESS = "mindfulness"
    LIFESTYLE_WELLNESS = "lifestyle_wellness"


class IndianWisdomContent(SoftDeleteMixin, Base):
    """
    Authentic Indian wellness content from government and institutional sources.

    Stores curated content from NHP, AYUSH, ICMR, NIMHANS, and recognized
    yoga/wellness institutions for integration with KIAAN.
    """

    __tablename__ = "indian_wisdom_content"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source: Mapped[IndianDataSourceType] = mapped_column(
        Enum(
            IndianDataSourceType,
            name="indiandatasourcetype",
            native_enum=True,
            create_constraint=False,
        ),
        index=True,
    )
    category: Mapped[IndianContentCategory] = mapped_column(
        Enum(
            IndianContentCategory,
            name="indiancontentcategory",
            native_enum=True,
            create_constraint=False,
        ),
        index=True,
    )
    title: Mapped[str] = mapped_column(String(512))
    content: Mapped[str] = mapped_column(Text)
    hindi_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    sanskrit_terms: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(64)), nullable=True
    )
    keywords: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(64)), nullable=True
    )
    practices: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(128)), nullable=True
    )
    benefits: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(256)), nullable=True
    )
    source_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    source_organization: Mapped[str | None] = mapped_column(String(256), nullable=True)
    last_fetched_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class YogaAsanaDB(SoftDeleteMixin, Base):
    """
    Authentic yoga asanas with Sanskrit terminology and mental health benefits.

    Based on teachings from The Yoga Institute, Ministry of AYUSH, and
    traditional yoga texts.
    """

    __tablename__ = "yoga_asanas"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    sanskrit_name: Mapped[str] = mapped_column(String(128), index=True)
    english_name: Mapped[str] = mapped_column(String(128), index=True)
    hindi_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    category: Mapped[str] = mapped_column(
        String(32), index=True
    )  # standing, seated, supine, prone, inversion
    difficulty: Mapped[str] = mapped_column(
        String(16), default="beginner"
    )  # beginner, intermediate, advanced
    description: Mapped[str] = mapped_column(Text)
    instructions: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(512)), nullable=True
    )
    benefits: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(256)), nullable=True
    )
    mental_benefits: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(256)), nullable=True
    )
    contraindications: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(256)), nullable=True
    )
    duration_seconds: Mapped[int] = mapped_column(Integer, default=30)
    breath_pattern: Mapped[str | None] = mapped_column(String(256), nullable=True)
    chakra_association: Mapped[str | None] = mapped_column(String(64), nullable=True)
    dosha_balance: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(16)), nullable=True
    )  # vata, pitta, kapha
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class PranayamaTechniqueDB(SoftDeleteMixin, Base):
    """
    Authentic pranayama breathing techniques from Indian traditions.

    Based on Hatha Yoga Pradipika, Ministry of AYUSH guidelines,
    and traditional yoga teachings.
    """

    __tablename__ = "pranayama_techniques"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    sanskrit_name: Mapped[str] = mapped_column(String(128), index=True)
    english_name: Mapped[str] = mapped_column(String(128), index=True)
    hindi_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    description: Mapped[str] = mapped_column(Text)
    instructions: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(512)), nullable=True
    )
    benefits: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(256)), nullable=True
    )
    mental_benefits: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(256)), nullable=True
    )
    contraindications: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(256)), nullable=True
    )
    duration_minutes: Mapped[int] = mapped_column(Integer, default=5)
    breath_ratio: Mapped[str | None] = mapped_column(
        String(32), nullable=True
    )  # e.g., "4:4:8"
    best_time: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )  # morning, evening, anytime
    difficulty: Mapped[str] = mapped_column(String(16), default="beginner")
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class MeditationPracticeDB(SoftDeleteMixin, Base):
    """
    Indian meditation traditions and practices.

    Based on Vedic traditions, Yoga Sutras of Patanjali,
    Buddhist traditions (Indian origin), and traditional guru lineages.
    """

    __tablename__ = "meditation_practices"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    sanskrit_name: Mapped[str] = mapped_column(String(128), index=True)
    english_name: Mapped[str] = mapped_column(String(128), index=True)
    hindi_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    tradition: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )  # Vedic, Buddhist, Jain, Tantric
    description: Mapped[str] = mapped_column(Text)
    instructions: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(512)), nullable=True
    )
    benefits: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(256)), nullable=True
    )
    mental_benefits: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(256)), nullable=True
    )
    duration_minutes: Mapped[int] = mapped_column(Integer, default=15)
    posture: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )  # seated, lying, walking
    focus_point: Mapped[str | None] = mapped_column(
        String(128), nullable=True
    )  # breath, mantra, visualization
    mantra: Mapped[str | None] = mapped_column(String(256), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class AyurvedicPracticeDB(SoftDeleteMixin, Base):
    """
    Authentic Ayurvedic wellness practices.

    Based on Charaka Samhita, Ashtanga Hridayam,
    and Ministry of AYUSH guidelines.
    """

    __tablename__ = "ayurvedic_practices"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    sanskrit_name: Mapped[str] = mapped_column(String(128), index=True)
    english_name: Mapped[str] = mapped_column(String(128), index=True)
    hindi_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )  # dinacharya, ritucharya, therapy, body_care
    instructions: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(512)), nullable=True
    )
    benefits: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(256)), nullable=True
    )
    mental_benefits: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(256)), nullable=True
    )
    dosha_effects: Mapped[dict | None] = mapped_column(
        JSON, nullable=True
    )  # {"vata": "...", "pitta": "...", "kapha": "..."}
    best_time: Mapped[str | None] = mapped_column(String(64), nullable=True)
    duration: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class IndianSourceFetchLog(Base):
    """
    Log of data fetches from Indian government and institutional sources.

    Tracks API calls, success/failure, and data freshness.
    """

    __tablename__ = "indian_source_fetch_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source: Mapped[IndianDataSourceType] = mapped_column(
        Enum(
            IndianDataSourceType,
            name="indiandatasourcetype",
            native_enum=True,
            create_constraint=False,
        ),
        index=True,
    )
    endpoint: Mapped[str] = mapped_column(String(512))
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    success: Mapped[bool] = mapped_column(Boolean, default=False)
    items_fetched: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fetched_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )

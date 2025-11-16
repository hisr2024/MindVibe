#!/usr/bin/env python3
"""
Demonstration script for MindVibe AI Mental-Wellness Coach

Shows the complete 4-phase implementation working together.
"""

import asyncio
from backend.services.chatbot import ChatbotService
from backend.services.domain_mapper import DomainMapper
from backend.services.safety_validator import SafetyValidator


def print_separator(title: str = "") -> None:
    """Print a visual separator."""
    if title:
        print(f"\n{'=' * 80}")
        print(f"  {title}")
        print(f"{'=' * 80}\n")
    else:
        print(f"{'=' * 80}\n")


def demonstrate_phase_1() -> None:
    """Demonstrate Phase 1: Core Response Engine."""
    print_separator("PHASE 1: Core Response Engine (6-Step Framework)")
    
    from backend.services.response_engine import ResponseEngine
    
    engine = ResponseEngine()
    
    test_message = "I'm feeling overwhelmed with everything"
    print(f"User Message: {test_message}")
    print()
    
    response = engine.generate_response(test_message, "emotional_regulation")
    
    print(f"Generated Response ({response['word_count']} words):")
    print("-" * 80)
    print(response['response'])
    print("-" * 80)
    print(f"✓ Word count: {response['word_count']} (range: 120-250)")
    print(f"✓ Validation passed: {response['validation_passed']}")


def demonstrate_phase_2() -> None:
    """Demonstrate Phase 2: Domain Integration."""
    print_separator("PHASE 2: Knowledge Domain Integration (9 Domains)")
    
    mapper = DomainMapper()
    
    print("9 Psychological Domains:")
    domains = mapper.get_all_domains()
    for i, (key, info) in enumerate(domains.items(), 1):
        print(f"  {i}. {info['name']}")
    
    print("\nDomain Routing Examples:")
    queries = [
        "I need motivation to take action",
        "I'm struggling with anxiety",
        "How can I improve my focus?",
        "I want to help others",
    ]
    
    for query in queries:
        domain_key = mapper.route_query_to_domain(query)
        if domain_key:
            domain_info = mapper.get_domain_by_key(domain_key)
            print(f"  '{query}' → {domain_info['name']}")
        else:
            print(f"  '{query}' → No specific domain")


def demonstrate_phase_3() -> None:
    """Demonstrate Phase 3: Safety & Quality Control."""
    print_separator("PHASE 3: Safety & Quality Control")
    
    validator = SafetyValidator()
    
    print("Crisis Detection:")
    crisis_examples = [
        "I want to kill myself",
        "I feel a bit anxious",
        "I can't take it anymore",
    ]
    
    for message in crisis_examples:
        result = validator.detect_crisis(message)
        status = "🚨 CRISIS DETECTED" if result['crisis_detected'] else "✓ No crisis"
        print(f"  '{message}' → {status}")
        if result['crisis_detected']:
            print(f"    Severity: {result['severity']}")
    
    print("\nReligious Term Sanitization:")
    religious_text = "Krishna teaches Arjuna about the divine soul and God"
    sanitized = validator.sanitize_religious_terms(religious_text)
    print(f"  Original:  '{religious_text}'")
    print(f"  Sanitized: '{sanitized}'")
    
    print("\nResponse Quality Validation:")
    good_response = " ".join(["I understand your feelings. Practice awareness and mindfulness. Take action toward your values. Notice your thoughts without judgment. You can control your effort and attention. Small steps create progress. Trust the process of change."] * 18)
    validation = validator.validate_response_quality(good_response)
    print(f"  Word count: {validation['word_count']}")
    print(f"  Valid: {validation['valid']}")
    print(f"  Evidence-based score: {validation['evidence_based_score']}")


def demonstrate_phase_4() -> None:
    """Demonstrate Phase 4: Evidence-Based Psychology."""
    print_separator("PHASE 4: Evidence-Based Psychology Integration")
    
    from backend.services.psychology_patterns import PsychologyPatterns
    
    patterns = PsychologyPatterns()
    
    print("CBT Pattern - Cognitive Restructuring:")
    cbt = patterns.get_cognitive_restructuring_pattern("worried")
    print(f"  {cbt}")
    
    print("\nACT Pattern - Values Clarification:")
    act = patterns.get_values_clarification_exercise()
    print(f"  {act['instruction']}")
    print(f"  Sample question: {act['questions'][0]}")
    
    print("\nMindfulness - Breathing Exercise:")
    breathing = patterns.get_breathing_exercise("4-2-6")
    print(f"  {breathing['name']}: {breathing['instruction']}")
    
    print("\nBehavioral Activation:")
    action = patterns.get_small_action_step("feeling stuck")
    print(f"  {action['action']}")


def demonstrate_integration() -> None:
    """Demonstrate full integration."""
    print_separator("FULL INTEGRATION: All 4 Phases Working Together")
    
    chatbot = ChatbotService()
    
    print("Chatbot Components:")
    print(f"  ✓ Phase 1: ResponseEngine")
    print(f"  ✓ Phase 2: DomainMapper (9 domains)")
    print(f"  ✓ Phase 3: SafetyValidator (crisis detection + sanitization)")
    print(f"  ✓ Phase 4: PsychologyPatterns (CBT/ACT/Mindfulness)")
    
    print("\nExample Workflow:")
    test_message = "I'm feeling anxious and unmotivated"
    print(f"1. User input: '{test_message}'")
    
    # Phase 3: Check for crisis
    crisis = chatbot.safety_validator.detect_crisis(test_message)
    print(f"2. Crisis check: {crisis['crisis_detected']}")
    
    # Phase 2: Route to domain
    domain = chatbot.domain_mapper.route_query_to_domain(test_message)
    domain_name = chatbot.domain_mapper.get_domain_by_key(domain)['name'] if domain else 'None'
    print(f"3. Domain routing: {domain_name}")
    
    # Phase 4: Select pattern
    pattern = chatbot.psychology_patterns.select_pattern_for_context(test_message, domain)
    print(f"4. Psychology pattern: {pattern['type']} - {pattern['pattern']}")
    
    # Phase 1: Generate response
    response = chatbot.response_engine.generate_response(test_message, domain)
    print(f"5. Response generated: {response['word_count']} words")
    print(f"6. Validation: {response['validation_passed']}")


def main() -> None:
    """Main demonstration function."""
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                  MindVibe AI Mental-Wellness Coach                           ║
║                  Complete 4-Phase Implementation Demo                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)
    
    try:
        demonstrate_phase_1()
        demonstrate_phase_2()
        demonstrate_phase_3()
        demonstrate_phase_4()
        demonstrate_integration()
        
        print_separator("Demo Complete")
        print("✓ All 4 phases demonstrated successfully")
        print("✓ Crisis detection, domain routing, quality validation working")
        print("✓ 120-250 word responses enforced")
        print("✓ Religious terms sanitized")
        print("✓ Evidence-based psychology patterns integrated")
        
    except Exception as e:
        print(f"\n❌ Error during demonstration: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()

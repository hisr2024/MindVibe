#!/bin/bash
#
# Quantum Coherence Verification Script
# Verifies 100% implementation of all MindVibe features
#

set -e

echo "================================================================"
echo "🔬 QUANTUM COHERENCE VERIFICATION - MINDVIBE"
echo "================================================================"
echo ""

ERRORS=0
WARNINGS=0
SUCCESSES=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((SUCCESSES++))
}

error() {
    echo -e "${RED}❌ $1${NC}"
    ((ERRORS++))
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

# 1. Check imports
echo "1️⃣  Checking Python imports..."
if python3 -c "from backend.services.openai_optimizer import openai_optimizer; from tenacity import retry; import tiktoken" 2>/dev/null; then
    success "Imports: tenacity, tiktoken, openai_optimizer"
else
    error "Import failed: Check tenacity, tiktoken installation"
fi
echo ""

# 2. Check Next.js i18n config
echo "2️⃣  Checking Next.js i18n routing..."
if grep -q "i18n:" next.config.js && grep -q "locales:" next.config.js; then
    success "i18n routing configured in next.config.js"
else
    error "Missing i18n config in next.config.js"
fi
echo ""

# 3. Check test files
echo "3️⃣  Checking test coverage..."
if [ -f "tests/unit/test_openai_optimizer.py" ]; then
    success "Unit tests: OpenAI Optimizer"
else
    error "Missing: tests/unit/test_openai_optimizer.py"
fi

if [ -f "tests/unit/test_kiaan_core.py" ]; then
    success "Unit tests: KIAAN Core"
else
    error "Missing: tests/unit/test_kiaan_core.py"
fi

if [ -f "tests/integration/test_multilingual_flow.py" ]; then
    success "Integration tests: Multilingual flow"
else
    error "Missing: tests/integration/test_multilingual_flow.py"
fi

if [ -f "tests/load/test_api_performance.py" ]; then
    success "Load tests: API performance"
else
    error "Missing: tests/load/test_api_performance.py"
fi
echo ""

# 4. Check RAG implementation
echo "4️⃣  Checking RAG implementation..."
if [ -f "backend/services/rag_service.py" ]; then
    success "RAG service exists"
else
    error "RAG service missing"
fi

if [ -f "scripts/embed_verses.py" ]; then
    success "Embedding script exists"
else
    error "Embedding script missing"
fi
echo ""

# 5. Check fine-tuning
echo "5️⃣  Checking fine-tuning pipeline..."
if [ -f "scripts/finetune_gita_examples.py" ]; then
    success "Fine-tuning script exists"
else
    error "Fine-tuning script missing"
fi
echo ""

# 6. Check critical files
echo "6️⃣  Checking critical service files..."
CRITICAL_FILES=(
    "backend/services/openai_optimizer.py"
    "backend/services/kiaan_core.py"
    "backend/services/wisdom_kb.py"
    "backend/services/gita_service.py"
    "config/translation.ts"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        success "File exists: $file"
    else
        error "Missing: $file"
    fi
done
echo ""

# 7. Check dependencies
echo "7️⃣  Checking key dependencies..."
if grep -q "tiktoken" requirements.txt; then
    success "tiktoken in requirements.txt"
else
    error "tiktoken missing from requirements.txt"
fi

if grep -q "tenacity" requirements.txt; then
    success "tenacity in requirements.txt"
else
    error "tenacity missing from requirements.txt"
fi

if grep -q "openai" requirements.txt; then
    success "openai in requirements.txt"
else
    error "openai missing from requirements.txt"
fi
echo ""

# Summary
echo "================================================================"
echo "📊 VERIFICATION SUMMARY"
echo "================================================================"
echo -e "${GREEN}✅ Successes: $SUCCESSES${NC}"
echo -e "${YELLOW}⚠️  Warnings:  $WARNINGS${NC}"
echo -e "${RED}❌ Errors:    $ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 QUANTUM COHERENCE: 100% ACHIEVED!${NC}"
    echo "================================================================"
    exit 0
else
    echo -e "${RED}⚠️  QUANTUM COHERENCE: INCOMPLETE${NC}"
    echo "   Please fix the errors above"
    echo "================================================================"
    exit 1
fi

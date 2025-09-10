#!/bin/bash

# Satoshi Quest - Oracle Configuration Switcher
# Usage: ./switch-oracle.sh [test|production]

CONTRACTS_DIR="contracts"
RESURRECTION_CONTRACT="$CONTRACTS_DIR/satoshi-quest-resurrection.clar"

# Oracle constants
TEST_ORACLE=".test-dia-oracle"
PROD_ORACLE="'ST1S5ZGRZV5K4S9205RWPRTX9RGS9JV40KQMR4G1J.dia-oracle"

if [ "$1" = "test" ]; then
    echo "🔧 Switching to TEST oracle configuration..."
    sed -i.bak "s|(define-constant DIA_ORACLE_CONTRACT .*|(define-constant DIA_ORACLE_CONTRACT $TEST_ORACLE)|" "$RESURRECTION_CONTRACT"
    echo "✅ Switched to test oracle: $TEST_ORACLE"
    
elif [ "$1" = "production" ]; then
    echo "🚀 Switching to PRODUCTION oracle configuration..."
    echo "⚠️  WARNING: This will use REAL DIA Oracle for price feeds!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sed -i.bak "s|(define-constant DIA_ORACLE_CONTRACT .*|(define-constant DIA_ORACLE_CONTRACT $PROD_ORACLE)|" "$RESURRECTION_CONTRACT"
        echo "✅ Switched to production oracle: $PROD_ORACLE"
        echo "🔥 Ready for mainnet deployment!"
    else
        echo "❌ Cancelled production switch"
        exit 1
    fi
    
elif [ "$1" = "check" ]; then
    echo "🔍 Current oracle configuration:"
    grep "define-constant DIA_ORACLE_CONTRACT" "$RESURRECTION_CONTRACT"
    
else
    echo "Usage: $0 [test|production|check]"
    echo ""
    echo "Commands:"
    echo "  test        - Switch to test oracle (for development)"
    echo "  production  - Switch to production oracle (for deployment)"
    echo "  check       - Show current oracle configuration"
    echo ""
    echo "Current configuration:"
    grep "define-constant DIA_ORACLE_CONTRACT" "$RESURRECTION_CONTRACT"
    exit 1
fi

echo ""
echo "📋 Don't forget to:"
echo "   1. Run tests after switching"
echo "   2. Verify all contract functionality"
echo "   3. Check the DEPLOYMENT.md file for full checklist"

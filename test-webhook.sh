#!/bin/bash

echo "🧪 Testando webhook do Proteo..."
echo ""

curl -X POST "https://hubp2p.com/api/proteo/webhook?secret=2e6c1508e42ee764beafac09c08ccd1234e0ae7da1b98d787a4e3e2ad429f7ae" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "document": "12345678900",
    "proteo_verification_id": "test-123"
  }'

echo ""
echo ""
echo "✅ Se retornou {\"success\":true}, o webhook está funcionando!"

curl -X POST http://localhost:3000/add-account \
    -H "Content-Type: application/json" \
    -d '{"xId": "sanctumso", "userId": "test-user"}'

# wait 10 seconds
sleep 10

curl -X POST http://localhost:3000/add-account \
    -H "Content-Type: application/json" \
    -d '{"xId": "JupiterExchange", "userId": "test-user"}'

# wait 10 seconds
sleep 10

curl -X POST http://localhost:3000/add-account \
    -H "Content-Type: application/json" \
    -d '{"xId": "FlashTrade_", "userId": "test-user"}'

# wait 10 seconds
sleep 10

curl -X POST http://localhost:3000/add-account \
    -H "Content-Type: application/json" \
    -d '{"xId": "jito_sol", "userId": "test-user"}'

# wait 10 seconds
sleep 10

curl -X POST http://localhost:3000/add-account \
    -H "Content-Type: application/json" \
    -d '{"xId": "DriftProtocol", "userId": "test-user"}'

# wait 10 seconds
sleep 10

curl -X POST http://localhost:3000/add-account \
    -H "Content-Type: application/json" \
    -d '{"xId": "RaydiumProtocol", "userId": "test-user"}'

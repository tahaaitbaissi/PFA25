#!/bin/bash

# Build and start all containers
docker-compose up -d --build

# Initialize Elasticsearch index (wait for it to be ready)
echo "Waiting for Elasticsearch to be ready..."
until curl -s http://localhost:9200/ > /dev/null; do
  sleep 5
done

echo "Initializing Elasticsearch index..."
docker-compose exec backend python -c "
from app.services.elasticsearch_service import ElasticsearchService
es = ElasticsearchService()
es.create_index()
print('Index created')
"

echo "All services are ready!"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:5000"
echo "- AI Model: http://localhost:8000"
echo "- Elasticsearch: http://localhost:9200"
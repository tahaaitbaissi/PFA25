# setup.ps1
Write-Host "Building and starting containers..."
docker-compose up -d --build

Write-Host "Waiting for services to initialize..."
Start-Sleep -Seconds 10

Write-Host "Initializing Elasticsearch index..."
docker-compose exec backend python -c "from app.services.elasticsearch_service import ElasticsearchService; es = ElasticsearchService(); es.create_index(); print('Index created')"

Write-Host "`nAll services are running!"
Write-Host "- Frontend: http://localhost:3000"
Write-Host "- Backend API: http://localhost:5000"
Write-Host "- AI Service: http://localhost:8000"
Write-Host "- Elasticsearch: http://localhost:9200`n"

Write-Host "To stop services, run: docker-compose down"
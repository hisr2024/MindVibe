output "api_endpoint" {
  description = "MindVibe API endpoint"
  value       = "http://localhost:8000"
}

output "database_volume" {
  description = "Docker volume storing postgres data"
  value       = docker_volume.postgres_data.name
}

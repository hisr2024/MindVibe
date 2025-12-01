output "api_endpoint" {
  description = "MindVibe API endpoint"
  value       = "http://localhost:8000"
}

output "database_volume" {
  description = "Docker volume storing postgres data"
  value       = docker_volume.postgres_data.name
}

output "journal_archive_bucket" {
  description = "S3 bucket used for encrypted journal storage"
  value       = var.enable_aws_resources ? aws_s3_bucket.journal_archives[0].bucket : ""
}

output "backup_bucket" {
  description = "S3 bucket receiving automated database backups"
  value       = var.enable_aws_resources ? aws_s3_bucket.backup_artifacts[0].bucket : ""
}

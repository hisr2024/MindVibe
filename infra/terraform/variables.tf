variable "app_image" {
  description = "Container image for the MindVibe backend"
  type        = string
  default     = "mindvibe-backend:latest"
}

variable "db_image" {
  description = "Postgres image for stateful data"
  type        = string
  default     = "postgres:15"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
  default     = "mindvibe"
}

variable "aws_region" {
  description = "AWS region for S3 buckets"
  type        = string
  default     = "us-east-1"
}

variable "enable_aws_resources" {
  description = "Create AWS resources (set to true in CI/CD or cloud deployments)"
  type        = bool
  default     = false
}

variable "journal_bucket_name" {
  description = "Override for the journal archive bucket name"
  type        = string
  default     = ""
}

variable "backup_bucket_name" {
  description = "Override for the backup bucket name"
  type        = string
  default     = ""
}

variable "force_destroy_buckets" {
  description = "Allow Terraform to delete non-empty buckets for ephemeral environments"
  type        = bool
  default     = false
}

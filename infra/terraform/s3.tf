locals {
  bucket_suffix       = try(tolist(random_id.bucket_suffix[*].hex)[0], "dev")
  journal_bucket_name = var.journal_bucket_name != "" ? var.journal_bucket_name : "mindvibe-journal-${local.bucket_suffix}"
  backup_bucket_name  = var.backup_bucket_name != "" ? var.backup_bucket_name : "mindvibe-backups-${local.bucket_suffix}"
}

resource "random_id" "bucket_suffix" {
  count       = var.enable_aws_resources ? 1 : 0
  byte_length = 2
}

resource "aws_s3_bucket" "journal_archives" {
  count         = var.enable_aws_resources ? 1 : 0
  bucket        = local.journal_bucket_name
  force_destroy = var.force_destroy_buckets
}

resource "aws_s3_bucket_versioning" "journal_archives" {
  count  = var.enable_aws_resources ? 1 : 0
  bucket = aws_s3_bucket.journal_archives[count.index].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "journal_archives" {
  count  = var.enable_aws_resources ? 1 : 0
  bucket = aws_s3_bucket.journal_archives[count.index].bucket

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "journal_archives" {
  count  = var.enable_aws_resources ? 1 : 0
  bucket = aws_s3_bucket.journal_archives[count.index].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "journal_archives" {
  count  = var.enable_aws_resources ? 1 : 0
  bucket = aws_s3_bucket.journal_archives[count.index].id

  rule {
    id     = "expire-old-archives"
    status = "Enabled"

    expiration {
      days = 365
    }
  }
}

resource "aws_s3_bucket" "backup_artifacts" {
  count         = var.enable_aws_resources ? 1 : 0
  bucket        = local.backup_bucket_name
  force_destroy = var.force_destroy_buckets
}

resource "aws_s3_bucket_versioning" "backup_artifacts" {
  count  = var.enable_aws_resources ? 1 : 0
  bucket = aws_s3_bucket.backup_artifacts[count.index].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backup_artifacts" {
  count  = var.enable_aws_resources ? 1 : 0
  bucket = aws_s3_bucket.backup_artifacts[count.index].bucket

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "backup_artifacts" {
  count  = var.enable_aws_resources ? 1 : 0
  bucket = aws_s3_bucket.backup_artifacts[count.index].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "backup_artifacts" {
  count  = var.enable_aws_resources ? 1 : 0
  bucket = aws_s3_bucket.backup_artifacts[count.index].id

  rule {
    id     = "transition-old-backups"
    status = "Enabled"

    expiration {
      days = 90
    }
  }
}

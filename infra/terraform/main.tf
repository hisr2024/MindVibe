terraform {
  required_version = ">= 1.6.0"
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "docker" {}

provider "aws" {
  region                      = var.aws_region
  skip_credentials_validation = var.enable_aws_resources ? false : true
  skip_metadata_api_check     = var.enable_aws_resources ? false : true
}

resource "docker_network" "mindvibe" {
  name = "mindvibe_net"
}

resource "docker_volume" "postgres_data" {
  name = "mindvibe_db_data"
}

resource "docker_container" "db" {
  name  = "mindvibe-db"
  image = var.db_image

  env = [
    "POSTGRES_USER=mindvibe",
    "POSTGRES_PASSWORD=${var.db_password}",
    "POSTGRES_DB=mindvibe",
  ]

  networks_advanced {
    name = docker_network.mindvibe.name
  }

  volumes {
    volume_name    = docker_volume.postgres_data.name
    container_path = "/var/lib/postgresql/data"
  }
}

resource "docker_container" "api" {
  name  = "mindvibe-api"
  image = var.app_image
  depends_on = [docker_container.db]

  env = [
    "DATABASE_URL=postgresql+asyncpg://mindvibe:${var.db_password}@mindvibe-db:5432/mindvibe",
    "RUN_MIGRATIONS_ON_STARTUP=true",
  ]

  networks_advanced {
    name = docker_network.mindvibe.name
  }

  ports {
    internal = 8000
    external = 8000
  }
}

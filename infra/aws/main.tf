terraform {
    required_providers {
        aws = { source = "hashicorp/aws" }
    }
    
    cloud {
        organization = "lightscale"
        workspaces {
            name = "layer-infra"
        }
    }
}

provider "aws" {
    region = "us-east-1"
}

module "layer_db" {
    source = "terraform-aws-modules/rds/aws"
    
    # Database identifier
    identifier = "layer-db"
    
    # Engine configuration
    engine = "postgres"
    engine_version = "15"
    family = "postgres15"
    instance_class = "db.t3.micro"
    
    # Database configuration
    db_name = "layer"
    username = var.db_username
    password = var.db_password
    
    # Network configuration
    vpc_security_group_ids = []
    subnet_ids = []
    
    # Storage configuration
    allocated_storage = 20
    storage_type = "gp2"
    
    # Backup configuration
    backup_retention_period = 7
    backup_window = "03:00-04:00"
    maintenance_window = "sun:04:00-sun:05:00"
    
    # Security configuration
    skip_final_snapshot = true
    deletion_protection = false
    
    # Monitoring
    monitoring_interval = 0
}


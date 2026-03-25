module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "6.1.1"

  identifier = "nexusmonitor-db"

  engine               = "postgres"
  engine_version       = "16.1"
  family               = "postgres16"
  major_engine_version = "16"
  instance_class       = "db.r7g.large"

  allocated_storage     = 200
  max_allocated_storage = 1000

  db_name  = "nexusmonitor"
  username = "nexusadmin"
  port     = 5432

  manage_master_user_password = true

  multi_az               = true
  db_subnet_group_name   = module.vpc.database_subnet_group
  vpc_security_group_ids = [module.security_group.security_group_id]

  maintenance_window = "Mon:00:00-Mon:03:00"
  backup_window      = "03:00-06:00"
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  backup_retention_period = 30
  skip_final_snapshot     = false
  deletion_protection     = true

  tags = {
    Owner       = "dbteam"
    Environment = "production"
  }
}

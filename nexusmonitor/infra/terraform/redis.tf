module "redis" {
  source  = "umotif-public/elasticache-redis/aws"
  version = "~> 3.0"

  name_prefix = "nexus-redis"

  engine_version = "7.1"
  port           = 6379

  node_type          = "cache.t4g.small"
  num_cache_clusters = 2
  automatic_failover_enabled = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  subnet_ids               = module.vpc.private_subnets
  vpc_id                   = module.vpc.vpc_id
  allowed_security_groups  = [module.security_group.security_group_id]

  maintenance_window = "tue:04:00-tue:05:00"
  snapshot_window    = "03:00-04:00"
  snapshot_retention_limit = 7
}

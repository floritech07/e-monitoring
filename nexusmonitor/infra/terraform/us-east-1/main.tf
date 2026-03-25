module "nexus_cluster_us_east" {
  source = "../shared_modules/eks" # Logical module sourcing

  cluster_name    = "nexus-prod-secondary"
  region          = "us-east-1"
  vpc_id          = module.vpc_us_east.vpc_id
  private_subnets = module.vpc_us_east.private_subnets
  node_min_size   = 2
  node_max_size   = 20
}

module "nexus_aurora_global_replica" {
  source = "../shared_modules/rds"

  cluster_identifier = "nexus-db-secondary"
  engine             = "aurora-postgresql"
  global_cluster     = "nexus-global-db" # Ties to eu-west-1 primary Aurora instance
  is_primary         = false
  instance_class     = "db.r6g.2xlarge"
}

module "nexus_redis_regional" {
  source = "../shared_modules/elasticache"
  
  cluster_id        = "nexus-redis-useast"
  node_type         = "cache.r6g.large"
  replicas_per_node = 2
  region            = "us-east-1"
}

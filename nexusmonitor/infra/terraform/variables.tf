variable "aws_region" {
  description = "AWS region for deployments"
  type        = string
  default     = "eu-west-1"
}

variable "cluster_name" {
  description = "EKS Cluster name"
  type        = string
  default     = "nexusmonitor-prod-eks"
}

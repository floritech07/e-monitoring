resource "aws_route53_health_check" "nexus_api_eu" {
  fqdn              = "api.eu-west-1.nexusmonitor.internal"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/healthz"
  failure_threshold = "3"
  request_interval  = "10"
}

resource "aws_route53_health_check" "nexus_api_us" {
  fqdn              = "api.us-east-1.nexusmonitor.internal"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/healthz"
  failure_threshold = "3"
  request_interval  = "10"
}

resource "aws_route53_record" "api_global" {
  zone_id = var.route53_zone_id
  name    = "api.nexusmonitor.internal"
  type    = "A"

  set_identifier = "eu-primary"
  failover_routing_policy {
    type = "PRIMARY"
  }
  health_check_id = aws_route53_health_check.nexus_api_eu.id
  alias {
    name                   = aws_lb.nexus_eu.dns_name
    zone_id                = aws_lb.nexus_eu.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "api_global_secondary" {
  zone_id = var.route53_zone_id
  name    = "api.nexusmonitor.internal"
  type    = "A"

  set_identifier = "us-secondary"
  failover_routing_policy {
    type = "SECONDARY"
  }
  health_check_id = aws_route53_health_check.nexus_api_us.id
  alias {
    name                   = aws_lb.nexus_us.dns_name
    zone_id                = aws_lb.nexus_us.zone_id
    evaluate_target_health = true
  }
}

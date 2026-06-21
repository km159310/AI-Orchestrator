output "alb_url" {
  description = "Public ALB URL — open this in a browser to hit the deployed app."
  value       = "http://${aws_lb.this.dns_name}"
}

output "ecr_repository_url" {
  description = "ECR repo to docker-push the image to."
  value       = aws_ecr_repository.this.repository_url
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster."
  value       = aws_ecs_cluster.this.name
}

output "ecs_service_name" {
  description = "Name of the ECS service."
  value       = aws_ecs_service.this.name
}

output "log_group" {
  description = "CloudWatch log group name."
  value       = aws_cloudwatch_log_group.this.name
}

output "region" {
  description = "AWS region this stack is deployed to."
  value       = var.region
}

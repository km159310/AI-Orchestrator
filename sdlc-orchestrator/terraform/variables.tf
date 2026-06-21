variable "region" {
  description = "AWS region for the ECS Fargate deployment."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short name used as a prefix for every resource."
  type        = string
  default     = "abc-bank"
}

variable "container_port" {
  description = "Port the container listens on (must match the generated app)."
  type        = number
  default     = 3000
}

variable "task_cpu" {
  description = "Fargate task CPU units (1024 = 1 vCPU)."
  type        = number
  default     = 512
}

variable "task_memory" {
  description = "Fargate task memory (MiB)."
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Number of Fargate tasks to run."
  type        = number
  default     = 1
}

variable "image_tag" {
  description = "ECR image tag for the task definition. Set to the SHA pushed by the orchestrator."
  type        = string
  default     = "latest"
}

# 实验 01：使用 Terraform 创建 AWS VPC

**时长：** 60 分钟  **前置条件：** AWS 账号、Terraform 1.6+。

## 目标

编写 Terraform 模块，创建包含公有和私有子网、路由表、NAT 网关及 Internet Gateway 的多可用区 VPC。执行应用、修改和销毁操作。

## 步骤

### 1. 项目布局
```
vpc-lab/
├── main.tf
├── variables.tf
├── outputs.tf
└── versions.tf
```

### 2. versions.tf
```hcl
terraform {
  required_version = ">= 1.6"
  required_providers { aws = { source = "hashicorp/aws", version = "~> 5.0" } }
}
provider "aws" { region = var.region }
```

### 3. variables.tf
```hcl
variable "region"     { type = string  default = "us-west-2" }
variable "name"       { type = string  default = "lab-vpc"  }
variable "cidr_block" { type = string  default = "10.10.0.0/16" }
variable "azs"        { type = list(string)  default = ["us-west-2a","us-west-2b"] }
```

### 4. main.tf（精简版）
```hcl
resource "aws_vpc" "this" {
  cidr_block = var.cidr_block
  enable_dns_support = true; enable_dns_hostnames = true
  tags = { Name = var.name }
}

resource "aws_subnet" "public" {
  count = length(var.azs)
  vpc_id = aws_vpc.this.id
  cidr_block = cidrsubnet(var.cidr_block, 4, count.index)
  availability_zone = var.azs[count.index]
  map_public_ip_on_launch = true
  tags = { Name = "${var.name}-public-${var.azs[count.index]}" }
}

resource "aws_subnet" "private" {
  count = length(var.azs)
  vpc_id = aws_vpc.this.id
  cidr_block = cidrsubnet(var.cidr_block, 4, count.index + 8)
  availability_zone = var.azs[count.index]
  tags = { Name = "${var.name}-private-${var.azs[count.index]}" }
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id
  tags = { Name = var.name }
}

resource "aws_eip" "nat" { domain = "vpc" }

resource "aws_nat_gateway" "this" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  depends_on    = [aws_internet_gateway.this]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }
}
resource "aws_route_table_association" "public" {
  count = length(var.azs)
  subnet_id = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.this.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.this.id
  }
}
resource "aws_route_table_association" "private" {
  count = length(var.azs)
  subnet_id = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}
```

### 5. outputs.tf
```hcl
output "vpc_id"            { value = aws_vpc.this.id }
output "public_subnet_ids" { value = aws_subnet.public[*].id }
output "private_subnet_ids"{ value = aws_subnet.private[*].id }
```

### 6. 应用
```bash
terraform init
terraform plan -out=plan.tfplan
terraform apply plan.tfplan
terraform output
```

### 7. 修改并重新应用

修改 `azs`，加入第三个可用区。运行 `terraform plan`——应当只显示新增资源，而没有销毁操作。

### 8. 销毁
```bash
terraform destroy -auto-approve
```

## 验证

- [ ] `terraform plan` 显示两个可用区所对应的预期资源数量。
- [ ] Apply 无错误完成。
- [ ] 输出包含两个公有子网与两个私有子网 ID。
- [ ] AWS 控制台中可以看到资源。

## 清理

务必以 `terraform destroy` 结束实验。忘记清理 NAT 网关每天可能产生约 1 美元费用（原文估计）。

## 故障排查

- **`Error: ... InvalidVpcID.NotFound`** — 可能存在竞态条件；添加 `depends_on` 强制执行顺序。
- **NAT 耗时超过 5 分钟** — 正常现象；NAT 创建较慢。
- **`UnauthorizedOperation`** — IAM 用户缺少 EC2/VPC 权限。

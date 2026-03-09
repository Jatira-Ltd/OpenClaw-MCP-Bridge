# AWS MCP Server

Tools for interacting with AWS services including EC2, S3, Lambda, RDS, and more.

## Installation

```bash
npm install @awlabs/mcp-aws
```

## Configuration

Required environment variables:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

## Tools

- `list_ec2_instances` - List EC2 instances
- `describe_ec2_instance` - Get EC2 instance details
- `list_s3_buckets` - List S3 buckets
- `list_s3_objects` - List objects in S3 bucket
- `upload_to_s3` - Upload file to S3
- `download_from_s3` - Download file from S3
- `list_lambda_functions` - List Lambda functions
- `invoke_lambda` - Invoke Lambda function
- `list_rds_instances` - List RDS instances
- `describe_rds_instance` - Get RDS instance details

## Usage

```bash
mcp enable @awlabs/mcp-aws
```

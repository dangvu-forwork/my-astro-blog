# pretty complicated
```
it's no longer static deployment (no longer too simple) so i will keep notes of how to deploy docker and all of that in here

-- Astro Build
run: "npm run build" at project root to build a dist/ file from the provided Astro stuff

--- AWS Deploy
cd to cdk, run "cdk diff" to check differences (confirming that everything new in dist has been successfully saved), then "npm run build" WHILE IN cdk FOLDER

-- Docker Publish
cd out to project folder then run:

Docker Publish to AWS (make sure ur logged in into your IAM first): 
$accountId = aws sts get-caller-identity --query Account --output text
$region = "us-east-1"
$repo = "my-astro-blog"
$registry = "$accountId.dkr.ecr.$region.amazonaws.com"

aws ecr create-repository --repository-name $repo --region $region
aws ecr get-login-password --region $region | docker login --username AWS --password-stdin $registry
docker build -t my-astro-blog .
docker tag my-astro-blog:latest "$registry/$repo:latest"
docker push "$registry/$repo:latest"




```
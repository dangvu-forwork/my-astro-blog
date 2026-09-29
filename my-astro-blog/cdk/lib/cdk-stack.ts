import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class StaticSiteStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const server = new cloudfront.Function(this, 'ServeRaw', {
      code: cloudfront.FunctionCode.fromInline(`
          function handler(event){
            var request = event.request; // Incoming URL. The full URL.
            var uri = request.uri; // The path of the URL. In this case, it's something like /posts/my-article

            // If it has no dot, it confirms it's a page route so change stuff.
            if (uri.indexOf('.') === -1){
              request.uri = 
                uri.charAt(uri.length - 1) === '/' // charAt starts at character 0.
                ? uri + 'index.html' // if it alr has a /, no need to add another one
                : uri + '/index.html' // otherwise just add it in
            }

            return request;
          }
      `)
    })
      
    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultBehavior: { 
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        functionAssociations: [{
          function: server,
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST
        }]
      },
      defaultRootObject: 'index.html',
    });

    new s3deploy.BucketDeployment(this, 'DeploySite', {
      sources: [s3deploy.Source.asset('./../dist')],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'], // Automatic CloudFront CDN cache invalidation
    })
  }
}
export default interface S3UploaderOptions {
    accessKeyId: string;
    secretAccessKey: string;
    buildPath: string;
    region: string;
    bucket: string;
    key?: string;
    acl?: string;
    cloudfront?: string;
    replaceHtml?: boolean;
}
import S3UploderOptions from "./S3UploaderOptions";

const ACL: RegExp = /^(private|public-read|public-read-write|aws-exec-read|authenticated-read|bucket-owner-read|bucket-owner-full-control)$/;
const validateACL = ($acl: string) => $acl && $acl.match(ACL) ? $acl : "public-read";

export const validateParam = ($option: S3UploderOptions) => {
    if (!$option) {
        throw new Error("[S3Uploader] You must pass parameters");
    } else if (!$option.accessKeyId) {
        throw new Error("[S3Uploader] parameter accessKeyId is required");
    } else if (!$option.secretAccessKey) {
        throw new Error("[S3Uploader] parameter secretAccessKey is required");
    } else if (!$option.buildPath) {
        throw new Error("[S3Uploader] parameter buildPath is required");
    } else if (!$option.region) {
        throw new Error("[S3Uploader] parameter region is must required");
    } else if (!$option.bucket) {
        throw new Error("[S3Uploader] parameter bucket is required");
    }
    
    $option.acl = validateACL($option.acl!);
    $option.replaceHtml = $option.replaceHtml || false;
};
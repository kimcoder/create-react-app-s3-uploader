# Create React App S3 Uploader
---
`create-react-app-s3-uploader`는 webpack 플러그인이며 [create-react-app](https://github.com/facebook/create-react-app) 환경에서 사용을 목적으로 제작하였습니다.
production 환경에서 react를 빌드하였을 시, static 디렉토리의 소스들을 aws s3의 버킷에 업로드 해줍니다.

`create-react-app-s3-uploader` is webpack plugin. (for [create-react-app](https://github.com/facebook/create-react-app)).
When react builded on production, this plugin upload static directory to aws s3 bucket

## install
---
```
npm install --save create-react-app-s3-uploader
```

## usage
---
가장 우선, `create-react-app` project에서 `npm eject`를 실행시켜줘야 합니다.
first of all, you shoud run `npm eject` in your `create-react-app` project

**webpack.config.prod.js**
```
const CreateReactAppS3Uploader = require("create-react-app-s3-uploader");

module.exports = {
    plugins: [
        new CreateReactAppS3Uploader({
            accessKeyId: {AWS ACCESS KEY },
            secretAccessKey: { AWS SECRET KEY },
            buildPath: paths.appBuild,
            region: "ap-northeast-2",
            bucket: "create-react-app-s3-uploader",
        })
    ]
};
```
**CreateReactAppS3Uploader Parameters**
|Name|Type|Required|Description|
|:--:|:--:|:-----:|:----------|
|**accessKeyId**|`{String}`|Required|AWS Access Key|
|**secretAccessKey**|`{String}`|Required|AWS Secret Key|
|**buildPath**|`{String}`|Required|`create-react-app` build directory path|
|**region**|`{String}`|Required|AWS S3 Region|
|**bucket**|`{String}`|Required|AWS S3 Bucket|
|**key**|`{String}`|Optional|If you set this param, you can upload to specific directory in your s3 bucket|
|**acl**|`{String}`|Optional|AWS S3 ACL, default `public-read`|
|**cloudfront**|`{String}`|Optional|S3's CloudFront Domain.|
|**replaceHtml**|`{boolean}`|Optional|default `false`. If you set to `true`, automatically change index.html's css & js's src to uploaded url|

## Example
---
![Example S3](/example_s3.gif)
![Example CloudFront](/example_cloudfront.gif)
## Reference
---
- ACL : [AWS ACL LIST](https://docs.aws.amazon.com/ko_kr/AmazonS3/latest/dev/acl-overview.html)
- Content-Type : [HTTP MIME TYPE](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Complete_list_of_MIME_types)

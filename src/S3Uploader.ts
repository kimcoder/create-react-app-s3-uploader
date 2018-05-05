import * as path from "path";
import * as aws from "aws-sdk";
import * as fs from "fs";
import S3UploderOptions from "./S3UploaderOptions";
import { validateParam } from "./S3UploaderUtil";
import { getContentType } from "./FileUtil";

export default class S3Uploader {
    options: S3UploderOptions;
    s3: aws.S3;
    staticPath: string;
    htmlPath: string;
    uploadDomain: string;
    uploadList: string[];
    uploadResult: { js: string, css: string };

    constructor($option: S3UploderOptions) {
        validateParam($option);
        this.options = $option;
        this.staticPath = path.join(this.options.buildPath, "static");
        this.htmlPath = path.join(this.options.buildPath, "index.html");
        this.uploadDomain = this.options.cloudfront || `s3.${this.options.region}.amazonaws.com/${this.options.bucket}`;
        this.uploadResult = { css: "", js: "" };
        this.configS3();
    }

    configS3 = () => {
        aws.config.update({
            accessKeyId: this.options.accessKeyId,
            secretAccessKey: this.options.secretAccessKey,
            region: this.options.region,
            signatureVersion: "v4",
        });

        this.s3 = new aws.S3({ apiVersion: "2006-03-01" });
    }

    apply = (compiler: any) => {
        compiler.plugin("done", compilation => {
            console.log("[S3Uploader apply] compile finished");
            
            fs.readdir(this.staticPath, ($err, $subDir) => {
                if ($err) {
                    console.log(`\x1b[31m[S3Uploader apply] static directory read error : ${$err.message} \x1b[0m`);
                } else {
                    this.uploadList = $subDir.reduce(($result: string[], $dir: string) => {
                        const subDirPath: string = path.join(this.staticPath, $dir);
                        return $result.concat(fs.readdirSync(subDirPath).map($file => path.join(subDirPath, $file)));
                    }, []);
                    
                    this.upload().then($res => {
                        console.log("\x1b[33m%s\x1b[0m", `\n-- UPLOAD COMPLETE --\n`);
                        console.log("\x1b[33m%s\x1b[0m", `   JS : ${this.uploadResult.js}`);
                        console.log("\x1b[33m%s\x1b[0m", `   CSS : ${this.uploadResult.css}\n`);
                        if (this.options.replaceHtml!) {
                            this.replaceIndexHtml();
                        }
                    });
                }
            });
        });
    }

    upload = async() => {
        console.log(`[S3Uploader upload] list count ${this.uploadList.length}`);
        for (const file of this.uploadList) {
            
            if (path.extname(file) === ".js") {
                this.updateUrlPublicPath(file, false);
            } else if (path.extname(file) === ".css") {
                this.updateUrlPublicPath(file, true);
            }

            await new Promise(resolve => {
                const key: string = file.replace(this.staticPath, `${(!this.options.key) ? "" : this.options.key + "/"}static`);

                this.s3.putObject({ 
                    ACL: this.options.acl || "public-read", 
                    Bucket: this.options.bucket, 
                    Key: key,
                    ContentType: getContentType(file),
                    Body: fs.createReadStream(file), 
                }, ($err, $res) => {
                    if ($err) {
                        console.log(`\x1b[31m[S3Uploader upload] s3 putObject error : ${$err.message} \x1b[0m`);
                    } else {
                        const url: string = `https://${this.uploadDomain}/${key}`;
                        console.log("\x1b[33m%s\x1b[0m", url);

                        if (path.extname(key) === ".js") {
                            this.uploadResult.js = url;
                        } else if (path.extname(key) === ".css") {
                            this.uploadResult.css = url;
                        }

                        resolve();
                    }
                });
            });
        }

        return Promise.resolve();
    }

    updateUrlPublicPath = ($filePath: string, $isCSS: boolean) => {
        const file: string = fs.readFileSync($filePath, "utf8");
        const reg: RegExp = $isCSS ? /\/static\/media\//g : /n.p\+\"static\/media\//g;
        const https: string = $isCSS ? `https://` : `"https://`;

        fs.writeFileSync($filePath, file.replace(reg, `${https}${this.uploadDomain}/static/media/`), "utf8");
    }

    replaceIndexHtml = () => {
        fs.readFile(this.htmlPath, "utf8", ($err, $html) => {
            if ($err) {
                console.log(`\x1b[31m[S3Uploader replaceIndexHtml] read index.html error : ${$err.message} \x1b[0m`);
            } else {
                const cssTag: string = `<link href="`;
                const jsTag: string = `<script type="text/javascript" src="`;
                const cssSrc: string = this.uploadResult.css.substring(0, this.uploadResult.css.indexOf("static/css") + "static/css".length);
                const jsSrc: string = this.uploadResult.js.substring(0, this.uploadResult.js.indexOf("static/js") + "static/js".length);
                const updateHtml: string = $html.replace(`${cssTag}/static/css`, `${cssTag}${cssSrc}`).replace(`${jsTag}/static/js`, `${jsTag}${jsSrc}`);

                fs.writeFile(this.htmlPath, updateHtml, "utf8", ($error) => {
                    if ($error) {
                        console.log(`\x1b[31m[S3Uploader replaceIndexHtml] replace index.html's css & js error : ${$error.message} \x1b[0m`);
                    } else {
                        console.log("\x1b[33m%s\x1b[0m", "[S3Uploader replaceIndexHtml] replace index.html success");
                    }
                });
            }
        });
    }
}

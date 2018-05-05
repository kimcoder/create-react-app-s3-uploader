"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const aws = require("aws-sdk");
const fs = require("fs");
const S3UploaderUtil_1 = require("./S3UploaderUtil");
const FileUtil_1 = require("./FileUtil");
class S3Uploader {
    constructor($option) {
        this.configS3 = () => {
            aws.config.update({
                accessKeyId: this.options.accessKeyId,
                secretAccessKey: this.options.secretAccessKey,
                region: this.options.region,
                signatureVersion: "v4",
            });
            this.s3 = new aws.S3({ apiVersion: "2006-03-01" });
        };
        this.apply = (compiler) => {
            compiler.plugin("done", compilation => {
                console.log("[S3Uploader apply] compile finished");
                fs.readdir(this.staticPath, ($err, $subDir) => {
                    if ($err) {
                        console.log(`\x1b[31m[S3Uploader apply] static directory read error : ${$err.message} \x1b[0m`);
                    }
                    else {
                        this.uploadList = $subDir.reduce(($result, $dir) => {
                            const subDirPath = path.join(this.staticPath, $dir);
                            return $result.concat(fs.readdirSync(subDirPath).map($file => path.join(subDirPath, $file)));
                        }, []);
                        this.upload().then($res => {
                            console.log("\x1b[33m%s\x1b[0m", `\n-- UPLOAD COMPLETE --\n`);
                            console.log("\x1b[33m%s\x1b[0m", `   JS : ${this.uploadResult.js}`);
                            console.log("\x1b[33m%s\x1b[0m", `   CSS : ${this.uploadResult.css}\n`);
                            if (this.options.replaceHtml) {
                                this.replaceIndexHtml();
                            }
                        });
                    }
                });
            });
        };
        this.upload = () => __awaiter(this, void 0, void 0, function* () {
            console.log(`[S3Uploader upload] list count ${this.uploadList.length}`);
            for (const file of this.uploadList) {
                if (path.extname(file) === ".js") {
                    this.updateUrlPublicPath(file, false);
                }
                else if (path.extname(file) === ".css") {
                    this.updateUrlPublicPath(file, true);
                }
                yield new Promise(resolve => {
                    const key = file.replace(this.staticPath, `${(!this.options.key) ? "" : this.options.key + "/"}static`);
                    this.s3.putObject({
                        ACL: this.options.acl || "public-read",
                        Bucket: this.options.bucket,
                        Key: key,
                        ContentType: FileUtil_1.getContentType(file),
                        Body: fs.createReadStream(file),
                    }, ($err, $res) => {
                        if ($err) {
                            console.log(`\x1b[31m[S3Uploader upload] s3 putObject error : ${$err.message} \x1b[0m`);
                        }
                        else {
                            const url = `https://${this.uploadDomain}/${key}`;
                            console.log("\x1b[33m%s\x1b[0m", url);
                            if (path.extname(key) === ".js") {
                                this.uploadResult.js = url;
                            }
                            else if (path.extname(key) === ".css") {
                                this.uploadResult.css = url;
                            }
                            resolve();
                        }
                    });
                });
            }
            return Promise.resolve();
        });
        this.updateUrlPublicPath = ($filePath, $isCSS) => {
            const file = fs.readFileSync($filePath, "utf8");
            const reg = $isCSS ? /\/static\/media\//g : /n.p\+\"static\/media\//g;
            const https = $isCSS ? `https://` : `"https://`;
            fs.writeFileSync($filePath, file.replace(reg, `${https}${this.uploadDomain}/static/media/`), "utf8");
        };
        this.replaceIndexHtml = () => {
            fs.readFile(this.htmlPath, "utf8", ($err, $html) => {
                if ($err) {
                    console.log(`\x1b[31m[S3Uploader replaceIndexHtml] read index.html error : ${$err.message} \x1b[0m`);
                }
                else {
                    const cssTag = `<link href="`;
                    const jsTag = `<script type="text/javascript" src="`;
                    const cssSrc = this.uploadResult.css.substring(0, this.uploadResult.css.indexOf("static/css") + "static/css".length);
                    const jsSrc = this.uploadResult.js.substring(0, this.uploadResult.js.indexOf("static/js") + "static/js".length);
                    const updateHtml = $html.replace(`${cssTag}/static/css`, `${cssTag}${cssSrc}`).replace(`${jsTag}/static/js`, `${jsTag}${jsSrc}`);
                    fs.writeFile(this.htmlPath, updateHtml, "utf8", ($error) => {
                        if ($error) {
                            console.log(`\x1b[31m[S3Uploader replaceIndexHtml] replace index.html's css & js error : ${$error.message} \x1b[0m`);
                        }
                        else {
                            console.log("\x1b[33m%s\x1b[0m", "[S3Uploader replaceIndexHtml] replace index.html success");
                        }
                    });
                }
            });
        };
        S3UploaderUtil_1.validateParam($option);
        this.options = $option;
        this.staticPath = path.join(this.options.buildPath, "static");
        this.htmlPath = path.join(this.options.buildPath, "index.html");
        this.uploadDomain = this.options.cloudfront || `s3.${this.options.region}.amazonaws.com/${this.options.bucket}`;
        this.uploadResult = { css: "", js: "" };
        this.configS3();
    }
}
exports.default = S3Uploader;

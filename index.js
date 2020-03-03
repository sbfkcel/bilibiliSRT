const fs = require('fs'),
    path = require('path'),
    http = require('http'),
    fillIn = (num,len)=>{
        num = ``+num;
        len = len - num.length;
        if(len){
            for(let i=0;i<len;i++){
                num = `0${num}`;
            };
        };
        return num;
    },
    formatTime = num => {
        num = num * 1000;
        let h = (()=>{
                let t = num / 60 / 60 / 1000;
                return t >= 1 ? ~~t : 0;
            })(),
            m = (()=>{
                let t = [num - (h * 60 * 60 * 1000)] / 60 / 1000;
                return t >= 1 ? ~~t : 0;
            })(),
            s = (()=>{
                let t = [num - (h * 60 * 60 * 1000) - (m * 60 * 1000)] / 1000;
                return t >= 1 ? ~~t : 0;
            })(),
            ms = (()=>{
                let t = [num - (h * 60 * 60 * 1000) - (m * 60 * 1000) - (s * 1000)];
                return t >= 1 ? ~~t : 0;
            })();
        return `${fillIn(h,2)}:${fillIn(m,2)}:${fillIn(s,2)},${fillIn(ms,3)}`;
    },
    fileInfo = pathStr => {
        let obj = {};

        obj.extname = path.extname(pathStr);

        console.log(path.parse(pathStr))

        return obj;
    },

    // 彩云翻译
    fanyi = (content,type)=>{
        type = type || 'en2zh';
        return new Promise((resolve,reject)=>{
            let req = http.request({
                method:"POST",
                host:"api.interpreter.caiyunai.com",
                path:"/v1/translator",
                headers:{
                    "Content-Type":"application/json",
                    "x-authorization":"token xke1jo9l4qsqsxluzi9h"
                }
            },res => {
                let result = ``;
                res.on("data", chunk => {
                    result += JSON.parse(chunk.toString()).target;
                });
                res.on("end",chunk => {
                    resolve(result);
                });
                res.on("error",err => {
                    reject(err);
                });
            });

            let data = {
                "source":content, 
                "trans_type":type,
                "request_id":"demo",
                "detect":true
            };

            req.write(JSON.stringify(data));
            req.end();
        });
    };

class Danmu{
    constructor(){
        this.url = `https://api.bilibili.com/x/web-interface/view?aid=40238909&cid=70674904`
    }
    async init(){
        const _ts = this;
        let data = await this.getData(40238909,70674904);
        let content = this.getSrt(data);

        fs.writeFileSync('test.srt',content);

        return "弹幕获取完成";
    }


    // 转换指定目录
    conversionDir(){
        const _ts = this;
        let srcDir = path.join(__dirname,'data'),
            files = fs.readdirSync(srcDir),
            outDir = path.join(__dirname,'out');

        files.forEach(item => {
            let itemPath = path.join(srcDir,item),
                itemInfo = path.parse(itemPath),
                itemName = itemInfo.name,
                outPath = path.join(outDir,`${itemName}.srt`);
            if(itemInfo.ext === '.json'){
                let itemObj = require(itemPath).body,
                    content = _ts.getSrt(itemObj);
                fs.writeFileSync(outPath,content);
            }
        });
    }

    getUrl(url){
        return new Promise((resolve,reject)=>{
            let result = ``;
            try {
                http.get(url,res => {
                    res.on("data",data => {
                        result += data.toString();
                    });
                    res.on("end",data => {
                        resolve(result);
                    });
                });
            } catch (error) {
                reject(error);
            };
        })
    }

    async getData(aid,cid){
        const _ts = this,
            url = `http://api.bilibili.com/x/web-interface/view?aid=${aid}&cid=${cid}`,
            urlData = await _ts.getUrl(url),
            subtitleUrl = JSON.parse(urlData).data.subtitle.list[0].subtitle_url,
            subtitlStr = await _ts.getUrl(subtitleUrl),
            subtitlData = JSON.parse(subtitlStr).body;
        return subtitlData;
    }

    getSrt(data){
        const _ts = this;
        let result = ``;
        data.forEach((item,index)=>{
            result += _ts.echoSrt(item,index);
        });
        return result;
    }
    echoSrt(data,index){
        let str = ``;
        str += index + 1;
        str += `\r\n`;

        str += `${formatTime(data.from)} --> ${formatTime(data.to)}\r\n`;

        str += `${data.content}\r\n`;

        str += `\r\n`;
        return str;
    }
};

// new Danmu().init().then(v => {
//     console.log('完成',v);
// }).catch(e => {
//     console.log('错误',e);
// });


new Danmu().conversionDir();
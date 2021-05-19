class Video {
    constructor(partnerID, partnerID2 ,entryID) {
        this.partnerID = partnerID;
        this.partnerID2 = partnerID2;
        this.entryID = entryID;
    }
    async getVideoInfo(){
        return await fetchVideoMetaData(this);
    }
}

class VideoInfo {
    constructor(videoName, duration, url) {
        this.videoName = videoName;
        this.duration = duration;
        this.url = url;
    }
}

function fetchVideoMetaData(video) {
    const queryURL = `https://cdnapi.kaltura.com/api_v3/index.php?apiVersion=3.1.5&format=1&service=multirequest&1%3Aexpiry=86400&1%3Aservice=session&1%3Aaction=startWidgetSession&1%3AwidgetId=_${video.partnerID}&2%3Aaction=get&2%3AentryId=${video.entryID}&2%3Aservice=baseentry&2%3Aks=%7B1%3Aresult%3Aks%7D&2%3AresponseProfile%3Afields=createdAt%2CdataUrl%2Cduration%2Cname%2Cplays%2CthumbnailUrl%2CuserId&2%3AresponseProfile%3Atype=1&3%3Aaction=getbyentryid&3%3AentryId=${video.entryID}&3%3Aservice=flavorAsset&3%3Aks=%7B1%3Aresult%3Aks%7D`
    const request = new XMLHttpRequest();
    request.open("GET", queryURL);
    request.responseType = "json";

    return new Promise((resolve, reject) => {
        request.addEventListener("load", (e) => {
            const res = request.response;
            if (!res) {
                reject([new VideoInfo(null, null, null)]);
            }
            else {
                let minBitRate = -1;
                let flavorID = null;
                for (let video of res[2]){
                    if (video.bitrate > minBitRate){
                        flavorID = video.id;
                        minBitRate = video.bitrate;
                    }
                }
                if (minBitRate !== -1){
                    const url = `https://cdnapi.kaltura.com/p/${video.partnerID}/sp/${video.partnerID2}/playManifest/entryId/${video.entryID}/format/url/protocol/http/flavorId/${flavorID}`;
                    resolve(new VideoInfo(res[1].name, res[1].duration, url));
                } else {
                    reject(new VideoInfo(null, null, null));
                }

            }
        });
        request.send();
    });
}

async function main(document) {
    window.onload = () => {
        initialize(window.document);
    };
    if (document) {
        if (document.readyState === "complete") {
            initialize(document);
        } else {
            document.onreadystatechange = () => {
                if (document.readyState === "complete") {
                    initialize(document);
                }
            };
        }
    }
}


async function initialize(document) {
    let frameTags = document.getElementsByTagName("iframe");
    Array.prototype.forEach.call(frameTags, function (frame) {
        try {
            var childDocument = frame.contentDocument;
        } catch (e) {
            return;
        }
        main(childDocument);
    });
    let img = document.querySelectorAll('img');
    let videoIDList = [];
    for (let i of img) {
        const regex = i.src.match("https?://cfvod.kaltura.com/p/([^/]+)/sp/([^/]+)/thumbnail/entry_id/([^/]+)");
        if(regex && regex.length === 4){
            // console.log("id ", regex[1], " id2 ", regex[2],  " entryid ", regex[3]);
            videoIDList.push(new Video(regex[1], regex[2], regex[3]));
        }
    }

    let videoInfoList = [];
    for (let v of videoIDList){
        let res = await v.getVideoInfo();
        console.log("url", res)
        videoInfoList.push(res)
    }
    chrome.runtime.sendMessage({message: videoInfoList}, () => {
        return true
    });
}

main();

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        if (!inIframe()){
            console.log("req", request.url)
                // a タグ生成
                var alink = document.createElement('a');
                alink.download = "filename";
                alink.href = request.url;
                alink.target = "_blank";
                alink.click();
        }
        return true;
    });

function inIframe () {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}
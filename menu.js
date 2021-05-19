chrome.contextMenus.onClicked.addListener(item => {
    console.log("added")
    console.log(item.menuItemId);
    const regex = item.menuItemId.match("^@URL(.*)");
    if(regex && regex.length === 2){
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { url: regex[1] }, function (response) {
                console.log(response);
                return true;
            });
        });
        console.log(regex[1])
    }
    return true;
});

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        const videoInfoList = request.message;
        chrome.contextMenus.removeAll();
        const parent = chrome.contextMenus.create({
            id: 'parent',
            title: 'Download Kaltura Video',
            enabled: (videoInfoList.length > 0)
        });

        for (let video of videoInfoList){
            chrome.contextMenus.create({
                id: video.videoName,
                parentId: 'parent',
                title: video.videoName
            });
            chrome.contextMenus.create({
                id: "@URL"+video.url,
                parentId: video.videoName,
                title: 'Download'
            });
        }

        sendResponse({});
        return true;
});


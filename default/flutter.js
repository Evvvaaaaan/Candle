var flutter_listener_fcmtoken = function(){};
var flutter_listener_localStorage = function(){};
var flutter_listener_appState = function(){};
var flutter_listener_push = function(obj_url){
    if(!isNull(obj_url)){
        location.href = obj_url;
    }
};
function receiveFromFlutter(obj_data){
    let tempJsonData = JSON.parse(JSON.stringify(obj_data));
    let tempType = tempJsonData["type"];
    if(tempType === "fcmToken"){
        //fcm토큰 가져오기
        let tempData = tempJsonData["data"];
        let tempToken = tempData["token"] + ''
        //localStorage.setItem('flutter_fcm', tempToken);
        flutter_listener_fcmtoken(tempToken);
    }
    if(tempType === "localStorage"){
        //스토리지 값 가져오기
        let tempKey = tempJsonData["key"] + '';
        let tempValue = tempJsonData["value"] + '';
        localStorage.setItem(tempKey, tempValue);
        $(function(){
            flutter_listener_localStorage(tempValue);
        });
    }
    if(tempType === "rewardAd"){
        let tempData = tempJsonData["data"];
        //alert("rewardAd : " + JSON.stringify(tempJsonData));
    }
    if(tempType === "push"){
        //푸시 / 로컬 알림 눌렀을 때 (알림에 넣은 data 전부)
        let tempData = tempJsonData["data"];
        //alert("push : " + JSON.stringify(tempData));
        flutter_listener_push(tempData["url"]);
    }
}
function flutter_sendSMS(obj_phone, obj_body){
    if (window.FlutterBridge) {
        window.FlutterBridge.postMessage(JSON.stringify({
            action: "sendSMS",
            phone: obj_phone + '',
            body: obj_body + ''
        }));
    } else {
        console.log("FlutterBridge is not available.");
        location.href = "sms:"+obj_phone+"?body=" + obj_body;
    }
}
function flutter_share(obj_content){
    if (window.FlutterBridge) {
        window.FlutterBridge.postMessage(JSON.stringify({
            action: "share",
            content: obj_content + ''
        }));
    } else {
        listner_only_share_copy(obj_content);
        console.log("FlutterBridge is not available.");
    }
}
function listner_only_share_copy(obj_content){
    window.navigator.clipboard.writeText(obj_content).then(() => {
        alert(obj_content + "\n클립보드로 복사되었습니다.");
    });
}
function flutter_openUrl(obj_url){
    if (window.FlutterBridge) {
        window.FlutterBridge.postMessage(JSON.stringify({
            action: "openUrl",
            url: obj_url + ''
        }));
    } else {
        console.log("FlutterBridge is not available.");
        window.open(obj_url + '', "_blank");
    }
}
function flutter_getFCMToken(){
    if (window.FlutterBridge) {
        window.FlutterBridge.postMessage(JSON.stringify({
            action: "getFCMToken"
        }));
    } else {
        console.log("FlutterBridge is not available.");
    }
}
function flutter_setLocalStorage(obj_key, obj_value){
    if (window.FlutterBridge) {
        window.FlutterBridge.postMessage(JSON.stringify({
            action: "setLocalStorage",
            key: obj_key + '',
            value: obj_value + ''
        }));
    } else {
        console.log("FlutterBridge is not available.");
    }
    localStorage.setItem(obj_key + '', obj_value + '');
}
function flutter_getLocalStorage(obj_key){
    if (window.FlutterBridge) {
        window.FlutterBridge.postMessage(JSON.stringify({
            action: "getLocalStorage",
            key: obj_key + ''
        }));
    } else {
        console.log("FlutterBridge is not available.");
        let tempJsonData = {
            "type" : "localStorage"
            ,"key" : obj_key + ''
            ,"value" : localStorage.getItem(obj_key + '')
        };
        receiveFromFlutter(tempJsonData);
    }
}
function flutter_showRewardAd(obj_from, obj_userId){
    if (window.FlutterBridge) {
        window.FlutterBridge.postMessage(JSON.stringify({
            action: "showRewardAd",
            from: obj_from + '',
            userId: obj_userId + ''
        }));
    } else {
        console.log("FlutterBridge is not available.");
    }
}
function flutter_scheduleNoti(obj_id, obj_hour, obj_minute, obj_title, obj_body, obj_data, obj_skipToday){
    //로컬 예약 알림 (매일 obj_hour:obj_minute, 한국 시간, 같은 id 면 덮어씀)
    //obj_skipToday 가 true 면 오늘은 건너뛰고 내일부터
    if (window.FlutterBridge) {
        window.FlutterBridge.postMessage(JSON.stringify({
            action: "scheduleNoti",
            id: Number(obj_id),
            hour: Number(obj_hour),
            minute: Number(obj_minute),
            title: obj_title + '',
            body: obj_body + '',
            data: obj_data || {},
            skipToday: obj_skipToday === true
        }));
        //alert("FlutterBridge scheduleNoti ON");
    } else {
        console.log("FlutterBridge is not available.");
        //alert("FlutterBridge scheduleNoti not...");
    }

}
function flutter_cancelNoti(obj_id){
    //로컬 예약 알림 하나 취소
    if (window.FlutterBridge) {
        window.FlutterBridge.postMessage(JSON.stringify({
            action: "cancelNoti",
            id: Number(obj_id)
        }));
    } else {
        console.log("FlutterBridge is not available.");
    }
}
function flutter_cancelAllNoti(){
    //로컬 예약 알림 전부 취소 (알림 끄기 / 로그아웃 / 탈퇴)
    if (window.FlutterBridge) {
        window.FlutterBridge.postMessage(JSON.stringify({
            action: "cancelAllNoti"
        }));
    } else {
        console.log("FlutterBridge is not available.");
    }
}

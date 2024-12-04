// ==UserScript==
// @name         iROIS 小幫手: 模具/CT定位小幫手
// @namespace    josesun@gmail.com
// @version      1.6
// @description  1. 當未上傳姿勢照時，無法送出表單
// @             2. 當未選擇自費 TOMO 項目時，不能選擇 TOMO 治療室
// @             3. 當自費項目:TOMO 尚未確定時，治療室只能選擇未確定欄位
// @             4. 選擇自費 TOMO 治療時，自動選擇 TOMO 治療室，若治療室已勾選則不選擇
// @             5. 選擇自費 ABC 治療時，自動選擇 L2 治療室，若治療室已勾選則不選擇
// @             6. 如果偵測到為 RAL 治療時，自動選擇 RAL 治療室
// @             7. 當掃描類型為 4D CT 時，自動新增對應的影像代號
// @             8. 當為 Resim 單時，自動選擇上次治療的治療室，若治療室已勾選則不選擇
// @             9. 點選感控警示可以直接連到 OnePage 查詢病人的檢驗資料
// @             10. 當病人需約束時，提示要請病人去櫃檯填寫同意書
// @author       Jose Sun
// @match        http://10.103.250.202/iROIS/CT/Edit/*
// @match        http://196.254.100.230/iROIS/CT/Edit/*
// @grant        none
// @downloadURL  https://www.dropbox.com/s/dna3rh86plgh8eg/iROIS%20%E5%B0%8F%E5%B9%AB%E6%89%8B-%20%E6%A8%A1%E5%85%B7-CT%E5%AE%9A%E4%BD%8D%E5%B0%8F%E5%B9%AB%E6%89%8B.user.js?dl=1
// @updateURL    https://www.dropbox.com/s/dna3rh86plgh8eg/iROIS%20%E5%B0%8F%E5%B9%AB%E6%89%8B-%20%E6%A8%A1%E5%85%B7-CT%E5%AE%9A%E4%BD%8D%E5%B0%8F%E5%B9%AB%E6%89%8B.user.js?dl=1
// ==/UserScript==
"use strict";

var submitType = $("button[name=submitType]").attr('id');
if (submitType == "updateForm") { // 已送出的表單只有「修改」按鈕
    submitType = "updateForm";
} else if (submitType == "tempForm2") { // 未送出的表單有「完成定位」按鈕
    submitType = "saveForm";
}
//console.log(submitType);
var submitTypeButton = document.querySelector("button[id=" + submitType +"]"); // 「完成定位」或「修改」 button 的元素位置
var brachyinfo = document.querySelector("#BrachytherapyInformation"); // Brachytherapy Information 元素位置

if (brachyinfo == null) { // 先排除 Brachy 的表單
    $("button[id=" + submitType +"]").off("click"); // off 按鈕所有綁定的 click event
}

// 當未上傳姿勢照時，無法送出表單
function blockSubmitWithoutPhoto (zEvent) {
    var photoListTable = document.querySelector("#PhotoList > div > table[class='table table-striped dis-table mb-1 file-info-table']"); // 照片清單表格的元素位置
    var phototypeNodeList = photoListTable.querySelectorAll("td:nth-child(1)"); // 從 photoListTable 抓出「類型」欄位的所有內容並存成 node list
    var phototypeArray = Array.apply(null, phototypeNodeList); // 將「類型」所有內容的 node list 存成 array
    var phototype = []; // 該病人照片類型 array

    // 從 phototypeArray 中抓出照片類型名稱並存到 phototype array
    phototypeArray.forEach(function(value, i, array) {
        phototype.push(value.innerText);
    });
    //console.log(phototype);

    if (phototype.includes("姿勢照")) {
        //console.log("已上傳姿勢照！");
        PostForm(submitType);
    } else {
        alert("iROIS 小幫手：\n尚未上傳姿勢照，無法送出！");
    }
}

// 當病人注意事項含有「約束」時，提醒要請病人填寫約束同意書
function alertSubmitWithRestraint (zEvent) {
    var patientNote = $("#Note").val();
    console.log("patientNote:", patientNote);

    if (patientNote.match(/約束/)) {
        alert("iROIS 小幫手：\n病人需約束，結束後請提醒病人到櫃檯填寫「約束同意書」！");
    };

};

if (submitTypeButton && brachyinfo == null) {
    submitTypeButton.addEventListener ("click", blockSubmitWithoutPhoto);
    submitTypeButton.addEventListener ("click", alertSubmitWithRestraint);
};



//快捷鈕
$('button[name="HotKey_Note"]').click(function () {
    var buttonMessage = $(this).val() == "" ? $(this).text() : $(this).val();
    console.log("buttonMessage:", buttonMessage);
    if (buttonMessage.match(/約束/)) {
        var patientNoteText = document.createElement("span"); // 欲插入的元素 (輸出結果)
        var patientNoteTextPos = document.querySelector("#Note"); // 定位出要插入元素的位置
        patientNoteText.setAttribute("class","form-inline valid-tooltip btn-primary");
        patientNoteText.setAttribute("style","font-size: 1.1rem;");
        patientNoteText.id = "patientNoteText";
        patientNoteText.innerText = "iROIS 小幫手：\n病人需約束，結束後請提醒病人到櫃檯填寫「約束同意書」！";
        patientNoteTextPos.parentNode.insertBefore(patientNoteText, patientNoteTextPos.nextSibling);
    }
});


// 當自費項目:TOMO 尚未確定時，治療室只能選擇未確定欄位
// 選擇自費 TOMO 治療時，自動選擇 TOMO 治療室，若治療室已勾選則不選擇
// 選擇自費 ABC 治療時，自動選擇 ABC 治療室，若治療室已勾選則不選擇

if (brachyinfo == null) { // 先排除 Brachy 的表單
    ChargeAutoSelect();
} else {
    // 如果偵測到為 RAL 治療時，自動選擇 RAL 治療室
    var patientChargeItemText = document.createElement("span"); // 欲插入的元素 (輸出結果)
    var patientChargeItemTextPos = document.querySelector("#CTForm > div.card-papper.ne-info > div.row > div.Radio-required > div:last-child"); // 定位出要插入元素的位置
    var ctTxRoomRAL = $("input[name='CT.TreatmentRoom'][value*='RAL']"); // 選擇治療室中含有'RAL'選項的元素位置
    ctTxRoomRAL.prop("checked", true);
    patientChargeItemText.setAttribute("class","form-inline valid-tooltip");
    patientChargeItemText.id = "patientChargeItemText";
    patientChargeItemText.innerHTML = "iROIS 小幫手偵測到病人為 RAL 治療：自動選擇 RAL 治療室";
    if (patientChargeItemTextPos != null) {
        patientChargeItemTextPos.parentNode.insertBefore(patientChargeItemText, patientChargeItemTextPos.nextSibling);
    }
};


function ChargeAutoSelect(value){
    if (document.querySelector("#Fixation > div.form-group > div.row >div.small-checkbox")) {
        var patientChargeItem = document.querySelector("#Fixation > div.form-group > div.row > div.small-checkbox").innerText; // 自費項目欄位的元素位置
    } else {
        var patientChargeItem = ""; // 如找不到該元素則設為空值
    }
    console.log("patientChargeItem:" , patientChargeItem);
    var ctTxRoom = $("input[name='CT.TreatmentRoom']"); // 選擇治療室中所有選項的元素位置
    var ctTxRoomUnsure = $("input[name='CT.TreatmentRoom'][value='?']"); // 選擇治療室中'未確定'的元素位置
    var ctTxRoomOr = $("input[name='CT.TreatmentRoom'][value*='or']"); // 選擇治療室中'未確定治療室'(含有 or)選項的元素位置
    var ctTxRoomTomo = $("input[name='CT.TreatmentRoom'][value='TOMOTHERAPY']"); // 選擇治療室中'TOMOTHERAPY'選項的元素位置
    var ctTxRoomL1 = $("input[name='CT.TreatmentRoom'][value='Synergy']"); // 選擇治療室中'Synergy'選項的元素位置
    var ctTxRoomL2 = $("input[name='CT.TreatmentRoom'][value='L2']"); // 選擇治療室中'L2'選項的元素位置

    if (/TOMO/.test(patientChargeItem) == false) {
        //console.log("/TOMO/.test(patientChargeItem):" , /TOMO/.test(patientChargeItem));
        ctTxRoom.attr("disabled", false);
        ctTxRoomTomo.attr("disabled", true);
        ctTxRoomOr.attr("disabled", true);

        var patientChargeItemText = document.createElement("span"); // 欲插入的元素 (輸出結果)
        var patientChargeItemTextPos = document.querySelector("#CTForm > div.card-papper.ne-info > div.row > div.Radio-required > div:last-child"); // 定位出要插入元素的位置
        patientChargeItemText.setAttribute("class","form-inline valid-tooltip");
        patientChargeItemText.id = "patientChargeItemText";
        patientChargeItemText.innerHTML = "因病人未選擇自費 TOMO 治療，iROIS 小幫手已將部分選項封鎖";
        if (patientChargeItemTextPos != null) {
            patientChargeItemTextPos.parentNode.insertBefore(patientChargeItemText, patientChargeItemTextPos.nextSibling);
        }
    };

    if (patientChargeItem.match(/TOMO \(未確定\)/)) {
        ctTxRoom.attr("disabled", true);
        ctTxRoomUnsure.attr("disabled", false);
        ctTxRoomOr.attr("disabled", false);

        var patientChargeItemText = document.createElement("span"); // 欲插入的元素 (輸出結果)
        var patientChargeItemTextPos = document.querySelector("#CTForm > div.card-papper.ne-info > div.row > div.Radio-required > div:last-child"); // 定位出要插入元素的位置
        patientChargeItemText.setAttribute("class","form-inline valid-tooltip");
        patientChargeItemText.id = "patientChargeItemText";
        patientChargeItemText.innerHTML = "因病人治療室尚未確定，iROIS 小幫手已將部分選項封鎖";
        if (patientChargeItemTextPos != null) {
            patientChargeItemTextPos.parentNode.insertBefore(patientChargeItemText, patientChargeItemTextPos.nextSibling);
        }
    };


    if (patientChargeItem.match(/TOMO 治療/) && document.querySelector("input[name='CT.TreatmentRoom']:checked") == null) {
        ctTxRoomTomo.prop("checked", true);

        var patientChargeItemText = document.createElement("span"); // 欲插入的元素 (輸出結果)
        var patientChargeItemTextPos = document.querySelector("#CTForm > div.card-papper.ne-info > div.row > div.Radio-required > div:last-child"); // 定位出要插入元素的位置
        //console.log(patientChargeItemTextPos);
        patientChargeItemText.setAttribute("class","form-inline valid-tooltip");
        patientChargeItemText.id = "patientChargeItemText";
        patientChargeItemText.innerHTML = "iROIS 小幫手偵測到病人為自費 TOMO 治療：自動選擇 TOMO 治療室";
        if (patientChargeItemTextPos != null) {
            patientChargeItemTextPos.parentNode.insertBefore(patientChargeItemText, patientChargeItemTextPos.nextSibling);
        }
    };

    if (patientChargeItem.match(/ABC 治療/) && document.querySelector("input[name='CT.TreatmentRoom']:checked") == null) {
        ctTxRoomL2.prop("checked", true);

        var patientChargeItemText = document.createElement("span"); // 欲插入的元素 (輸出結果)
        var patientChargeItemTextPos = document.querySelector("#CTForm > div.card-papper.ne-info > div.row > div.Radio-required > div:last-child"); // 定位出要插入元素的位置
        patientChargeItemText.setAttribute("class","form-inline valid-tooltip");
        patientChargeItemText.id = "patientChargeItemText";
        patientChargeItemText.innerHTML = "iROIS 小幫手偵測到病人為自費 ABC 治療：自動選擇 L2 治療室";
        if (patientChargeItemTextPos != null) {
            patientChargeItemTextPos.parentNode.insertBefore(patientChargeItemText, patientChargeItemTextPos.nextSibling);
        }
    };

    // 當掃描類型為 4D CT 時，自動新增對應的影像代號
    var patientChargeItemText = document.createElement("span"); // 欲插入的元素 (輸出結果)
    var patientChargeItemTextPos = document.querySelector("#ImageNoArea > div:last-child"); // 定位出要插入元素的位置
    if (document.querySelector("#Fixation > div.form-group > div > div:nth-child(3) > div > input[name='SimConditionClassItemList[0]']:checked")) {
        var scanTypeValue = document.querySelector("#Fixation > div.form-group > div > div:nth-child(3) > div > input[name='SimConditionClassItemList[0]']:checked").nextElementSibling.innerText; // 掃描類型
    } else {
        var scanTypeValue = "3D CT"; // 如掃描方式未勾選則預設為 3D CT
    }
    //console.log(scanTypeValue);
    var img_0_AmountOfImagePos = document.querySelector("#Img_0 > input:nth-child(3)"); // 定位第一個影像代號/張數 的位置
    //console.log(img_0_AmountOfImagePos.value);
    var imageAddButton = document.querySelector("#AddImageNo");

    if (scanTypeValue.match(/4D CT/) && img_0_AmountOfImagePos.value == "") {
        imageAddButton.click();
        document.querySelector("#Img_0 > input:nth-child(2)").value = "Non Gated";
        document.querySelector("#Img_1 > input:nth-child(2)").value = "MIP/AIP";
        patientChargeItemText.setAttribute("class","form-inline valid-tooltip");
        patientChargeItemText.id = "patientChargeItemText";
        patientChargeItemText.innerHTML = "iROIS 小幫手偵測到病人為 4D CT 掃描：自動填入對應的影像代號";
        if (patientChargeItemTextPos != null) {
            patientChargeItemTextPos.parentNode.insertBefore(patientChargeItemText, patientChargeItemTextPos.nextSibling);
        }
    };

    // 當為 Resim 單時，自動選擇上次治療的治療室，若治療室已勾選則不選擇
    var patientChargeItemText = document.createElement("span"); // 欲插入的元素 (輸出結果)
    var patientChargeItemTextPos = document.querySelector("#ImageNoArea > div:last-child"); // 定位出要插入元素的位置
    var reSimValue = document.querySelector("#CTForm > div.row > div.block-same-h > div.block-same-h_inside > div:nth-child(2) > div:nth-child(2)").innerText;
    console.log("reSimValue:" , reSimValue);
    if (document.querySelector("#CTForm > div.col-md-12 > div.bg-white > div > div > div > table > tbody > tr:last-child > td:nth-child(8)")) {
        var lastTxRoomPos = document.querySelector("#CTForm > div.col-md-12 > div.bg-white > div > div > div > table > tbody > tr:last-child > td:nth-child(8)");
        console.log(lastTxRoomPos.innerText);
    } else if (document.querySelector("#CTForm > div.bg-white > div > div > div > table > tbody > tr:last-child > td:nth-child(10)")) {
        var lastTxRoomPos = document.querySelector("#CTForm > div.bg-white > div > div > div > table > tbody > tr:last-child > td:nth-child(10)");
        console.log(lastTxRoomPos.innerText);
    }

    var patientChargeItemText = document.createElement("span"); // 欲插入的元素 (輸出結果)
    var patientChargeItemTextPos = document.querySelector("#CTForm > div.card-papper.ne-info > div.row > div.Radio-required > div:last-child"); // 定位出要插入元素的位置

    console.log("document.querySelector('input[name='CT.TreatmentRoom']:checked')", document.querySelector("input[name='CT.TreatmentRoom']:checked"));
    if (reSimValue.match(/是/) && lastTxRoomPos && document.querySelector("input[name='CT.TreatmentRoom']:checked") == null && brachyinfo == null) {
        if (lastTxRoomPos.innerText.match(/Synergy/)) {
            ctTxRoomL1.prop("checked", true);
        } else if (lastTxRoomPos.innerText.match(/L2/)) {
            ctTxRoomL2.prop("checked", true);
        } else if (lastTxRoomPos.innerText.match(/Tomo/)) {
            ctTxRoomTomo.prop("checked", true);
        }
        patientChargeItemText.setAttribute("class","form-inline valid-tooltip");
        patientChargeItemText.id = "patientChargeItemText";
        patientChargeItemText.innerHTML = "iROIS 小幫手偵測到此張為 Re-Sim 單：自動選擇上次治療的治療室";
        console.log("patientChargeItemTextPos", patientChargeItemTextPos);
        if (patientChargeItemTextPos != null) {
            patientChargeItemTextPos.parentNode.insertBefore(patientChargeItemText, patientChargeItemTextPos.nextSibling);
        };
        if (patientChargeItemTextPos == null) {
            document.querySelector("#patientChargeItemText").innerText = "iROIS 小幫手偵測到此張為 Re-Sim 單：自動選擇上次治療的治療室";
        };
    };
};

// 點選感控警示可以直接連到 OnePage 查詢病人的檢驗資料
var PId = document.querySelector("#CTForm > div.card-papper > div.row > div.col-md-9 > div.row > div:nth-child(2) > div > div.col-md-8").innerText; // 病歷號

var badgedangerNodeList = document.getElementsByClassName("badge badge-danger");
var badgedangerArray = Array.apply(null, badgedangerNodeList);
//console.log(badgedangerArray);

badgedangerArray.forEach(function(item, i) {
    var linkElement = document.createElement("a");
    linkElement.href = "http://10.125.10.11:8040/" + PId + "/culture";
    linkElement.target = '_blank';

    // 將原始元素的內容移動到連結中
    while (item.firstChild) {
        linkElement.appendChild(item.firstChild);
    }

    // 替換原始元素為新建的連結元素
    item.parentNode.replaceChild(linkElement, item);

    // 添加 "badge btn-danger" 類別和樣式
    linkElement.className = "badge btn-danger";
    linkElement.style.cursor = "pointer";
    linkElement.title ="iROIS 小幫手: 點選可以連到 OnePage 查詢病人的檢驗資料";
});


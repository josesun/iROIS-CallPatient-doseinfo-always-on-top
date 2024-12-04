// ==UserScript==
// @name         iROIS 小幫手: 報到/治療資訊小幫手
// @namespace    josesun@gmail.com
// @version      7.4
// @description  1. iROIS 報到/治療資訊，第一次執行新治療計畫時提醒
// @             2. 將網頁標題改成病人姓名以方便點選
// @             3. iROIS 報到/治療資訊中，自動選擇該病人的位移類型
// @                若是 TOMO 治療的病人位移類型自動選擇 MVCT
// @                若是 ABC 治療的病人位移類型自動選擇 CBCT 優待
// @                若是 CBCT 的病人位移類型自動選擇 CBCT
// @             4. 病人若有已排定的 CT 排程，提前提醒給病人預約單，CT 排程當天提示顯影劑資訊、Metformin 提醒及脹滿膀胱資訊
// @             5. 療程進度指示器，顯示整體療程進度，如全部結束則顯示完成治療療程連結
// @             6. 增加快速跳轉日期功能，以便修改位移紀錄
// @             7. ReSim 進度指示器，顯示醫師 Reduce 開單狀態、ReSim ReSim 排程及完成狀態
// @             8. 將跳出的 alert 訊息繼續顯示於頁面上
// @             9. 點選感控警示可以直接連到 OnePage 查詢病人的檢驗資料
// @author       Jose Sun
// @match        http://10.103.250.202/iROIS/CallPatient/Edit/*
// @match        http://196.254.100.230/iROIS/CallPatient/Edit/*
// @grant        none
// @downloadURL  https://www.dropbox.com/s/zwf4qrvon9mymgv/iROIS%20%E5%B0%8F%E5%B9%AB%E6%89%8B-%20%E5%A0%B1%E5%88%B0-%E6%B2%BB%E7%99%82%E8%B3%87%E8%A8%8A%E5%B0%8F%E5%B9%AB%E6%89%8B.user.js?dl=1
// @updateURL    https://www.dropbox.com/s/zwf4qrvon9mymgv/iROIS%20%E5%B0%8F%E5%B9%AB%E6%89%8B-%20%E5%A0%B1%E5%88%B0-%E6%B2%BB%E7%99%82%E8%B3%87%E8%A8%8A%E5%B0%8F%E5%B9%AB%E6%89%8B.user.js?dl=1
// ==/UserScript==
"use strict";

// 偵測是否為 iPad
const detectBrowser = {
  isIOs: () => /iPad|iPhone|iPod/.test(navigator.userAgent),
  isIpad: () => {
    if (/iPad/i.test(navigator.userAgent)) {
      return true;
    }
    if (/Macintosh/i.test(navigator.userAgent)) {
      try {
        document.createEvent('TouchEvent');
        return true;
      } catch (e) {}
    }
    return false;
  },
}

var url = location.href; // 目前網址
var name_all = document.querySelector("#CallPatientForm > div > div > div > div > div > div > div.col-md-8").innerText; // 姓名欄位的元素內容
var name = name_all.match(".+ "); // name_all 中含有姓名和年齡，故用 RegEx 從 name_all 中抓出姓名
var pageMessageBox = "";

// 初次執行新計畫時提醒
var element = document.querySelector("table[class='table table-hover res-table  last-table']"); // 治療中摘要表格的元素位置
var sitesNodeList = element.querySelectorAll("td:nth-child(1)"); // 從 element 抓出「治療部位」欄位的所有內容並存成 node list
var sitesArray = Array.apply(null, sitesNodeList); // 將「治療部位」所有內容的 node list 存成 array
var sites = []; // 該病人治療部位 array
// 從 sitesArray 中抓出單純的治療部位名稱並存到 site array
sitesArray.forEach(function(value, i, array) {
    sites.push(value.innerText.match(".+?(?=\\n)"));
});

var timesNodeList = element.querySelectorAll("td:nth-child(4)"); // 從 element 抓出「目前次數/計劃總次數」欄位的所有內容並存成 node list
var timesArray = Array.apply(null, timesNodeList); // 將「目前次數/計劃總次數」所有內容的 node list 存成 array
var nowFx = []; // 該病人目前次數 array
var endFx = []; // 該病人計畫總次數 array
// 從 timesArray 中依序讀取並存到 timesSplit，再用 RegEx 將目前次數及計畫總次數分開，並分別存成 nowFx / endFx array
var timesSplit //
timesArray.forEach(function(value, i, array) {
    timesSplit = array[i].innerText.split(" / ");
    nowFx.push(Number(timesSplit[0]));
    endFx.push(Number(timesSplit[1]));
});

var lastTxdatesNodelist = element.querySelectorAll("td:nth-child(7)"); // 從 element 抓出「最後治療日期」欄位的所有內容並存成 node list
var lastTxdatesArray = Array.apply(null, lastTxdatesNodelist); // 將「最後治療日期」所有內容的 node list 存成 array
var lastTxdates = []; // 該病人最後治療日期 array
// 從 lastTxdatesArray 中依序讀取並存到 lastTxdates
lastTxdatesArray.forEach(function(value, i, array) {
    lastTxdates.push(value.innerText);
});

// 反轉下面所有 array 排序，將最新的欄位排到最前面
sites.reverse();
nowFx.reverse();
endFx.reverse();
lastTxdates.reverse();
//nowFx = [0,0,14]; for debug

//alert("sites:" + sites + "\nnow:" + nowFx + "\nend:" + endFx + "\nlastTxdates:" + lastTxdates);
//alert(/bolus|Bolus|BOLUS/.test(sites[0]))

var today = new Date();
var currentDate = today.getFullYear() + "-" + padStart(today.getMonth()+1, 2, '0') + "-" + padStart(today.getDate(), 2, '0'); // 今天日期：將 today 轉換成 XXXX-XX-XX 的格式
var newSiteAlert = "";
for (var i = 0; i < 1; i++) {
    if (/bolus|Bolus|BOLUS/.test(sites[i]) == false) { // 若偵測到 site 名稱含有 bolus 則跳過
        if (nowFx[i] == 0 && endFx[i] != 0) { // 如果目前次數為 0 且 計畫總次數不為 0 則繼續比對 (表示有一個新 Plan 尚未開始)
            if (nowFx[i + 1] == endFx[i + 1] && endFx[i + 1] !=0 && currentDate != lastTxdates[i + 1]) { // 情況 1: 上個 plan 的目前次數等於計畫總次數 (表示該 plan 已完成), 且上個 plan 的總次數不為 0 (排除空 plan), 且今日日期不等於最後治療日期 (避免最後一次治療完成後還未到隔天就跳出提示)
                newSiteAlert = "iROIS 小幫手：\n今天是 " + name + "\n新 Plan：" + sites[i] + " 的第一次治療！";
                alert(newSiteAlert);
                pageMessageBox = newSiteAlert;
            }
            if (nowFx[i + 1] == 0 && nowFx[i + 2] == endFx[i + 2] && currentDate != lastTxdates[i + 2]) { // 情況 2: 上個 plan 的目前次數等於 0 (表示該 plan 未做) 且上上個 plan 的目前次數等於計畫總次數且今日日期不等於最後治療日期 (若該病人有換過 plan 時會有多個 plan，故多一個情況用來處理此問題)
                newSiteAlert = "iROIS 小幫手：\n今天是 " + name + "\n新 Plan：" + sites[i + 1] + " 的第一次治療！";
                alert(newSiteAlert);
                pageMessageBox = newSiteAlert;
            }
        }
    }
};

// padStart() method pads the current string with another string
function padStart(string, targetLength, padString = ' ') {
    return (Array(targetLength).join(padString) + string)
        .slice(-targetLength)
}

// 將網頁標題改成病人姓名
document.title = name;

// 自動選擇位移類型
var patientChargeItem = document.querySelector("#ChargeModify"); // 自費項目欄位的元素位置

// 處理第一次治療時無「位移記錄」button 時元素位置改變的情況
if (document.querySelector("#LoadOISData + button")) {
    var alertTextPos = document.querySelector("#LoadOISData + button");
} else {
    var alertTextPos = document.querySelector("#LoadOISData");
}

var alertText = document.createElement("span"); // 產生插入提示字串的元素

function selectShift (zEvent) {
    var newPositionShift = document.querySelector("#PositionShiftArea").lastChild; // 位移紀錄表格的元素位置
    var newPositionShiftType = newPositionShift.querySelectorAll("div")[16].querySelector("select"); // 「影像類型」的元素位置
    var newPositionShiftCharge = newPositionShift.querySelectorAll("div")[17].querySelector("div>input"); // 「優待」的元素位置
    // 下面是各種判斷條件
    if (patientChargeItem.innerText.search("TOMO") != -1) {
        alertText.innerHTML = " iROIS 小幫手偵測到病人為自費 TOMO 治療：自動選擇 MVCT"
        alertTextPos.parentNode.insertBefore(alertText, alertTextPos.nextSibling);
        newPositionShiftType.selectedIndex=2;
        //newPositionShiftCharge.checked = true;
    }
    if (patientChargeItem.innerText.search("CBCT") != -1) {
        alertText.innerHTML = " iROIS 小幫手偵測到病人為自費 CBCT：自動選擇 CBCT"
        alertTextPos.parentNode.insertBefore(alertText, alertTextPos.nextSibling);
        newPositionShiftType.selectedIndex=1;
        //newPositionShiftCharge.checked = true;
    }
    if (patientChargeItem.innerText.search("ABC") != -1) {
        alertText.innerHTML = " iROIS 小幫手偵測到病人為自費 ABC 治療：自動選擇 CBCT Free"
        alertTextPos.parentNode.insertBefore(alertText, alertTextPos.nextSibling);
        newPositionShiftType.selectedIndex=1;
        newPositionShiftCharge.checked = true;
    }
}

var addButton = document.querySelector("#AddPositionShiftEmpty"); // 「+」 button 的元素位置
// 當「+」 button 被 click 時觸發 selectShift() method
if (addButton) {
    addButton.addEventListener ("click", selectShift);
}


// 提前提醒病人已排定 CT 排程
var setReminderBeforeDates = "3"; // 設定(含今日)幾天前要提醒

if (document.querySelector("#CallPatientForm > div > div > div > div.col-md-12") && /近期CT排程時間/.test(document.querySelector("#CallPatientForm > div > div > div > div.col-md-12").innerText)) { // 判斷近期CT排程時間的元素內容是否存在
    var ctSimDate_all = document.querySelector("#CallPatientForm > div > div > div > div.col-md-12").innerText; // 找到則將近期CT排程時間存成 ctSimDate_all
    } else {
    var ctSimDate_all = "近期CT排程時間： 1970-01-01 00:00"; // 找不到則歸零
}
//console.log(ctSimDate_all);
var ctSimDate = ctSimDate_all.match("\ .*?\ ").toString().trim(); // 從 ctSimDate_all 中抓出日期
var ctSimTime = ctSimDate_all.match(".{2}:.{2}").toString().trim();// 從 ctSimDate_all 中抓出時間
var PId = document.querySelector("#CallPatientForm > div.card-papper > div.row > div.col-xl-7 > div.row > div:nth-child(8) > div > div.col-md-8").innerText; // 病歷號

function GetCtContrastNote(id) {
    var extCTContrastNote = ""; //先宣告欲回傳的變數預設值
    var ac_url = '/iROIS/CT/ProjectList';
    // 抓取此病人的 模具/CT定位 待辦清單
    $.ajax({
        type: "Get",
        url: ac_url,
        dataType: "html",
        cache: false,
        async: false,
        data: { TreatmentTypeId: "1", page: 1, Completed: 0, PId: id }
    }).done(function (result) {
        var extCTDoc = new DOMParser().parseFromString(result, "text/html");
        var extCTTable = extCTDoc.querySelector("table[class='table-borderless meeting-table table table-hover table-servicemeeting']");
        var extCTNodeList = extCTTable.querySelectorAll("td:nth-child(1) > a"); // 從 extCTTable 抓出所有「編輯」連結並存成 node list
        var extCTArray = Array.apply(null, extCTNodeList); // 將「編輯」連結所有內容的 node list 存成 array
        if (extCTArray.length != 0) { // 檢查該病人於 模具/CT定位待辦清單中有待編輯的模擬單才繼續抓取顯影劑資訊
            var extCTLink = extCTArray[0].getAttribute("href");
            var ac_url = extCTLink;

            // 抓取此病人的 模具/CT定位 編輯內容
            $.ajax({
                type: "Get",
                url: ac_url,
                dataType: "html",
                cache: false,
                async: false,
            }).done(function (result) {
                var extCTEditDoc = new DOMParser().parseFromString(result, "text/html");
                var extCTContrastAll = extCTEditDoc.querySelector("div#Fixation > div.col-md-8 > div.row > div.col-md-9").innerText.match(/[\S]/g).join('');
                var extCTMetforminAll = extCTEditDoc.querySelector("#CTForm > div.card-papper > div.row > div.col-md-10").innerText.trim();
                var extCTNoteAll = extCTEditDoc.querySelector("#Note").innerText.trim();

                if (/脹滿膀胱.*/g.test(extCTNoteAll) == true) {
                    var extCTNoteBladder = extCTNoteAll.match(/脹滿膀胱.*/g).toString().trim();
                    extCTNoteBladder = extCTNoteBladder.replace(/,/gi,"、");
                } else {
                    var extCTNoteBladder = '';
                }
                //console.log(extCTNoteBladder);

                console.log(extCTContrastAll);
                console.log(extCTMetforminAll);

                if (extCTMetforminAll.toLowerCase().includes("nil") || extCTMetforminAll.toLowerCase().includes("no") || extCTMetforminAll.toLowerCase().includes("否")) {
                    var extCTMetformin = "";
                } else {
                    var extCTMetformin = "\n☆★☆★☆★ 病人有服用 Metformin ☆★☆★☆★\n● 請提醒病人 CT 定位「檢查當天及之後 48 小時」需停藥！";
                };

                if (/否/.test(extCTContrastAll) == true) {
                    extCTContrastNote = extCTContrastNote.concat("○ 不需注射顯影劑\n");
                    if (extCTNoteBladder.length > 0) {
                        extCTContrastNote = extCTContrastNote.concat("※  " + extCTNoteBladder + "\n");
                    };
                } else if (/顯影途徑/.test(extCTContrastAll) == true) {
                    var extCTContrastAll = extCTContrastAll.replace("顯影途徑：","");
                    var extCTContrastArray = extCTContrastAll.split("藥物：");
                    //console.log(extCTContrastArray);
                    var extCTContrastWay = extCTContrastArray[0];
                    var extCTContrastMedicine = extCTContrastArray[1];
                    console.log(extCTContrastWay);
                    console.log(extCTContrastMedicine);
                    if (/.*\d+.*$/.test(extCTContrastMedicine)) { // 若醫師顯影途徑忘了點選注射時的例外情況
                        extCTContrastNote = extCTContrastNote.concat("● 注射顯影劑 " + extCTContrastMedicine + extCTMetformin + "\n");
                    } else if (/注射/.test(extCTContrastWay) == true) {
                        extCTContrastNote = extCTContrastNote.concat("● 注射顯影劑 " + extCTContrastMedicine + extCTMetformin + "\n");
                    };
                    if (/口服/.test(extCTContrastWay) == true) {
                        extCTContrastWay = extCTContrastWay.replace("、注射",""); // 刪除重複的「注射」字串
                        extCTContrastWay = extCTContrastWay.replace("口服","● 口服顯影劑 ");
                        extCTContrastNote = extCTContrastNote.concat(extCTContrastWay + "\n");
                    };
                    if (extCTNoteBladder.length > 0) {
                        extCTContrastNote = extCTContrastNote.concat("※  " + extCTNoteBladder + "\n");
                    };
                };
            })
        } else {
            // extCTContrastNote = "今天 CT 定位已完成。"; //此條件判斷不准，因為模具/CT定位待辦清單中找不到可能是還沒開單，故先註解掉
            extCTContrastNote = "查無模具/CT定位單資訊，可能為RAL排程或尚未開單。";
        }
    })
    return extCTContrastNote;
}

var betweenCtDates = workingDaysBetweenDates(currentDate, ctSimDate); // 今天日期與 CT 排程日期相差的天數
var contrastNoteAlert = "";

// CT 排程日期間隔如在 setReminderBeforeDates 內則提示:
if (betweenCtDates <= setReminderBeforeDates && betweenCtDates >= 2) {
    var CtContrastNote = GetCtContrastNote(PId).replace(/\n*$/,""); // 取得 GetCtContrastNote 傳回的值，刪除最後的 \n
    //console.log(CtContrastNote);
    contrastNoteAlert = "iROIS 小幫手：\n" + name + "\n" + (betweenCtDates - 1) + " 天後有安排 CT-Sim，請記得給病人「CT 定位預約單」。\n\n" + CtContrastNote + "\n\n如果已給單請忽略此訊息！";
    alert(contrastNoteAlert);
    pageMessageBox = contrastNoteAlert;

} else if (betweenCtDates == 1) { // CT 排程當天則提示:
    var CtContrastNote = GetCtContrastNote(PId).replace(/\n*$/,""); // 取得 GetCtContrastNote 傳回的值，刪除最後的 \n
    //console.log(CtContrastNote);
    if (/口服/.test(CtContrastNote)) {
        var CtContrastNoteReminder = "\n※ 請記得讓病人先喝顯影劑再進行 CT 定位！";
    } else {
        var CtContrastNoteReminder = "";
    }

    contrastNoteAlert = "iROIS 小幫手：\n" + name + "\n今天 " + ctSimTime + " 要做 CT-Sim，請提醒病人先不要離開。\n\n" + CtContrastNote + CtContrastNoteReminder;
    alert(contrastNoteAlert);
    pageMessageBox = contrastNoteAlert;
}

//console.log(ctSimDate);
//console.log(betweenCtDates);

// 比對兩個日期間的工作日間隔天數
function workingDaysBetweenDates(d0, d1) {
    var startDate = parseDate(d0);
    var endDate = parseDate(d1);
    //節日陣列，
    var holidays = [];
    // 結束日一定要大於開始日，否則回傳0
    if (endDate < startDate) {
        return 0;
    }

    var z = 0; // 遇到國定假日的日數
    for (i = 0; i < holidays.length; i++)
    {
        var cand = parseDate(holidays[i]);
        var candDay = cand.getDay();

        if (cand >= startDate && cand <= endDate && candDay != 0 && candDay != 6)
        {
            // 如果假日不是星期六日，就
            z++;
        }

    }
    // 計算兩個日期間的總日數
    var millisecondsPerDay = 86400 * 1000; // 一天的總milliseconds微秒數
    startDate.setHours(0,0,0,1); // 一天的起點
    endDate.setHours(23,59,59,999); // 終點
    var diff = endDate - startDate; // 兩天之間的總微秒數
    var days = Math.ceil(diff / millisecondsPerDay);

    // 算出周數weeks
    var weeks = Math.floor(days / 7);
    // 總日數 - (周數*2)=實際工作天(包含國定假日)
    days = days - (weeks * 2);

    var startDay = startDate.getDay();
    var endDay = endDate.getDay();

    // 減去周末
    if (startDay - endDay > 1) {
        days = days - 2;
    }
    // 如果開始日是星期天，結束日不是星期六
    if (startDay == 0 && endDay != 6) {
        days = days - 1
    }
    // 如果結束日星期六，開始日不是星期天
    if (endDay == 6 && startDay != 0) {
        days = days - 1
    }
    // 減掉國定假日
    return days - z;
}

function parseDate(input) { // 轉換日期格式
    var parts = input.match(/(\d+)/g);
    // new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
    return new Date(parts[0], parts[1]-1, parts[2]); // months are 0-based
}


// 提示療程是否結束
if (document.querySelector("#ReduceFX")) { // 處理醫師未輸入預計總劑量/次數的情況
    var reduceFx_all = document.querySelector("#ReduceFX").innerText; // 預計總劑量/次數的元素內容
    var totalDoseArray = reduceFx_all.match(/預計總劑量：\d+/g); // 預計總劑量
    var totalDose = totalDoseArray[0].replace("預計總劑量：",""); // Safari 不支援 Positive Lookbehind 故改成用 replace
    var totalFxArray = reduceFx_all.match(/預計總次數：\d+/g); // 預計總次數
    var totalFx = totalFxArray[0].replace("預計總次數：",""); // Safari 不支援 Positive Lookbehind 故改成用 replace
    var endFx_total = endFx.reduce((accumulator,currentValue) => accumulator + currentValue); // 計畫總計數全部加總 = 療程總次數 (用來與預計總次數比對)
    } else {
        var totalDose = 0;
        var totalFx = 0;
    }
//alert(totalDose);
//alert(totalFx);
var elementCourseTable = document.querySelectorAll("table[class='table table-hover res-table  last-table']")[0]; // 欲插入的元素位置
var reduceNoticeText = document.createElement("span"); // 產生插入結束治療字串的元素
reduceNoticeText.style.fontSize = "19px";
reduceNoticeText.title ="iROIS 小幫手: 療程進度提示，顯示整體療程進度，如全部結束則顯示完成治療療程連結";


// 一般治療中要顯示的提示
for (i = 0; i < 1; i++) {
    if (nowFx[i] < endFx[i] && totalFx == 0) {
        reduceNoticeText.style.color = "#1ABC9C";
        reduceNoticeText.innerHTML = " 此病人已無後續治療計畫。";
    } else if (nowFx[i] < endFx[i] && endFx_total == totalFx) {
        reduceNoticeText.style.color = "#1ABC9C";
        reduceNoticeText.innerHTML = " 此病人已無後續治療計畫。";
    } else if (nowFx[i] < endFx[i] && endFx_total < totalFx) {
        reduceNoticeText.style.color = "blue";
        reduceNoticeText.innerHTML = " 此病人後續還有 Reduce 計畫尚未治療。";
    }

    if (nowFx[i] == 0 && endFx[i] != 0) {
        endFx_total = endFx_total - endFx[i]; // 當新 Plan 提前出來時，因尚未治療故須把總次數先減掉新 Plan 的次數避免誤判
        if (nowFx[i+1] < endFx[i+1] && totalFx == 0) {
            reduceNoticeText.style.color = "#1ABC9C";
            reduceNoticeText.innerHTML = " 此病人已無後續治療計畫。";
        } else if (nowFx[i+1] < endFx[i+1] && endFx_total == totalFx) {
            reduceNoticeText.style.color = "#1ABC9C";
            reduceNoticeText.innerHTML = " 此病人已無後續治療計畫。";
        } else if (nowFx[i+1] < endFx[i+1] && endFx_total < totalFx) {
            reduceNoticeText.style.color = "blue";
            reduceNoticeText.innerHTML = " 此病人後續還有 Reduce 計畫尚未治療。";
        }
    }
}

var courseCompletedUrl = url.replace('CallPatient', 'CourseCompletedDiscontinue'); // 替換成取消/完成治療療程的網址

// 當該計畫最後一次治療時要顯示的提示
for (i = 0; i < 1; i++) {
    if (/bolus|Bolus|BOLUS/.test(sites[i]) == false) { // 若偵測到 site 名稱含有 bolus 則跳過
        if (nowFx[i] >= endFx[i] -1 && totalFx == 0) {
            reduceNoticeText.style.color = "green";
            reduceNoticeText.innerHTML = " 此病人療程已全部結束，請先關閉 MOSAIQ 療程後點選「<a href='" + courseCompletedUrl + "' target='_blank'>完成治療療程<a>」以結束治療。";
        } else if (nowFx[i] >= endFx[i] -1 && endFx_total == totalFx) {
            reduceNoticeText.style.color = "green";
            reduceNoticeText.innerHTML = " 此病人療程已全部結束，請先關閉 MOSAIQ 療程後點選「<a href='" + courseCompletedUrl + "' target='_blank'>完成治療療程<a>」以結束治療。";
        } else if (nowFx[i] >= endFx[i] -1 && endFx_total < totalFx) {
            reduceNoticeText.style.color = "red";
            reduceNoticeText.innerHTML = " 注意：此病人療程尚未結束！下次治療請選擇 Reduce 計畫繼續治療！";;
        }
    }
    if (nowFx[i] == 0 && endFx[i] != 0 && nowFx[i+1] != endFx[i+1]) {
        endFx_total = endFx_total - endFx[i]; // 當新 Plan 提前出來時，因尚未治療故須把總次數先減掉新 Plan 的次數避免誤判
        if (nowFx[i+1] >= endFx[i+1] -1 && totalFx == 0) {
            reduceNoticeText.style.color = "green";
            reduceNoticeText.innerHTML = " 此病人療程已全部結束，請先關閉 MOSAIQ 療程後點選「<a href='" + courseCompletedUrl + "' target='_blank'>完成治療療程<a>」以結束治療。";
        } else if (nowFx[i+1] >= endFx[i+1] -1 && endFx_total == totalFx) {
            reduceNoticeText.style.color = "red";
            reduceNoticeText.innerHTML = " 此病人療程已全部結束，請先關閉 MOSAIQ 療程後點選「<a href='" + courseCompletedUrl + "' target='_blank'>完成治療療程<a>」以結束治療。";
        } else if (nowFx[i+1] >= endFx[i+1] -1 && endFx_total < totalFx) {
            reduceNoticeText.style.color = "red";
            reduceNoticeText.innerHTML = " 注意：此病人療程尚未結束！下次治療請選擇 Reduce 計畫繼續治療！";
        }
    }
};

elementCourseTable.parentNode.insertBefore(reduceNoticeText, elementCourseTable.nextSibling); // 插入上述產生的提示文字到 elementCourseTable 位置


// 快速切換治療日期以便修改位移紀錄
var posShiftHstryReplaceUrl = url.substr (0 , url.indexOf('&ScheduleDate=') + 14); // 去掉日期的網址，以便接下來替換用
var posShiftHstryDateFromUrl = decodeURIComponent(url.slice (url.indexOf('&ScheduleDate=') + 14)); // 從網址取得目前修改的日期並解碼 URI
//console.log(posShiftHstryDateFromUrl);

if (document.querySelector("#PSGrid > div")) { // 檢查已有「位移紀錄」才執行下列代碼
    var posShiftHstryDiv = document.querySelector("#PSGrid > div"); // 欲插入的元素位置
    var posShiftHstryNoticeText = document.createElement("div"); // 產生插入結束治療字串的元素
    var posShiftAreaDiv = document.querySelector("#PositionShiftArea"); // 欲插入的元素位置
    var posShiftAreaNoticeText = document.createElement("div");
    var bodyDiv = document.getElementsByTagName('body')[0]; // 欲插入的元素位置
    var flatpickrScriptText = document.createElement("script");

    posShiftHstryNoticeText.innerHTML = "<div class='search-no'><label>目前修改日期：" + posShiftHstryDateFromUrl + "</label>　　　　<label>欲修改的位移日期：</label><input class='date-input date flatpickr-input' id='gotoDate' name='gotoDate' type='text' placeholder=''></div><div><button id='btn-search' type='button' class='btn-default'>跳轉</button></div>";
    posShiftHstryNoticeText.title ="iROIS 小幫手: 顯示目前修改的位移日期，選擇日期可快速跳轉，以便修改該日期之位移紀錄";
    posShiftHstryDiv.parentNode.insertBefore(posShiftHstryNoticeText, posShiftHstryDiv);
    posShiftAreaNoticeText.innerHTML = "<b>目前修改日期：" + posShiftHstryDateFromUrl + "</b>";
    posShiftAreaNoticeText.title = "iROIS 小幫手: 顯示目前修改的位移日期";
    posShiftAreaNoticeText.style = "text-align:left";
    posShiftAreaDiv.parentNode.insertBefore(posShiftAreaNoticeText, posShiftAreaDiv);
    flatpickrScriptText.innerHTML = "$('#gotoDate').flatpickr();$('#btn-search').click(function (){var gotodate = $('#gotoDate').val();document.location.href='" + posShiftHstryReplaceUrl +"'+ gotodate;});";
    bodyDiv.insertBefore(flatpickrScriptText, bodyDiv.lastChild);


    var posShiftHstryTable = document.querySelectorAll("#PositionShiftHstry > div > div > #PSGrid > div[class='fixed-table-container'] > div > table"); // 位移紀錄表格的元素位置
    //console.log(posShiftHstryTable);
    for (i = 0; i < posShiftHstryTable.length; i++) {
        var posShiftHstryScheduleDateTrNodelist = posShiftHstryTable[i].querySelectorAll("td:nth-child(1)"); // 位移日期欄位的元素位置
        for (var j = 0; j < posShiftHstryScheduleDateTrNodelist.length; j++) {
            var trDate = posShiftHstryScheduleDateTrNodelist[j].innerText;
            //console.log(trDate);
            posShiftHstryScheduleDateTrNodelist[j].innerHTML = '<a href="' + posShiftHstryReplaceUrl + trDate + '">' + trDate + '</a>';
            posShiftHstryScheduleDateTrNodelist[j].title = "iROIS 小幫手: 點選可快速跳轉至該日期，以便修改該日期之位移紀錄";
        }
    }
}


// ReSim 狀態指示器，提示病人 Reduce 單開單與否、ReSim 單排程與否、ReSim 執行完成與否
function getResimCTStatusDate(id) {
    var ctCompletedDate = ''; // 宣告輸出變數
    var ctCompletedDateMsg = '';
    // 先找模具/CT已完成列表
    var ac_url = "/iROIS/CT/ProjectList";
    $.ajax({
        type: "GET",
        url: ac_url,
        dataType: "html",
        cache: false,
        data: { page: 1, Completed: 1, PId: id , Date1:'' , Date2: currentDate },
        success: function (result) {
            var CompleteCTDoc = new DOMParser().parseFromString(result, "text/html");
            var CompleteCTTable = CompleteCTDoc.querySelector("table[class='table-borderless meeting-table table table-hover table-servicemeeting']");
            var tbody = CompleteCTTable.querySelector('tbody');
            // 找到所有行
            var rowsNodeList = tbody.querySelectorAll('tr');
            var rows = Array.apply(null, rowsNodeList);
            rows.reverse(); // 反轉所有行 使出現多組相符資料時可以顯示最後一筆

            // 迭代每一行
            rows.forEach(row => {
                var status = row.querySelector('td:nth-child(7)').innerText.trim();
                if (status === 'Reduce') {
                    ctCompletedDate = row.querySelector('td:nth-child(9)').innerText.trim();
                    ctCompletedDateMsg = 'ReSim 完成時間：' + ctCompletedDate;
                    $('#resimCTDateText').html(ctCompletedDateMsg);
                }
            });

            if (ctCompletedDateMsg == '') {

                // 找不到再找模具/CT待辦清單
                var ad_url = "/iROIS/CT/ProjectList";
                $.ajax({
                    type: "GET",
                    url: ad_url,
                    dataType: "html",
                    cache: false,
                    data: { TreatmentTypeId: "1", page: 1, Completed: 0, PId: id },
                    success: function (result) {
                        var noScheduleCTDoc = new DOMParser().parseFromString(result, "text/html");
                        var noScheduleCTTable = noScheduleCTDoc.querySelector("table[class='table-borderless meeting-table table table-hover table-servicemeeting']");
                        var resimDeltaDate = Number(resimTimes) - nowFx_total;
                        var tbody = noScheduleCTTable.querySelector('tbody');
                        // 找到所有行
                        var rowsNodeList = tbody.querySelectorAll('tr');
                        var rows = Array.apply(null, rowsNodeList);
                        rows.reverse(); // 反轉所有行 使出現多組相符資料時可以顯示最後一筆

                        // 迭代每一行
                        ctCompletedDateMsg = '';

                        rows.forEach(row => {
                            var status = row.querySelector('td:nth-child(9)').innerText.trim();
                            if (status === 'Reduce') {
                                var ctDateTime = row.querySelector('td:nth-child(3)').innerText.trim();
                                if (ctDateTime === 'No Schedule') {
                                    ctCompletedDateMsg = '<b><span style="color: red">已開單尚未排程，還剩 ' + resimDeltaDate + ' 次 ReSim</b>';
                                }
                            } else if (ctCompletedDateMsg == '') {
                                ctCompletedDateMsg = '已提醒 Reduce 但醫師尚未開單';
                            }
                        });

                        if (rows.length == 0) { // 如果找不到資料表示都未開單
                            ctCompletedDateMsg = '已提醒 Reduce 但醫師尚未開單';
                        }

                        //console.log(nowFx_total, resimTimes, resimDeltaDate , ctCompletedDateMsg);
                        $('#resimCTDateText').html(ctCompletedDateMsg);
                    }
                });

            }
        }
    });
    return ctCompletedDate;
};


if (document.querySelector("#ReduceFX")) {
    //console.log(reduceFx_all);
    //console.log('nowFx_total:', nowFx_total);
    var reduceTimesArray = reduceFx_all.match(/治療第 \d+ 次後，提醒Reduce/g);
    var reduceTimesMatchArray = reduceTimesArray[0].match(/\d+/g);
    var reduceNotifyTimes = reduceTimesMatchArray[0] // 第幾次時提醒 Reduce
    var resimTimesArray = reduceFx_all.match(/治療第 \d+ 次後Resim/g);
    if (resimTimesArray && resimTimesArray.length != null) { // 處理無 Resim 次數時的情況
        var resimTimesMatchArray = resimTimesArray[0].match(/\d+/g);
        var resimTimes = resimTimesMatchArray[0]; // 第幾次時要 Resim
        } else {
        var resimTimes = '0';
        }
    //console.log('reduceNotifyTimes:', reduceNotifyTimes, 'resimTimes:', resimTimes);

    var nowFx_total = nowFx.reduce((accumulator,currentValue) => accumulator + currentValue); // 目前治療次數全部加總 = 療程目前次數

    // 插入元素
    var resimCTDateText = document.createElement("div"); // 欲插入的元素 (輸出結果)
    var resimCTDateTextPos = document.querySelector("#CallPatientForm > div.row > div[class='col-md-7 text-left'] > br"); // 定位出要插入元素的位置
    resimCTDateText.id = 'resimCTDateText'; // 增加 id
    resimCTDateText.title ="iROIS 小幫手: ReSim 進度提示，顯示醫師 Reduce 開單狀態、ReSim 排程及完成狀態";
    //resimCTDateText.innerText = 'resimCTDateText';
    resimCTDateTextPos.parentNode.insertBefore(resimCTDateText, resimCTDateTextPos);

}

if (nowFx_total < reduceNotifyTimes) {
    resimCTDateText.innerText = '';
} else if (nowFx_total > reduceNotifyTimes && resimTimes != '0') {
    //console.log(CompletedCTDate);
    getResimCTStatusDate(PId);
} else if (nowFx_total > reduceNotifyTimes && resimTimes == '0') {
    resimCTDateText.innerText = 'Reduce 計畫不需 ReSim';
}

// 將跳出的 alert 訊息繼續顯示於頁面上
if (pageMessageBox != "") {
    pageMessageBox = pageMessageBox.replace("iROIS 小幫手：\n","");
    //console.log("yes");
    var pageMessageBoxDiv = document.createElement("div");
    pageMessageBoxDiv.id = "pageMessageBox";
    pageMessageBoxDiv.style.position = "fixed";
    pageMessageBoxDiv.style.fontSize = "16px";
    if (detectBrowser.isIOs() == false) {
        pageMessageBoxDiv.style.right = "1100px";
    } else {
	pageMessageBoxDiv.style.left = "640px";
    };
    pageMessageBoxDiv.style.top = "6px";
    pageMessageBoxDiv.style.backgroundColor = "#FFFFFF";
    pageMessageBoxDiv.style.border = "3px black solid";
    pageMessageBoxDiv.style.borderRadius = "10px";
    pageMessageBoxDiv.style.padding = "5px"
    //pageMessageBoxDiv.style.cursor = "move";
    pageMessageBoxDiv.style.zIndex = "100";
    pageMessageBoxDiv.innerText = pageMessageBox;

    var pageMessageBoxDivpos = document.getElementsByClassName("card-papper bg-pattern")[0];
    pageMessageBoxDivpos.parentNode.insertBefore(pageMessageBoxDiv, pageMessageBoxDivpos.nextSibling);
}


// 點選感控警示可以直接連到 OnePage 查詢病人的檢驗資料
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


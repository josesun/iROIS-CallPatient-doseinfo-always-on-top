// ==UserScript==
// @name         iROIS 小幫手: 病例討論小幫手
// @namespace    josesun@gmail.com
// @version      0.7
// @description  1. 於病歷討論頁面中顯示首次治療的位移紀錄
// @author       Jose Sun
// @match        http://10.103.250.202/iROIS/ChartRound/Edit/*
// @match        http://196.254.100.230/iROIS/ChartRound/Edit/*
// @grant        none
// @downloadURL  https://www.dropbox.com/s/fig1i68bjam54hw/iROIS%20%E5%B0%8F%E5%B9%AB%E6%89%8B-%20%E7%97%85%E4%BE%8B%E8%A8%8E%E8%AB%96%E5%B0%8F%E5%B9%AB%E6%89%8B.user.js?dl=1
// @updateURL	 https://www.dropbox.com/s/fig1i68bjam54hw/iROIS%20%E5%B0%8F%E5%B9%AB%E6%89%8B-%20%E7%97%85%E4%BE%8B%E8%A8%8E%E8%AB%96%E5%B0%8F%E5%B9%AB%E6%89%8B.user.js?dl=1
// ==/UserScript==
"use strict";
var today = new Date();
var currentDate = today.getFullYear() + "-" + padStart(today.getMonth()+1, 2, '0') + "-" + padStart(today.getDate(), 2, '0'); // 今天日期：將 today 轉換成 XXXX-XX-XX 的格式

var name_all = document.querySelector("#ChartRoundForm > div > div > div > div.col-md-4").innerText; // 姓名欄位的元素內容
var name = name_all.replace("姓名：",""); // 將 name_all 中標題刪除

var pid_all = document.querySelector("#ChartRoundForm > div > div > div > div:nth-child(2)").innerText; // 病歷號欄位的元素內容
var pid = pid_all.replace("病歷號：",""); // 將 pid_all 中標題刪除

var posShiftHistryText = document.createElement("div"); // 欲插入的元素 (輸出結果)
var posShiftHistryTextPos= document.querySelector("#ChartRoundForm > div.front-info > div.card-papper > div:nth-child(14)"); // 定位出要插入元素的位置

posShiftHistryText.innerHTML = '<div class="row form-group"><div class="col-md-2 col-xl-3"><strong>首次治療位移程度<p>(iROIS 小幫手)：</strong></div><div class="col-md-10 col-xl-9 over-flow-scroll mb30"><table class="table-borderless meeting-table table table-hover text-center"><thead class="thead-dark2"><tr><th style="min-width:120px"><div class="th-inner">治療部位</div><div class="fht-cell"></div></th><th style="min-width:120px" data-field="RTDate"><div class="th-inner">治療時間</div><div class="fht-cell"></div></th><th style="" data-field="PSTx"><div class="th-inner">Tx(mm)</div><div class="fht-cell"></div></th><th style="" data-field="PSTy"><div class="th-inner">Ty(mm)</div><div class="fht-cell"></div></th><th style="" data-field="PSTz"><div class="th-inner">Tz(mm)</div><div class="fht-cell"></div></th><th style="" data-field="PSRx"><div class="th-inner">Rx(deg)</div><div class="fht-cell"></div></th><th style="" data-field="PSRy"><div class="th-inner">Ry(deg)</div><div class="fht-cell"></div></th><th style="" data-field="PSRz"><div class="th-inner">Rz(deg)</div><div class="fht-cell"></div></th><th style="" data-field="ImageType"><div class="th-inner">影像類型</div><div class="fht-cell"></div></th><th style="" data-field="Preferential"><div class="th-inner">優待</div><div class="fht-cell"></div></th><th style="" data-field="PSNote"><div class="th-inner">備註</div><div class="fht-cell"></div></th><th style="" data-field="Remark"><div class="th-inner">重新標線</div><div class="fht-cell"></div></th><th style="" data-field="EditUserName"><div class="th-inner">放射師</div><div class="fht-cell"></div></th><th style="min-width:120px" data-field="SignOff"><div class="th-inner">簽核</div><div class="fht-cell"></div></th></tr><tbody id="posShiftHistry"></tbody></div>'; // 欲插入的文字

getPosShiftHistryUrl()

posShiftHistryTextPos.parentNode.insertBefore(posShiftHistryText, posShiftHistryTextPos);

function getPosShiftHistryUrl() {
    var posShiftHistryAllHtml = ''; // 宣告輸出變數
    var url = "/iROIS/PatientPersonal/ProjectList";
    $.ajax({
        type: "GET",
        url: url,
        cache: false,
        data: { Doctor: '', PatientId: pid, Date1: '', Date2: currentDate, FlowId: '' },
        success: function (result) {
            var patientPersonalDoc = new DOMParser().parseFromString(result, "text/html");
            var patientPersonalRTingNodelist = patientPersonalDoc.querySelectorAll("#RTing > div > div > div > div > div > div > #PStable > tbody > tr > td:nth-child(1) > a");
            var patientPersonalRTingPSTableArray = Array.apply(null, patientPersonalRTingNodelist); // Nodelist 轉 array
            var patientPersonalRTingPSTableLink = patientPersonalRTingPSTableArray.map(function (value, index, array) { // 所有治療中位移紀錄的連結 array
                return value.getAttribute("href");
            });
            //console.log(patientPersonalRTingPSTableLink);

            for (var i = 0; i < patientPersonalRTingPSTableLink.length; i++) {
                var patientPersonalRTingPSTableLink_now = patientPersonalRTingPSTableLink[i];
                $.ajax({
                    type: "GET",
                    url: patientPersonalRTingPSTableLink[i],
                    cache: false,
                    success: function (result) {
                        var posShiftHistryDoc = new DOMParser().parseFromString(result, "text/html");
                        var posShiftHistrySiteOIS_all = posShiftHistryDoc.querySelector("#wrapper > div > div > div > div > div > div > div.pt-info.card-papper.bg-pattern > div > div:nth-child(5)").innerText; // Site(OIS) 欄位的元素內容
                        var posShiftHistrySiteOIS = posShiftHistrySiteOIS_all.replace("Site(OIS)：","").trim();
                        posShiftHistrySiteOIS = '<a href="' + patientPersonalRTingPSTableLink_now + '" target="_blank">' + posShiftHistrySiteOIS + '</a>';
                        //console.log(posShiftHistrySiteOIS);
                        var posShiftHistryHtml = "<tr><td>" + posShiftHistrySiteOIS + "</td>" + posShiftHistryDoc.querySelector("#board > tbody > tr:nth-child(1)").innerHTML + "</tr>";
                        posShiftHistryAllHtml += posShiftHistryHtml; // 為了不要每次 loop 都覆蓋舊的資料，這裡用另一個變數把所有輸出合併

                        //console.log(posShiftHistryAllHtml);
                        $('#posShiftHistry').html(posShiftHistryAllHtml);
                    },
                    error: function (err) {
                    }
                });
            };

            if (patientPersonalRTingPSTableLink.length == 0) { // 找不到位移紀錄連結時的提示
                posShiftHistryAllHtml = "<tr><td colspan='8'>查無治療中療程之位移紀錄，下面試著列出最新一筆歷史療程的位移紀錄</td></tr>";

                var patientPersonalRTHstryNodelist = patientPersonalDoc.querySelectorAll("#RTHstry > div > div > div > div > #PStable > tbody > tr > td:nth-child(1) > a");
                var patientPersonalRTHstryPSTableArray = Array.apply(null, patientPersonalRTHstryNodelist); // Nodelist 轉 array
                var patientPersonalRTHstryPSTableLink = patientPersonalRTHstryPSTableArray.map(function (value, index, array) { // 所有治療中位移紀錄的連結 array
                    return value.getAttribute("href");
                });
                patientPersonalRTHstryPSTableLink.reverse() // reverse 歷史療程的位移紀錄連結 array，將最後一個變成第一筆
                //console.log(patientPersonalRTHstryPSTableLink);

                for (var j = 0; j < 1; j++) { // j < 1 是因為只要讀取最新一筆的歷史療程
                    var patientPersonalRTHstryPSTableLink_now = patientPersonalRTHstryPSTableLink[j];
                    $.ajax({
                        type: "GET",
                        url: patientPersonalRTHstryPSTableLink[j],
                        cache: false,
                        success: function (result) {
                            var posShiftHistryDoc = new DOMParser().parseFromString(result, "text/html");
                            var posShiftHistrySiteOIS_all = posShiftHistryDoc.querySelector("#wrapper > div > div > div > div > div > div > div.pt-info.card-papper.bg-pattern > div > div:nth-child(5)").innerText; // Site(OIS) 欄位的元素內容
                            var posShiftHistrySiteOIS = posShiftHistrySiteOIS_all.replace("Site(OIS)：","").trim();
                            posShiftHistrySiteOIS = '<a href="' + patientPersonalRTHstryPSTableLink_now + '" target="_blank">' + posShiftHistrySiteOIS + '</a>';
                            //console.log(posShiftHistrySiteOIS);
                            var posShiftHistryHtml = "<tr><td>" + posShiftHistrySiteOIS + "</td>" + posShiftHistryDoc.querySelector("#board > tbody > tr:nth-child(1)").innerHTML + "</tr>";
                            posShiftHistryAllHtml += posShiftHistryHtml; // 為了不要每次 loop 都覆蓋舊的資料，這裡用另一個變數把所有輸出合併

                            //console.log(posShiftHistryAllHtml);
                            $('#posShiftHistry').html(posShiftHistryAllHtml);
                        },
                        error: function (err) {
                        }
                    });
                };

                //$('#posShiftHistry').html(posShiftHistryAllHtml);
            }

        },
        error: function (err) {
        }
    });
    return posShiftHistryAllHtml;
};

// padStart() method pads the current string with another string
function padStart(string, targetLength, padString = ' ') {
    return (Array(targetLength).join(padString) + string)
        .slice(-targetLength)
}
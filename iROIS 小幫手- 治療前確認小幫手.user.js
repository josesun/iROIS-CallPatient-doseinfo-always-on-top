// ==UserScript==
// @name         iROIS 小幫手: 治療前確認小幫手
// @namespace    josesun@gmail.com
// @version      0.7
// @description  1. 於治療前確認頁面檢核處方總劑量、次數、劑量是否與 MOSAIQ 相符
// @author       Jose Sun
// @match        http://10.103.250.202/iROIS/RT/Edit/*
// @match        http://196.254.100.230/iROIS/RT/Edit/*
// @grant        none
// @downloadURL  https://www.dropbox.com/s/mp4ng7drvs9rii0/iROIS%20%E5%B0%8F%E5%B9%AB%E6%89%8B-%20%E6%B2%BB%E7%99%82%E5%89%8D%E7%A2%BA%E8%AA%8D%E5%B0%8F%E5%B9%AB%E6%89%8B.user.js?dl=1
// @updateURL    https://www.dropbox.com/s/mp4ng7drvs9rii0/iROIS%20%E5%B0%8F%E5%B9%AB%E6%89%8B-%20%E6%B2%BB%E7%99%82%E5%89%8D%E7%A2%BA%E8%AA%8D%E5%B0%8F%E5%B9%AB%E6%89%8B.user.js?dl=1
// ==/UserScript==
"use strict";

// 取得處方總劑量、分次、單次劑量
var rx_table = document.querySelector("#PrescriptionArea > div > div > table[class='table table-striped dis-table light-shadow mb-1 ml-1']");
//console.log(rx_table);
var rows = rx_table.getElementsByTagName("tr");
var rx_fractionDose = document.querySelector("#PrescriptionArea > div[class='col-md-10 col-xl-9'] > div > div > div[class='col-md-6 text-left']"); // 分次劑量改用左下角的每次劑量 (cGy)
//console.log(rx_fractionDose);

var rx_totalDoseArray = new Array();
var rx_fractionsArray = new Array();
var rx_doseArray = new Array();

for (var i = 1; i < rows.length; i++) {
    var cells = rows[i].getElementsByTagName("td");
    rx_totalDoseArray.push(Number(cells[2].innerHTML.trim()));
    rx_fractionsArray.push(Number(cells[3].innerHTML.trim()));
    rx_doseArray.push(Number(cells[4].innerHTML.trim()));
};

//console.log(`Total dose (cGy): ${rx_totalDoseArray}, Fractions: ${rx_fractionsArray}, Dose (cGy): ${rx_doseArray}`);

var maxDoseIndex = rx_doseArray.indexOf(Math.max(...rx_doseArray));
//console.log(maxDoseIndex);
var rx_totalDose = rx_totalDoseArray[maxDoseIndex];
var rx_fractions = rx_fractionsArray[maxDoseIndex];
var rx_dose = rx_doseArray[maxDoseIndex];
//var rx_dose = Number(rx_fractionDose.innerText.match(/\d+$/)); // 分次劑量改用左下角的每次劑量 (cGy)

console.log("Rx tdose:", rx_totalDose, "Rx fx:", rx_fractions, "Rx dose:", rx_dose);


// 取得 MOSAIQ 實際總劑量、分次、單次劑量
if (document.querySelector("#RTForm > div.col-md-12 > div > div.panel-body > div > div > table[class='table table-hover res-table  last-table']")) {
    var ois_table = document.querySelector("#RTForm > div.col-md-12 > div > div.panel-body > div > div > table[class='table table-hover res-table  last-table']");
    var ois_rows = ois_table.getElementsByTagName("tr");

    var ois_totalDoseArray = new Array();
    var ois_fractionsArray = new Array();
    var ois_doseArray = new Array();

    for (var j = 1; j < ois_rows.length; j++) {
        var ois_cells = ois_rows[j].getElementsByTagName("td");
        ois_totalDoseArray.push(Number(ois_cells[4].textContent.trim().split('/')[1]));
        ois_fractionsArray.push(Number(ois_cells[3].textContent.trim().split('/')[1]));
        ois_doseArray.push(Number(ois_cells[2].textContent.trim()));
    };

    ois_totalDoseArray.reverse();
    ois_fractionsArray.reverse();
    ois_doseArray.reverse();

    console.log("ois_totalDoseArray:", ois_totalDoseArray, "ois_fractionsArray:", ois_fractionsArray, "ois_doseArray:", ois_doseArray);


    var ois_totalDose = ois_totalDoseArray[0];
    var ois_fractions = ois_fractionsArray[0];
    var ois_dose = ois_doseArray[0];

    //console.log(ois_table);
    //const ois_totalDose = Number(ois_table.querySelector('tr:last-child td:nth-child(5)').textContent.trim().split('/')[1].trim());
    //const ois_fractions = Number(ois_table.querySelector('tr:last-child td:nth-child(4)').textContent.trim().split('/')[1].trim());
    //const ois_dose = Number(ois_table.querySelector('tr:last-child td:nth-child(3)').textContent.trim());
    console.log("OIS tdose:", ois_totalDose, "OIS fx:", ois_fractions, "OIS dose:", ois_dose);

    // Array 加總
    function SumData(arr){
        var sum=0;
        for (var i = 0; i < arr.length; i++) {
            sum += arr[i];
        };
        return sum;
    }

    // 執行治療前檢核並提示
    var msg_alert = '';

    var ois_totalDose_match = 0;
    var ois_fractions_match = 0;
    var ois_dose_match = 0;


    if (rx_totalDose == SumData(ois_totalDoseArray) && rx_fractions == SumData(ois_fractionsArray)) { // 將所有 OIS 的 Plan 加總，然後與 Rx 比對，若相符表示此為 Replan 計畫則不予處理
    } else {
        for (var k = 0; k < ois_totalDoseArray.length; k++) { // 有時候物理師會同時丟出多個階段的治療計畫，先檢查每個階段的 MOSAIQ 參數是否正確，若正確則 match = 1
            if (rx_totalDose == ois_totalDoseArray[k]) {
                ois_totalDose_match = 1;
            };
            if (rx_fractions == ois_fractionsArray[k]) {
                ois_fractions_match = 1;
            };
            if (rx_dose == ois_doseArray[k]) {
                ois_dose_match = 1;
            };
        };

        if (ois_totalDose_match == 1 && ois_totalDose_match == 1 && ois_dose_match == 1) { //有時候物理師會同時丟出多個階段的治療計畫，為免誤判，只要某個階段的 MOSAIQ 參數比對正確，則視為劑量相符
        } else {
            if (rx_totalDose !== ois_totalDose) {
                msg_alert = msg_alert + "● 處方總劑量與 MOSAIQ 總劑量不符！\n";
            };
            if (rx_fractions !== ois_fractions) {
                msg_alert = msg_alert + "● 處方次數與 MOSAIQ 次數不符！\n";
            };
            if (rx_dose !== ois_dose) {
                msg_alert = msg_alert + "● 處方分次劑量與 MOSAIQ 分次劑量不符！\n";
            };
        };
    };

    console.log("ois_totalDose_match:", ois_totalDose_match, "ois_fractions_match:", ois_fractions_match, "ois_dose_match:", ois_dose_match);

    if (msg_alert !== '') {
        var msg_title = 'iROIS 小幫手偵測到此治療計畫參數異常：';
        var msg_footnote = '可能是 MOSAIQ 同時有多個階段的治療計畫，若否則請與物理師聯絡。';

        alert(msg_title + '\n\n' + msg_alert.trimEnd('\n') + '\n\n' + msg_footnote);
    }
}
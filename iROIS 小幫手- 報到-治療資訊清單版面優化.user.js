// ==UserScript==
// @name iROIS 小幫手: 報到/治療資訊清單版面優化
// @namespace josesun@gmail.com
// @version 0.6
// @description 1. 每 1 分鐘重新載入 iROIS 報到/治療資訊，若偵測為 iPad 則不啟用此功能
// @            2. 報到/治療資訊清單以報到時間排序
// @            3. 若病人需要脹滿膀胱時變色提示
// @            4. 若病人遲到時變色提示
// @            5. 移除治療備註中的 Resim 提示
// @author Jose Sun
// @match http://10.103.250.202/iROIS/CallPatient
// @match http://196.254.100.230/iROIS/CallPatient
// @grant none
// @downloadURL  https://www.dropbox.com/s/dr47edq6em061gf/iROIS%20%E5%B0%8F%E5%B9%AB%E6%89%8B-%20%E5%A0%B1%E5%88%B0-%E6%B2%BB%E7%99%82%E8%B3%87%E8%A8%8A%E6%B8%85%E5%96%AE%E7%89%88%E9%9D%A2%E5%84%AA%E5%8C%96.user.js?dl=1
// @updateURL  https://www.dropbox.com/s/dr47edq6em061gf/iROIS%20%E5%B0%8F%E5%B9%AB%E6%89%8B-%20%E5%A0%B1%E5%88%B0-%E6%B2%BB%E7%99%82%E8%B3%87%E8%A8%8A%E6%B8%85%E5%96%AE%E7%89%88%E9%9D%A2%E5%84%AA%E5%8C%96.user.js?dl=1
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

var timer = 60000 // 設定重新載入的間隔時間 (ms)

var QueryButton = document.querySelector("#CPQuery");
var AlertText = document.createElement("div");
if (detectBrowser.isIOs() == false) {
    AlertText.title = "iROIS 小幫手: 定期自動更新報到/治療資訊";
    AlertText.style = "font-size: 95%";
    AlertText.innerHTML = "每" + timer / 60000 + "分鐘自動更新"
    QueryButton.parentNode.insertBefore(AlertText, QueryButton);
    QueryButton.click();

    setInterval(function() {
        QueryButton.click();
    }, timer);
}

// 將清單中需要脹滿膀胱的病人及遲到的病人變底色提醒
var fullBladderText = /脹滿膀胱/;
var setDelayTime = 15; // 設定遲到幾分後變色提醒


//當 ajax 資料變更後觸發 function
$(document).ajaxSuccess(function(event, xhr, settings) {
    // 報到/治療資訊清單以報到時間排序
    var tbody = $('#ExternalList table tbody');
    var rows = tbody.children('tr').get();

    rows.sort(function(a, b) {
        var timeA = $(a).find('td:nth-child(7)').text(); // 排程時間列的 index = 7
        var timeB = $(b).find('td:nth-child(7)').text();

        var checkInTimeA = $(a).find('td:nth-child(8)').text(); // 報到時間列的 index = 8
        var checkInTimeB = $(b).find('td:nth-child(8)').text();

        // 先按排程時間排序
        var result = timeA.localeCompare(timeB);

        if (result === 0) {
            // 如果排程時間相同，則按照報到時間排序
            result = checkInTimeA.localeCompare(checkInTimeB);
        }
        return result;
    });

    // 將排序後的行重新添加到表格中
    $.each(rows, function(index, row) {
        tbody.append(row);
    });

    var extListTable = document.querySelector("#ExternalList > div > div > div >table[class='table-borderless meeting-table table table-hover table-ring']");
    if (extListTable) {
        var extListTr = extListTable.querySelectorAll("tr");

        extListTr.forEach(function(Tr, index){
            if (index < 1) return; // 略過表格的第一行

            // 需脹滿膀胱的病人變色提示
            var extListRTNote = Tr.querySelector("td:nth-child(11)").innerText;
            //console.log(extListTd);
            if (fullBladderText.test(extListRTNote) == true) {
                Tr.className = "table-info";
            }

            // 移除治療備註中的 Resim 提示
            if (extListRTNote.match(/治療第 \d+ 次後Resim/)) {
                console.log(extListRTNote);
                extListRTNote = extListRTNote.replace(/治療第 \d+ 次後Resim/,"");
                console.log(extListRTNote);
                Tr.querySelector("td:nth-child(11)").innerText = extListRTNote;
            }

            // 將遲到的病人變色提示
            var extListTime = Tr.querySelector("td:nth-child(7)").innerText;
            var extListCheckInTime = Tr.querySelector("td:nth-child(8)").innerText;
            var timeDiff = calculateTimeDifference(extListTime, extListCheckInTime, "HH:mm");
            //console.log(timeDiff);
            if (timeDiff > setDelayTime * 60) { // 將分鐘轉換為秒
                Tr.className = "table-pink";
            }
        });

    var extListTitle = document.querySelector("#ExternalList > div > div > div > p.note-title");
    extListTitle.title = "iROIS 小幫手: 將清單依報到時間排序、需脹滿膀胱及遲到的病人變色提示、移除備註中的 Resim 提示";
    extListTitle.innerHTML = '體外放射治療：(依報到時間排序)　<i class="mdi mdi-checkbox-blank-circle" style="color: #f2a216;"></i> unknown　<i class="mdi mdi-checkbox-blank-circle text-info"></i> ' + fullBladderText.toString().slice(1,-1) + '　<i class="mdi mdi-checkbox-blank-circle text-pink"></i> 遲到';
    }
});


// 計算兩個時間之間的差值（以秒為單位）
function calculateTimeDifference(time1, time2, format) {
    var time1Obj = parseTime(time1, format);
    var time2Obj = parseTime(time2, format);

    //var diff = Math.abs(time2Obj - time1Obj);
    var diff = time2Obj - time1Obj;
    return diff / 1000; // 轉換為秒數
}

// 解析時間字串為 Date 物件
function parseTime(time, format) {
    var [hours, minutes] = time.split(":");
    var formattedTime = format.replace("HH", hours).replace("mm", minutes);
    return new Date("1970/01/01 " + formattedTime); // 日期設定為 1970/01/01（任意日期即可）
}
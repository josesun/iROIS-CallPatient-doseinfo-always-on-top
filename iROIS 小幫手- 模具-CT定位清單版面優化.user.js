// ==UserScript==
// @name iROIS 小幫手: 模具/CT定位清單版面優化
// @namespace josesun@gmail.com
// @version 0.4
// @description 1. 當今日有 CT 定位單位尚未送出時顯示提醒
// @author Jose Sun
// @match http://10.103.250.202/iROIS/CT*
// @match http://196.254.100.230/iROIS/CT*
// @grant none
// @downloadURL https://www.dropbox.com/scl/fi/qvcgmoq8eb14fkp7hoqil/iROIS-CT-.user.js?rlkey=ojq6n0kt06p6zklm83zr0muck&dl=1
// @updateURL https://www.dropbox.com/scl/fi/qvcgmoq8eb14fkp7hoqil/iROIS-CT-.user.js?rlkey=ojq6n0kt06p6zklm83zr0muck&dl=1
// ==/UserScript==
"use strict";
var today = new Date();
var currentDate = today.getFullYear() + "-" + padStart(today.getMonth() + 1, 2, '0') + "-" + padStart(today.getDate(), 2, '0'); // 今天日期：將 today 轉換成 XXXX-XX-XX 的格式
var posTodayTaskIndicatorText = document.createElement("span"); // 欲插入的元素 (輸出結果)
var posTodayTaskIndicatorTextPos = document.querySelector("div.title-card-pos"); // 定位出要插入元素的位置

function getTaskList() {
    var TaskListDateArray = [];
    var TaskListPidArray = [];
    var CompletedListPidArray = [];
    var taskListHtml = ''; // 宣告輸出變數
    var url = "/iROIS/CT/ProjectList";

    function fetchTaskList(url, page) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: "GET",
                url: url,
                cache: false,
                data: {TreatmentTypeId: '1', page: page, Completed: 0, PId: '', IsReduce: ''},
                success: function (result) {
                    var TaskListDoc = new DOMParser().parseFromString(result, "text/html");
                    var TaskListTable = TaskListDoc.querySelector("table[class='table-borderless meeting-table table table-hover table-servicemeeting']");
                    var TaskList_rows = TaskListTable.getElementsByTagName("tr");

                    for (var j = 1; j < TaskList_rows.length; j++) {
                        var TaskList_cells = TaskList_rows[j].getElementsByTagName("td");
                        TaskListDateArray.push(TaskList_cells[2].textContent.trim());
                        TaskListPidArray.push(TaskList_cells[4].textContent.trim());
                    }

                    resolve();
                },
                error: function (err) {
                    reject(err);
                }
            });
        });
    }

    $.ajax({
        type: "GET",
        url: url,
        cache: false,
        data: {TreatmentTypeId: '1', page: '', Completed: 0, PId: '', IsReduce: ''},
        success: function (result) {
            var TaskListDoc = new DOMParser().parseFromString(result, "text/html");

            var allpageElement = TaskListDoc.querySelector("ul[class='pagination']"); //取得總頁數
            if (TaskListDoc.querySelector("li:nth-last-child(2) > a").textContent == '‹') {
                var all_page = Number(0);
            } else if (TaskListDoc.querySelector("li:nth-last-child(2) > a").textContent == '...') {
                var all_page = Number(TaskListDoc.querySelector("li:nth-last-child(3) > a").textContent);
            } else {
                var all_page = Number(TaskListDoc.querySelector("li:nth-last-child(2) > a").textContent);
            }

            var requests = []; // 存储所有非同步请求的数组

            var TaskListTable = TaskListDoc.querySelector("table[class='table-borderless meeting-table table table-hover table-servicemeeting']");
            var TaskList_rows = TaskListTable.getElementsByTagName("tr");

            for (var j = 1; j < TaskList_rows.length; j++) {
                var TaskList_cells = TaskList_rows[j].getElementsByTagName("td");
                TaskListDateArray.push(TaskList_cells[2].textContent.trim());
                TaskListPidArray.push(TaskList_cells[4].textContent.trim());
            }

            // 如果有第2頁以上才繼續抓取
            if (all_page >= 2) {
                for (var i = 2; i <= all_page; i++) {
                    requests.push(fetchTaskList(url, i));
                }
            }

            // 等待所有非同步请求完成
            Promise.all(requests)
                .then(function () {
                //console.log(TaskListDateArray, TaskListPidArray);

                var TodayTaskListDateArray = TaskListDateArray.filter(function (date) {
                    return date.includes(currentDate);
                });

                var TodayTaskListPidArray = TaskListPidArray.filter(function (_, index) {
                    return TaskListDateArray[index].includes(currentDate);
                });

                var TodayTaskList = TodayTaskListPidArray.length;
                //TodayTaskList = 0;

                if (TodayTaskList > 0) {
                    posTodayTaskIndicatorText.textContent = '今天還有 ' + TodayTaskList + ' 張定位單尚未送出！'; // 欲插入的文字
                    posTodayTaskIndicatorText.style.position = "relative";
                    posTodayTaskIndicatorText.style.left = "30px";
                    posTodayTaskIndicatorText.style.fontSize = "34px";
                    posTodayTaskIndicatorText.style.color = "red";
                    posTodayTaskIndicatorTextPos.parentNode.insertBefore(posTodayTaskIndicatorText, posTodayTaskIndicatorTextPos.nextSibling);
                } else {
                    posTodayTaskIndicatorText.textContent = '目前沒有未完成的定位單'; // 無
                    posTodayTaskIndicatorText.style.position = "relative";
                    posTodayTaskIndicatorText.style.left = "30px";
                    posTodayTaskIndicatorText.style.fontSize = "34px";
                    posTodayTaskIndicatorText.style.color = "green";
                    posTodayTaskIndicatorTextPos.parentNode.insertBefore(posTodayTaskIndicatorText, posTodayTaskIndicatorTextPos.nextSibling);

                };
            })
                .catch(function (error) {
                console.error(error);
            });
        },
        error: function (err) {
            console.error(err);
        }
    });
    return taskListHtml;
}

//當頁面載入時先執行一次程式
getTaskList();

//之後每當按下CT排程的按鈕時都執行一次程式
$('#tab_CTSchedule_Query, #tab_TaskList_Query, #tab_CompletedList_Query').on('click', function () {
    getTaskList();
});

$('a[data-toggle="tab"]').on('click', function () {
    getTaskList();
});

// padStart() method pads the current string with another string
function padStart(string, targetLength, padString = ' ') {
    return (Array(targetLength).join(padString) + string)
        .slice(-targetLength);
}
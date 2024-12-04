// ==UserScript==
// @name         iROIS 小幫手: 報到/治療資訊版面優化 (診間版)
// @namespace    josesun@gmail.com
// @version      1.1
// @description  將 iROIS 報到/治療資訊中病人之計畫參數/治療記錄置頂顯示，避免需要一直上下捲動
// @author       Jose Sun
// @match        http://10.103.250.202/iROIS/CallPatient/Edit/*
// @match        http://196.254.100.230/iROIS/CallPatient/Edit/*
// @grant        none
// @downloadURL  https://www.dropbox.com/s/slqmlzjp44zpon5/iROIS%20%E5%B0%8F%E5%B9%AB%E6%89%8B-%20%E5%A0%B1%E5%88%B0-%E6%B2%BB%E7%99%82%E8%B3%87%E8%A8%8A%E7%89%88%E9%9D%A2%E5%84%AA%E5%8C%96%20%28%E8%A8%BA%E9%96%93%E7%89%88%29.user.js?dl=1
// @updateURL    https://www.dropbox.com/s/slqmlzjp44zpon5/iROIS%20%E5%B0%8F%E5%B9%AB%E6%89%8B-%20%E5%A0%B1%E5%88%B0-%E6%B2%BB%E7%99%82%E8%B3%87%E8%A8%8A%E7%89%88%E9%9D%A2%E5%84%AA%E5%8C%96%20%28%E8%A8%BA%E9%96%93%E7%89%88%29.user.js?dl=1
// ==/UserScript==
"use strict";
var thisElement;
//Course Info on left top corner in screen
var elementCourseInfo = document.getElementsByClassName("over-flow-scroll")[3];

if (elementCourseInfo.innerText.indexOf("治療部位") >= 0 ) { // Check if it's coruse info table
    var newCourseDiv = document.createElement("div");
    newCourseDiv.setAttribute("class","green bg-white");
    newCourseDiv.innerHTML = elementCourseInfo.innerHTML;
    dragElement(newCourseDiv)

    var newCourseDivpos = document.getElementsByClassName("card-papper bg-pattern")[0];
    newCourseDivpos.parentNode.insertBefore(newCourseDiv, newCourseDivpos.nextSibling);

    newCourseDiv.style.position = "fixed";
    newCourseDiv.style.right = "60px";
    newCourseDiv.style.top = "6px";
    newCourseDiv.style.backgroundColor = "#FFFFFFCC";
    newCourseDiv.style.fontSize = "16px";
    newCourseDiv.style.border = "3px red solid";
    newCourseDiv.style.cursor = "move";
    newCourseDiv.style.zIndex = "100";

    var newCourseDivTable = newCourseDiv.getElementsByClassName("table table-hover res-table  last-table")[0];
    newCourseDivTable.setAttribute("class","table-hover res-table last-table");

    var newCourseDivTableTh = newCourseDivTable.getElementsByTagName('th');
    for (var j = 0; j < newCourseDivTableTh.length; j++) {
        thisElement = newCourseDivTableTh[j];
        thisElement.style.paddingRight = "0.85rem";
    }
}


//ReduceFx string on page top
if (document.getElementById("ReduceFX")) {
    var elementReduceFx = document.getElementById("ReduceFX");
    elementReduceFx.style.position = "absolute";
    elementReduceFx.style.left = "330px";
    elementReduceFx.style.top = "-53px";
    elementReduceFx.style.width = "800px";
}


function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "header")) {
        // if present, the header is where you move the DIV from:
        document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    } else {
        // otherwise, move the DIV from anywhere inside the DIV:
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        elmnt.style.bottom = '';
        elmnt.style.right = '';
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}
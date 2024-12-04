// ==UserScript==
// @name iROIS 小幫手: 縮小左方側邊欄 (窄螢幕用)
// @namespace josesun@gmail.com
// @version 0.1
// @description 非寬螢幕可以使用此 userjs 縮小 iROIS 左方側邊欄以加大顯示面積
// @author Jose Sun
// @match http://10.103.250.202/iROIS/*
// @match http://196.254.100.230/iROIS/*
// @grant none
// @downloadURL  https://www.dropbox.com/s/oo1dunnxzopqdzm/iROIS%20%E5%B0%8F%E5%B9%AB%E6%89%8B-%20%E7%B8%AE%E5%B0%8F%E5%B7%A6%E6%96%B9%E5%81%B4%E9%82%8A%E6%AC%84%20%28%E7%AA%84%E8%9E%A2%E5%B9%95%E7%94%A8%29.user.js?dl=1
// @updateURL  https://www.dropbox.com/s/oo1dunnxzopqdzm/iROIS%20%E5%B0%8F%E5%B9%AB%E6%89%8B-%20%E7%B8%AE%E5%B0%8F%E5%B7%A6%E6%96%B9%E5%81%B4%E9%82%8A%E6%AC%84%20%28%E7%AA%84%E8%9E%A2%E5%B9%95%E7%94%A8%29.user.js?dl=1
// ==/UserScript==
"use strict";
var SidebarButton = document.querySelector(".button-menu-mobile");

SidebarButton.click();
// ==UserScript==
// @name         Интеграция WhatsApp APP+Звонки в CRM
// @namespace    http://tampermonkey.net/
// @version      0.7
// @description  Добавляет ссылки WhatsApp рядом с номерами телефонов в CRM, открывая десктопное приложение или веб-версию
// @author       madKULOLO
// @match        http://crm.local/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function normalizePhoneNumber(phone) {
        let cleaned = phone.replace(/[^0-9]/g, '');
        if (cleaned.length === 11 && (cleaned.startsWith('8') || cleaned.startsWith('7'))) {
            cleaned = '7' + cleaned.slice(1);
        } else if (cleaned.length === 10) {
            cleaned = '7' + cleaned;
        }
        return cleaned;
    }

    // Функция для создания ссылки WhatsApp (десктоп или веб-версия)
    function createWhatsAppLink(phone) {
        const normalized = normalizePhoneNumber(phone);
        // Раскомментируй следующую строку для использования веб-версии WhatsApp
        // return `https://web.whatsapp.com/send?phone=${normalized}`;
        // Текущая настройка: открытие десктопного приложения WhatsApp
        return `whatsapp://send?phone=${normalized}`;
        // Альтернативная веб-версия через API (если нужно)
        // return `https://api.whatsapp.com/send?phone=${normalized}`;
    }

    function createWhatsAppIcon(phone, recordId) {
        const link = createWhatsAppLink(phone);
        const icon = document.createElement('a');
        icon.href = link;
        icon.style.marginLeft = '5px';
        icon.style.textDecoration = 'none';
        icon.style.display = 'inline-block';
        icon.innerHTML = '<img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" width="16" height="16" style="filter: grayscale(100%);">';
        icon.dataset.processed = 'true';

        icon.addEventListener('click', function(event) {
            event.preventDefault();
            // Раскомментируй следующий блок и закомментируй "window.location" для веб-версии
            /*
            window.open(link, '_blank');
            */
            // Текущая настройка: открытие десктопного приложения
            window.location = link;
        });

        return icon;
    }

    function processExistingPhoneNumbers() {
        const phoneLinks = document.querySelectorAll('a.phoneField:not([data-wa-processed])');
        phoneLinks.forEach(link => {
            if (!link.nextElementSibling || !link.nextElementSibling.classList.contains('whatsapp-icon')) {
                const phone = link.getAttribute('data-value');
                const recordId = link.getAttribute('record');

                const waIcon = createWhatsAppIcon(phone, recordId);
                waIcon.classList.add('whatsapp-icon');
                link.parentNode.insertBefore(waIcon, link.nextSibling);

                link.dataset.waProcessed = 'true';
            }
        });
    }

    function findPhoneNumbersInText() {
        const mobileRegex = /(?<!\d)(?:\+7|7|8)[\s-]*\(?(9\d{2})\)?[\s-]*(?:\d{2,3})[\s-]*(?:\d{2})[\s-]*(?:\d{2,3})(?!\d|[^@]*@)/g;
        const landlineRegex = /(?<!\d)(?:\+7|8)[\s-]*\(?([0-8]\d{2,4})\)?[\s-]*(\d{1,3})[\s-]*(\d{1,3})[\s-]*(\d{1,3})(?!\d|[^@]*@)/g;

        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    const parent = node.parentNode;
                    if (parent.tagName === 'SCRIPT' ||
                        parent.tagName === 'STYLE' ||
                        parent.classList.contains('phoneField') ||
                        parent.classList.contains('whatsapp-icon') ||
                        parent.tagName === 'INPUT' ||
                        parent.tagName === 'TEXTAREA') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const nodesToProcess = [];
        let node;
        while (node = walker.nextNode()) {
            if ((mobileRegex.test(node.textContent) || landlineRegex.test(node.textContent)) && !node.parentNode.querySelector('.whatsapp-icon')) {
                nodesToProcess.push(node);
            }
        }

        nodesToProcess.forEach(node => {
            const parent = node.parentNode;
            let html = node.textContent;

            html = html.replace(mobileRegex, (match) => {
                const cleanedPhone = normalizePhoneNumber(match);
                const formattedPhone = match.replace(/(\+7|7|8)[\s-]*\(?(9\d{2})\)?[\s-]*(\d{2,3})[\s-]*(\d{2})[\s-]*(\d{2,3})/, '$1-$2-$3-$4-$5');

                // Раскомментируй следующий блок и закомментируй текущий для веб-версии (открытие в новой вкладке)
                /*
                return `<a class="phoneField" data-value="${cleanedPhone}" record="0" ` +
                       `onclick="Vtiger_PBXManager_Js.registerPBXOutboundCall('${cleanedPhone}',0)" data-wa-processed="true">${formattedPhone}</a>` +
                       `<a href="${createWhatsAppLink(cleanedPhone)}" class="whatsapp-icon" target="_blank" style="margin-left:5px;display:inline-block;">` +
                       `<img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" width="16" height="16" style="filter: grayscale(100%);"></a>`;
                */
                // Текущая настройка: открытие десктопного приложения
                return `<a class="phoneField" data-value="${cleanedPhone}" record="0" ` +
                       `onclick="Vtiger_PBXManager_Js.registerPBXOutboundCall('${cleanedPhone}',0)" data-wa-processed="true">${formattedPhone}</a>` +
                       `<a href="${createWhatsAppLink(cleanedPhone)}" class="whatsapp-icon" style="margin-left:5px;display:inline-block;">` +
                       `<img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" width="16" height="16" style="filter: grayscale(100%);"></a>`;
            });

            html = html.replace(landlineRegex, (match) => {
                const cleanedPhone = normalizePhoneNumber(match);
                const formattedPhone = match.replace(/(\+7|8)[\s-]*\(?([0-8]\d{2,4})\)?[\s-]*(\d{1,3})[\s-]*(\d{1,3})[\s-]*(\d{1,3})/, '$1-$2-$3-$4-$5');

                return `<a class="phoneField" data-value="${cleanedPhone}" record="0" ` +
                       `onclick="Vtiger_PBXManager_Js.registerPBXOutboundCall('${cleanedPhone}',0)" data-wa-processed="true">${formattedPhone}</a>`;
            });

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            while (tempDiv.firstChild) {
                parent.insertBefore(tempDiv.firstChild, node);
            }
            parent.removeChild(node);
        });
    }

    const observer = new MutationObserver((mutations) => {
        processExistingPhoneNumbers();
        findPhoneNumbersInText();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    processExistingPhoneNumbers();
    findPhoneNumbersInText();
})();
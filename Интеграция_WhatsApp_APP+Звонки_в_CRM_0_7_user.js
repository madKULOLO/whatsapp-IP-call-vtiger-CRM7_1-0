// ==UserScript==
// @name         Интеграция WhatsApp APP+Звонки в CRM
// @namespace    http://tampermonkey.net/
// @version      0.8
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

    function createWhatsAppLink(phone) {
        const normalized = normalizePhoneNumber(phone);
        return `whatsapp://send?phone=${normalized}`;
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
        // Обновленное регулярное выражение для мобильных номеров (строго +7/7/8, затем 9 и 9 цифр)
        const mobileRegex = /(?<!\d)(?:\+7|7|8)\s*\(?(9\d{2})\)?\s*(?:\d{3})\s*(?:\d{2})\s*(?:\d{2})(?!\d)/g;
        // Обновленное регулярное выражение для стационарных номеров (3-5 цифр кода, 5-7 цифр номера)
        const landlineRegex = /(?<!\d)(?:\+7|8)\s*\(?(?:[1-8]\d{2,4})\)?\s*(?:\d{2,3})\s*(?:\d{2})\s*(?:\d{2,3})(?!\d)/g;
        // Регулярное выражение для исключения IMEI (15 цифр)
        const imeiRegex = /\b\d{15}\b/g;

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
            const text = node.textContent;
            // Проверяем, что текст содержит телефонный номер, но не IMEI
            if ((mobileRegex.test(text) || landlineRegex.test(text)) && !imeiRegex.test(text.replace(/[^0-9]/g, ''))) {
                nodesToProcess.push(node);
            }
        }

        nodesToProcess.forEach(node => {
            const parent = node.parentNode;
            let html = node.textContent;

            html = html.replace(mobileRegex, (match) => {
                const cleanedPhone = normalizePhoneNumber(match);
                const formattedPhone = match.replace(/(\+7|7|8)\s*\(?(9\d{2})\)?\s*(\d{3})\s*(\d{2})\s*(\d{2})/, '$1-$2-$3-$4-$5');
                return `<a class="phoneField" data-value="${cleanedPhone}" record="0" ` +
                       `onclick="Vtiger_PBXManager_Js.registerPBXOutboundCall('${cleanedPhone}',0)" data-wa-processed="true">${formattedPhone}</a>` +
                       `<a href="${createWhatsAppLink(cleanedPhone)}" class="whatsapp-icon" style="margin-left:5px;display:inline-block;">` +
                       `<img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" width="16" height="16" style="filter: grayscale(100%);"></a>`;
            });

            html = html.replace(landlineRegex, (match) => {
                const cleanedPhone = normalizePhoneNumber(match);
                const formattedPhone = match.replace(/(\+7|8)\s*\(?(?:[1-8]\d{2,4})\)?\s*(\d{2,3})\s*(\d{2})\s*(\d{2,3})/, '$1-$2-$3-$4');
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

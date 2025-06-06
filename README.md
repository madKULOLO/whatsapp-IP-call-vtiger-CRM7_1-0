
# Интеграция WhatsApp APP + Звонки в vtiger CRM - 7.1.0

Tampermonkey-скрипт, который добавляет иконку WhatsApp рядом с номерами телефонов vtiger CRM - 7.1.0 (например, `http://crm.local`). Позволяет инициировать чат в WhatsApp напрямую из интерфейса CRM, используя десктопное приложение или веб-версию WhatsApp.

## 📦 Возможности

* 🔗 Добавляет ссылку на WhatsApp рядом с каждым номером телефона.
* 💬 Позволяет открыть чат в WhatsApp Desktop или Web.
* 📞 Интеграция с функцией исходящего звонка CRM (`Vtiger_PBXManager_Js.registerPBXOutboundCall`).
* 🔍 Автоматически ищет и распознаёт номера телефонов в тексте на странице.
* ♻️ Поддержка динамически подгружаемых элементов через `MutationObserver`.
* ✅ Обработка как мобильных, так и городских номеров.
* 🧼 Нормализует номера телефонов (приведение к формату WhatsApp).

## 🛠️ Установка

1. Установите расширение [Tampermonkey](https://www.tampermonkey.net/) или [Violetmonkey](https://violentmonkey.github.io/) (для win8/старые браузеры) для вашего браузера.
2. Включите [режим разработчика Tampermonkey](https://www.tampermonkey.net/faq.php#Q209) 
3. Нажмите «Создать новый скрипт» в панели Tampermonkey.
4. Вставьте содержимое скрипта из `Интеграция_WhatsApp_APP+Звонки_в_CRM_0_7_user.js`.
5. Сохраните скрипт.
6. Убедитесь, что сайт `http://crm.local` соответствует настройке `@match` или измените `@match` под свой домен CRM.

## 🧠 Логика работы

### 1. **Нормализация номера**

```js
normalizePhoneNumber()
```

Удаляет все лишние символы и приводит номер к международному формату: `+7XXXXXXXXXX`.

### 2. **Создание иконки WhatsApp**

```js
createWhatsAppIcon()
```

Формирует ссылку:

* `whatsapp://send?phone=...` — для десктопного приложения
* `https://web.whatsapp.com/send?phone=...` — (раскомментируйте строку при необходимости)
* `https://api.whatsapp.com/send?phone=...` — (альтернативная веб-версия)

### 3. **Обработка существующих номеров**

```js
processExistingPhoneNumbers()
```

Находит элементы `<a class="phoneField">` и добавляет к ним иконку WhatsApp, если она ещё не добавлена.

### 4. **Поиск в тексте**

```js
findPhoneNumbersInText()
```

Обходит текстовые узлы DOM и ищет номера, заменяя их на кликабельные ссылки с иконкой WhatsApp.

### 5. **Наблюдение за DOM**

```js
MutationObserver
```

Позволяет скрипту отслеживать динамически появляющиеся номера телефонов (например, после AJAX-загрузки).

## ⚙️ Настройки

В коде есть закомментированные блоки:

* Для использования **веб-версии WhatsApp** вместо десктопного приложения, раскомментируйте соответствующие строки `window.open(...)` и ссылку `https://web.whatsapp.com/send?...`.

## 📷 Пример интерфейса
![](https://github.com/madKULOLO/whatsapp-IP-call-vtiger-CRM7_1-0/blob/main/vivaldi_8wQRB3kzSY.png?raw=true)
* Нажатие на WA иконку открывает чат в WhatsApp с этим номером.
* Нажатие на номер телефона инициализирует звонок через `Vtiger_PBXManager_Js.registerPBXOutboundCall`

## 🔒 Безопасность

Скрипт не отправляет данные за пределы вашего CRM и не использует внешние API (кроме ссылки на иконку WhatsApp).


## 📌 Требования

* vtiger CRM - 7.1.0, отображающая номера телефонов в DOM
* Tampermonkey/Violetmonkey для запуска пользовательских скриптов
* WhatsApp Desktop или Web

## 📄 Лицензия

MIT License — свободно используйте и адаптируйте под себя.

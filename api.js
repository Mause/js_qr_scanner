function QrAPI(apiUrl, apiPassword) {
    this.apiUrl = apiUrl;
    this.apiPassword = apiPassword;
}
QrAPI.prototype = {
    getHistory: function getHistory() {
        return this.scanRequest("");
    },

    scanRequest: function scanRequest(barcode) {
        'use strict';
        return $.post(
            this.apiUrl,
            {
                "qrcode": barcode,
                "password": this.apiPassword
            },
            null,
            'json'
        )
    }
}

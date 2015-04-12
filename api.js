function QrAPI(apiUrl, apiPassword) {
    this.apiUrl = apiUrl;
    this.apiPassword = apiPassword;
}
QrAPI.prototype = {
    getHistory: function getHistory() {
        return $.getJSON(
            this.apiUrl,
            {
                qrcode: "",
                password: this.apiPassword
            }
        );
    },

    scanRequest: function scanRequest(barcode) {
        'use strict';
        return $.post(
            this.apiUrl,
            {
                "qrcode": barcode,
                "password": this.apiPassword
            },
            this.scanRequestSuccess,
            'json'
        )
    }
}

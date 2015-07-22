class QrAPI {
    constructor(apiUrl, apiPassword) {
        this.apiUrl = apiUrl;
        this.apiPassword = apiPassword;
    }
    setPassword(password) {
        this.apiPassword = password;
    }
    getHistory() {
        return this.scanRequest("");
    }
    scanRequest(barcode) {
        'use strict';
        return new Promise($.post(
            this.apiUrl,
            {
                "qrcode": barcode,
                "password": this.apiPassword
            },
            null,
            'json'
        ))
    }
}

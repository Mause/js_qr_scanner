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
    },

    scanRequestSuccess: function scanRequestSuccess(data) {
        if (data.status < 1) {
            var error;

            if (data.error.length <= 0) {
                error = "Unknown error occured";
            } else {
                error = data.error;
            }
            alert(error);

        } else if (data.paid < 1){
            alert("Hasn't paid!");

        } else {
            var user = data.user.user,
                firstName = user.first_name,
                lastName = user.last_name,
                successMessage = "";

            if (firstName.length > 0) {
                successMessage = firstName;
                if (lastName.length > 0) {
                    successMessage += lastName;
                }
            } else {
                successMessage = "Sign-in successful";
            }

            console.log(data);
            alert(successMessage);
        }
    },
}

const video = document.getElementById("video");
const result = document.getElementById("result");
const resetButton = document.getElementById("resetButton");
const statusText = document.getElementById("statusText");
const numberPad = document.getElementById("numberPad");
const sendButton = document.getElementById("sendButton");

const API_URL = "https://update.wymanmelyssa4.workers.dev/";

let reader;
let isScanning = false;

// ========================================
// AMOUNT
// Mặc định = 1
// ========================================

let selectedAmount = 1;

// Lưu barcode đã quét
let barcodeData = null;


// ========================================
// TẠO BUTTON 1 -> 48
// ========================================

for (let number = 1; number <= 48; number += 1) {

    const button = document.createElement("button");

    button.type = "button";
    button.className =
        `number-button${number === 1 ? " active" : ""}`;

    button.textContent = number;
    button.setAttribute("aria-label", `Số ${number}`);

    button.addEventListener("click", () => {

        // Xóa active button cũ
        document
            .querySelector(".number-button.active")
            ?.classList.remove("active");

        // Active button mới
        button.classList.add("active");

        // Cập nhật amount
        selectedAmount = number;

        console.log("Selected amount:", selectedAmount);
    });

    numberPad.appendChild(button);
}


// ========================================
// TÁCH BARCODE 14 SỐ
//
// 4 số đầu  = game
// 6 số tiếp = ticket_number
// 3 số tiếp = ticket_sequence
// 1 số cuối = alpha
// ========================================

function parseBarcode(code) {

    if (!/^\d{14}$/.test(code)) {
        return null;
    }

    return {
        game: code.substring(0, 4),

        ticket_number: code.substring(4, 10),

        ticket_sequence: code.substring(10, 13),

        alpha: code.substring(13, 14)
    };
}


// ========================================
// START SCANNER
// ========================================

async function startScanner() {

    if (isScanning) return;

    isScanning = true;

    resetButton.disabled = true;

    result.textContent = "Đang quét...";
    statusText.textContent = "Đang quét barcode...";

    reader = new ZXingBrowser.BrowserMultiFormatReader();

    try {

        const devices =
            await ZXingBrowser.BrowserCodeReader
                .listVideoInputDevices();

        if (!devices.length) {

            result.textContent =
                "Không tìm thấy camera";

            statusText.textContent =
                "Camera chưa sẵn sàng";

            isScanning = false;

            resetButton.disabled = false;

            return;
        }


        // ========================================
        // CAMERA SAU
        // ========================================

        const deviceId =
            devices[devices.length - 1].deviceId;

        const activeReader = reader;


        activeReader.decodeFromVideoDevice(
            deviceId,
            video,
            (decoded, error) => {

                if (!decoded || !isScanning) {
                    return;
                }

                const code =
                    decoded.getText().trim();

                console.log(
                    "Barcode:",
                    code
                );


                // ========================================
                // KIỂM TRA BARCODE 14 SỐ
                // ========================================

                if (code.length !== 14 ||
                    !/^[0-9]{14}$/.test(code)
                ) {

                    result.textContent = "";

                    statusText.textContent =
                        "Barcode phải gồm đúng 14 số";

                    console.warn(
                        "Barcode không hợp lệ:",
                        code,
                        "Độ dài:",
                        code.length
                    );

                    // Tiếp tục quét
                    return;
                }


                // ========================================
                // BARCODE HỢP LỆ
                // ========================================

                barcodeData = parseBarcode(code);

                console.log(
                    "Barcode data:",
                    barcodeData
                );


                result.textContent = code;

                statusText.textContent =
                    "Đã nhận diện thành công";


                // Dừng scanner
                isScanning = false;

                resetButton.disabled = false;


                // ========================================
                // DỪNG CAMERA
                // ========================================

                try {

                    activeReader.reset();

                } catch (stopError) {

                    console.warn(
                        "Không thể dừng camera:",
                        stopError
                    );
                }
            }
        );

    } catch (error) {

        console.log(error);

        result.textContent =
            "Không thể mở camera";

        statusText.textContent =
            "Có lỗi khi truy cập camera";

        isScanning = false;

        resetButton.disabled = false;
    }
}


// ========================================
// RESET
// ========================================

resetButton.addEventListener("click", () => {

    if (reader) {

        try {

            reader.reset();

        } catch (stopError) {

            console.warn(
                "Không thể dừng camera cũ:",
                stopError
            );
        }
    }


    // Xóa barcode cũ
    barcodeData = null;


    // Bắt đầu quét lại
    startScanner();
});


// ========================================
// SEND
// ========================================

// ========================================
// CONFIRM DIALOG
// ========================================

const confirmDialog =
    document.getElementById("confirmDialog");

const confirmDialogMessage =
    document.getElementById("confirmDialogMessage");

const cancelConfirmButton =
    document.getElementById("cancelConfirmButton");

const confirmSendButton =
    document.getElementById("confirmSendButton");


// ========================================
// SEND BUTTON
// ========================================

sendButton.addEventListener("click", () => {

    // ========================================
    // CHƯA CÓ BARCODE
    // ========================================

    if (!barcodeData) {

        statusText.textContent =
            "Vui lòng quét barcode trước";

        return;
    }


    // ========================================
    // HIỂN THỊ CONFIRM
    // ========================================

    confirmDialogMessage.textContent =
        `Bạn có chắc muốn gửi không?\n\n` +
        `Game: ${barcodeData.game}\n` +
        `Ticket: ${barcodeData.ticket_number}\n` +
        `Số thứ tự: ${barcodeData.ticket_sequence}\n` +
        `Số lượng: ${selectedAmount}`;


    confirmDialog.showModal();
});


// ========================================
// HỦY
// ========================================

cancelConfirmButton.addEventListener(
    "click",
    () => {

        confirmDialog.close();

    }
);


// ========================================
// XÁC NHẬN GỬI
// ========================================

confirmSendButton.addEventListener(
    "click",
    async () => {

        // Đóng confirm dialog
        confirmDialog.close();


        // ====================================
        // DATA GỬI API
        // ====================================

        const data = {

            game: barcodeData.game,

            ticket_number:
                barcodeData.ticket_number,

            ticket_sequence:
                barcodeData.ticket_sequence,

            alpha:
                barcodeData.alpha,

            amount:
                selectedAmount
        };


        console.log(
            "Sending data:",
            data
        );


        // ====================================
        // DISABLE SEND
        // ====================================

        sendButton.disabled = true;
        confirmSendButton.disabled = true;


        statusText.textContent =
            "Đang gửi...";


        try {

            // ====================================
            // CALL API
            // ====================================

            const response = await fetch(
                API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify(data)
                }
            );


            // ====================================
            // ĐỌC RESPONSE
            // ====================================

            const responseText =
                await response.text();


            let responseData = null;


            try {

                responseData =
                    JSON.parse(responseText);

            } catch {

                responseData =
                    responseText;
            }


            console.log(
                "API status:",
                response.status
            );

            console.log(
                "API response:",
                responseData
            );


            // ====================================
            // KIỂM TRA ERROR
            // ====================================

            const apiError =
                !response.ok ||
                (
                    responseData &&
                    typeof responseData === "object" &&
                    responseData.success === false
                );


            if (apiError) {

                let errorMessage =
                    "Update thất bại.";


                // JSON
                if (
                    responseData &&
                    typeof responseData === "object"
                ) {

                    if (responseData.message) {

                        errorMessage =
                            responseData.message;

                    } else if (responseData.error) {

                        errorMessage =
                            responseData.error;
                    }

                }

                // TEXT
                else if (
                    typeof responseData === "string" &&
                    responseData.trim()
                ) {

                    errorMessage =
                        responseData;
                }


                console.log(
                    "API Error:",
                    response.status,
                    errorMessage
                );


                statusText.textContent =
                    "Gửi thất bại";


                showErrorDialog(
                    errorMessage
                );


                return;
            }


            // ====================================
            // SUCCESS
            // ====================================

            statusText.textContent =
                "Gửi thành công";


            console.log(
                "Đã gửi thành công:",
                data
            );

        } catch (error) {

            // ====================================
            // NETWORK ERROR
            // ====================================

            console.log(
                "Lỗi gửi API:",
                error
            );


            statusText.textContent =
                "Gửi thất bại";


            showErrorDialog(
                "Không thể kết nối đến server.\n" +
                "Vui lòng thử lại."
            );

        } finally {

            sendButton.disabled = false;

            confirmSendButton.disabled = false;
        }
    }
);


// ========================================
// KHỞI ĐỘNG CAMERA
// ========================================

startScanner();

// ========================================
// ERROR DIALOG
// ========================================

const errorDialog =
    document.getElementById("errorDialog");

const errorDialogMessage =
    document.getElementById("errorDialogMessage");

const closeErrorDialog =
    document.getElementById("closeErrorDialog");


function showErrorDialog(message) {

    if (!errorDialog || !errorDialogMessage) {
        console.log("Không tìm thấy Error Dialog");
        return;
    }

    errorDialogMessage.textContent = message;

    if (!errorDialog.open) {
        errorDialog.showModal();
    }
}


if (closeErrorDialog && errorDialog) {

    closeErrorDialog.addEventListener(
        "click",
        () => {
            errorDialog.close();
        }
    );

}
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


// ========================================
// TẠO BUTTON 1 -> 48
// ========================================

for (let number = 1; number <= 48; number += 1) {

    const button = document.createElement("button");

    button.type = "button";
    button.className = `number-button${number === 1 ? " active" : ""}`;
    button.textContent = number;
    button.setAttribute("aria-label", `Số ${number}`);

    button.addEventListener("click", () => {

        // Xóa active cũ
        document
            .querySelector(".number-button.active")
            ?.classList.remove("active");

        // Active button mới
        button.classList.add("active");

        // Lưu amount
        selectedAmount = number;

        console.log("Amount:", selectedAmount);
    });

    numberPad.appendChild(button);
}


// ========================================
// TÁCH BARCODE 14 SỐ
// ========================================

function parseBarcode(code) {

    if (!/^\d{14}$/.test(code)) {
        return null;
    }

    return {
        game: code.substring(0, 4),
        ticket_number: code.substring(4, 10),
        ticket_sequence: code.substring(10, 13),
        alpha: code.substring(13, 14),
        amount: selectedAmount
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
            await ZXingBrowser.BrowserCodeReader.listVideoInputDevices();

        if (!devices.length) {

            result.textContent = "Không tìm thấy camera";
            statusText.textContent = "Camera chưa sẵn sàng";

            isScanning = false;
            resetButton.disabled = false;

            return;
        }

        // ========================================
        // CHỌN CAMERA SAU
        // ========================================

        const deviceId = devices[devices.length - 1].deviceId;

        const activeReader = reader;

        activeReader.decodeFromVideoDevice(
            deviceId,
            video,
            (decoded, error) => {

                if (!decoded || !isScanning) return;

                const code = decoded.getText().trim();

                console.log("Barcode:", code);

                // ========================================
                // KIỂM TRA 14 SỐ
                // ========================================

                if (!/^\d{14}$/.test(code)) {

                    result.textContent = code;

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

                const data = parseBarcode(code);

                console.log("Barcode data:", data);

                result.textContent = code;

                statusText.textContent =
                    "Đã nhận diện thành công";

                // Dừng scan
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


                // ========================================
                // LƯU DATA ĐỂ SEND
                // ========================================

                window.barcodeData = data;

            }
        );

    } catch (error) {

        console.error(error);

        result.textContent = "Không thể mở camera";

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

    window.barcodeData = null;

    startScanner();
});


// ========================================
// SEND DATA LÊN API
// ========================================

sendButton.addEventListener("click", async () => {

    // Chưa quét barcode
    if (!window.barcodeData) {

        statusText.textContent =
            "Vui lòng quét barcode trước";

        return;
    }

    // Lấy barcode hiện tại
    const data = {
        ...window.barcodeData,

        // Luôn lấy amount hiện tại
        amount: selectedAmount
    };

    console.log("Sending:", data);

    sendButton.disabled = true;

    statusText.textContent = "Đang gửi...";

    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)
        });


        // ========================================
        // KIỂM TRA RESPONSE
        // ========================================

        const responseText = await response.text();

        let responseData;

        try {

            responseData = JSON.parse(responseText);

        } catch {

            responseData = responseText;
        }


        console.log("API response:", responseData);


        if (!response.ok) {

            throw new Error(
                `API Error ${response.status}: ${responseText}`
            );
        }


        // ========================================
        // SEND THÀNH CÔNG
        // ========================================

        statusText.textContent =
            "Gửi thành công";

        console.log(
            "Đã gửi thành công:",
            data
        );

    } catch (error) {

        console.error(
            "Lỗi gửi API:",
            error
        );

        statusText.textContent =
            "Gửi thất bại";

    } finally {

        sendButton.disabled = false;
    }
});


// ========================================
// KHỞI ĐỘNG CAMERA
// ========================================

startScanner();
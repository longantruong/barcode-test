const video = document.getElementById("video");
const result = document.getElementById("result");
const resetButton = document.getElementById("resetButton");
const statusText = document.getElementById("statusText");
const numberPad = document.getElementById("numberPad");

let reader;
let isScanning = false;

for (let number = 1; number <= 48; number += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `number-button${number === 1 ? " active" : ""}`;
    button.textContent = number;
    button.setAttribute("aria-label", `Số ${number}`);
    button.addEventListener("click", () => {
        document.querySelector(".number-button.active")?.classList.remove("active");
        button.classList.add("active");
    });
    numberPad.appendChild(button);
}

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
            return;
        }

        // Camera sau
        const deviceId = devices[devices.length - 1].deviceId;

        const activeReader = reader;

        activeReader.decodeFromVideoDevice(
            deviceId,
            video,
            (decoded, error) => {

                if (decoded && isScanning) {

                    let code = decoded.getText();

                    console.log("Barcode:", code);

                    // Hiển thị barcode
                    result.textContent = code;
                    statusText.textContent = "Đã nhận diện thành công";

                    // Cho phép quét mã mới trước khi dừng camera để nút không bị khóa
                    isScanning = false;
                    resetButton.disabled = false;

                    // Dừng camera. Một vài trình duyệt có thể báo lỗi khi stream đã đóng.
                    try {
                        activeReader.reset();
                    } catch (stopError) {
                        console.warn("Không thể dừng camera:", stopError);
                    }
                }

            }
        );
    } catch (error) {
        console.error(error);
        result.textContent = "Không thể mở camera";
        statusText.textContent = "Có lỗi khi truy cập camera";
        isScanning = false;
    }
}

resetButton.addEventListener("click", () => {
    if (reader) {
        try {
            reader.reset();
        } catch (stopError) {
            console.warn("Không thể dừng camera cũ:", stopError);
        }
    }

    startScanner();
});

startScanner();
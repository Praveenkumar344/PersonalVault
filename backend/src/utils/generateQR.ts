import QRCode from "qrcode";

export const generateQRCode = async (otpauthUrl: string | QRCode.QRCodeSegment[]) => {
  try {
    return await QRCode.toDataURL(otpauthUrl);
  } catch (err) {
    console.error("Error generating QR:", err);
    throw err;
  }
};

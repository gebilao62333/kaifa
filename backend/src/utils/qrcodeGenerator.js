const QRCode = require('./qrcode');

const generateQRCode = (text, options = {}) => {
  const {
    width = 200,
    margin = 4,
    color = {
      dark: '#000000',
      light: '#ffffff'
    }
  } = options;

  try {
    const qr = new QRCode(-1, QRCode.QRErrorCorrectLevel.H);
    qr.addData(text);
    qr.make();

    const moduleCount = qr.getModuleCount();
    const size = width - margin * 2;
    const moduleSize = size / moduleCount;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${width}" viewBox="0 0 ${width} ${width}">`;
    svg += `<rect width="100%" height="100%" fill="${color.light}"/>`;

    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) {
          const x = margin + col * moduleSize;
          const y = margin + row * moduleSize;
          svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${color.dark}"/>`;
        }
      }
    }
    svg += '</svg>';

    return {
      success: true,
      svg,
      base64: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
      text
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  generateQRCode
};
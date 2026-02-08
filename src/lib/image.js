const sharp = require('sharp');

// Define sizes configuration
const SIZES = {
    thumbnail: { width: 150, height: 150 },
    medium: { width: 800, height: 600 },
    large: { width: 1920, height: 1080 }
};

// Watermark SVG
const WATERMARK_SVG = Buffer.from(`
  <svg width="200" height="50">
    <text x="10" y="30" font-family="Arial" font-size="20" fill="rgba(255,255,255,0.5)">
      © ServerlessPipeline 2026
    </text>
  </svg>
`);

const processImage = async (buffer) => {
    const processedImages = {};

    try {
        for (const [sizeName, dimensions] of Object.entries(SIZES)) {
            console.log(`Processing ${sizeName}...`);

            let pipeline = sharp(buffer)
                .resize(dimensions.width, dimensions.height, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({
                    quality: 80,
                    progressive: true,
                    mozjpeg: true
                });

            // Add watermark to large image
            if (sizeName === 'large') {
                pipeline = pipeline.composite([{
                    input: WATERMARK_SVG,
                    gravity: 'southeast'
                }]);
            }

            processedImages[sizeName] = await pipeline.toBuffer();
        }

        return processedImages;
    } catch (error) {
        console.error(`Error processing image: ${error.message}`);
        throw error;
    }
};

module.exports = {
    processImage,
};

import { v2 as cloudinary } from 'cloudinary';
// ================================================
// Cloudinary Configuration (inline credentials)
// ================================================
cloudinary.config({
    cloud_name: 'qbf24rg0',
    api_key: '153191335666429',
    api_secret: 'BniGLVVAygpOYZ4Go3f5IcExbbw',
});
async function testCloudinary() {
    try {
        // ================================================
        // Step 1: Upload an image
        // ================================================
        console.log('📤 Uploading sample image...');
        const uploadResult = await cloudinary.uploader.upload('https://res.cloudinary.com/demo/image/upload/sample.jpg', {
            public_id: 'prime-academic-test',
            folder: 'prime-academic-manager',
        });
        console.log('\n✅ Upload successful!');
        console.log('Secure URL:', uploadResult.secure_url);
        console.log('Public ID:', uploadResult.public_id);
        // ================================================
        // Step 2: Get image details
        // ================================================
        console.log('\n📊 Image Details:');
        console.log('Width:', uploadResult.width, 'px');
        console.log('Height:', uploadResult.height, 'px');
        console.log('Format:', uploadResult.format);
        console.log('File Size:', uploadResult.bytes, 'bytes');
        // ================================================
        // Step 3: Transform the image
        // ================================================
        // f_auto: Automatically selects the best format (WebP, AVIF, etc.) based on browser support
        // q_auto: Automatically adjusts quality for optimal file size vs. visual quality
        const transformedUrl = cloudinary.url('prime-academic-test', {
            transformation: [
                { width: 800, height: 600, crop: 'limit' },
                { quality: 'auto' }, // q_auto equivalent
                { fetch_format: 'auto' }, // f_auto equivalent
            ],
        });
        console.log('\n✨ Image transformation applied:');
        console.log('  - f_auto: Automatically selects optimal format (WebP/AVIF)');
        console.log('  - q_auto: Automatically adjusts quality for best compression');
        console.log('\n🚀 Done! Click the link below to see the optimized version of the image.');
        console.log('   Check the file size and format in your browser DevTools Network tab.');
        console.log('\nTransformed URL:', transformedUrl);
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
testCloudinary();
//# sourceMappingURL=cloudinary-test.js.map
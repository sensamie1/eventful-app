import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import * as cloudinary from 'cloudinary';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { promisify } from 'util';

dotenv.config();

const unlinkAsync = promisify(fs.unlink);

@Injectable()
export class CloudinaryService {
    constructor() {
        cloudinary.v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
    }

    async upload(file: Express.Multer.File): Promise<string> {
        const result = await cloudinary.v2.uploader.upload(file.path);
        if (!file) {
            throw new HttpException('No file uploaded.', HttpStatus.BAD_REQUEST);
        }
        // Delete local image
        await unlinkAsync(file.path);
        return result.secure_url;
    }

    async uploadImage(file: Express.Multer.File): Promise<string> {
        if (!file) {
            throw new HttpException('No file uploaded.', HttpStatus.BAD_REQUEST);
        }
    
        // Save file buffer to a temporary file
        const tempFilePath = `temp/${file.originalname}`; // Define the temporary file path
        await fs.promises.writeFile(tempFilePath, file.buffer);
    
        // Upload the temporary file to Cloudinary
        const result = await cloudinary.v2.uploader.upload(tempFilePath);
    
        // Delete the temporary file
        await unlinkAsync(tempFilePath);
    
        return result.secure_url;
    }

    async uploadQrCode(qrCodeData: string, folder: string): Promise<string> {
        try {
            // Generate QR code image
            const qrCodeImagePath = './uploads/qr_code.png';
            await QRCode.toFile(qrCodeImagePath, qrCodeData);

            // Upload QR code image to Cloudinary
            const cloudinaryResponse = await cloudinary.v2.uploader.upload(qrCodeImagePath, {
                folder: folder // Specify the folder in Cloudinary
            });

            // Delete local QR code image
            fs.unlinkSync(qrCodeImagePath);

            return cloudinaryResponse.url;
        } catch (error) {
            console.error('Error uploading QR code to Cloudinary:', error);
            throw new Error('Error uploading QR code to Cloudinary.');
        }
    }
}




// import { Injectable } from '@nestjs/common';
// import { v2 as cloudinary } from 'cloudinary';
// import * as dotenv from 'dotenv';

// dotenv.config();


// @Injectable()
// export class CloudinaryService {
//     constructor() {
//         cloudinary.config({
//             cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//             api_key: process.env.CLOUDINARY_API_KEY,
//             api_secret: process.env.CLOUDINARY_API_SECRET
//         });
//     }

//     async upload(file: Express.Multer.File): Promise<string> {
//         const result = await cloudinary.uploader.upload(file.path);
//         return result.secure_url;
//     }
    
// }


// import * as cloudinary from 'cloudinary';
// import * as dotenv from 'dotenv';


// dotenv.config(); // Load environment variables from .env file


// cloudinary.v2.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET
// });

// export { cloudinary };



import { Injectable, NotFoundException, ConflictException, BadRequestException, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCreatorDto } from './dto/create-creator.dto';
import { CreatorSignInDto } from './dto/signin.dto';
// import { UpdateCreatorDto } from './dto/update-creator.dto';
import { Creator, CreatorDocument } from './entities/creator.entity';
import * as jwt from 'jsonwebtoken';
import { sendVerificationEmail, sendPasswordResetEmail } from './creators-email.service';
import * as bcrypt from 'bcrypt';



@Injectable()
export class CreatorsService {
  constructor(@InjectModel(Creator.name) private readonly creatorModel: Model<CreatorDocument>) {}
  
  async create(createCreatorDto: CreateCreatorDto) {
    try {
      const { email } = createCreatorDto;
  
      // Check if a creator with the same email already exists
      const existingCreator = await this.creatorModel.findOne({ email }).exec();
      if (existingCreator) {
        throw new ConflictException('Creator already exists.');
      }
      
      const createdCreator = new this.creatorModel(createCreatorDto);
  
      // Save the creator to the database
      const savedCreator = await createdCreator.save();
  
      // Generate a JWT token for email verification
      const token = jwt.sign({ email: savedCreator.email, _id: savedCreator._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      // Construct the verification link
      const verificationLink = `https://eventful-app.onrender.com/creators/verify-email?token=${token}`;

      // const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/creators/verify-email?token=${token}`;
  
      // Send verification email
      await sendVerificationEmail(savedCreator.email, verificationLink);
  
      // Return the saved creator
      return {
        message: 'Creator created successfully. Check your Email and verify to complete signup. Note: Verification link expires in 1hr.',
        savedCreator,
        statusCode: HttpStatus.CREATED,
        token
      };
    } catch (error) {
      throw error;
    }
  }

  async createViews(createCreatorDto: CreateCreatorDto) {
    try {
      const { email } = createCreatorDto;
  
      // Check if a creator with the same email already exists
      const existingCreator = await this.creatorModel.findOne({ email }).exec();
      if (existingCreator) {
        throw new ConflictException('Creator already exists.');
      }
      
      const createdCreator = new this.creatorModel(createCreatorDto);
  
      // Save the creator to the database
      const savedCreator = await createdCreator.save();
  
      // Generate a JWT token for email verification
      const token = jwt.sign({ email: savedCreator.email, _id: savedCreator._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      // Construct the verification link
      const verificationLink = `https://eventful-app.onrender.com/views/creators/verify-email?token=${token}`;

      // const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/views/creators/verify-email?token=${token}`;
  
      // Send verification email
      await sendVerificationEmail(savedCreator.email, verificationLink);
  
      // Return the saved creator
      return {
        message: 'Creator created successfully. Check your Email and verify to complete signup. Note: Verification link expires in 1hr.',
        savedCreator,
        statusCode: HttpStatus.CREATED,
        token
      };
    } catch (error) {
      throw error;
    }
  }

  async verifyEmail(token: string) {
    try {
      const decoded: jwt.JwtPayload = jwt.verify(token, process.env.JWT_SECRET) as jwt.JwtPayload;

      const creator = await this.creatorModel.findById(decoded._id);
      if (!creator) {
        throw new NotFoundException('Creator not found.');
      }
      if (creator.isVerified) {
        return {
          message: 'Email already verified.',
          statusCode: HttpStatus.OK
        };
      }

      // Update only the isVerified field
      await this.creatorModel.findByIdAndUpdate(decoded._id, { isVerified: true });

      return {
        message: 'Email verified successfully.',
        statusCode: HttpStatus.OK
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new HttpException('Verification link has expired.', HttpStatus.UNAUTHORIZED);
      } else {
        console.error('Error in verifying email:', error);
        throw new HttpException('Invalid verification link.', HttpStatus.GONE);
      }
    }
  }

  async reVerifyEmail(email: string) {
    const creator = await this.creatorModel.findOne({ email });

    if (!email) {
      throw new BadRequestException('Email is required.');
    }

    if (!creator) {
      throw new NotFoundException('Creator not found.');
    }

    // Generate a JWT token for email verification
    const token = jwt.sign({ email: creator.email, _id: creator._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Construct the verification link
    const verificationLink = `https://eventful-app.onrender.com/creators/verify-email?token=${token}`;

    // const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/creators/verify-email?token=${token}`;

    // Send verification email
    await sendVerificationEmail(creator.email, verificationLink);

    return {
      message: 'Verification email has been resent.',
      statusCode: HttpStatus.OK
    };
  }

  async reVerifyEmailViews(email: string) {
    try {
      const creator = await this.creatorModel.findOne({ email });

      if (!email) {
        throw new BadRequestException('Email is required.');
      }

      if (!creator) {
        throw new NotFoundException('Creator not found.');
      }

      // Generate a JWT token for email verification
      const token = jwt.sign({ email: creator.email, _id: creator._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Construct the verification link
      const verificationLink = `https://eventful-app.onrender.com/views/creators/verify-email?token=${token}`;

      // const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/views/creators/verify-email?token=${token}`;

      // Send verification email
      await sendVerificationEmail(creator.email, verificationLink);

      return {
        message: 'Verification email has been resent.',
        statusCode: HttpStatus.OK
      };
    } catch (error) {
      throw error;
    }
  }


  async findAll() {
    const creators = await this.creatorModel.find().select('-password').exec()
    return {
      message: 'Creators retrieved successfully.',
      data: creators,
      statusCode: HttpStatus.OK
    }
  }

  async findOne(id: string) {
    const creator = await this.creatorModel.findById(id).select('-password').exec();
    if (!creator) {
      throw new NotFoundException(`Creator with ID ${id} not found`);
    }
    return {
      message: 'Creator retrieved successfully.',
      creator,
      statusCode: HttpStatus.OK
    }
  }

  async signIn(signInDto: CreatorSignInDto) {
    const { email, password } = signInDto;

    // Find the creator by email
    const creator = await this.creatorModel.findOne({email});

    if (!creator) {
      throw new UnauthorizedException('Creator not found.');
    }

    if (!creator.isVerified) {
      const verificationLink = `https://eventful-app.onrender.com/creators/resend-verification-email`;

      // const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/creators/resend-verification-email`;
      throw new HttpException({
        message: `Email not verified. Check your Email for verification link or request a new one here - ${verificationLink}`,
        success: false
      }, HttpStatus.FORBIDDEN);
    }

    // Check if the password matches
    const isValidPassword = await Creator.validatePassword(
      password,
      creator.password,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Email or password is not correct.');
    }

    // Generate JWT token
    const token = await jwt.sign({ email: creator.email, _id: creator._id, first_name: creator.first_name, last_name: creator.last_name}, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' })

    return {
      message: 'Creator login successful.',
      creator,
      token,
      statusCode: HttpStatus.OK
    };
  }

  async signInViews(CreatorSignInDto: CreatorSignInDto) {
    try {
      const { email, password } = CreatorSignInDto;

      // Find the user by email
      const creator = await this.creatorModel.findOne({email});

      if (!creator) {
        throw new NotFoundException('Creator not found.');
      }

      if (!creator.isVerified) {
        const verificationLink = `https://eventful-app.onrender.com/views/creators/resend-verification-email`;

        // const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/views/creators/resend-verification-email`;
        throw new HttpException({
          message: `Email not verified. Check your Email for verification link or request a new one here - ${verificationLink}`,
          success: false
        }, HttpStatus.FORBIDDEN);
      }

      // Check if the password matches
      const isValidPassword = await Creator.validatePassword(
        password,
        creator.password,
      );

      if (!isValidPassword) {
        throw new UnauthorizedException('Email or password is not correct.');
      }

      // Generate JWT token
      const token = await jwt.sign({ email: creator.email, _id: creator._id, first_name: creator.first_name, last_name: creator.last_name}, 
        process.env.JWT_SECRET, 
        { expiresIn: '24h' })

      return {
        message: 'Creator login successful.',
        creator,
        token,
        statusCode: HttpStatus.OK
      };
    } catch (error) {
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string) {
    try {
      const creator = await this.creatorModel.findOne({ email });
  
      if (!creator) {
        throw new NotFoundException('Creator with not found');
      }
  
      const token = await jwt.sign({ email: creator.email, _id: creator._id}, process.env.JWT_SECRET, { expiresIn: '5m' });
  
      const resetLink = `https://eventful-app.onrender.com/views/creators/reset-password?token=${token}`;

      // const resetLink = `http://${process.env.HOST}:${process.env.PORT}/views/creators/reset-password?token=${token}`;
      
      // Send password reset email
      await sendPasswordResetEmail(creator.email, resetLink);
  
      return {
        message: 'Password reset email has been sent.',
        statusCode: HttpStatus.OK

      };
    } catch (error) {
      throw error;
    }
  }

  async CreatorResetPassword(_id: string, newPassword: string) {
    try {
      const creator = await this.creatorModel.findById(_id);
      if (!creator) {
        throw new HttpException('Creator not found.', HttpStatus.NOT_FOUND);
      }
      

      // Check if the new password is the same as the current password
      const isSamePassword = await bcrypt.compare(newPassword, creator.password);
      if (isSamePassword) {
        throw new HttpException('New password must be different from the current password.', HttpStatus.CONFLICT);
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update only the password field
      await this.creatorModel.findByIdAndUpdate(_id, { password: hashedPassword });
      return {
        message: 'Paasword changed successfully.',
        statusCode: HttpStatus.OK
      }
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
          throw new HttpException('Password reset link has expired.', HttpStatus.UNAUTHORIZED);
        } else if (error.name === 'HttpException') {
          throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
        } else {
          console.error('Password reset error:', error);
          throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
        }
      }
    }


  // async update(id: number, updateCreatorDto: UpdateCreatorDto): Promise<Creator> {
  //   const updatedCreator = await this.creatorModel.findByIdAndUpdate(id, updateCreatorDto, { new: true });
  //   if (!updatedCreator) {
  //     throw new NotFoundException(`Creator with ID ${id} not found`);
  //   }
  //   return updatedCreator;
  // }

  // async remove(id: number): Promise<Creator> {
  //   const removedCreator = await this.creatorModel.findByIdAndDelete(id);
  //   if (!removedCreator) {
  //     throw new NotFoundException(`Creator with ID ${id} not found`);
  //   }
  //   return removedCreator;
  // }
}

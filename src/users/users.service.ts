import { Injectable, NotFoundException, ConflictException, BadRequestException, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UserSignInDto } from './dto/signin.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './entities/user.entity';
import * as jwt from 'jsonwebtoken';
import { sendVerificationEmail, sendPasswordResetEmail } from './users-email.service';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}
  
  async create(createUserDto: CreateUserDto) {
    try {
      const { email } = createUserDto;
  
      // Check if a user with the same email already exists
      const existingUser = await this.userModel.findOne({ email }).exec();
      if (existingUser) {
        throw new ConflictException('User already exists.');
      }
      
      const createdUser = new this.userModel(createUserDto);
  
      // Save the user to the database
      const savedUser = await createdUser.save();
  
      // Generate a JWT token for email verification
      const token = jwt.sign({ email: savedUser.email, _id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      // Construct the verification link
      const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/users/verify-email?token=${token}`;
  
      // Send verification email
      await sendVerificationEmail(savedUser.email, verificationLink);
  
      // Return the saved user
      return {
        message: 'User created successfully. Check your Email and verify to complete signup. Note: Verification link expires in 1hr.',
        savedUser,
        statusCode: HttpStatus.CREATED,
        token
      };
    } catch (error) {
      throw error;
    }
  }
  async createViews(createUserDto: CreateUserDto) {
    try {
      const { email } = createUserDto;
  
      // Check if a user with the same email already exists
      const existingUser = await this.userModel.findOne({ email }).exec();
      if (existingUser) {
        throw new ConflictException('User already exists.');
      }
      
      const createdUser = new this.userModel(createUserDto);
  
      // Save the user to the database
      const savedUser = await createdUser.save();
  
      // Generate a JWT token for email verification
      const token = jwt.sign({ email: savedUser.email, _id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      // Construct the verification link
      const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/views/users/verify-email?token=${token}`;
  
      // Send verification email
      await sendVerificationEmail(savedUser.email, verificationLink);
  
      // Return the saved user
      return {
        message: 'User created successfully. Check your Email and verify to complete signup. Note: Verification link expires in 1hr.',
        savedUser,
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

      const user = await this.userModel.findById(decoded._id);
      if (!user) {
        throw new NotFoundException('User not found.');
      }
      if (user.isVerified) {
        return {
          message: 'Email already verified.',
          statusCode: HttpStatus.ACCEPTED
        };
      }

      // Update only the isVerified field
      await this.userModel.findByIdAndUpdate(decoded._id, { isVerified: true });

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
    try {
      const user = await this.userModel.findOne({ email });

      if (!email) {
        throw new BadRequestException('Email is required.');
      }

      if (!user) {
        throw new NotFoundException('User not found.');
      }

      // Generate a JWT token for email verification
      const token = jwt.sign({ email: user.email, _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Construct the verification link
      const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/users/verify-email?token=${token}`;

      // Send verification email
      await sendVerificationEmail(user.email, verificationLink);

      return {
        message: 'Verification email has been resent.',
        statusCode: HttpStatus.OK
      };
    } catch (error) {
      throw error;
    }
  }

  async reVerifyEmailViews(email: string) {
    try {
      const user = await this.userModel.findOne({ email });

      if (!email) {
        throw new BadRequestException('Email is required.');
      }

      if (!user) {
        throw new NotFoundException('User not found.');
      }

      // Generate a JWT token for email verification
      const token = jwt.sign({ email: user.email, _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Construct the verification link
      const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/views/users/verify-email?token=${token}`;

      // Send verification email
      await sendVerificationEmail(user.email, verificationLink);

      return {
        message: 'Verification email has been resent.',
        statusCode: HttpStatus.OK
      };
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    try {
      const users = await this.userModel.find().select('-password').exec()
      return {
        message: 'Users retrieved successfully.',
        data: users,
        statusCode: HttpStatus.OK
      }
    } catch (error) {
      throw error;
    }
    
  }

  async findOne(id: string) {
    try {
      const user = await this.userModel.findById(id).select('-password').exec();
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return {
        message: 'User retrieved successfully.',
        user,
        statusCode: HttpStatus.OK
      }
    } catch (error) {
      throw error;
    }

  }

  async signIn(signInDto: UserSignInDto) {
    try {
      const { email, password } = signInDto;

      // Find the user by email
      const user = await this.userModel.findOne({email});

      if (!user) {
        throw new UnauthorizedException('User not found.');
      }

      if (!user.isVerified) {
        const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/users/resend-verification-email`;
        throw new HttpException({
          message: `Email not verified. Check your Email for verification link or request a new one here - ${verificationLink}`,
          success: false
        }, HttpStatus.FORBIDDEN);
      }

      // Check if the password matches
      const isValidPassword = await User.validatePassword(
        password,
        user.password,
      );

      if (!isValidPassword) {
        throw new UnauthorizedException('Email or password is not correct.');
      }

      // Generate JWT token
      const token = await jwt.sign({ email: user.email, _id: user._id, first_name: user.first_name, last_name: user.last_name}, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' })

      return {
        message: 'User login successful.',
        user,
        token,
        statusCode: HttpStatus.OK
      };
    } catch (error) {
      throw error;
    }
  }

  async signInViews(signInDto: UserSignInDto) {
    try {
      const { email, password } = signInDto;

      // Find the user by email
      const user = await this.userModel.findOne({email});

      if (!user) {
        throw new NotFoundException('User not found.');
      }

      if (!user.isVerified) {
        const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/views/users/resend-verification-email`;
        throw new HttpException({
          message: `Email not verified. Check your Email for verification link or request a new one here - ${verificationLink}`,
          success: false
        }, HttpStatus.FORBIDDEN);
      }

      // Check if the password matches
      const isValidPassword = await User.validatePassword(
        password,
        user.password,
      );

      if (!isValidPassword) {
        throw new UnauthorizedException('Email or password is not correct.');
      }

      // Generate JWT token
      const token = await jwt.sign({ email: user.email, _id: user._id, first_name: user.first_name, last_name: user.last_name}, 
        process.env.JWT_SECRET, 
        { expiresIn: '24h' })

      return {
        message: 'User login successful.',
        user,
        token,
        statusCode: HttpStatus.OK
      };
    } catch (error) {
      throw error;
    }
    
  }

  async sendPasswordResetEmail(email: string) {
    try {
      const user = await this.userModel.findOne({ email });
  
      if (!user) {
        throw new NotFoundException('User with not found');
      }
  
      const token = await jwt.sign({ email: user.email, _id: user._id}, process.env.JWT_SECRET, { expiresIn: '5m' });
  
      const resetLink = `http://${process.env.HOST}:${process.env.PORT}/views/users/reset-password?token=${token}`;
      
      // Send password reset email
      await sendPasswordResetEmail(user.email, resetLink);
  
      return {
        message: 'Password reset email has been sent.',
        statusCode: HttpStatus.OK

      };
    } catch (error) {
      throw error;
    }
  }

  async UserResetPassword(_id: string, newPassword: string) {
    try {
      const user = await this.userModel.findById(_id);
      if (!user) {
        throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
      }
      

      // Check if the new password is the same as the current password
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        throw new HttpException('New password must be different from the current password.', HttpStatus.CONFLICT);
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update only the password field
      await this.userModel.findByIdAndUpdate(_id, { password: hashedPassword });
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

  // async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
  //   const updatedUser = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true });
  //   if (!updatedUser) {
  //     throw new NotFoundException(`User with ID ${id} not found`);
  //   }
  //   return updatedUser;
  // }

  // async remove(id: number): Promise<User> {
  //   const removedUser = await this.userModel.findByIdAndDelete(id);
  //   if (!removedUser) {
  //     throw new NotFoundException(`User with ID ${id} not found`);
  //   }
  //   return removedUser;
  // }
}

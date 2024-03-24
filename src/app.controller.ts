import { Controller, Get, Render, Post, Body, ValidationPipe, Req, Res, HttpException, HttpStatus, Query, BadRequestException, NotFoundException, UnauthorizedException, UseGuards, ConflictException, UseInterceptors, UploadedFile, Param, GoneException} from '@nestjs/common';
import { AppService } from './app.service';
import { UsersService } from './users/users.service';
import { CreatorsService } from './creators/creators.service';
import { EventsService } from './events/events.service';
import { CreateUserDto } from './users/dto/create-user.dto';
import { CreateCreatorDto } from './creators/dto/create-creator.dto';
import { CreateEventDto } from './events/dto/create-event.dto';
import { UserSignInDto } from './users/dto/signin.dto';
import { CreatorSignInDto } from './creators/dto/signin.dto';
import { Request, Response } from 'express';
import { UserJwtAuthGuard } from './user-jwt-auth.guard';
import { CreatorJwtAuthGuard } from './creator-jwt-auth.guard';
import * as jwt from 'jsonwebtoken';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdmittedDto } from './events/dto/admitted.dto';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly usersService: UsersService,
    private readonly creatorsService: CreatorsService,
    private readonly eventsService: EventsService
  ) {}

  @Get()
  getHome(): object {
    return this.appService.getHome();
  }

  @Get('welcome')
  getWelcomePage1(@Req() req: Request, @Res() res: Response) {
    if (req.cookies.user_jwt) {
      return res.redirect('/views/users/user-home');
    } else {
      return res.render('users-welcome', { user: res.locals.user, });
    }
  }

  @Get('views')
  getWelcomePage2(@Req() req: Request, @Res() res: Response) {
    if (req.cookies.user_jwt) {
      return res.redirect('/views/users/user-home');
    } else {
      return res.render('users-welcome', { user: res.locals.user, });
    }
  }
  @Get('views/welcome')
  getWelcomePage3(@Req() req: Request, @Res() res: Response) {
    if (req.cookies.user_jwt) {
      return res.redirect('/views/users/user-home');
    } else {
      return res.render('users-welcome', { user: res.locals.user, });
    }
  }

  @Get('views/users')
  getWelcomePage4(@Req() req: Request, @Res() res: Response) {
    if (req.cookies.user_jwt) {
      return res.redirect('/views/users/user-home');
    } else {
      return res.render('users-welcome', { user: res.locals.user, });
    }
  }

  @Get('views/creators')
  getCreatorsWelcomePage1(@Req() req: Request, @Res() res: Response) {
    if (req.cookies.creator_jwt) {
      return res.redirect('/views/creators/creator-home');
    } else {
      return res.render('creators-welcome', { creator: res.locals.creator, });
    }
  }

  @Get('views/users/welcome')
  getWelcomePage5(@Req() req: Request, @Res() res: Response) {
    if (req.cookies.user_jwt) {
      return res.redirect('/views/users/user-home');
    } else {
      return res.render('users-welcome', { user: res.locals.user, });
    }
  }

  @Get('views/creators/welcome')
  getCreatorsWelcomePage2(@Req() req: Request, @Res() res: Response) {
    if (req.cookies.creator_jwt) {
      return res.redirect('/views/creators/creator-home');
    } else {
      return res.render('creators-welcome', { creator: res.locals.creator, });
    }
  }

  @Get('views/users/terms')
  userTerms(@Req() req: Request, @Res() res: Response) {
    if (req.cookies.user_jwt) {
      return res.redirect('/views/users/user-auth-terms');
    } else {
      return res.render('users-terms', { user: res.locals.user, });
    }
  }

  @Get('views/creators/terms')
  creatorTerms(@Req() req: Request, @Res() res: Response) {
    if (req.cookies.creator_jwt) {
      return res.redirect('/views/creators/creator-auth-terms');
    } else {
      return res.render('creators-terms', { creator: res.locals.creator, });
    }
  }

  @Get('views/users/signup')
  getUserSignUp(@Req() req: Request, @Res() res: Response) {
    if (req.cookies.user_jwt) {
      return res.redirect('/views/users/user-home');
    } else {
      return res.render('users-signup', { user: res.locals.user, });
    }
  }

  @Get('views/creators/signup')
  getCreatorSignUp(@Req() req: Request, @Res() res: Response) {
    if (req.cookies.creator_jwt) {
      return res.redirect('/views/creator/creator-home');
    } else {
      return res.render('creators-signup', { creator: res.locals.creator, });
    }
  }

  @Post('views/users/signup')
  async postUserSignup(
    @Req() req: Request,
    @Res() res: Response, 
    @Body(new ValidationPipe()) createUserDto: CreateUserDto
  ) {
    try {
      const response = await this.usersService.createViews(createUserDto);
      req.flash('success', response.message);
      return res.redirect('/views/users/signup');
    } catch (error) {
      if (error instanceof HttpException) {
        req.flash('error', error.message);
        if (error.getStatus() === HttpStatus.CONFLICT) {
          return res.redirect('/views/users/login');
        } else {
          return res.redirect('/views/users/404');
        }
      } else {
        req.flash('error', 'Signup Error.');
        return res.redirect('/views/users/404');
      }
    }
  }

  @Post('views/creators/signup')
  async postCreatorSignup(
    @Req() req: Request,
    @Res() res: Response, 
    @Body(new ValidationPipe()) createCreatorDto: CreateCreatorDto
  ) {
    try {
      const response = await this.creatorsService.createViews(createCreatorDto);
      req.flash('success', response.message);
      return res.redirect('/views/creators/signup');
    } catch (error) {
      if (error instanceof HttpException) {
        req.flash('error', error.message);
        if (error.getStatus() === HttpStatus.CONFLICT) {
          return res.redirect('/views/creators/login');
        } else {
          return res.redirect('/views/creators/404');
        }
      } else {
        req.flash('error', 'Signup Error.');
        return res.redirect('/views/creators/404');
      }
    }
  }

  @Get('views/users/verify-email')
  async userVerifyEmail(
    @Query('token') token: string,
    @Res() res: any,
  ) {
    try {
      const response = await this.usersService.verifyEmail(token);
      if (response.statusCode === 200) {
        return res.render('user-email-verify-success', { user: res.locals.user });
      } else if (response.statusCode === 202) {
        return res.render('user-email-already-verified', { user: res.locals.user });
      } else if (response.statusCode === 401 || response.statusCode === 410) {
        return res.render('user-email-verify-failed', { user: res.locals.user, env: process.env });
      } else if (response.statusCode === 404) {
        return res.render('user-email-verify-not-found', { user: res.locals.user });
      } else {
        return res.render('404', { error: response.message });
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      return res.render('404', { error: error.message });
    }
  }
  
  @Get('views/creators/verify-email')
  async creatorVerifyEmail(
    @Query('token') token: string,
    @Res() res: any,
  ) {
    try {
      const response = await this.creatorsService.verifyEmail(token);
      if (response.statusCode === 200) {
        return res.render('creator-email-verify-success', { creator: res.locals.creator });
      } else if (response.statusCode === 202) {
        return res.render('creator-email-already-verified', { creator: res.locals.creator });
      } else if (response.statusCode === 401 || response.statusCode === 410) {
        return res.render('creator-email-verify-failed', { creator: res.locals.creator, env: process.env });
      } else if (response.statusCode === 404) {
        return res.render('creator-email-verify-not-found', { creator: res.locals.creator });
      } else {
        return res.render('404', { error: response.message });
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      return res.render('404', { error: error.message });
    }
  }

  @Get('views/users/resend-verification-email')
  getUserReVerify(@Req() req: Request, @Res() res: Response) {
    if (req.cookies.user_jwt) {
      res.redirect('/views/users/user-home');
    } else {
      return res.render('user-reverify-email', { user: res.locals.user, });
    }
  }

  @Get('views/creators/resend-verification-email')
  getCreatorReVerify(@Req() req: Request, @Res() res: Response) {
    if (req.cookies.creator_jwt) {
      res.redirect('/views/creators/creator-home');
    } else {
      return res.render('creator-reverify-email', { creator: res.locals.creator, });
    }
  }

  @Post('views/users/resend-verification-email')
  async postUserReVerifyEmail(
    @Req() req: Request,
    @Res() res: Response, 
    @Body('email', new ValidationPipe()) email: string
  ) {
    try {
    const response = await this.usersService.reVerifyEmailViews(email);
    if (response.statusCode === HttpStatus.OK) {
      req.flash('success', 'Verification Email has been resent. Check your Email for verification, then you can login.');
      return res.redirect('login');
    }
    } catch (error) {
      if (error instanceof BadRequestException) {
        req.flash('error', error.message);
        return res.redirect('404');
      } else if (error instanceof NotFoundException) {
        req.flash('error', 'User not found. Signup to create an account.');
        return res.redirect('signup');
      } else {
        req.flash('error', 'An unexpected error occurred.');
        return res.redirect('404');
      }
    }
  }

  @Post('views/creators/resend-verification-email')
  async postCreatorReVerifyEmail(
    @Req() req: Request,
    @Res() res: Response, 
    @Body('email', new ValidationPipe()) email: string
  ) {
    try {
    const response = await this.creatorsService.reVerifyEmailViews(email);
    if (response.statusCode === HttpStatus.OK) {
      req.flash('success', 'Verification Email has been resent. Check your Email for verification, then you can login.');
      return res.redirect('login');
    }
    } catch (error) {
      if (error instanceof BadRequestException) {
        req.flash('error', error.message);
        return res.redirect('404');
      } else if (error instanceof NotFoundException) {
        req.flash('error', 'Creator not found. Signup to create an account.');
        return res.redirect('signup');
      } else {
        req.flash('error', 'An unexpected error occurred.');
        return res.redirect('404');
      }
    }
  }

  @Get('views/users/login')
  async getUsersLogin(@Req() req: Request, @Res() res: Response) {
    // Check if the user JWT token exists in cookies
    if (req.cookies.user_jwt) {
      // Decode the JWT token to check its expiration
      const token = req.cookies.user_jwt;
      jwt.verify(token, process.env.JWT_SECRET, (err: Error | null, decodedToken: any) => {
        if (err) {
          // If there's an error verifying the token, clear it from cookies
          res.clearCookie('user_jwt');
          console.error('Error verifying token:', err);
          // Redirect to login page or handle the error as appropriate
          return res.redirect('/views/users/login');
        } else {
          // Token is valid, check if it's expired
          if (decodedToken.exp * 1000 < Date.now()) {
            // If the token has expired, clear it from cookies
            res.clearCookie('user_jwt');
            // Redirect to login page 
            return res.redirect('/views/users/login');
          } else {
            // If the token is still valid, redirect to the home page
            return res.redirect('user-home');
          }
        }
      });
    }
    // If the user JWT token doesn't exist or has expired, render the login page
    return res.status(HttpStatus.OK).render('users-login', { user: res.locals.user || null, messages: req.flash() });
  }
  
  @Get('views/creators/login')
  async getCreatorsLogin(@Req() req: Request, @Res() res: Response) {
    // Check if the creator JWT token exists in cookies
    if (req.cookies.creator_jwt) {
      // Decode the JWT token to check its expiration
      const token = req.cookies.creator_jwt;
      jwt.verify(token, process.env.JWT_SECRET, (err: Error | null, decodedToken: any) => {
        if (err) {
          // If there's an error verifying the token, clear it from cookies
          res.clearCookie('creator_jwt');
          console.error('Error verifying token:', err);
          // Redirect to login page or handle the error as appropriate
          return res.redirect('/views/creators/login');
        } else {
          // Token is valid, check if it's expired
          if (decodedToken.exp * 1000 < Date.now()) {
            // If the token has expired, clear it from cookies
            res.clearCookie('creator_jwt');
            // Redirect to login page 
            return res.redirect('/views/creators/login');
          } else {
            // If the token is still valid, redirect to the home page
            return res.redirect('creator-home');
          }
        }
      });
    }
    // If the user JWT token doesn't exist or has expired, render the login page
    return res.status(HttpStatus.OK).render('creators-login', { creator: res.locals.creator || null, messages: req.flash() });
  }
  
  @Post('views/users/login')
  async postUsersLogin(
    @Body(new ValidationPipe()) signInDto: UserSignInDto,
    @Req() req: Request, 
    @Res() res: Response
  ) {
    try {
      const response = await this.usersService.signInViews(signInDto);
      // set cookie
      res.cookie('user_jwt', response.token, { maxAge: 1 * 24 * 60 * 60 * 1000 });
      // res.cookie('user_jwt', response.token, { maxAge: 1 * 60 * 1000 });
      return res.redirect('user-home');
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        req.flash('error', 'Email or password incorrect.');
        return res.redirect('login');
      } else if (error instanceof NotFoundException) {
        req.flash('error', 'User not found.');
        return res.redirect('login');
      } else if (error instanceof HttpException && error.getStatus() === HttpStatus.FORBIDDEN) {
        return res.render('user-email-not-verified', { user: res.locals.user, env: process.env });
      } else {
        return res.render('404', { error: error.message });
      }
    }
  }
  
  @Post('views/creators/login')
  async postCreatorsLogin(
    @Body(new ValidationPipe()) CreatorSignInDto: CreatorSignInDto,
    @Req() req: Request, 
    @Res() res: Response
  ) {
    try {
      const response = await this.creatorsService.signInViews(CreatorSignInDto);
      // set cookie
      res.cookie('creator_jwt', response.token, { maxAge: 1 * 24 * 60 * 60 * 1000 });
      // res.cookie('creator_jwt', response.token, { maxAge: 1 * 60 * 1000 });
      return res.redirect('creator-home');
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        req.flash('error', 'Email or password incorrect.');
        return res.redirect('login');
      } else if (error instanceof NotFoundException) {
        req.flash('error', 'Creator not found.');
        return res.redirect('login');
      } else if (error instanceof HttpException && error.getStatus() === HttpStatus.FORBIDDEN) {
        return res.render('creator-email-not-verified', { creator: res.locals.creator, env: process.env });
      } else {
        return res.render('404', { error: error.message });
      }
    }
  }

  @Get('views/users/forgot-password')
  async getUsersForgotPassword(@Req() req: Request, @Res() res: Response) {
    // If the user is already logged in, redirect to the home page
    if (req.cookies.user_jwt) {
      return res.redirect('user-home');
    } else {
      return res.status(HttpStatus.OK).render('user-forgot-password', { user: res.locals.user || null, messages: req.flash() });
    }
  }

  @Get('views/creators/forgot-password')
  async getCreatorsForgotPassword(@Req() req: Request, @Res() res: Response) {
    // If the creator is already logged in, redirect to the home page
    if (req.cookies.creator_jwt) {
      return res.redirect('creator-home');
    } else {
      return res.status(HttpStatus.OK).render('creator-forgot-password', { creator: res.locals.creator || null, messages: req.flash() });
    }
  }

  @Post('/views/users/forgot-password')
  async sendUserPasswordResetEmail(@Body('email') email: string, @Req() req: Request, @Res() res: Response) {
    try {
      const response = await this.usersService.sendPasswordResetEmail(email);
      if (response.statusCode === 200) {
        req.flash('success', 'Password reset email has been resent. Check your email to change your password.');
        return res.redirect('forgot-password');
      } else if (response.statusCode === 404) {
        req.flash('error', 'User not found. Please check the email input and try again.');
        return res.redirect('forgot-password');
      } else {
        return res.render('404', { error: response.message });
      }
    } catch (error) {
      console.error(error);
      return res.render('404', { error: 'Password reset error.' });
    }
  }

  @Post('/views/creators/forgot-password')
  async sendCreatorPasswordResetEmail(@Body('email') email: string, @Req() req: Request, @Res() res: Response) {
    try {
      const response = await this.creatorsService.sendPasswordResetEmail(email);
      if (response.statusCode === 200) {
        req.flash('success', 'Password reset email has been resent. Check your email to change your password.');
        return res.redirect('forgot-password');
      } else if (response.statusCode === 404) {
        req.flash('error', 'Creator not found. Please check the email input and try again.');
        return res.redirect('forgot-password');
      } else {
        return res.render('404', { error: response.message });
      }
    } catch (error) {
      console.error(error);
      return res.render('404', { error: 'Password reset error.' });
    }
  }

  @Get('views/users/reset-password')
  async UserResetPasswordPage(@Req() req: Request, @Res() res: Response) {
    // If the user is already logged in, redirect to the home page
    if (req.cookies.user_jwt) {
      return res.redirect('user-home');
    }
    const token = req.query.token || req.cookies.user_password_jwt;
    if (!token) {
      req.flash('error', 'Reset token is missing.');
      return res.redirect('forgot-password');
    }
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decoded);
      // Token is valid
      // Set JWT token in the cookie
      res.cookie('user_password_jwt', token, { maxAge: 5 * 60 * 1000, httpOnly: true });
      // Pass user information to the reset password page
      return res.render('user-reset-password', { user: res.locals.user || null, token: req.query.token, messages: req.flash() });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        // Token has expired
        req.flash('error', 'Password reset link has expired.');
      } else {
        // Other token verification errors
        console.error('Error verifying token:', error);
        req.flash('error', 'Invalid reset token.');
      }
      return res.redirect('forgot-password');
    }
  }
  
  @Get('views/creators/reset-password')
  async CreatorResetPasswordPage(@Req() req: Request, @Res() res: Response) {
    // If the creator is already logged in, redirect to the home page
    if (req.cookies.creator_jwt) {
      return res.redirect('creator-home');
    }
    const token = req.query.token || req.cookies.creator_password_jwt;
    if (!token) {
      req.flash('error', 'Reset token is missing.');
      return res.redirect('forgot-password');
    }
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decoded);
      // Token is valid
      // Set JWT token in the cookie
      res.cookie('creator_password_jwt', token, { maxAge: 5 * 60 * 1000, httpOnly: true });
      // Pass creator information to the reset password page
      return res.render('creator-reset-password', { creator: res.locals.creator || null, token: req.query.token, messages: req.flash() });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        // Token has expired
        req.flash('error', 'Password reset link has expired.');
      } else {
        // Other token verification errors
        console.error('Error verifying token:', error);
        req.flash('error', 'Invalid reset token.');
      }
      return res.redirect('forgot-password');
    }
  }

  @Post('views/users/reset-password')
  async UserResetPassword(@Req() req: Request, @Res() res: Response) {
    try {
      const token = req.cookies.user_password_jwt; // Access JWT token from cookie
      const newPassword = req.body.password;

      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

      const response = await this.usersService.UserResetPassword(decoded._id, newPassword);
      if (response.statusCode === 200) {
        req.flash('success', 'Password changed successfully. You can now login with your new password.');
        res.clearCookie('user_password_jwt');
        return res.redirect('login');
      } else if (response.statusCode === 409) {
        req.flash('error', response.message);
        return res.redirect('forgot-password');
      } else if (response.statusCode === 401) {
        req.flash('error', response.message);
        return res.redirect('forgot-password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      req.flash('error', error.message);
      return res.redirect('forgot-password');
    }
  }
  
  @Post('views/creators/reset-password')
  async CreatorResetPassword(@Req() req: Request, @Res() res: Response) {
    try {
      const token = req.cookies.creator_password_jwt; // Access JWT token from cookie
      const newPassword = req.body.password;

      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

      const response = await this.creatorsService.CreatorResetPassword(decoded._id, newPassword);
      if (response.statusCode === 200) {
        req.flash('success', 'Password changed successfully. You can now login with your new password.');
        res.clearCookie('creator_password_jwt');
        return res.redirect('login');
      } else if (response.statusCode === 409) {
        req.flash('error', response.message);
        return res.redirect('forgot-password');
      } else if (response.statusCode === 401) {
        req.flash('error', response.message);
        return res.redirect('forgot-password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      req.flash('error', error.message);
      return res.redirect('forgot-password');
    }
  }

  @Get('views/users/events')
  async findAllEventsUsers(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('name') name?: string,
    @Query('type') type?: string,
  ) {
    try {
      if (req.cookies.user_jwt) {
        return res.redirect('users-events');
      }
      const response = await this.eventsService.ViewsFindAll(page, limit, name, type);
      // console.log(response.events);
      return res.render('users-events', {events: response.events, current: page, pages: response.pages, messages: req.flash() });
    } catch (error) {
      if (error instanceof NotFoundException) {
        req.flash('error', error.message);
        return res.render('users-events');
      } else {
        console.error('Error retrieving events:', error);
        req.flash('error', error.message);
        return res.render('users-events');
      }
    }
  }
  @Get('views/creators/events')
  async findAllEventsCreators(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('name') name?: string,
    @Query('type') type?: string,
  ) {
    try {
      if (req.cookies.creator_jwt) {
        return res.redirect('creators-events');
      }
      const response = await this.eventsService.ViewsFindAll(page, limit, name, type);
      // console.log(response.events);
      return res.render('creators-events', {events: response.events, current: page, pages: response.pages, messages: req.flash() });
    } catch (error) {
      if (error instanceof NotFoundException) {
        req.flash('error', error.message);
        return res.render('creators-events');
      } else {
        console.error('Error retrieving events:', error);
        req.flash('error', error.message);
        return res.render('creators-events');
      }
    }
  }


  //PROTECTED ROUTES

  @Get('views/users/logout')
  @UseGuards(UserJwtAuthGuard)
  userLogout(@Res() res: Response) {
    res.clearCookie('user_jwt');
    res.redirect('login');
  }

  @Get('views/creators/logout')
  @UseGuards(CreatorJwtAuthGuard)
  creatorLogout(@Res() res: Response) {
    res.clearCookie('creator_jwt');
    res.redirect('login');
  }

  @Get('views/users/user-home')
  @UseGuards(UserJwtAuthGuard)
  userHome(@Res() res: Response) {
    console.log({user: res.locals.user});
    res.render('user-home', {user: res.locals.user});
  }

  @Get('views/creators/creator-home')
  @UseGuards(CreatorJwtAuthGuard)
  creatorHome(@Res() res: Response) {
    console.log({creator: res.locals.creator});
    res.render('creator-home', {creator: res.locals.creator});
  }

  @Get('views/users/user-auth-terms')
  @UseGuards(UserJwtAuthGuard)
  userAuthTerms(@Res() res: Response) {
    console.log({user: res.locals.user});
    res.render('user-auth-terms', {user: res.locals.user});
  }

  @Get('views/creators/creator-auth-terms')
  @UseGuards(CreatorJwtAuthGuard)
  creatorAuthTerms(@Res() res: Response) {
    console.log({creator: res.locals.creator});
    res.render('creator-auth-terms', {creator: res.locals.creator});
  }

  @Get('views/creators/events/upload-image')
  @UseGuards(CreatorJwtAuthGuard)
  createEventImage(@Req() req: Request, @Res() res: Response) {
    console.log({creator: res.locals.creator});
    res.render('create-event-upload', {creator: res.locals.creator , messages: req.flash() });
  }

  @Post('views/creators/events/upload-image')
  @UseGuards(CreatorJwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @Req() req: Request,
    @Res() res: Response,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      const token = req.cookies.creator_jwt; // Access JWT token from cookie

      const response = await this.eventsService.uploadImage(token, file);
      if (response.image_url) {
        // req.flash('success', response.message);
        // req.flash('image_url', response.image_url); 
        return res.status(200).json({ imageUrl: response.image_url });
      } else {
        // req.flash('error', response.message);
        return res.status(400).json({ imageUrl: response.image_url });
      }
      // return res.redirect('/views/creators/events/create');
    } catch (error) {
      console.error('Error uploading image:', error);
      // req.flash('error', 'Error uploading image.');
      return res.status(500).json({ error: 'Error uploading image' });
      // return res.redirect('/views/creators/events/create');
    }
  }

  @Get('views/creators/events/create')
  @UseGuards(CreatorJwtAuthGuard)
  createEvent(@Req() req: Request, @Res() res: Response) {
    // console.log({creator: res.locals.creator});
    res.render('create-event', {creator: res.locals.creator , messages: req.flash() });
  }

  @Post('views/creators/events/create')
  @UseGuards(CreatorJwtAuthGuard)
  async postCreateEvent(
    @Req() req: Request,
    @Res() res: Response, 
    // @Body() createEventDto: CreateEventDto
  ) {
    try {
      const token = req.cookies.creator_jwt; // Access JWT token from cookie
      const createEventDto = req.body
      console.log(req.body);
      console.log(createEventDto);
      const response = await this.eventsService.createViewsEvent(token, createEventDto);
      if (response.statusCode === 201) {
        req.flash('success', response.message);
        return res.redirect('/views/creators/events/create');
      }
    } catch (error) {
      if (error instanceof HttpException) {
        if (error.getStatus() === HttpStatus.CONFLICT) {
          req.flash('error', error.message);
          return res.redirect('/views/creators/events/create');
        } else {
          req.flash('error', error.message);
          return res.redirect('/views/creators/events/create');
        }
      } else {
        req.flash('error', 'Creation Error.');
        return res.render('404', {creator: res.locals.creator || null});
      }
    }
  }

  @Get('views/users/users-events')
  @UseGuards(UserJwtAuthGuard)
  async findAllEventsAuthUsers(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('name') name?: string,
    @Query('type') type?: string,
  ) {
    try {
      const response = await this.eventsService.ViewsFindAll(page, limit, name, type);
      // console.log(response.events);
      return res.render('users-events', {events: response.events, current: page, pages: response.pages, user: res.locals.user , messages: req.flash() });
    } catch (error) {
      if (error instanceof NotFoundException) {
        req.flash('error', error.message);
        return res.render('users-events', {user: res.locals.user});
      } else {
        console.error('Error retrieving events:', error);
        req.flash('error', error.message);
        return res.render('users-events', {user: res.locals.user});
      }
    }
  }

  @Get('views/creators/creators-events')
  @UseGuards(CreatorJwtAuthGuard)
  async findAllEventsAuthCreators(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('name') name?: string,
    @Query('type') type?: string,
  ) {
    try {
      const response = await this.eventsService.ViewsFindAll(page, limit, name, type);
      // console.log(response.events);
      return res.render('creators-events', {events: response.events, current: page, pages: response.pages, creator: res.locals.creator , messages: req.flash() });
    } catch (error) {
      if (error instanceof NotFoundException) {
        req.flash('error', error.message);
        return res.render('creators-events', {creator: res.locals.creator});
      } else {
        console.error('Error retrieving events:', error);
        req.flash('error', error.message);
        return res.render('creators-events', {creator: res.locals.creator});
      }
    }
  }
  
  @Get('views/users/events/:id')
  @UseGuards(UserJwtAuthGuard)
  async findOneEventUsers(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,

  ) {
    try {
      const response = await this.eventsService.findOneViews(id);
      // console.log(response.event);
      return res.render('user-view-event', {event: response.event, user: res.locals.user , messages: req.flash() });
    } catch (error) {
      if (error instanceof NotFoundException) {
        req.flash('error', error.message);
        return res.render('user-view-event', {user: res.locals.user});
      } else if (error instanceof GoneException) {
        req.flash('error', error.message);
        return res.render('user-view-event', {user: res.locals.user});
      }  else {
        console.error('Error retrieving event:', error);
        req.flash('error', error.message);
        return res.render('user-view-event', {user: res.locals.user});
      }
    }
  }

  @Get('views/creators/events/:id')
  @UseGuards(CreatorJwtAuthGuard)
  async findOneEventCreators(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,

  ) {
    try {
      const response = await this.eventsService.findOneViews(id);
      // console.log(response.event);
      return res.render('creator-view-event', {event: response.event, creator: res.locals.creator , messages: req.flash() });
    } catch (error) {
      if (error instanceof NotFoundException) {
        req.flash('error', error.message);
        return res.render('creator-view-event', {creator: res.locals.creator});
      } else if (error instanceof GoneException) {
        req.flash('error', error.message);
        return res.render('creator-view-event', {creator: res.locals.creator});
      }  else {
        console.error('Error retrieving event:', error);
        req.flash('error', error.message);
        return res.render('creator-view-event', {creator: res.locals.creator});
      }
    }
  }
  
  @Get('views/users/my-events')
  @UseGuards(UserJwtAuthGuard)
  async findMyEventsAuthUsers(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    try {
      const token = req.cookies.user_jwt; // Access JWT token from cookie
      const response = await this.eventsService.findEventsByAttendeeEmail(token, page, limit);
      // console.log(response.events);
      return res.render('user-my-events', {events: response.events, current: page, pages: response.pages, user: res.locals.user , messages: req.flash() });
    } catch (error) {
      if (error instanceof NotFoundException) {
        req.flash('error', error.message);
        return res.render('user-my-events', {user: res.locals.user});
      } else {
        console.error('Error retrieving events:', error);
        req.flash('error', error.message);
        return res.render('user-my-events', {user: res.locals.user});
      }
    }
  }
  
  @Get('views/creators/my-events')
  @UseGuards(CreatorJwtAuthGuard)
  async findMyEventsAuthCreators(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('name') name?: string,
    @Query('type') type?: string,
  ) {
    try {
      const token = req.cookies.creator_jwt; // Access JWT token from cookie
      const response = await this.eventsService.findAllCreatorEventsViews(token, page, limit, name, type);
      // console.log(response.events);
      return res.render('creator-my-events', {
        events: response.events, 
        attendeesGrandTotal: response.attendeesGrandTotal, 
        admittedGrandTotal: response.admittedGrandTotal,
        current: page, 
        pages: response.pages, 
        creator: res.locals.creator , 
        messages: req.flash() 
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        req.flash('error', error.message);
        return res.render('creator-my-events', {creator: res.locals.creator});
      } else {
        console.error('Error retrieving events:', error);
        req.flash('error', error.message);
        return res.render('creator-my-events', {creator: res.locals.creator});
      }
    }
  }

  @Get('views/creators/my-event/:id')
  @UseGuards(CreatorJwtAuthGuard)
  async findMyEventCreators(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,

  ) {
    try {
      const response = await this.eventsService.findOneCreatorEventViews(id);
      // console.log(response.event);
      return res.render('creator-mine', {
        event: response.event,
        attendeesTotal: response.attendeesTotal,
        admittedTotal: response.admittedTotal,
        creator: res.locals.creator, 
        messages: req.flash() });
    } catch (error) {
      if (error instanceof NotFoundException) {
        req.flash('error', error.message);
        return res.render('creator-mine', {creator: res.locals.creator});
      } else if (error instanceof GoneException) {
        req.flash('error', error.message);
        return res.render('creator-mine', {creator: res.locals.creator});
      }  else {
        console.error('Error retrieving event:', error);
        req.flash('error', error.message);
        return res.render('creator-mine', {creator: res.locals.creator});
      }
    }
  }
  @Get('views/creators/my-event/:id/admit')
  @UseGuards(CreatorJwtAuthGuard)
  async findMyAdmitEventCreators(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,

  ) {
    try {
      const response = await this.eventsService.findOneViews(id);
      // console.log(response.event);
      return res.render('creator-admit-user', {event: response.event, creator: res.locals.creator , messages: req.flash() });
    } catch (error) {
      if (error instanceof NotFoundException) {
        req.flash('error', error.message);
        return res.render('creator-admit-user', {creator: res.locals.creator});
      } else if (error instanceof GoneException) {
        req.flash('error', error.message);
        return res.render('creator-admit-user', {creator: res.locals.creator});
      }  else {
        console.error('Error retrieving event:', error);
        req.flash('error', error.message);
        return res.render('creator-admit-user', {creator: res.locals.creator});
      }
    }
  }

  @Post('views/users/events/:id/book')
  @UseGuards(UserJwtAuthGuard)
  async postBookTicket(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') eventId: string,
  ) {
    try {
      const token = req.cookies.user_jwt; // Access JWT token from cookie
      const user_reminder_date = req.body.user_reminder_date
      const response = await this.eventsService.addUserToAttendeesViews(token, eventId, user_reminder_date);
      if (response.statusCode === 200) {
        req.flash('success', response.message);
        return res.redirect('/views/users/events');
      }
    } catch (error) {
      if (error instanceof HttpException) {
        if (error.getStatus() === HttpStatus.CONFLICT) {
          req.flash('error', error.message);
          return res.redirect('/views/users/events');
        } else {
          req.flash('error', error.message);
          return res.redirect('/views/users/events');
        }
      } else {
        req.flash('error', 'Booking Error.');
        return res.render('404', {user: res.locals.user || null})
      }
    }
  }

  @Get('views/creators/my-event/:id/:userEmail/admit')
  @UseGuards(CreatorJwtAuthGuard)
  async admitUser(
    @Param('id') eventId: string,
    @Param('userEmail') userEmail: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const admittedDto: AdmittedDto = { user_email: userEmail };
      const token = req.cookies.creator_jwt; // Access JWT token from cookie
      const response = await this.eventsService.admitUserToEvent(token, eventId, admittedDto);
      if (response.statusCode === 200) {
        req.flash('success', response.message);
        return res.redirect('/views/creators/my-events');
      }
    } catch (error) {
      if (error instanceof HttpException) {
        if (error.getStatus() === HttpStatus.CONFLICT) {
          req.flash('error', error.message);
          return res.redirect('/views/creators/my-events');
        } else {
          req.flash('error', error.message);
          return res.redirect('/views/creators/my-events');
        }
      } else {
        req.flash('error', 'Creation Error.');
        return res.render('404', {creator: res.locals.creator || null});
      }
    }
  }

  



  // @Get('*')
  // errorPage(@Req() req: Request, @Res() res: Response) {
  //   res.render('404', {user: res.locals.user || null});
  // }
  







}


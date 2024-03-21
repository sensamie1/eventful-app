import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { engine } from 'express-handlebars';
// import expbs from 'express-handlebars';
import flash = require('express-flash');
import * as session from 'express-session';
import * as cookieParser from 'cookie-parser';



async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.useStaticAssets(join(__dirname, '..', 'public'));
    app.setBaseViewsDir(join(__dirname, '..', 'views'))

    // Set up Handlebars view engine
    app.engine('hbs', engine({
      extname: '.hbs',
      defaultLayout: 'main',
      layoutsDir: join(__dirname, '..', 'views/layouts'), // Directory for layout files
      partialsDir: join(__dirname, '..', 'views/partials'), // Directory for partials
    }));

    // const hbs = expbs.create({
    //   extname: '.hbs',
    //   defaultLayout: 'main',
    //   layoutsDir: join(__dirname, '..', 'views/layouts'), // Directory for layout files
    //   partialsDir: join(__dirname, '..', 'views/partials'), // Directory for partials

    //   // custom helper
    //   helpers: {
    //     list: function(value, options) {
    //       //value = events
    //       let out = "<ul>";
    //       for (let i = 0; i < value.length; i++) {
    //         out = out + "<ul>" + options.fn(value[i]) + "<li>";
    //       }
    //       return out + "<ul>"
    //     }
    //   }
    
    // })

    // // Set up Handlebars view engine
    // app.engine('hbs', hbs.engine);

    app.setViewEngine('hbs')


  
  // Set up session middleware with a secret key
  app.use(session({
    secret: "secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 86400000 } // 24 hours
  }));

  app.use(cookieParser());
  
  app.use(flash());

  
  
  await app.listen(process.env.PORT || 3000);
}
bootstrap();

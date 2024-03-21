import { Injectable } from '@nestjs/common';

// @Injectable()
// export class AppService {
//   getHello(): string {
//     return 'Hello World!';
//   }
// }


@Injectable()
export class AppService {
  getHome(): object {
    return {
      message: 'Welcome to Eventful App!',
      statusCode: 200
    };
  }
}

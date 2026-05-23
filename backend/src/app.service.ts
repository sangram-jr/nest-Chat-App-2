import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    console.log("changes in app service");
    return 'Hello World!';
  }
}

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import emailjs from '@emailjs/nodejs';

@Injectable()
export class MailService {
   async sendResetPasswordEmail(
      email: string,
      username: string,
      token: string,
   ) {
      try {
         const templateOptions = {
            username: username,
            to_email: email,
            site_url: process.env.SITE_URL,
            token: token
         }

         const response = await emailjs.send(
            'jogo_do_glecio',
            'reset_password',
            templateOptions,
            {
               publicKey: process.env.EMAILJS_PUBLIC_KEY,
               privateKey: process.env.EMAILJS_PRIVATE_KEY,
            },
         );
      } catch (err) {
         console.error(err);
         throw err;
      }
   }
}

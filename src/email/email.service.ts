import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from '../common/common.constants';
import { EmailOptions } from './email.interface';
import * as superagent from 'superagent';

@Injectable()
export class EmailService {
  constructor(@Inject(CONFIG_OPTIONS) private readonly options: EmailOptions) {
    this.sendEmail('aaa', 'bbb', 'alkain77@gmail.com');
  }

  private async sendEmail(subject: string, contents: string, to: string) {
    const rawKey = `api:${this.options.apiKey}`;

    superagent
      .post(`https://api.mailgun.net/v3/${this.options.emailDomain}/messages`)
      .set('Authorization', `Basic ${Buffer.from(rawKey).toString('base64')}`)
      .field('from', `Excited User mailgun@${this.options.emailDomain}`)
      .field('to', to)
      .field('subject', subject)
      .field('text', contents)
      .end((err, res) => {
        console.log('end call');
        console.log('err : ', err);
        console.log('res : ', res);
      });
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from '../common/common.constants';
import { EmailOptions, EmailVar } from './email.interface';
import * as superagent from 'superagent';

@Injectable()
export class EmailService {
  constructor(@Inject(CONFIG_OPTIONS) private readonly options: EmailOptions) {}

  async sendEmail(
    subject: string,
    template: string,
    to_email: string,
    emailVars: EmailVar[]
  ) {
    const rawKey = `api:${this.options.apiKey}`;
    const fieldObj = {};
    emailVars.forEach((eVar) => (fieldObj[eVar.key] = eVar.value));

    superagent
      .post(`https://api.mailgun.net/v3/${this.options.emailDomain}/messages`)
      .set('Authorization', `Basic ${Buffer.from(rawKey).toString('base64')}`)
      .field('from', `Nuber Eats mailgun@${this.options.emailDomain}`)
      .field('subject', subject)
      .field('template', template)
      .field('to', to_email)
      .field(fieldObj)
      .end((err, res) => {
        // if (err) {
        //   console.log(res, err);
        // }
      });
  }

  async sendVerificationEmail(to_email: string, code: string) {
    await this.sendEmail('Verify Your Email', 'confirm', to_email, [
      { key: 'v:user_name', value: 'pu-haha' },
      { key: 'v:code', value: code },
    ]);
  }
}

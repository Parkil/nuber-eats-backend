import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from '../common/common.constants';
import { EmailOptions, EmailVar } from './email.interface';
import * as superagent from 'superagent';
import * as process from 'process';

@Injectable()
export class EmailService {
  constructor(@Inject(CONFIG_OPTIONS) private readonly options: EmailOptions) {}

  async sendEmail(
    subject: string,
    template: string,
    to_email: string,
    emailVars: EmailVar[]
  ) {
    // e2e 테스트에서 사용되는 supertest 가 내부적으로는 superagent 를 사용하기 때문에
    // superagent mocking 을 사용할수가 없음 그래서 임시변통으로 test 환경에서는 email
    // 발송을 하지 않게 처리
    if (process.env.NODE_ENV === 'test') {
      return Promise.resolve();
    }

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
        if (err) {
          console.log(res, err);
        }
      });
  }

  async sendVerificationEmail(to_email: string, code: string) {
    await this.sendEmail('Verify Your Email', 'confirm', to_email, [
      { key: 'v:user_name', value: 'pu-haha' },
      { key: 'v:code', value: code },
    ]);
  }
}

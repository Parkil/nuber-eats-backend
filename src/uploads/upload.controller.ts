import {
  Controller,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileSizeValidator } from '../common/file/file.size.validator';
import { multerConfig } from '../common/multer/multer.config';

@Controller('')
export class UploadController {
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileSizeValidator({ maxSize: 500 * 1024 })],
      })
    )
    file: Express.Multer.File
  ) {
    console.log('file : ', file);
  }
}

import { FileValidator } from '@nestjs/common';

export type FileSizeValidateOption = {
  maxSize: number;
};

export class FileSizeValidator extends FileValidator<FileSizeValidateOption> {
  buildErrorMessage(file: any): string {
    const kb = this.validationOptions.maxSize / 1024;
    return `${file.name} 의 크기는 ${kb} kb 이하여야 합니다`;
  }

  isValid(file: any): boolean | Promise<boolean> {
    return file.size <= this.validationOptions.maxSize;
  }
}

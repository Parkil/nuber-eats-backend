import * as fs from 'fs';
import { diskStorage } from 'multer';

export const multerConfig = {
  storage: diskStorage({
    destination: (_req, _file, callback) => {
      const uploadPath = './uploads/';
      if (!fs.existsSync(uploadPath)) {
        // uploads 폴더가 존재하지 않을시, 신규 생성
        fs.mkdirSync(uploadPath);
      }
      callback(null, uploadPath);
    },
    filename: (_req, file, callback) => {
      //파일명 한글 깨짐 처리
      callback(null, Buffer.from(file.originalname, 'latin1').toString('utf8'));
    },
  }),
};

import { Module, Global, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as serviceAccount from 'src/config/firebase-service-account.json';

@Global() // ✅ 글로벌 모듈로 지정하여 중복 생성 방지
@Module({
  providers: [
    {
      provide: 'FIREBASE_ADMIN', // ✅ Firebase Admin SDK를 NestJS에서 사용하도록 제공
      useFactory: () => {
        FirebaseModule.logger.log('🔥 Firebase 모듈 초기화 시작...');
        if (!admin.apps.length) { // ✅ 이미 초기화된 경우 실행하지 않음
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
          });
          FirebaseModule.logger.log('🔥 Firebase 모듈이 최초로 초기화되었습니다.');
        } else {
          FirebaseModule.logger.warn('⚠️ Firebase 모듈이 이미 초기화되어 있습니다. 중복 초기화를 방지합니다.');
        }
        return admin;
      },
    },
  ],
  exports: ['FIREBASE_ADMIN'], // ✅ Firebase Admin SDK를 내보내서 다른 모듈에서 사용 가능하게 함
})
export class FirebaseModule {
  private static readonly logger = new Logger(FirebaseModule.name); // ✅ 전역적으로 Logger 인스턴스 관리
}
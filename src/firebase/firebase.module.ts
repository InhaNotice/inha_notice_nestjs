import { Module } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as serviceAccount from 'src/config/firebase-service-account.json';

@Module({})
export class FirebaseModule {
  static initialize(): void {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  }
}
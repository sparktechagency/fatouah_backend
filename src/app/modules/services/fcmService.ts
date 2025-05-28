import admin from 'firebase-admin';
import serviceAccount from "../../../../serviceAccountKey.json"


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export const sendToTopic = async (topic: any, message: any) => {
  const payload = {
    notification: {
      title: message.title,
      body: message.body,
    },
    topic,
  };

  try {
    const response = await admin.messaging().send(payload);
    console.log(`✅ Sent to topic "${topic}"`);
    return response;
  } catch (error) {
    console.error('❌ FCM Error:', error);
    throw error;
  }
};

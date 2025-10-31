import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Initialize the SMS default group if it doesn't exist
 * This should be called once when the app loads or when needed
 */
export const initializeSmsGroup = async () => {
  const SMS_GROUP_ID = 'SMS';
  
  try {
    const smsGroupRef = doc(db, 'receiptGroups', SMS_GROUP_ID);
    const smsGroupDoc = await getDoc(smsGroupRef);

    if (!smsGroupDoc.exists()) {
      await setDoc(smsGroupRef, {
        name: 'sms',
        friendlyName: 'SMS Receipts',
        photos: [],
        createdAt: new Date().toISOString(),
        isDefault: true,
      });
      console.log('SMS default group created successfully');
      return true;
    }
    
    console.log('SMS group already exists');
    return false;
  } catch (error) {
    console.error('Error initializing SMS group:', error);
    throw error;
  }
};

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDekUSz8JzAjrOeMu_I-ODUoM46eronrSo',
  authDomain: 'red-girder-465715-n6.firebaseapp.com',
  projectId: 'red-girder-465715-n6',
  appId: '1:516445042682:web:f66cbcdfb4a00cf2e09643',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

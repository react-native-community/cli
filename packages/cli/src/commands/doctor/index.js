// @flow
import doctor from './doctor';

export default {
  func: doctor,
  name: 'doctor',
  description:
    'Diagnose and fix common Node.js, iOS, Android & React Native issues.',
  options: [
    {
      name: '--fix',
      description: 'Fix issues',
    },
  ],
};

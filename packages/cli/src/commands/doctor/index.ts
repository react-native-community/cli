import doctor from './doctor';

export default {
  func: doctor,
  name: 'doctor',
  description:
    '[EXPERIMENTAL] Diagnose and fix common Node.js, iOS, Android & React Native issues.',
  options: [
    {
      name: '--fix',
      description: 'Attempt to fix all diagnosed issues.',
    },
    {
      name: '--contributor',
      description:
        'Add healthchecks required to installations required for contributing to React Native.',
    },
  ],
};
